import {
  assertDigest,
  assertExactKeys,
  assertNonEmptyString,
  decodeCanonicalBase64,
  deepFreeze,
  hashHex,
} from './schema.js';

const KEY_CLASS_CLAIMS = Object.freeze({
  software: 'key-possession-only',
  'platform-keystore': 'externally-attested-platform-keystore',
  'hardware-backed': 'externally-attested-hardware-backed',
});

export const KEY_CLASS_IDS = Object.freeze(Object.keys(KEY_CLASS_CLAIMS));

function verifyAttestationShape(evidence) {
  assertExactKeys(
    evidence,
    ['artifactBase64', 'artifactSha256', 'format', 'schema', 'verifierId'],
    'key-class evidence',
  );
  if (evidence.schema !== 'scopa.external-key-attestation.v1') {
    throw new Error('unsupported key-class evidence schema');
  }
  assertNonEmptyString(evidence.format, 'key-class evidence format');
  assertNonEmptyString(evidence.verifierId, 'key-class evidence verifierId');
  assertDigest(evidence.artifactSha256, 'key-class evidence artifactSha256');
  const artifact = decodeCanonicalBase64(
    evidence.artifactBase64,
    'key-class evidence artifactBase64',
  );
  if (hashHex(artifact) !== evidence.artifactSha256) {
    throw new Error('key-class evidence artifact hash mismatch');
  }
  return artifact;
}

export function createKeyClass({ id = 'software', evidence = null } = {}) {
  if (!Object.hasOwn(KEY_CLASS_CLAIMS, id)) {
    throw new Error(`unsupported key class: ${id}`);
  }
  if (id === 'software' && evidence !== null) {
    throw new Error('software key class cannot carry backing attestation');
  }
  if (id !== 'software' && evidence === null) {
    throw new Error(`${id} requires external attestation evidence`);
  }
  if (evidence !== null) verifyAttestationShape(evidence);
  return deepFreeze({
    schema: 'scopa.key-class.v1',
    id,
    assurance: KEY_CLASS_CLAIMS[id],
    evidence,
  });
}

export async function verifyKeyClass(
  keyClass,
  { attestationVerifier, publicKeySpki } = {},
) {
  assertExactKeys(
    keyClass,
    ['assurance', 'evidence', 'id', 'schema'],
    'key class',
  );
  if (keyClass.schema !== 'scopa.key-class.v1') {
    throw new Error('unsupported key-class schema');
  }
  if (!Object.hasOwn(KEY_CLASS_CLAIMS, keyClass.id)) {
    throw new Error(`unsupported key class: ${keyClass.id}`);
  }
  if (keyClass.assurance !== KEY_CLASS_CLAIMS[keyClass.id]) {
    throw new Error('key-class assurance overstates or contradicts its class');
  }
  if (keyClass.id === 'software') {
    if (keyClass.evidence !== null) {
      throw new Error('software key class cannot carry backing attestation');
    }
    return { id: keyClass.id, assurance: keyClass.assurance, attested: false };
  }
  const artifact = verifyAttestationShape(keyClass.evidence);
  if (typeof attestationVerifier !== 'function') {
    throw new Error(`${keyClass.id} requires an external attestation verifier`);
  }
  const accepted = await attestationVerifier({
    artifact,
    evidence: keyClass.evidence,
    keyClassId: keyClass.id,
    publicKeySpki,
  });
  if (accepted !== true) {
    throw new Error(`${keyClass.id} attestation was not accepted`);
  }
  return { id: keyClass.id, assurance: keyClass.assurance, attested: true };
}
