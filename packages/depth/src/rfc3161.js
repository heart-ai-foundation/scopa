import { spawnSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { encodeDcbor } from '../../journal/src/dcbor.js';
import { hashHex } from '../../journal/src/hash.js';
import {
  assertDigest,
  assertExactKeys,
  assertNonEmptyString,
  decodeCanonicalBase64,
  deepFreeze,
  encodeBase64,
} from './schema.js';

function runOpenSsl(opensslPath, args, cwd) {
  const result = spawnSync(opensslPath, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
  });
  if (result.status !== 0) {
    const output = `${result.stderr ?? ''}${result.stdout ?? ''}`.trim();
    throw new Error(`OpenSSL RFC 3161 command failed: ${output}`);
  }
  return result.stdout;
}

function timestampSubjectBytes(signature) {
  assertExactKeys(
    signature,
    [
      'algorithm',
      'domain',
      'key',
      'schema',
      'signatureBase64',
      'signingInputSha256',
    ],
    'commitment signature',
  );
  decodeCanonicalBase64(
    signature.signatureBase64,
    'commitment signatureBase64',
  );
  return encodeDcbor(signature);
}

function assertRequest(request) {
  assertExactKeys(
    request,
    ['imprintAlgorithm', 'imprintHex', 'queryBase64', 'schema'],
    'RFC 3161 request',
  );
  if (
    request.schema !== 'scopa.rfc3161-request.v1' ||
    request.imprintAlgorithm !== 'sha256'
  ) {
    throw new Error('unsupported RFC 3161 request');
  }
  assertDigest(request.imprintHex, 'RFC 3161 request imprintHex');
  decodeCanonicalBase64(request.queryBase64, 'RFC 3161 request queryBase64');
}

function certificateDetails(pem, label) {
  let certificate;
  try {
    certificate = new X509Certificate(pem);
  } catch (error) {
    throw new Error(`${label} is not a valid X.509 certificate: ${error.message}`);
  }
  return {
    sha256: hashHex(new Uint8Array(certificate.raw)),
    subject: certificate.subject,
    issuer: certificate.issuer,
  };
}

export async function createRfc3161Request({
  signature,
  opensslPath = 'openssl',
}) {
  const bytes = timestampSubjectBytes(signature);
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-rfc3161-query-'));
  try {
    await writeFile(path.join(root, 'signature.bin'), bytes);
    runOpenSsl(
      opensslPath,
      [
        'ts',
        '-query',
        '-data',
        'signature.bin',
        '-sha256',
        '-cert',
        '-out',
        'request.tsq',
      ],
      root,
    );
    const query = new Uint8Array(await readFile(path.join(root, 'request.tsq')));
    return deepFreeze({
      schema: 'scopa.rfc3161-request.v1',
      imprintAlgorithm: 'sha256',
      imprintHex: hashHex(bytes),
      queryBase64: encodeBase64(query),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

export function createRfc3161Anchor({
  request,
  responseBytes,
  authorityId,
  untrustedCertificatesPem,
}) {
  assertRequest(request);
  if (!(responseBytes instanceof Uint8Array)) {
    throw new TypeError('RFC 3161 responseBytes must be a Uint8Array');
  }
  assertNonEmptyString(authorityId, 'RFC 3161 authorityId');
  assertNonEmptyString(
    untrustedCertificatesPem,
    'RFC 3161 untrustedCertificatesPem',
  );
  const signer = certificateDetails(
    untrustedCertificatesPem,
    'RFC 3161 signer certificate',
  );
  return deepFreeze({
    schema: 'scopa.rfc3161-anchor.v1',
    authorityId,
    request,
    responseBase64: encodeBase64(responseBytes),
    signerCertificateSha256: signer.sha256,
    untrustedCertificatesPem,
    trust: 'verifier-supplied-root-required',
  });
}

export async function requestRfc3161Timestamp({
  request,
  url,
  fetchImpl = globalThis.fetch,
}) {
  assertRequest(request);
  if (typeof fetchImpl !== 'function') {
    throw new Error('RFC 3161 transport requires a fetch implementation');
  }
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:') {
    throw new Error('RFC 3161 transport requires HTTPS');
  }
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/timestamp-reply',
      'content-type': 'application/timestamp-query',
    },
    body: Buffer.from(request.queryBase64, 'base64'),
    redirect: 'error',
  });
  if (!response.ok) {
    throw new Error(`RFC 3161 authority returned HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type')?.split(';', 1)[0];
  if (contentType !== 'application/timestamp-reply') {
    throw new Error(
      `RFC 3161 authority returned unexpected content type: ${contentType ?? 'missing'}`,
    );
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error('RFC 3161 authority returned an empty response');
  }
  return bytes;
}

function parseTimestampText(text) {
  const field = (label) => {
    const match = text.match(new RegExp(`^${label}:\\s*(.+)$`, 'm'));
    return match?.[1]?.trim() ?? null;
  };
  return {
    hashAlgorithm: field('Hash Algorithm'),
    policyOid: field('Policy OID'),
    serialNumber: field('Serial number'),
    authorityTime: field('Time stamp'),
  };
}

export async function verifyRfc3161Anchor({
  anchor,
  signature,
  trustedRootsPem,
  opensslPath = 'openssl',
  expectedAuthorityId,
  expectedSignerCertificateSha256,
}) {
  assertExactKeys(
    anchor,
    [
      'authorityId',
      'request',
      'responseBase64',
      'schema',
      'signerCertificateSha256',
      'trust',
      'untrustedCertificatesPem',
    ],
    'RFC 3161 anchor',
  );
  if (
    anchor.schema !== 'scopa.rfc3161-anchor.v1' ||
    anchor.trust !== 'verifier-supplied-root-required'
  ) {
    throw new Error('unsupported RFC 3161 anchor or trust policy');
  }
  assertNonEmptyString(anchor.authorityId, 'RFC 3161 authorityId');
  if (
    expectedAuthorityId !== undefined &&
    anchor.authorityId !== expectedAuthorityId
  ) {
    throw new Error('RFC 3161 authorityId does not match verifier policy');
  }
  assertNonEmptyString(
    anchor.untrustedCertificatesPem,
    'RFC 3161 untrustedCertificatesPem',
  );
  assertDigest(
    anchor.signerCertificateSha256,
    'RFC 3161 signerCertificateSha256',
  );
  if (
    expectedSignerCertificateSha256 !== undefined &&
    anchor.signerCertificateSha256 !== expectedSignerCertificateSha256
  ) {
    throw new Error(
      'RFC 3161 signer certificate does not match verifier identity policy',
    );
  }
  const declaredSigner = certificateDetails(
    anchor.untrustedCertificatesPem,
    'RFC 3161 signer certificate',
  );
  if (declaredSigner.sha256 !== anchor.signerCertificateSha256) {
    throw new Error('RFC 3161 signer certificate fingerprint mismatch');
  }
  assertNonEmptyString(trustedRootsPem, 'RFC 3161 trustedRootsPem');
  assertRequest(anchor.request);
  const bytes = timestampSubjectBytes(signature);
  if (hashHex(bytes) !== anchor.request.imprintHex) {
    throw new Error(
      'RFC 3161 imprint does not bind the commitment signature envelope',
    );
  }
  const query = decodeCanonicalBase64(
    anchor.request.queryBase64,
    'RFC 3161 request queryBase64',
  );
  const response = decodeCanonicalBase64(
    anchor.responseBase64,
    'RFC 3161 responseBase64',
  );
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-rfc3161-verify-'));
  try {
    await Promise.all([
      writeFile(path.join(root, 'request.tsq'), query),
      writeFile(path.join(root, 'response.tsr'), response),
      writeFile(path.join(root, 'roots.pem'), trustedRootsPem),
      writeFile(
        path.join(root, 'untrusted.pem'),
        anchor.untrustedCertificatesPem,
      ),
    ]);
    runOpenSsl(
      opensslPath,
      [
        'ts',
        '-reply',
        '-in',
        'response.tsr',
        '-token_out',
        '-out',
        'token.der',
      ],
      root,
    );
    runOpenSsl(
      opensslPath,
      [
        'cms',
        '-verify',
        '-inform',
        'DER',
        '-in',
        'token.der',
        '-noverify',
        '-signer',
        'actual-signer.pem',
        '-out',
        'tstinfo.der',
      ],
      root,
    );
    const actualSigner = certificateDetails(
      await readFile(path.join(root, 'actual-signer.pem'), 'utf8'),
      'RFC 3161 token signer certificate',
    );
    if (actualSigner.sha256 !== anchor.signerCertificateSha256) {
      throw new Error(
        'RFC 3161 response signer does not match the declared signer certificate',
      );
    }
    const text = runOpenSsl(
      opensslPath,
      ['ts', '-reply', '-in', 'response.tsr', '-text'],
      root,
    );
    const parsed = parseTimestampText(text);
    const authorityEpoch = Date.parse(parsed.authorityTime);
    if (
      parsed.hashAlgorithm?.toLowerCase() !== 'sha256' ||
      parsed.authorityTime === null ||
      parsed.policyOid === null ||
      parsed.serialNumber === null ||
      !Number.isFinite(authorityEpoch)
    ) {
      throw new Error('RFC 3161 response text omitted required verified fields');
    }
    const verificationOutput = runOpenSsl(
      opensslPath,
      [
        'ts',
        '-verify',
        '-queryfile',
        'request.tsq',
        '-in',
        'response.tsr',
        '-CAfile',
        'roots.pem',
        '-untrusted',
        'untrusted.pem',
        '-attime',
        String(Math.floor(authorityEpoch / 1000)),
      ],
      root,
    );
    return Object.freeze({
      schema: 'scopa.rfc3161-anchor-verification.v1',
      ok: true,
      authorityId: anchor.authorityId,
      authorityIdPolicyMatched:
        expectedAuthorityId === undefined ? null : true,
      signerCertificatePolicyMatched:
        expectedSignerCertificateSha256 === undefined ? null : true,
      trust: anchor.trust,
      imprintAlgorithm: anchor.request.imprintAlgorithm,
      imprintHex: anchor.request.imprintHex,
      policyOid: parsed.policyOid,
      serialNumber: parsed.serialNumber,
      authorityTime: parsed.authorityTime,
      certificateValidationTime: parsed.authorityTime,
      revocationStatus: 'not-checked',
      signerCertificateSha256: actualSigner.sha256,
      signerSubject: actualSigner.subject,
      signerIssuer: actualSigner.issuer,
      verifier: 'openssl-ts',
      verifierOutput: verificationOutput.trim(),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
