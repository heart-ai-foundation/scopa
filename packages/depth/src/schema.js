import { encodeDcbor, validateDcborValue } from '../../journal/src/dcbor.js';
import { hashHex } from '../../journal/src/hash.js';

export { hashHex };

export class DepthVerificationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'DepthVerificationError';
    this.code = 'SCOPA_DEPTH_INVALID';
    this.details = details;
  }
}

export function assertPlainObject(value, label) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new DepthVerificationError(`${label} must be a plain object`);
  }
}

export function assertExactKeys(value, keys, label) {
  assertPlainObject(value, label);
  const expected = new Set(keys);
  const actual = Object.keys(value);
  const missing = [...expected].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !expected.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new DepthVerificationError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

export function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new DepthVerificationError(`${label} must be a non-empty string`);
  }
  if (value.normalize('NFC') !== value) {
    throw new DepthVerificationError(`${label} must be Unicode NFC`);
  }
}

export function assertDigest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new DepthVerificationError(`${label} must be a lowercase SHA-256 digest`);
  }
}

export function decodeCanonicalBase64(value, label) {
  if (
    typeof value !== 'string' ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
  ) {
    throw new DepthVerificationError(`${label} must be canonical base64`);
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value) {
    throw new DepthVerificationError(`${label} must be canonical base64`);
  }
  return new Uint8Array(bytes);
}

export function encodeBase64(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('encodeBase64 requires a Uint8Array');
  }
  return Buffer.from(bytes).toString('base64');
}

export function hashDcbor(value) {
  return hashHex(encodeDcbor(value));
}

export function hashUtf8(value) {
  if (typeof value !== 'string') {
    throw new TypeError('hashUtf8 requires a string');
  }
  return hashHex(new TextEncoder().encode(value));
}

export function assertDcbor(value, label) {
  try {
    validateDcborValue(value);
  } catch (error) {
    throw new DepthVerificationError(`${label} is not valid SCOPA dCBOR: ${error.message}`);
  }
}

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
