export class AdapterValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'AdapterValidationError';
    this.code = 'SCOPA_ADAPTER_SCHEMA_INVALID';
    this.details = details;
  }
}

export function isPlainObject(value) {
  return Boolean(
    value &&
    !Array.isArray(value) &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype,
  );
}

export function exactObject(value, keys, label) {
  if (!isPlainObject(value)) {
    throw new AdapterValidationError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value);
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !keys.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new AdapterValidationError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

export function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AdapterValidationError(`${label} must be a non-empty string`);
  }
  return value;
}

const SESSION_KEYS = new Set([
  'agent',
  'request',
  'schema',
  'sessionId',
]);
const AGENT_KEYS = new Set([
  'model',
  'provenance',
  'provider',
]);

export function validateSessionDescriptor(value) {
  exactObject(value, SESSION_KEYS, 'adapter session');
  if (value.schema !== 'scopa.adapter-session.v1') {
    throw new AdapterValidationError('unsupported adapter session schema');
  }
  exactObject(value.agent, AGENT_KEYS, 'adapter session agent');
  if (value.agent.provenance !== 'launcher-declared') {
    throw new AdapterValidationError(
      'agent identity provenance must be launcher-declared',
    );
  }
  return Object.freeze({
    schema: value.schema,
    sessionId: nonEmptyString(value.sessionId, 'sessionId'),
    request: nonEmptyString(value.request, 'request'),
    agent: Object.freeze({
      provider: nonEmptyString(value.agent.provider, 'agent.provider'),
      model: nonEmptyString(value.agent.model, 'agent.model'),
      provenance: value.agent.provenance,
    }),
  });
}
