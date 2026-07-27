import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from 'node:crypto';
import { encodeDcbor } from '../../journal/src/dcbor.js';
import { hashHex } from '../../journal/src/hash.js';
import {
  assertDigest,
  assertExactKeys,
  decodeCanonicalBase64,
  deepFreeze,
  encodeBase64,
  hashDcbor,
} from './schema.js';
import { createKeyClass, verifyKeyClass } from './key-class.js';
import { verifyInferPin } from './infer-pin.js';

export const SIGNATURE_ALGORITHM = 'ed25519';
export const SIGNING_DOMAIN = 'SCOPA-COMMITMENT-SIGNATURE-v1';

function publicSpki(publicKey) {
  const key =
    publicKey?.type === 'public' ? publicKey : createPublicKey(publicKey);
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new Error('SCOPA v1 signer requires an Ed25519 public key');
  }
  return new Uint8Array(key.export({ type: 'spki', format: 'der' }));
}

function signingInput({ commitment, inferPins, keyId, keyClass }) {
  return {
    schema: 'scopa.commitment-signing-input.v1',
    domain: SIGNING_DOMAIN,
    commitment,
    inferPins,
    key: {
      id: keyId,
      class: keyClass,
    },
  };
}

function assertCommitment(commitment) {
  assertExactKeys(
    commitment,
    ['algorithm', 'length', 'rootHash', 'schema'],
    'chain commitment',
  );
  if (
    commitment.schema !== 'scopa.chain-commitment.v1' ||
    commitment.algorithm !== 'sha256' ||
    !Number.isSafeInteger(commitment.length) ||
    commitment.length <= 0
  ) {
    throw new Error('unsupported chain commitment');
  }
  assertDigest(commitment.rootHash, 'chain commitment rootHash');
}

export function generateSoftwareSigningKeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return Object.freeze({
    privateKey,
    publicKey,
    keyClass: createKeyClass({ id: 'software' }),
  });
}

export function createCommitmentSignature({
  commitment,
  inferPins = [],
  privateKey,
  publicKey,
  keyClass = createKeyClass({ id: 'software' }),
}) {
  assertCommitment(commitment);
  if (!Array.isArray(inferPins)) throw new TypeError('inferPins must be an array');
  for (const pin of inferPins) verifyInferPin(pin);
  const privateObject =
    privateKey?.type === 'private' ? privateKey : createPrivateKey(privateKey);
  if (privateObject.asymmetricKeyType !== 'ed25519') {
    throw new Error('SCOPA v1 signer requires an Ed25519 private key');
  }
  const spki = publicSpki(publicKey);
  const derivedPublic = publicSpki(createPublicKey(privateObject));
  if (Buffer.compare(Buffer.from(spki), Buffer.from(derivedPublic)) !== 0) {
    throw new Error('private and public signing keys do not match');
  }
  const keyId = hashHex(spki);
  const input = signingInput({ commitment, inferPins, keyId, keyClass });
  const inputBytes = encodeDcbor(input);
  const signatureBytes = new Uint8Array(sign(null, inputBytes, privateObject));
  return deepFreeze({
    schema: 'scopa.commitment-signature.v1',
    algorithm: SIGNATURE_ALGORITHM,
    domain: SIGNING_DOMAIN,
    key: {
      id: keyId,
      class: keyClass,
      publicKey: {
        bytesBase64: encodeBase64(spki),
        encoding: 'spki-der-base64',
      },
    },
    signingInputSha256: hashHex(inputBytes),
    signatureBase64: encodeBase64(signatureBytes),
  });
}

export async function verifyCommitmentSignature({
  commitment,
  inferPins = [],
  signature: envelope,
  attestationVerifier,
}) {
  assertCommitment(commitment);
  if (!Array.isArray(inferPins)) throw new TypeError('inferPins must be an array');
  for (const pin of inferPins) verifyInferPin(pin);
  assertExactKeys(
    envelope,
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
  if (
    envelope.schema !== 'scopa.commitment-signature.v1' ||
    envelope.algorithm !== SIGNATURE_ALGORITHM ||
    envelope.domain !== SIGNING_DOMAIN
  ) {
    throw new Error('unsupported signature schema, algorithm, or domain');
  }
  assertDigest(envelope.signingInputSha256, 'signature signingInputSha256');
  assertExactKeys(envelope.key, ['class', 'id', 'publicKey'], 'signature key');
  assertDigest(envelope.key.id, 'signature key id');
  assertExactKeys(
    envelope.key.publicKey,
    ['bytesBase64', 'encoding'],
    'signature public key',
  );
  if (envelope.key.publicKey.encoding !== 'spki-der-base64') {
    throw new Error('unsupported public-key encoding');
  }
  const spki = decodeCanonicalBase64(
    envelope.key.publicKey.bytesBase64,
    'signature public key bytesBase64',
  );
  if (hashHex(spki) !== envelope.key.id) {
    throw new Error('signature key id does not match public key');
  }
  const keyClassResult = await verifyKeyClass(envelope.key.class, {
    attestationVerifier,
    publicKeySpki: spki,
  });
  const input = signingInput({
    commitment,
    inferPins,
    keyId: envelope.key.id,
    keyClass: envelope.key.class,
  });
  const inputBytes = encodeDcbor(input);
  if (hashHex(inputBytes) !== envelope.signingInputSha256) {
    throw new Error('commitment signature input hash mismatch');
  }
  const signatureBytes = decodeCanonicalBase64(
    envelope.signatureBase64,
    'commitment signatureBase64',
  );
  const key = createPublicKey({
    key: Buffer.from(spki),
    format: 'der',
    type: 'spki',
  });
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new Error('signature public key is not Ed25519');
  }
  if (!verify(null, inputBytes, key, signatureBytes)) {
    throw new Error('commitment signature verification failed');
  }
  return Object.freeze({
    schema: 'scopa.commitment-signature-verification.v1',
    ok: true,
    algorithm: envelope.algorithm,
    domain: envelope.domain,
    keyId: envelope.key.id,
    keyClass: keyClassResult,
    signingInputSha256: hashDcbor(input),
  });
}
