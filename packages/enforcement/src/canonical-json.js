import { createHash } from 'node:crypto';

function normalize(value, path = '$') {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return value;
  }
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  if (Array.isArray(value)) {
    return value.map((item, index) => normalize(item, `${path}[${index}]`));
  }
  if (
    value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const result = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = normalize(value[key], `${path}.${key}`);
    }
    return result;
  }
  throw new TypeError(`${path} is not canonical JSON data`);
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value));
}

export function canonicalJsonPretty(value) {
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}

export function jsonHash(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
