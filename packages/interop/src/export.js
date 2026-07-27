import { createHash } from 'node:crypto';
import { decodeRecord } from '../../journal/src/record.js';
import { hexToBytes } from '../../journal/src/bytes.js';
import { verifyEvidencePacket } from '../../depth/src/packet.js';
import { mappingForEffect } from './mapping.js';
import {
  assertExactKeys,
  assertPlainObject,
  deepFreeze,
  encodeBase64,
  hashBytes,
  InteropVerificationError,
  stableJsonPretty,
} from './schema.js';

export const CASE_EXPORT_SCHEMA = 'scopa.case-export.v1';
export const CASE_ONTOLOGY_VERSION = '1.4.0';
export const CASE_UTILS_VERSION = '0.17.0';
export const MAX_NATIVE_PACKET_BYTES = 16 * 1024 * 1024;
export const SCOPA_CASE_NAMESPACE_UUID =
  '1d915dbb-6654-5073-916b-5b9e8721e017';

export const CASE_CONTEXT = deepFreeze({
  '@version': 1.1,
  kb: 'https://heart-ai.foundation/scopa/case/kb/',
  scopa: 'https://heart-ai.foundation/scopa/ontology/v1#',
  'uco-action': 'https://ontology.unifiedcyberontology.org/uco/action/',
  'uco-core': 'https://ontology.unifiedcyberontology.org/uco/core/',
  'uco-identity': 'https://ontology.unifiedcyberontology.org/uco/identity/',
  'uco-tool': 'https://ontology.unifiedcyberontology.org/uco/tool/',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
});

function deterministicUuid(label, value) {
  const namespace = Buffer.from(
    SCOPA_CASE_NAMESPACE_UUID.replaceAll('-', ''),
    'hex',
  );
  const digest = createHash('sha1')
    .update(namespace)
    .update('SCOPA-CASE-ID-v1\0', 'utf8')
    .update(label, 'utf8')
    .update('\0', 'utf8')
    .update(value, 'utf8')
    .digest()
    .subarray(0, 16);
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function nodeId(kind, label, value) {
  return `kb:${kind}-${deterministicUuid(label, value)}`;
}

function ref(id) {
  return { '@id': id };
}

function parseNativePacket(packetBytes) {
  if (!(packetBytes instanceof Uint8Array)) {
    throw new TypeError('packetBytes must be a Uint8Array');
  }
  if (
    packetBytes.byteLength === 0 ||
    packetBytes.byteLength > MAX_NATIVE_PACKET_BYTES
  ) {
    throw new InteropVerificationError(
      `native packet must contain 1-${MAX_NATIVE_PACKET_BYTES} bytes`,
    );
  }
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(packetBytes);
  } catch {
    throw new InteropVerificationError('native packet is not valid UTF-8');
  }
  let packet;
  try {
    packet = JSON.parse(text);
  } catch {
    throw new InteropVerificationError('native packet is not valid JSON');
  }
  assertPlainObject(packet, 'native packet');
  return packet;
}

function actionNode(record, packetHash) {
  const mapping = mappingForEffect(record.effect.category);
  return {
    '@id': nodeId('action', 'record', record.hash),
    '@type': mapping.actionType,
    'scopa:effectCategory': record.effect.category,
    'scopa:effectKind': mapping.effectKind,
    'scopa:outcomeStatus': record.outcome.status,
    'scopa:recordHash': record.hash,
    'scopa:sequence': record.seq,
    'scopa:scope': record.effect.scope,
    'scopa:nativePacketSha256': packetHash,
    'uco-core:description':
      `SCOPA journal record ${record.seq}: ${record.effect.category} ` +
      `(${mapping.effectKind}) completed with outcome ${record.outcome.status}. ` +
      'The exact signed record remains in the native SCOPA packet.',
    'uco-core:name': mapping.label,
    'uco-core:tag': [
      mapping.tag,
      `scopa:effect-kind:${mapping.effectKind}`,
      `scopa:record-hash:${record.hash}`,
    ],
  };
}

function relationshipNode({
  packetHash,
  kind,
  sourceId,
  targetId,
  discriminator,
}) {
  return {
    '@id': nodeId(
      'relationship',
      kind,
      `${packetHash}:${sourceId}:${targetId}:${discriminator}`,
    ),
    '@type': 'uco-core:Relationship',
    'uco-core:isDirectional': true,
    'uco-core:kindOfRelationship': kind,
    'uco-core:source': ref(sourceId),
    'uco-core:target': ref(targetId),
  };
}

function buildDocument({ packet, packetBytes, packetVerification }) {
  const packetHash = hashBytes(packetBytes);
  const records = packet.recordHex.map((hex) => decodeRecord(hexToBytes(hex)));
  const bundleId = nodeId('bundle', 'packet', packetHash);
  const carrierId = nodeId('evidence-packet', 'packet', packetHash);
  const toolId = nodeId('tool', 'scopa-kernel', records[0].kernelVersion);
  const identityId = nodeId('identity', 'signing-key', packet.signature.key.id);

  const actions = records.map((record) => actionNode(record, packetHash));
  const toolRelationships = actions.map((action, index) =>
    relationshipNode({
      packetHash,
      kind: 'SCOPA action recorded by runtime tool',
      sourceId: action['@id'],
      targetId: toolId,
      discriminator: String(index),
    }),
  );
  const signerRelationship = relationshipNode({
    packetHash,
    kind: 'SCOPA packet signed by cryptographic key',
    sourceId: carrierId,
    targetId: identityId,
    discriminator: 'signer',
  });

  const carrier = {
    '@id': carrierId,
    '@type': ['uco-core:UcoObject', 'scopa:EvidencePacket'],
    'scopa:caseOntologyVersion': CASE_ONTOLOGY_VERSION,
    'scopa:caseUtilsVersion': CASE_UTILS_VERSION,
    'scopa:chainRootSha256': packet.commitment.rootHash,
    'scopa:exportSchema': CASE_EXPORT_SCHEMA,
    'scopa:nativePacketBase64': {
      '@type': 'xsd:base64Binary',
      '@value': encodeBase64(packetBytes),
    },
    'scopa:nativePacketMediaType': 'application/vnd.scopa.evidence-packet+json',
    'scopa:nativePacketSha256': packetHash,
    'scopa:signatureAlgorithm': packet.signature.algorithm,
    'scopa:signatureKeyId': packet.signature.key.id,
    'scopa:verificationClaim': packetVerification.claim,
    'uco-core:description':
      'Exact signed SCOPA evidence packet. CASE validation checks graph ' +
      'structure only; SCOPA verification separately checks the journal, ' +
      'signature, optional timestamp, and INFER pins.',
    'uco-core:name': `SCOPA evidence packet ${packetHash.slice(0, 12)}`,
    'uco-core:tag': [
      'scopa:native-packet-preserved',
      'scopa:case-validation-does-not-verify-signature',
      `scopa:key-class:${packet.signature.key.class.id}`,
    ],
  };
  if (packet.timestampAnchor !== null) {
    carrier['scopa:timestampAuthorityId'] =
      packet.timestampAnchor.authorityId;
  }

  const identity = {
    '@id': identityId,
    '@type': 'uco-identity:Identity',
    'scopa:identityBoundary':
      'cryptographic-key-identifier; not a person, device, organization, or provider identity',
    'scopa:signatureKeyId': packet.signature.key.id,
    'uco-core:description':
      `Ed25519 key identifier ${packet.signature.key.id}. ` +
      `Its SCOPA key class is ${packet.signature.key.class.id} with assurance ` +
      `${packet.signature.key.class.assurance}; this node makes no human or device attribution.`,
    'uco-core:name': `SCOPA signing key ${packet.signature.key.id.slice(0, 12)}`,
    'uco-core:tag': [
      'scopa:cryptographic-key-identity',
      `scopa:key-class:${packet.signature.key.class.id}`,
      `scopa:key-assurance:${packet.signature.key.class.assurance}`,
    ],
  };

  const tool = {
    '@id': toolId,
    '@type': 'uco-tool:Tool',
    'uco-core:description':
      'SCOPA enforcement runtime that sealed the native journal. This graph ' +
      'does not imply that SCOPA performed every underlying external action.',
    'uco-core:name': 'SCOPA',
    'uco-core:tag': ['scopa:runtime-tool', 'scopa:open-enforcement-runtime'],
    'uco-tool:version': records[0].kernelVersion,
  };

  const members = [
    carrier,
    identity,
    tool,
    ...actions,
    ...toolRelationships,
    signerRelationship,
  ];
  const bundle = {
    '@id': bundleId,
    '@type': 'uco-core:Bundle',
    'scopa:exportSchema': CASE_EXPORT_SCHEMA,
    'scopa:nativePacketSha256': packetHash,
    'uco-core:description':
      'CASE/UCO projection of a signed SCOPA packet. The projection is for ' +
      'forensic graph interchange; the embedded native packet remains the proof.',
    'uco-core:name': `SCOPA CASE export ${packetHash.slice(0, 12)}`,
    'uco-core:object': members.map((node) => ref(node['@id'])),
    'uco-core:specVersion': CASE_ONTOLOGY_VERSION,
    'uco-core:tag': [
      `scopa:export-schema:${CASE_EXPORT_SCHEMA}`,
      `scopa:case-ontology:${CASE_ONTOLOGY_VERSION}`,
    ],
  };

  return deepFreeze({
    '@context': CASE_CONTEXT,
    '@graph': [bundle, ...members],
  });
}

export async function createCaseExport({
  packetBytes,
  verificationOptions = {},
}) {
  const packet = parseNativePacket(packetBytes);
  const packetVerification = await verifyEvidencePacket(
    packet,
    verificationOptions,
  );
  const document = buildDocument({
    packet,
    packetBytes,
    packetVerification,
  });
  return Object.freeze({
    schema: CASE_EXPORT_SCHEMA,
    document,
    jsonBytes: new TextEncoder().encode(stableJsonPretty(document)),
    nativePacketSha256: hashBytes(packetBytes),
    packet,
    packetVerification,
  });
}

export function assertCaseDocumentEnvelope(document) {
  assertExactKeys(document, ['@context', '@graph'], 'CASE export document');
  if (!Array.isArray(document['@graph']) || document['@graph'].length === 0) {
    throw new InteropVerificationError(
      'CASE export document @graph must be a non-empty array',
    );
  }
}

export function serializeCaseExport(document) {
  assertCaseDocumentEnvelope(document);
  return new TextEncoder().encode(stableJsonPretty(document));
}
