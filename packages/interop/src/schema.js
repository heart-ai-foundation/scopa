import { createHash } from 'node:crypto';

export class InteropVerificationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'InteropVerificationError';
    this.code = 'SCOPA_INTEROP_INVALID';
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
    throw new InteropVerificationError(`${label} must be a plain object`);
  }
}

export function assertExactKeys(value, keys, label) {
  assertPlainObject(value, label);
  const expected = new Set(keys);
  const actual = Object.keys(value);
  const missing = [...expected].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !expected.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new InteropVerificationError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

export function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InteropVerificationError(`${label} must be a non-empty string`);
  }
  if (value.normalize('NFC') !== value) {
    throw new InteropVerificationError(`${label} must be Unicode NFC`);
  }
}

export function assertDigest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new InteropVerificationError(
      `${label} must be a lowercase SHA-256 digest`,
    );
  }
}

export function hashBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('hashBytes requires a Uint8Array');
  }
  return createHash('sha256').update(bytes).digest('hex');
}

export function decodeCanonicalBase64(value, label) {
  if (
    typeof value !== 'string' ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    throw new InteropVerificationError(`${label} must be canonical base64`);
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value) {
    throw new InteropVerificationError(`${label} must be canonical base64`);
  }
  return new Uint8Array(bytes);
}

export function encodeBase64(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('encodeBase64 requires a Uint8Array');
  }
  return Buffer.from(bytes).toString('base64');
}

function normalizeJson(value, seen) {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new InteropVerificationError(
        'CASE export does not support non-finite JSON numbers',
      );
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== 'object') {
    throw new InteropVerificationError(
      `CASE export cannot encode JSON ${typeof value}`,
    );
  }
  if (seen.has(value)) {
    throw new InteropVerificationError('CASE export cannot encode cycles');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && !Array.isArray(value)) {
    throw new InteropVerificationError(
      `CASE export cannot encode ${Object.prototype.toString.call(value)}`,
    );
  }
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) {
        throw new InteropVerificationError(
          'CASE export arrays must use the ordinary Array prototype',
        );
      }
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const frozen = Object.isFrozen(value);
      if (!frozen && !Object.isExtensible(value)) {
        throw new InteropVerificationError(
          'CASE export arrays must be ordinary mutable JSON or deeply frozen',
        );
      }
      const expectedKeys = new Set([
        'length',
        ...Array.from({ length: value.length }, (_, index) => String(index)),
      ]);
      const unknown = Reflect.ownKeys(descriptors).filter(
        (key) => typeof key !== 'string' || !expectedKeys.has(key),
      );
      if (unknown.length > 0) {
        throw new InteropVerificationError(
          'CASE export arrays cannot contain extra properties',
        );
      }
      const lengthDescriptor = descriptors.length;
      if (
        lengthDescriptor.enumerable ||
        lengthDescriptor.configurable ||
        lengthDescriptor.writable === frozen
      ) {
        throw new InteropVerificationError(
          'CASE export array length descriptor is not ordinary JSON data',
        );
      }
      const output = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = descriptors[index];
        if (
          !descriptor ||
          !descriptor.enumerable ||
          !Object.hasOwn(descriptor, 'value') ||
          descriptor.writable === frozen ||
          descriptor.configurable === frozen
        ) {
          throw new InteropVerificationError(
            'CASE export arrays must be dense enumerable data',
          );
        }
        output.push(normalizeJson(descriptor.value, seen));
      }
      return output;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const frozen = Object.isFrozen(value);
    if (!frozen && !Object.isExtensible(value)) {
      throw new InteropVerificationError(
        'CASE export objects must be ordinary mutable JSON or deeply frozen',
      );
    }
    const keys = Reflect.ownKeys(descriptors);
    if (keys.some((key) => typeof key !== 'string')) {
      throw new InteropVerificationError(
        'CASE export objects cannot contain symbol keys',
      );
    }
    const output = Object.create(null);
    for (const key of keys.sort()) {
      const descriptor = descriptors[key];
      if (
        !descriptor.enumerable ||
        !Object.hasOwn(descriptor, 'value') ||
        descriptor.writable === frozen ||
        descriptor.configurable === frozen
      ) {
        throw new InteropVerificationError(
          `CASE export property ${key} must be enumerable data`,
        );
      }
      if (descriptor.value === undefined) {
        throw new InteropVerificationError(
          `CASE export cannot encode undefined at ${key}`,
        );
      }
      output[key] = normalizeJson(descriptor.value, seen);
    }
    return output;
  } finally {
    seen.delete(value);
  }
}

export function stableJson(value) {
  return JSON.stringify(normalizeJson(value, new Set()));
}

export function stableJsonPretty(value) {
  return `${JSON.stringify(normalizeJson(value, new Set()), null, 2)}\n`;
}

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
