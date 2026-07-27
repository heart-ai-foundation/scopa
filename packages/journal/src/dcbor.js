import { decode, encode, rfc8949EncodeOptions } from 'cborg';
import { bytesEqual } from './bytes.js';

export const DCBOR_PROFILE = 'scopa.dcbor-integer-subset.v1';

export class DcborValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DcborValidationError';
    this.code = 'SCOPA_DCBOR_INVALID';
  }
}

function validateString(value, path) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new DcborValidationError(`${path} contains an unpaired surrogate`);
      }
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new DcborValidationError(`${path} contains an unpaired surrogate`);
    }
  }
  if (value.normalize('NFC') !== value) {
    throw new DcborValidationError(`${path} must be Unicode NFC`);
  }
}

function validateRecord(value, path, seen) {
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new DcborValidationError(`${path} must be a plain object`);
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key !== 'string') {
      throw new DcborValidationError(`${path} cannot contain symbol keys`);
    }
    validateString(key, `${path} key`);
    const descriptor = descriptors[key];
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new DcborValidationError(
        `${path}.${key} must be an enumerable data property`,
      );
    }
    validateDcborValue(descriptor.value, `${path}.${key}`, seen);
  }
}

export function validateDcborValue(value, path = '$', seen = new WeakSet()) {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    validateString(value, path);
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new DcborValidationError(`${path} must be a safe integer`);
    }
    return value;
  }
  if (value instanceof Uint8Array) return value;
  if (!value || typeof value !== 'object') {
    throw new DcborValidationError(`${path} has an unsupported dCBOR type`);
  }
  if (seen.has(value)) {
    throw new DcborValidationError(`${path} contains a cycle`);
  }
  seen.add(value);
  if (Array.isArray(value)) {
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const expectedKeys = new Set([
      'length',
      ...Array.from({ length: value.length }, (_, index) => String(index)),
    ]);
    const extraKeys = Reflect.ownKeys(descriptors).filter(
      (key) => typeof key !== 'string' || !expectedKeys.has(key),
    );
    if (extraKeys.length > 0) {
      throw new DcborValidationError(`${path} cannot contain extra array properties`);
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[index];
      if (
        !descriptor ||
        !descriptor.enumerable ||
        !Object.hasOwn(descriptor, 'value')
      ) {
        throw new DcborValidationError(`${path}[${index}] cannot be sparse`);
      }
      validateDcborValue(descriptor.value, `${path}[${index}]`, seen);
    }
  } else {
    validateRecord(value, path, seen);
  }
  seen.delete(value);
  return value;
}

function normalizeDecoded(value) {
  if (value instanceof Map) {
    const output = {};
    for (const [key, child] of value.entries()) {
      if (typeof key !== 'string') {
        throw new DcborValidationError('SCOPA dCBOR maps require text keys');
      }
      Object.defineProperty(output, key, {
        value: normalizeDecoded(child),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return output;
  }
  if (Array.isArray(value)) return value.map(normalizeDecoded);
  return value;
}

export function encodeDcbor(value) {
  validateDcborValue(value);
  return encode(value, rfc8949EncodeOptions);
}

export function decodeDcbor(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('decodeDcbor requires a Uint8Array');
  }
  let value;
  try {
    value = normalizeDecoded(decode(bytes, {
      strict: true,
      allowIndefinite: false,
      allowUndefined: false,
      allowInfinity: false,
      allowNaN: false,
      allowBigInt: false,
      rejectDuplicateMapKeys: true,
      useMaps: true,
    }));
  } catch (error) {
    throw new DcborValidationError(`CBOR decode failed: ${error.message}`);
  }
  validateDcborValue(value);
  const canonical = encodeDcbor(value);
  if (!bytesEqual(bytes, canonical)) {
    throw new DcborValidationError(
      'encoded bytes are not the canonical SCOPA dCBOR representation',
    );
  }
  return value;
}
