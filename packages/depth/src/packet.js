import { createChainCommitment, verifyChain } from '../../journal/src/record.js';
import { bytesToHex, hexToBytes } from '../../journal/src/bytes.js';
import {
  assertExactKeys,
  assertNonEmptyString,
  deepFreeze,
} from './schema.js';
import {
  createCommitmentSignature,
  verifyCommitmentSignature,
} from './signature.js';
import { verifyInferPin } from './infer-pin.js';
import { verifyInferPinLinkage } from './infer-link.js';
import { verifyRfc3161Anchor } from './rfc3161.js';

function assertPacket(packet) {
  assertExactKeys(
    packet,
    [
      'commitment',
      'inferPins',
      'recordHex',
      'schema',
      'signature',
      'timestampAnchor',
    ],
    'evidence packet',
  );
  if (packet.schema !== 'scopa.evidence-packet.v1') {
    throw new Error('unsupported evidence packet schema');
  }
  if (
    !Array.isArray(packet.recordHex) ||
    packet.recordHex.length === 0 ||
    packet.recordHex.some(
      (hex) => typeof hex !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(hex),
    )
  ) {
    throw new Error('evidence packet recordHex must contain journal records');
  }
  if (!Array.isArray(packet.inferPins)) {
    throw new Error('evidence packet inferPins must be an array');
  }
  if (packet.timestampAnchor !== null) {
    assertNonEmptyString(
      packet.timestampAnchor.authorityId,
      'timestamp authorityId',
    );
  }
}

function verifyPins(pins) {
  const verified = pins.map((pin) => verifyInferPin(pin));
  return verified;
}

export function createEvidencePacket({
  records,
  commitment = createChainCommitment(records),
  inferPins = [],
  privateKey,
  publicKey,
  keyClass,
}) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new TypeError('records must be a non-empty array');
  }
  const chain = verifyChain(records, commitment);
  verifyPins(inferPins);
  verifyInferPinLinkage(chain.records, inferPins);
  const signature = createCommitmentSignature({
    commitment,
    inferPins,
    privateKey,
    publicKey,
    keyClass,
  });
  return deepFreeze({
    schema: 'scopa.evidence-packet.v1',
    commitment,
    recordHex: records.map(bytesToHex),
    inferPins,
    signature,
    timestampAnchor: null,
  });
}

export function attachTimestampAnchor(packet, timestampAnchor) {
  assertPacket(packet);
  if (packet.timestampAnchor !== null) {
    throw new Error('evidence packet already has a timestamp anchor');
  }
  return deepFreeze({
    ...packet,
    timestampAnchor,
  });
}

export async function verifyEvidencePacket(
  packet,
  {
    trustedTimestampRootsPem,
    opensslPath = 'openssl',
    attestationVerifier,
    expectedTimestampAuthorityId,
    expectedTimestampSignerSha256,
    requireTimestamp = false,
  } = {},
) {
  assertPacket(packet);
  const records = packet.recordHex.map(hexToBytes);
  const chain = verifyChain(records, packet.commitment);
  const inferPins = verifyPins(packet.inferPins);
  const inferLinkage = verifyInferPinLinkage(chain.records, packet.inferPins);
  const signature = await verifyCommitmentSignature({
    commitment: packet.commitment,
    inferPins: packet.inferPins,
    signature: packet.signature,
    attestationVerifier,
  });
  let timestamp = null;
  if (requireTimestamp && packet.timestampAnchor === null) {
    throw new Error('verification policy requires an RFC 3161 timestamp anchor');
  }
  if (packet.timestampAnchor !== null) {
    timestamp = await verifyRfc3161Anchor({
      anchor: packet.timestampAnchor,
      signature: packet.signature,
      trustedRootsPem: trustedTimestampRootsPem,
      opensslPath,
      expectedAuthorityId: expectedTimestampAuthorityId,
      expectedSignerCertificateSha256: expectedTimestampSignerSha256,
    });
  }
  return Object.freeze({
    schema: 'scopa.evidence-packet-verification.v1',
    ok: true,
    chain: {
      length: chain.length,
      rootHash: chain.rootHash,
    },
    inferPins: inferPins.map((pin) => ({
      pinId: pin.pinId,
      provider: pin.provider,
      modelSnapshot: pin.modelSnapshot,
      snapshotAuthority: pin.snapshotAuthority,
      snapshotStatus: pin.snapshotStatus,
      snapshotPinned: pin.snapshotPinned,
      responseHash: pin.responseHash,
    })),
    inferLinkage,
    signature,
    timestamp,
    claim:
      timestamp === null
        ? 'signed commitment; no external time claim'
        : 'signed commitment with RFC 3161 time assertion under verifier-supplied trust',
  });
}
