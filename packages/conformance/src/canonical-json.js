import { createHash } from 'node:crypto';

function normalize(value, seen) {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('canonical JSON does not support non-finite numbers');
    }
    return Object.is(value, -0) ? 0 : value;
  }

  if (typeof value === 'bigint') {
    return { $bigint: value.toString(10) };
  }

  if (typeof value !== 'object') {
    throw new TypeError(`canonical JSON does not support ${typeof value}`);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new TypeError('canonical JSON does not support invalid dates');
    }
    return { $date: value.toISOString() };
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null && !Array.isArray(value)) {
    throw new TypeError(
      `canonical JSON does not support ${Object.prototype.toString.call(value)}`,
    );
  }

  if (seen.has(value)) {
    throw new TypeError('canonical JSON does not support cyclic values');
  }
  seen.add(value);

  try {
    if (Array.isArray(value)) {
      return value.map((item) => normalize(item, seen));
    }

    const output = {};
    for (const key of Object.keys(value).sort()) {
      const item = value[key];
      if (item === undefined) {
        throw new TypeError(`canonical JSON does not support undefined at key ${key}`);
      }
      output[key] = normalize(item, seen);
    }
    return output;
  } finally {
    seen.delete(value);
  }
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value, new Set()));
}

export function canonicalJsonPretty(value) {
  return `${JSON.stringify(normalize(value, new Set()), null, 2)}\n`;
}

export function sha256Canonical(value) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}
