#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexToBytes } from '../../journal/src/bytes.js';
import { hashHex } from '../../journal/src/hash.js';
import {
  appendInferPinRecords,
  attachTimestampAnchor,
  createEvidencePacket,
  createInferPin,
  createRfc3161Anchor,
  createRfc3161Request,
  generateSoftwareSigningKeyPair,
  replayInferOffline,
  requestRfc3161Timestamp,
  verifyEvidencePacket,
} from './index.js';
import { createLocalTsaFixture } from '../test/tsa-fixture.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function optionsFrom(argv) {
  const options = {
    authorityId: null,
    packetOut: null,
    reportOut: null,
    rootsIn: null,
    rootsOut: null,
    timestampUrl: null,
    untrustedIn: null,
    signerSha256: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--packet-out') options.packetOut = argv[++index];
    else if (argv[index] === '--report-out') options.reportOut = argv[++index];
    else if (argv[index] === '--roots-out') options.rootsOut = argv[++index];
    else if (argv[index] === '--roots-in') options.rootsIn = argv[++index];
    else if (argv[index] === '--untrusted-in') options.untrustedIn = argv[++index];
    else if (argv[index] === '--timestamp-url') options.timestampUrl = argv[++index];
    else if (argv[index] === '--authority-id') options.authorityId = argv[++index];
    else if (argv[index] === '--signer-sha256') options.signerSha256 = argv[++index];
    else throw new Error(`unknown argument: ${argv[index]}`);
  }
  if (
    options.timestampUrl &&
    (
      !options.rootsIn ||
      !options.untrustedIn ||
      !options.authorityId ||
      !options.signerSha256
    )
  ) {
    throw new Error(
      'external timestamping requires --roots-in, --untrusted-in, --authority-id, and --signer-sha256',
    );
  }
  return options;
}

async function main() {
  const options = optionsFrom(process.argv.slice(2));
  const [s3EvidenceText, receiptText, planBytes] = await Promise.all([
    readFile(
      path.join(ROOT, 'evidence/S3/2026-07-26-model-agent-boundary-map.json'),
      'utf8',
    ),
    readFile(
      path.join(ROOT, 'runs/S3/2026-07-26-model-session-receipt.json'),
      'utf8',
    ),
    readFile(path.join(ROOT, 'runs/S3/2026-07-26-model-agent-plan.json')),
  ]);
  const s3Evidence = JSON.parse(s3EvidenceText);
  const receipt = JSON.parse(receiptText);
  const baseRecords = s3Evidence.journalEvidence.recordHex.map(hexToBytes);
  const inferPin = createInferPin({
    provider: receipt.request.provider,
    modelSnapshot: `requested:${receipt.request.requestedModel}`,
    snapshotAuthority: 'host-reported-not-provider-signed',
    snapshotStatus: 'requested-alias-not-snapshot',
    prompt: receipt.request.prompt,
    promptHash: receipt.request.promptSha256,
    parameters: {
      client: receipt.client.name,
      clientVersion: receipt.client.version,
      outputSchemaSha256: receipt.request.outputSchemaSha256,
      transport: 'ephemeral-read-only-codex-cli',
    },
    responseBytes: new Uint8Array(planBytes),
  });
  const fixtureModelSource =
    'SCOPA deterministic fixture model v1: output equals UTF-8("fixture-response-v1").';
  const fixtureResponse = new TextEncoder().encode('fixture-response-v1');
  const immutableFixturePin = createInferPin({
    provider: 'scopa-deterministic-fixture',
    modelSnapshot: `sha256:${hashHex(new TextEncoder().encode(fixtureModelSource))}`,
    snapshotAuthority: 'host-reported-not-provider-signed',
    snapshotStatus: 'content-addressed-immutable-snapshot',
    prompt: 'Return the fixture response.',
    parameters: {
      fixtureProtocol: 'scopa.deterministic-fixture-model.v1',
    },
    responseBytes: fixtureResponse,
  });
  const { records, commitment } = appendInferPinRecords(
    baseRecords,
    [inferPin, immutableFixturePin],
  );
  const keys = generateSoftwareSigningKeyPair();
  let packet = createEvidencePacket({
    records,
    commitment,
    inferPins: [inferPin, immutableFixturePin],
    ...keys,
  });
  const tsa = options.timestampUrl ? null : await createLocalTsaFixture();
  try {
    const request = await createRfc3161Request({
      signature: packet.signature,
    });
    const [trustedRootsPem, untrustedCertificatesPem] = options.timestampUrl
      ? await Promise.all([
          readFile(options.rootsIn, 'utf8'),
          readFile(options.untrustedIn, 'utf8'),
        ])
      : [tsa.rootCertPem, tsa.tsaCertPem];
    const response = options.timestampUrl
      ? await requestRfc3161Timestamp({
          request,
          url: options.timestampUrl,
        })
      : await tsa.issue(Buffer.from(request.queryBase64, 'base64'));
    const authorityId = options.timestampUrl
      ? options.authorityId
      : tsa.authorityId;
    const timestampAnchor = createRfc3161Anchor({
      request,
      responseBytes: response,
      authorityId,
      untrustedCertificatesPem,
    });
    packet = attachTimestampAnchor(packet, timestampAnchor);
    const verification = await verifyEvidencePacket(packet, {
      expectedTimestampAuthorityId: authorityId,
      expectedTimestampSignerSha256:
        options.signerSha256 ?? timestampAnchor.signerCertificateSha256,
      requireTimestamp: true,
      trustedTimestampRootsPem: trustedRootsPem,
    });
    const replayed = replayInferOffline(inferPin);
    const replayedFixture = replayInferOffline(immutableFixturePin);
    const report = {
      schema: 'scopa.s4-acceptance-probe.v1',
      ok: verification.ok,
      authorityScope: options.timestampUrl
        ? `external RFC 3161 authority at ${new URL(options.timestampUrl).origin}; trust root supplied explicitly`
        : 'ephemeral local test TSA trusted explicitly by the verifier; not a public time authority',
      privateKeyRetained: false,
      offlineReplayMatches:
        Buffer.compare(Buffer.from(replayed), planBytes) === 0,
      immutableSnapshotReplayMatches:
        Buffer.compare(Buffer.from(replayedFixture), Buffer.from(fixtureResponse)) === 0,
      verification,
    };
    const writes = [];
    if (options.packetOut) {
      writes.push(writeFile(options.packetOut, `${JSON.stringify(packet, null, 2)}\n`));
    }
    if (options.rootsOut) writes.push(writeFile(options.rootsOut, trustedRootsPem));
    if (options.reportOut) {
      writes.push(writeFile(options.reportOut, `${JSON.stringify(report, null, 2)}\n`));
    }
    await Promise.all(writes);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await tsa?.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
