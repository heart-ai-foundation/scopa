import {
  ACT_CATEGORIES,
  assertEffectDescriptor,
} from '../../journal/src/effect-schema.js';

const EVENT_KEYS = new Set(['eventId', 'operation', 'target', 'toolName']);
const DECLARATION_KEYS = new Set(['operation', 'targetPattern']);
const OBSERVATION_PAYLOAD_KEYS = new Set([
  'eventId',
  'operation',
  'resultStatus',
  'target',
  'toolName',
]);

const OPERATIONS = Object.freeze([
  Object.freeze({ category: 'EMIT', operation: 'emit' }),
  Object.freeze({ category: 'TOOL.COMMAND', operation: 'execute' }),
  Object.freeze({ category: 'TOOL.QUERY', operation: 'query' }),
  Object.freeze({ category: 'TOOL.QUERY', operation: 'read' }),
  Object.freeze({ category: 'TOOL.COMMAND', operation: 'write' }),
]);

const OPERATION_MAP = new Map(
  OPERATIONS.map(({ operation, category }) => [operation, category]),
);
const ACT_SET = new Set(ACT_CATEGORIES);

export const CODING_AGENT_PROFILE = Object.freeze({
  schema: 'scopa.observation-profile.v1',
  profileId: 'coding-agent.v1',
  operations: OPERATIONS,
});

export class ObservationProfileError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ObservationProfileError';
    this.code = 'SCOPA_OBSERVATION_PROFILE_INVALID';
  }
}

function plainObject(value, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new ObservationProfileError(`${label} must be a plain object`);
  }
}

function exactKeys(value, expected, label) {
  plainObject(value, label);
  const actual = Object.keys(value);
  const missing = [...expected].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !expected.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new ObservationProfileError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ObservationProfileError(`${label} must be a non-empty string`);
  }
}

export function assertCodingAgentEvent(event) {
  exactKeys(event, EVENT_KEYS, 'coding-agent event');
  nonEmptyString(event.eventId, 'eventId');
  nonEmptyString(event.toolName, 'toolName');
  nonEmptyString(event.target, 'target');
  if (!OPERATION_MAP.has(event.operation)) {
    throw new ObservationProfileError(
      `unsupported coding-agent operation: ${event.operation}`,
    );
  }
  return event;
}

export function classifyCodingAgentEvent(
  event,
  { resultStatus, scope },
) {
  assertCodingAgentEvent(event);
  if (!['fulfilled', 'rejected'].includes(resultStatus)) {
    throw new ObservationProfileError('resultStatus must be fulfilled or rejected');
  }
  nonEmptyString(scope, 'scope');
  const category = OPERATION_MAP.get(event.operation);
  const effect = {
    category,
    payload: {
      eventId: event.eventId,
      operation: event.operation,
      resultStatus,
      target: event.target,
      toolName: event.toolName,
    },
    scope,
  };
  if (ACT_SET.has(category)) {
    effect.idempotencyKey = `observe:${event.eventId}`;
  }
  return assertEffectDescriptor(effect);
}

export function parseCodingAgentObservation(record) {
  try {
    if (
      record?.outcome?.status !== 'fulfilled' ||
      !record.outcome.value ||
      Array.isArray(record.outcome.value) ||
      typeof record.outcome.value !== 'object' ||
      Object.getPrototypeOf(record.outcome.value) !== Object.prototype ||
      Object.keys(record.outcome.value).length !== 1 ||
      record.outcome.value.observation !== 'captured'
    ) {
      return null;
    }
    const payload = record?.effect?.payload;
    exactKeys(payload, OBSERVATION_PAYLOAD_KEYS, 'observation payload');
    const event = {
      eventId: payload.eventId,
      operation: payload.operation,
      target: payload.target,
      toolName: payload.toolName,
    };
    const expected = classifyCodingAgentEvent(event, {
      resultStatus: payload.resultStatus,
      scope: record.effect.scope,
    });
    if (
      record.effect.category !== expected.category ||
      record.effect.idempotencyKey !== expected.idempotencyKey
    ) {
      return null;
    }
    return Object.freeze({
      ...event,
      category: expected.category,
      resultStatus: payload.resultStatus,
      scope: record.effect.scope,
    });
  } catch {
    return null;
  }
}

export function validateDeclaredBoundaries(declarations = []) {
  if (!Array.isArray(declarations)) {
    throw new ObservationProfileError('declared boundaries must be an array');
  }
  return declarations.map((declaration, index) => {
    exactKeys(declaration, DECLARATION_KEYS, `declared boundary ${index}`);
    if (!OPERATION_MAP.has(declaration.operation)) {
      throw new ObservationProfileError(
        `unsupported declared operation: ${declaration.operation}`,
      );
    }
    nonEmptyString(declaration.targetPattern, 'targetPattern');
    if (
      declaration.targetPattern.includes('*') &&
      !declaration.targetPattern.endsWith('/**')
    ) {
      throw new ObservationProfileError(
        'targetPattern supports only an exact target or a trailing /**',
      );
    }
    return Object.freeze({ ...declaration });
  });
}

export function declarationMatches(declaration, observation) {
  if (declaration.operation !== observation.operation) return false;
  if (!declaration.targetPattern.endsWith('/**')) {
    return declaration.targetPattern === observation.target;
  }
  const prefix = declaration.targetPattern.slice(0, -3);
  return (
    observation.target === prefix ||
    observation.target.startsWith(`${prefix}/`)
  );
}
