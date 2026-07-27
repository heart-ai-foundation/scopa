import { hashHex } from '../../journal/src/hash.js';
import {
  assertDcbor,
  assertDigest,
  assertExactKeys,
  assertNonEmptyString,
  decodeCanonicalBase64,
  deepFreeze,
  encodeBase64,
  hashDcbor,
  hashUtf8,
} from './schema.js';

function pinBody(pin) {
  const { pinId, ...body } = pin;
  return body;
}

export function createInferPin({
  provider,
  modelSnapshot,
  snapshotAuthority,
  snapshotStatus,
  prompt,
  promptHash,
  parameters = {},
  responseBytes,
}) {
  assertNonEmptyString(provider, 'INFER provider');
  assertNonEmptyString(modelSnapshot, 'INFER modelSnapshot');
  if (snapshotAuthority !== 'host-reported-not-provider-signed') {
    throw new Error(
      'S4 supports only the explicit host-reported-not-provider-signed snapshot authority',
    );
  }
  if (
    ![
      'content-addressed-immutable-snapshot',
      'requested-alias-not-snapshot',
    ].includes(snapshotStatus)
  ) {
    throw new Error('unsupported INFER snapshot status');
  }
  if (
    snapshotStatus === 'content-addressed-immutable-snapshot' &&
    !/^sha256:[0-9a-f]{64}$/.test(modelSnapshot)
  ) {
    throw new Error(
      'content-addressed immutable snapshots require a sha256:<digest> modelSnapshot',
    );
  }
  if (prompt === undefined && promptHash === undefined) {
    throw new Error('INFER pin requires prompt or promptHash');
  }
  const resolvedPromptHash =
    promptHash ?? hashUtf8(prompt);
  assertDigest(resolvedPromptHash, 'INFER prompt hash');
  if (prompt !== undefined && hashUtf8(prompt) !== resolvedPromptHash) {
    throw new Error('INFER prompt does not match promptHash');
  }
  assertDcbor(parameters, 'INFER parameters');
  if (!(responseBytes instanceof Uint8Array)) {
    throw new TypeError('INFER responseBytes must be a Uint8Array');
  }
  const body = {
    schema: 'scopa.infer-pin.v1',
    claim: 'retained response bytes for offline replay; not provider-signed',
    provider,
    modelSnapshot,
    snapshotAuthority,
    snapshotStatus,
    prompt: {
      algorithm: 'sha256',
      digest: resolvedPromptHash,
    },
    parameters,
    response: {
      algorithm: 'sha256',
      bytesBase64: encodeBase64(responseBytes),
      digest: hashHex(responseBytes),
      encoding: 'base64',
    },
  };
  return deepFreeze({
    ...body,
    pinId: hashDcbor(body),
  });
}

export function verifyInferPin(pin, { expectedPrompt } = {}) {
  assertExactKeys(
    pin,
    [
      'claim',
      'modelSnapshot',
      'parameters',
      'pinId',
      'prompt',
      'provider',
      'response',
      'schema',
      'snapshotAuthority',
      'snapshotStatus',
    ],
    'INFER pin',
  );
  if (pin.schema !== 'scopa.infer-pin.v1') {
    throw new Error('unsupported INFER pin schema');
  }
  if (pin.claim !== 'retained response bytes for offline replay; not provider-signed') {
    throw new Error('INFER pin claim boundary changed');
  }
  assertNonEmptyString(pin.provider, 'INFER provider');
  assertNonEmptyString(pin.modelSnapshot, 'INFER modelSnapshot');
  if (pin.snapshotAuthority !== 'host-reported-not-provider-signed') {
    throw new Error('unsupported or overstated INFER snapshot authority');
  }
  if (
    ![
      'content-addressed-immutable-snapshot',
      'requested-alias-not-snapshot',
    ].includes(pin.snapshotStatus)
  ) {
    throw new Error('unsupported INFER snapshot status');
  }
  if (
    pin.snapshotStatus === 'content-addressed-immutable-snapshot' &&
    !/^sha256:[0-9a-f]{64}$/.test(pin.modelSnapshot)
  ) {
    throw new Error('immutable INFER snapshot is not content addressed');
  }
  assertDcbor(pin.parameters, 'INFER parameters');
  assertExactKeys(pin.prompt, ['algorithm', 'digest'], 'INFER prompt pin');
  if (pin.prompt.algorithm !== 'sha256') {
    throw new Error('unsupported INFER prompt hash algorithm');
  }
  assertDigest(pin.prompt.digest, 'INFER prompt digest');
  if (
    expectedPrompt !== undefined &&
    hashUtf8(expectedPrompt) !== pin.prompt.digest
  ) {
    throw new Error('expected prompt does not match INFER pin');
  }
  assertExactKeys(
    pin.response,
    ['algorithm', 'bytesBase64', 'digest', 'encoding'],
    'INFER response pin',
  );
  if (pin.response.algorithm !== 'sha256' || pin.response.encoding !== 'base64') {
    throw new Error('unsupported INFER response representation');
  }
  assertDigest(pin.response.digest, 'INFER response digest');
  const responseBytes = decodeCanonicalBase64(
    pin.response.bytesBase64,
    'INFER response bytesBase64',
  );
  if (hashHex(responseBytes) !== pin.response.digest) {
    throw new Error('INFER retained response hash mismatch');
  }
  if (hashDcbor(pinBody(pin)) !== pin.pinId) {
    throw new Error('INFER pinId mismatch');
  }
  return Object.freeze({
    schema: 'scopa.infer-pin-verification.v1',
    ok: true,
    pinId: pin.pinId,
    provider: pin.provider,
    modelSnapshot: pin.modelSnapshot,
    snapshotAuthority: pin.snapshotAuthority,
    snapshotStatus: pin.snapshotStatus,
    snapshotPinned:
      pin.snapshotStatus === 'content-addressed-immutable-snapshot',
    promptHash: pin.prompt.digest,
    responseHash: pin.response.digest,
    responseBytes,
    claim: pin.claim,
  });
}

export function replayInferOffline(pin, options) {
  return verifyInferPin(pin, options).responseBytes;
}
