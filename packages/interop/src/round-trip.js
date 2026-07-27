import { createCaseExport, assertCaseDocumentEnvelope, serializeCaseExport } from './export.js';
import {
  assertDigest,
  assertExactKeys,
  decodeCanonicalBase64,
  hashBytes,
  InteropVerificationError,
  stableJson,
} from './schema.js';

function carrierNode(document) {
  const carriers = document['@graph'].filter(
    (node) =>
      node &&
      typeof node === 'object' &&
      !Array.isArray(node) &&
      node['scopa:exportSchema'] === 'scopa.case-export.v1' &&
      Array.isArray(node['@type']) &&
      node['@type'].includes('scopa:EvidencePacket'),
  );
  if (carriers.length !== 1) {
    throw new InteropVerificationError(
      `CASE export must contain exactly one SCOPA evidence packet carrier; found ${carriers.length}`,
    );
  }
  return carriers[0];
}

function packetBytesFromCarrier(carrier) {
  assertExactKeys(
    carrier['scopa:nativePacketBase64'],
    ['@type', '@value'],
    'native packet base64 literal',
  );
  if (carrier['scopa:nativePacketBase64']['@type'] !== 'xsd:base64Binary') {
    throw new InteropVerificationError(
      'native packet literal must use xsd:base64Binary',
    );
  }
  const bytes = decodeCanonicalBase64(
    carrier['scopa:nativePacketBase64']['@value'],
    'native packet base64 value',
  );
  assertDigest(
    carrier['scopa:nativePacketSha256'],
    'native packet SHA-256',
  );
  if (hashBytes(bytes) !== carrier['scopa:nativePacketSha256']) {
    throw new InteropVerificationError(
      'native packet bytes do not match the CASE carrier digest',
    );
  }
  return bytes;
}

export async function verifyCaseExport(
  document,
  { verificationOptions = {} } = {},
) {
  const normalizedJson = stableJson(document);
  const normalizedDocument = JSON.parse(normalizedJson);
  assertCaseDocumentEnvelope(normalizedDocument);
  const carrier = carrierNode(normalizedDocument);
  const packetBytes = packetBytesFromCarrier(carrier);
  const expected = await createCaseExport({
    packetBytes,
    verificationOptions,
  });
  if (normalizedJson !== stableJson(expected.document)) {
    throw new InteropVerificationError(
      'CASE graph does not exactly match the deterministic SCOPA projection',
    );
  }
  return Object.freeze({
    schema: 'scopa.case-export-verification.v1',
    ok: true,
    caseOntologyVersion: carrier['scopa:caseOntologyVersion'],
    caseUtilsVersion: carrier['scopa:caseUtilsVersion'],
    nativePacketSha256: carrier['scopa:nativePacketSha256'],
    packetBytes,
    packet: expected.packet,
    packetVerification: expected.packetVerification,
    graph: {
      nodeCount: normalizedDocument['@graph'].length,
      actionCount: normalizedDocument['@graph'].filter(
        (node) => node['@type'] === 'uco-action:Action',
      ).length,
      relationshipCount: normalizedDocument['@graph'].filter(
        (node) => node['@type'] === 'uco-core:Relationship',
      ).length,
    },
    claim:
      'CASE/UCO graph structure plus exact native SCOPA packet recovery; ' +
      'CASE validation does not replace SCOPA cryptographic verification',
  });
}

export async function verifyCaseExportBytes(
  jsonBytes,
  options = {},
) {
  if (!(jsonBytes instanceof Uint8Array) || jsonBytes.byteLength === 0) {
    throw new TypeError('jsonBytes must be a non-empty Uint8Array');
  }
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(jsonBytes);
  } catch {
    throw new InteropVerificationError('CASE export is not valid UTF-8');
  }
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    throw new InteropVerificationError('CASE export is not valid JSON');
  }
  const canonical = serializeCaseExport(document);
  if (!Buffer.from(canonical).equals(Buffer.from(jsonBytes))) {
    throw new InteropVerificationError(
      'CASE export JSON is not the canonical SCOPA serialization',
    );
  }
  return verifyCaseExport(document, options);
}
