import {
  canonicalJson,
  deepFreeze,
} from '../../enforcement/src/index.js';
import {
  AdapterValidationError,
  exactObject,
  isPlainObject,
  nonEmptyString,
} from './schema.js';

export const TRANSCRIPT_SCHEMA = 'scopa.adapter-transcript.v1';
export const TRANSCRIPT_MAX_EVENTS = 1024;
export const TRANSCRIPT_MAX_EVENT_BYTES = 4 * 1024 * 1024;
export const TRANSCRIPT_RESULT_RESERVE_BYTES = 1024 * 1024;

const TRANSCRIPT_KEYS = new Set([
  'events',
  'schema',
  'session',
  'terminal',
]);
const SESSION_KEYS = new Set([
  'agent',
  'client',
  'id',
  'protocolVersion',
  'request',
]);
const AGENT_KEYS = new Set([
  'model',
  'provenance',
  'provider',
]);
const CLIENT_KEYS = new Set([
  'name',
  'version',
]);
const EVENT_KEYS = new Set([
  'arguments',
  'effect',
  'kind',
  'method',
  'outcome',
  'requestId',
  'result',
  'sequence',
  'tool',
]);
const TERMINAL_KEYS = new Set([
  'canStop',
  'failedGates',
  'lockHash',
  'status',
]);
const EVENT_KINDS = new Set([
  'initialize',
  'protocol_error',
  'tool_call',
  'tool_result',
]);
const OUTCOMES = new Set([
  'accepted',
  'allowed',
  'blocked',
  'denied',
  'error',
  'initialized',
  'satisfied',
]);
const EFFECTS = new Set([
  null,
  'MUTATE',
  'OBSERVE',
]);

function validRequestId(value) {
  return (
    value === null ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isSafeInteger(value))
  );
}

function validateTerminal(terminal) {
  if (terminal === null) return null;
  exactObject(terminal, TERMINAL_KEYS, 'transcript terminal');
  if (
    typeof terminal.canStop !== 'boolean' ||
    !['blocked', 'satisfied'].includes(terminal.status) ||
    terminal.canStop !== (terminal.status === 'satisfied') ||
    !Array.isArray(terminal.failedGates) ||
    terminal.failedGates.some((gate) => typeof gate !== 'string') ||
    typeof terminal.lockHash !== 'string'
  ) {
    throw new AdapterValidationError('invalid transcript terminal state');
  }
  return terminal;
}

export function validateTranscript(value) {
  try {
    canonicalJson(value);
  } catch (error) {
    throw new AdapterValidationError(
      `transcript is not canonical JSON data: ${error.message}`,
    );
  }
  exactObject(value, TRANSCRIPT_KEYS, 'adapter transcript');
  if (value.schema !== TRANSCRIPT_SCHEMA) {
    throw new AdapterValidationError('unsupported adapter transcript schema');
  }
  exactObject(value.session, SESSION_KEYS, 'transcript session');
  exactObject(value.session.agent, AGENT_KEYS, 'transcript agent');
  exactObject(value.session.client, CLIENT_KEYS, 'transcript client');
  nonEmptyString(value.session.id, 'transcript session id');
  nonEmptyString(value.session.request, 'transcript request');
  nonEmptyString(value.session.protocolVersion, 'transcript protocolVersion');
  nonEmptyString(value.session.agent.provider, 'transcript agent provider');
  nonEmptyString(value.session.agent.model, 'transcript agent model');
  if (value.session.agent.provenance !== 'launcher-declared') {
    throw new AdapterValidationError('invalid transcript agent provenance');
  }
  nonEmptyString(value.session.client.name, 'transcript client name');
  nonEmptyString(value.session.client.version, 'transcript client version');
  if (!Array.isArray(value.events) || value.events.length === 0) {
    throw new AdapterValidationError('transcript events must be non-empty');
  }

  const pending = new Map();
  const seenCallIds = new Set();
  let lastCheckResult = null;
  for (const [index, event] of value.events.entries()) {
    exactObject(event, EVENT_KEYS, `events[${index}]`);
    if (
      event.sequence !== index ||
      !EVENT_KINDS.has(event.kind) ||
      !OUTCOMES.has(event.outcome) ||
      !EFFECTS.has(event.effect) ||
      !validRequestId(event.requestId) ||
      typeof event.method !== 'string' ||
      !(event.tool === null || typeof event.tool === 'string') ||
      !(event.arguments === null || isPlainObject(event.arguments)) ||
      !(event.result === null || isPlainObject(event.result))
    ) {
      throw new AdapterValidationError(`invalid transcript event at ${index}`);
    }
    if (index === 0 && event.kind !== 'initialize') {
      throw new AdapterValidationError(
        'transcript must begin with initialize event',
      );
    }
    const requestKey = `${typeof event.requestId}:${event.requestId}`;
    if (event.kind === 'initialize') {
      if (
        index !== 0 ||
        event.requestId === null ||
        event.method !== 'initialize' ||
        event.tool !== null ||
        event.effect !== null ||
        event.arguments !== null ||
        event.outcome !== 'initialized' ||
        event.result === null
      ) {
        throw new AdapterValidationError('invalid initialize transcript event');
      }
    }
    if (event.kind === 'protocol_error') {
      if (
        event.tool !== null ||
        event.effect !== null ||
        event.arguments !== null ||
        event.outcome !== 'error' ||
        event.result === null ||
        typeof event.result.code !== 'number' ||
        typeof event.result.message !== 'string'
      ) {
        throw new AdapterValidationError(
          `invalid protocol error at ${index}`,
        );
      }
    }
    if (event.kind === 'tool_call') {
      if (
        event.requestId === null ||
        event.method !== 'tools/call' ||
        event.tool === null ||
        event.effect === null ||
        event.arguments === null ||
        event.outcome !== 'accepted' ||
        event.result !== null ||
        seenCallIds.has(requestKey)
      ) {
        throw new AdapterValidationError(`invalid tool call at ${index}`);
      }
      seenCallIds.add(requestKey);
      pending.set(requestKey, event);
    }
    if (event.kind === 'tool_result') {
      const call = pending.get(requestKey);
      if (
        !call ||
        event.method !== 'tools/call' ||
        event.tool !== call.tool ||
        event.effect !== call.effect ||
        event.arguments !== null ||
        event.result === null
      ) {
        throw new AdapterValidationError(
          `tool result does not match a pending call at ${index}`,
        );
      }
      pending.delete(requestKey);
      if (event.tool === 'scopa_check') {
        const state = event.result.state;
        const expectedOutcome = state?.canStop ? 'satisfied' : 'blocked';
        if (
          !state ||
          event.outcome !== expectedOutcome ||
          event.effect !== 'OBSERVE'
        ) {
          throw new AdapterValidationError(
            `check result outcome mismatch at ${index}`,
          );
        }
        lastCheckResult = event.result;
      } else if (
        !['allowed', 'denied', 'error'].includes(event.outcome)
      ) {
        throw new AdapterValidationError(
          `invalid tool result outcome at ${index}`,
        );
      }
    }
  }
  if (pending.size > 0) {
    throw new AdapterValidationError('transcript contains an unfinished tool call');
  }
  const terminal = validateTerminal(value.terminal);
  if (terminal !== null) {
    const state = lastCheckResult?.state;
    if (
      !state ||
      terminal.canStop !== state.canStop ||
      terminal.status !== state.status ||
      terminal.lockHash !== state.lockHash ||
      terminal.failedGates.join('\0') !== state.failedGates.join('\0')
    ) {
      throw new AdapterValidationError(
        'transcript terminal does not match the final check result',
      );
    }
  }
  return deepFreeze(structuredClone(value));
}

function boundedLimit(value, maximum, label) {
  if (
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > maximum
  ) {
    throw new RangeError(`${label} must be an integer from 1 to ${maximum}`);
  }
  return value;
}

function eventKey(requestId) {
  return `${typeof requestId}:${requestId}`;
}

export function createTranscriptRecorder({
  descriptor,
  maxEvents = TRANSCRIPT_MAX_EVENTS,
  maxEventBytes = TRANSCRIPT_MAX_EVENT_BYTES,
  resultReserveBytes = TRANSCRIPT_RESULT_RESERVE_BYTES,
}) {
  const eventLimit = boundedLimit(
    maxEvents,
    TRANSCRIPT_MAX_EVENTS,
    'maxEvents',
  );
  const byteLimit = boundedLimit(
    maxEventBytes,
    TRANSCRIPT_MAX_EVENT_BYTES,
    'maxEventBytes',
  );
  const resultReserve = boundedLimit(
    resultReserveBytes,
    TRANSCRIPT_RESULT_RESERVE_BYTES,
    'resultReserveBytes',
  );
  if (resultReserve >= byteLimit) {
    throw new RangeError('resultReserveBytes must be less than maxEventBytes');
  }
  let session = null;
  const events = [];
  let eventBytes = 0;
  let reservedResultEvents = 0;
  let reservedResultBytes = 0;
  const pendingResultReservations = new Map();
  let terminal = null;

  function preparedEvent(event) {
    const prepared = {
      sequence: events.length,
      requestId: null,
      method: '',
      tool: null,
      effect: null,
      arguments: null,
      result: null,
      ...event,
    };
    return {
      bytes: Buffer.byteLength(canonicalJson(prepared)),
      event: prepared,
    };
  }

  function appendPrepared(
    prepared,
    reserveBytes = 0,
    reserveEvents = 0,
  ) {
    if (
      events.length + reservedResultEvents + 1 + reserveEvents > eventLimit ||
      eventBytes +
        reservedResultBytes +
        prepared.bytes +
        reserveBytes >
        byteLimit
    ) {
      return false;
    }
    events.push(prepared.event);
    eventBytes += prepared.bytes;
    reservedResultEvents += reserveEvents;
    reservedResultBytes += reserveBytes;
    return true;
  }

  function append(event, reserveBytes = 0, reserveEvents = 0) {
    return appendPrepared(
      preparedEvent(event),
      reserveBytes,
      reserveEvents,
    );
  }

  return Object.freeze({
    begin({ client, protocolVersion, requestId }) {
      if (session !== null) {
        throw new AdapterValidationError('adapter session already initialized');
      }
      session = {
        id: descriptor.sessionId,
        request: descriptor.request,
        agent: { ...descriptor.agent },
        client: {
          name: nonEmptyString(client.name, 'client.name'),
          version: nonEmptyString(client.version, 'client.version'),
        },
        protocolVersion: nonEmptyString(
          protocolVersion,
          'protocolVersion',
        ),
      };
      if (!append({
        kind: 'initialize',
        requestId,
        method: 'initialize',
        outcome: 'initialized',
        result: {
          client: { ...session.client },
          protocolVersion,
        },
      })) {
        session = null;
        throw new AdapterValidationError(
          'initialize event exceeds transcript capacity',
        );
      }
    },
    recordCall({ requestId, tool, effect, arguments: args }) {
      const key = eventKey(requestId);
      if (pendingResultReservations.has(key)) return false;
      const recorded = append({
        kind: 'tool_call',
        requestId,
        method: 'tools/call',
        tool,
        effect,
        arguments: structuredClone(args),
        outcome: 'accepted',
      }, resultReserve, 1);
      if (recorded) pendingResultReservations.set(key, resultReserve);
      return recorded;
    },
    recordResult({ requestId, tool, effect, outcome, result }) {
      const key = eventKey(requestId);
      const reserved = pendingResultReservations.get(key);
      if (reserved === undefined) return false;
      const prepared = preparedEvent({
        kind: 'tool_result',
        requestId,
        method: 'tools/call',
        tool,
        effect,
        outcome,
        result: structuredClone(result),
      });
      if (prepared.bytes > reserved) return false;
      pendingResultReservations.delete(key);
      reservedResultEvents -= 1;
      reservedResultBytes -= reserved;
      const recorded = appendPrepared(prepared);
      if (!recorded) {
        pendingResultReservations.set(key, reserved);
        reservedResultEvents += 1;
        reservedResultBytes += reserved;
      }
      return recorded;
    },
    recordProtocolError({ requestId = null, method = '', result }) {
      if (session === null) return;
      return append({
        kind: 'protocol_error',
        requestId,
        method,
        outcome: 'error',
        result: structuredClone(result),
      });
    },
    setTerminal(state) {
      terminal = {
        canStop: state.canStop,
        status: state.status,
        failedGates: [...state.failedGates],
        lockHash: state.lockHash,
      };
    },
    snapshot() {
      if (session === null) {
        throw new AdapterValidationError('adapter session is not initialized');
      }
      return validateTranscript({
        schema: TRANSCRIPT_SCHEMA,
        session: structuredClone(session),
        events: structuredClone(events),
        terminal: terminal === null ? null : structuredClone(terminal),
      });
    },
    limits() {
      return deepFreeze({
        maxEvents: eventLimit,
        maxEventBytes: byteLimit,
        resultReserveBytes: resultReserve,
      });
    },
    usage() {
      return deepFreeze({
        eventCount: events.length,
        eventBytes,
        reservedResultEvents,
        reservedResultBytes,
      });
    },
  });
}
