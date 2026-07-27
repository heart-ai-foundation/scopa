import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { sealRecord } from '../../journal/src/record.js';
import { hashHex } from '../../journal/src/hash.js';
import {
  appendInferPinRecords,
  attachTimestampAnchor,
  createEvidencePacket,
  createInferPin,
  createKeyClass,
  createRfc3161Anchor,
  createRfc3161Request,
  generateSoftwareSigningKeyPair,
  replayInferOffline,
  requestRfc3161Timestamp,
  verifyCommitmentSignature,
  verifyEvidencePacket,
  verifyInferPin,
} from '../src/index.js';
import { createLocalTsaFixture } from './tsa-fixture.js';

function journalFixture(inferPins = []) {
  const sealed = sealRecord({
    runId: 'S4-depth-test',
    scriptHash: 'a'.repeat(64),
    seq: 0,
    scope: 'workspace',
    effect: {
      category: 'TOOL.QUERY',
      payload: {
        operation: 'fixture-read',
      },
      scope: 'workspace',
    },
    outcome: {
      status: 'fulfilled',
      value: {
        result: 'fixture',
      },
    },
  });
  return appendInferPinRecords([sealed.bytes], inferPins);
}

function inferFixture() {
  return createInferPin({
    provider: 'openai',
    modelSnapshot: `sha256:${'b'.repeat(64)}`,
    snapshotAuthority: 'host-reported-not-provider-signed',
    snapshotStatus: 'content-addressed-immutable-snapshot',
    prompt: 'Return a bounded coding-agent plan.',
    parameters: {
      reasoningEffort: 'high',
      temperatureBasisPoints: 0,
    },
    responseBytes: new TextEncoder().encode(
      '{"calls":[{"operation":"read","target":"README.md"}]}',
    ),
  });
}

function clone(value) {
  return structuredClone(value);
}

test('INFER pin replays retained bytes offline and rejects every bound-field mutation', () => {
  const pin = inferFixture();
  const verification = verifyInferPin(pin, {
    expectedPrompt: 'Return a bounded coding-agent plan.',
  });
  assert.equal(verification.ok, true);
  assert.equal(verification.snapshotPinned, true);
  assert.equal(
    new TextDecoder().decode(replayInferOffline(pin)),
    '{"calls":[{"operation":"read","target":"README.md"}]}',
  );
  for (const mutate of [
    (candidate) => {
      candidate.provider = 'other';
    },
    (candidate) => {
      candidate.modelSnapshot = 'moving-alias';
    },
    (candidate) => {
      candidate.snapshotAuthority = 'provider-signed';
    },
    (candidate) => {
      candidate.snapshotStatus = 'requested-alias-not-snapshot';
    },
    (candidate) => {
      candidate.parameters.temperatureBasisPoints = 1;
    },
    (candidate) => {
      candidate.prompt.digest = '0'.repeat(64);
    },
    (candidate) => {
      candidate.response.bytesBase64 = Buffer.from('changed').toString('base64');
    },
  ]) {
    const candidate = clone(pin);
    mutate(candidate);
    assert.throws(() => verifyInferPin(candidate));
  }
});

test('Ed25519 signature binds commitment, INFER pins, algorithm, domain, and key class', async () => {
  const pin = inferFixture();
  const { records, commitment } = journalFixture([pin]);
  const keys = generateSoftwareSigningKeyPair();
  const packet = createEvidencePacket({
    records,
    commitment,
    inferPins: [pin],
    ...keys,
  });
  const verified = await verifyCommitmentSignature({
    commitment,
    inferPins: [pin],
    signature: packet.signature,
  });
  assert.equal(verified.ok, true);
  assert.equal(verified.algorithm, 'ed25519');
  assert.equal(verified.domain, 'SCOPA-COMMITMENT-SIGNATURE-v1');
  assert.equal(verified.keyClass.assurance, 'key-possession-only');

  for (const mutate of [
    (candidate) => {
      candidate.algorithm = 'rsa-pss-sha256';
    },
    (candidate) => {
      candidate.domain = 'OTHER-DOMAIN';
    },
    (candidate) => {
      candidate.key.class.id = 'hardware-backed';
      candidate.key.class.assurance = 'externally-attested-hardware-backed';
    },
    (candidate) => {
      candidate.signatureBase64 = Buffer.alloc(64).toString('base64');
    },
  ]) {
    const candidate = clone(packet.signature);
    mutate(candidate);
    await assert.rejects(() =>
      verifyCommitmentSignature({
        commitment,
        inferPins: [pin],
        signature: candidate,
      }),
    );
  }
});

test('stronger key classes require hash-valid evidence and an external verifier', async () => {
  assert.throws(() => createKeyClass({ id: 'hardware-backed' }));
  const artifact = new TextEncoder().encode('opaque attestation');
  const keyClass = createKeyClass({
    id: 'hardware-backed',
    evidence: {
      schema: 'scopa.external-key-attestation.v1',
      format: 'test/opaque',
      artifactBase64: Buffer.from(artifact).toString('base64'),
      artifactSha256: hashHex(artifact),
      verifierId: 'test-attestation-verifier.v1',
    },
  });
  const { records, commitment } = journalFixture();
  const keys = generateSoftwareSigningKeyPair();
  const packet = createEvidencePacket({
    records,
    commitment,
    inferPins: [],
    privateKey: keys.privateKey,
    publicKey: keys.publicKey,
    keyClass,
  });
  await assert.rejects(() => verifyEvidencePacket(packet), /external attestation verifier/);
  const accepted = await verifyEvidencePacket(packet, {
    attestationVerifier: async ({ artifact: received }) =>
      Buffer.from(received).equals(Buffer.from(artifact)),
  });
  assert.equal(accepted.signature.keyClass.attested, true);
});

test('packet verification fails on record, commitment, signature, and INFER tampering', async () => {
  const pin = inferFixture();
  const { records, commitment } = journalFixture([pin]);
  const keys = generateSoftwareSigningKeyPair();
  const packet = createEvidencePacket({
    records,
    commitment,
    inferPins: [pin],
    ...keys,
  });
  assert.equal((await verifyEvidencePacket(packet)).ok, true);
  assert.equal((await verifyEvidencePacket(packet)).inferLinkage.linkedRecordCount, 1);
  const unlinked = journalFixture();
  assert.throws(() =>
    createEvidencePacket({
      records: unlinked.records,
      commitment: unlinked.commitment,
      inferPins: [pin],
      ...keys,
    }),
  );
  await assert.rejects(
    () => verifyEvidencePacket(packet, { requireTimestamp: true }),
    /requires an RFC 3161 timestamp/,
  );
  const duplicate = clone(packet);
  duplicate.inferPins.push(clone(duplicate.inferPins[0]));
  await assert.rejects(() => verifyEvidencePacket(duplicate), /duplicate INFER/);

  const mutations = [
    (candidate) => {
      candidate.recordHex[0] = `${candidate.recordHex[0].slice(0, -2)}00`;
    },
    (candidate) => {
      candidate.commitment.rootHash = '0'.repeat(64);
    },
    (candidate) => {
      candidate.signature.signingInputSha256 = '0'.repeat(64);
    },
    (candidate) => {
      candidate.inferPins[0].parameters.reasoningEffort = 'low';
    },
  ];
  for (const mutate of mutations) {
    const candidate = clone(packet);
    mutate(candidate);
    await assert.rejects(() => verifyEvidencePacket(candidate));
  }
});

test('RFC 3161 anchor verifies imprint, token signature, signer certificate, and caller trust root', async (context) => {
  const tsa = await createLocalTsaFixture();
  context.after(() => tsa.close());
  const pin = inferFixture();
  const { records } = journalFixture([pin]);
  const keys = generateSoftwareSigningKeyPair();
  const unsigned = createEvidencePacket({
    records,
    inferPins: [pin],
    ...keys,
  });
  const request = await createRfc3161Request({
    signature: unsigned.signature,
  });
  const queryBytes = Buffer.from(request.queryBase64, 'base64');
  const responseBytes = await tsa.issue(queryBytes);
  const transported = await requestRfc3161Timestamp({
    request,
    url: 'https://tsa.example.test/tsr',
    fetchImpl: async (_url, options) => {
      assert.equal(options.headers['content-type'], 'application/timestamp-query');
      assert.deepEqual(new Uint8Array(options.body), new Uint8Array(queryBytes));
      return new Response(responseBytes, {
        status: 200,
        headers: { 'content-type': 'application/timestamp-reply' },
      });
    },
  });
  assert.deepEqual(transported, responseBytes);
  await assert.rejects(
    () =>
      requestRfc3161Timestamp({
        request,
        url: 'http://tsa.example.test/tsr',
        fetchImpl: async () => new Response(responseBytes),
      }),
    /requires HTTPS/,
  );
  const anchor = createRfc3161Anchor({
    request,
    responseBytes,
    authorityId: tsa.authorityId,
    untrustedCertificatesPem: tsa.tsaCertPem,
  });
  const packet = attachTimestampAnchor(unsigned, anchor);
  const verified = await verifyEvidencePacket(packet, {
    expectedTimestampAuthorityId: tsa.authorityId,
    expectedTimestampSignerSha256: anchor.signerCertificateSha256,
    trustedTimestampRootsPem: tsa.rootCertPem,
  });
  assert.equal(verified.timestamp.ok, true);
  assert.equal(verified.timestamp.imprintHex, request.imprintHex);
  assert.equal(verified.timestamp.verifierOutput, 'Verification: OK');
  assert.equal(verified.timestamp.authorityIdPolicyMatched, true);
  assert.equal(verified.timestamp.signerCertificatePolicyMatched, true);
  assert.equal(verified.timestamp.revocationStatus, 'not-checked');
  assert.match(verified.timestamp.authorityTime, /GMT$/);
  await assert.rejects(
    () =>
      verifyEvidencePacket(packet, {
        expectedTimestampAuthorityId: 'different-authority',
        trustedTimestampRootsPem: tsa.rootCertPem,
      }),
    /does not match verifier policy/,
  );
  await assert.rejects(
    () =>
      verifyEvidencePacket(packet, {
        expectedTimestampAuthorityId: tsa.authorityId,
        expectedTimestampSignerSha256: '0'.repeat(64),
        trustedTimestampRootsPem: tsa.rootCertPem,
      }),
    /does not match verifier identity policy/,
  );

  const wrong = await createLocalTsaFixture();
  context.after(() => wrong.close());
  const signerSwapped = clone(packet);
  signerSwapped.timestampAnchor = createRfc3161Anchor({
    request,
    responseBytes,
    authorityId: tsa.authorityId,
    untrustedCertificatesPem: wrong.tsaCertPem,
  });
  await assert.rejects(
    () =>
      verifyEvidencePacket(signerSwapped, {
        expectedTimestampAuthorityId: tsa.authorityId,
        trustedTimestampRootsPem: tsa.rootCertPem,
      }),
    /response signer does not match|OpenSSL RFC 3161 command failed/,
  );
  await assert.rejects(
    () =>
      verifyEvidencePacket(packet, {
        expectedTimestampAuthorityId: tsa.authorityId,
        expectedTimestampSignerSha256: anchor.signerCertificateSha256,
        trustedTimestampRootsPem: wrong.rootCertPem,
      }),
    /OpenSSL RFC 3161 command failed/,
  );
  const tampered = clone(packet);
  const response = Buffer.from(tampered.timestampAnchor.responseBase64, 'base64');
  tampered.timestampAnchor.responseBase64 = response.subarray(0, -1).toString('base64');
  await assert.rejects(() =>
    verifyEvidencePacket(tampered, {
      expectedTimestampAuthorityId: tsa.authorityId,
      expectedTimestampSignerSha256: anchor.signerCertificateSha256,
      trustedTimestampRootsPem: tsa.rootCertPem,
    }),
  );
});

test('fresh process verifies a self-contained packet without private key or original workflow', async (context) => {
  const tsa = await createLocalTsaFixture();
  context.after(() => tsa.close());
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-depth-cli-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const pin = inferFixture();
  const { records } = journalFixture([pin]);
  const keys = generateSoftwareSigningKeyPair();
  let packet = createEvidencePacket({
    records,
    inferPins: [pin],
    ...keys,
  });
  const request = await createRfc3161Request({ signature: packet.signature });
  const response = await tsa.issue(Buffer.from(request.queryBase64, 'base64'));
  packet = attachTimestampAnchor(
    packet,
    createRfc3161Anchor({
      request,
      responseBytes: response,
      authorityId: tsa.authorityId,
      untrustedCertificatesPem: tsa.tsaCertPem,
    }),
  );
  const packetPath = path.join(root, 'packet.json');
  const rootsPath = path.join(root, 'trusted-roots.pem');
  const reportPath = path.join(root, 'verification.json');
  await Promise.all([
    writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`),
    writeFile(rootsPath, tsa.rootCertPem),
  ]);
  const childEnv = { ...process.env };
  delete childEnv.NODE_TEST_CONTEXT;
  const result = spawnSync(
    process.execPath,
    [
      'packages/depth/src/verify-packet-cli.js',
      '--packet',
      packetPath,
      '--timestamp-roots',
      rootsPath,
      '--report-out',
      reportPath,
      '--require-timestamp',
      '--timestamp-authority-id',
      tsa.authorityId,
      '--timestamp-signer-sha256',
      packet.timestampAnchor.signerCertificateSha256,
    ],
    {
      cwd: path.resolve(import.meta.dirname, '../../..'),
      encoding: 'utf8',
      env: childEnv,
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  assert.equal(report.ok, true);
  assert.equal(report.chain.length, 2);
  assert.equal(report.inferPins.length, 1);
  assert.equal(report.inferLinkage.linkedRecordCount, 1);
  assert.equal(report.timestamp.ok, true);
  assert.equal(
    await readFile(packetPath, 'utf8').then((text) => JSON.parse(text).schema),
    'scopa.evidence-packet.v1',
  );
});
