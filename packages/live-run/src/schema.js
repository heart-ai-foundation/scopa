import {
  createHash,
} from 'node:crypto';

export const LIVE_TERMINAL_SCHEMA = 'scopa.live-terminal.v1';

export const LIVE_TERMINAL_STATES = Object.freeze([
  'succeeded',
  'exited',
  'signaled',
  'timed-out',
  'output-limit',
  'spawn-failed',
  'version-drift',
  'inventory-drift',
  'normalization-failed',
  'cleanup-failed',
]);

export const LIVE_TERMINAL_REASONS = Object.freeze([
  'completed',
  'nonzero-exit',
  'process-signal',
  'deadline-exceeded',
  'capture-limit-exceeded',
  'spawn-error',
  'client-version-mismatch',
  'capability-inventory-mismatch',
  'stream-normalization-error',
  'orphan-process-detected',
  'process-group-survived',
]);

const TERMINAL_KEYS = Object.freeze([
  'canStop',
  'cleanup',
  'exitCode',
  'ok',
  'output',
  'reason',
  'schema',
  'signal',
  'state',
]);
const OUTPUT_KEYS = Object.freeze([
  'capturedBytes',
  'maxBytes',
  'stderrBytes',
  'stderrSha256',
  'stdoutBytes',
  'stdoutSha256',
  'truncated',
]);
const CLEANUP_KEYS = Object.freeze([
  'groupGone',
  'killSent',
  'method',
  'orphanDetected',
  'termSent',
]);

function exactKeys(value, expected, label) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function nonnegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a nonnegative safe integer`);
  }
}

function digest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new TypeError(`${label} must be a SHA-256 hex digest`);
  }
}

export function emptyOutputSummary(maxBytes) {
  nonnegativeInteger(maxBytes, 'maxBytes');
  const emptyDigest = createHash('sha256').update(Buffer.alloc(0)).digest('hex');
  return {
    maxBytes,
    stdoutBytes: 0,
    stderrBytes: 0,
    capturedBytes: 0,
    truncated: false,
    stdoutSha256: emptyDigest,
    stderrSha256: emptyDigest,
  };
}

export function emptyCleanupSummary() {
  return {
    method: 'posix-process-group',
    termSent: false,
    killSent: false,
    groupGone: true,
    orphanDetected: false,
  };
}

export function validateTerminalEnvelope(value) {
  exactKeys(value, TERMINAL_KEYS, 'live terminal envelope');
  if (value.schema !== LIVE_TERMINAL_SCHEMA) {
    throw new TypeError('live terminal envelope has an unknown schema');
  }
  if (!LIVE_TERMINAL_STATES.includes(value.state)) {
    throw new TypeError('live terminal envelope has an unknown state');
  }
  if (!LIVE_TERMINAL_REASONS.includes(value.reason)) {
    throw new TypeError('live terminal envelope has an unknown reason');
  }
  if (typeof value.ok !== 'boolean' || typeof value.canStop !== 'boolean') {
    throw new TypeError('live terminal polarity must be boolean');
  }
  if (value.ok !== (value.state === 'succeeded')) {
    throw new TypeError('live terminal ok polarity conflicts with state');
  }
  if (value.canStop && !value.ok) {
    throw new TypeError('a failed live terminal cannot permit completion');
  }
  if (
    value.exitCode !== null &&
    (!Number.isSafeInteger(value.exitCode) || value.exitCode < 0)
  ) {
    throw new TypeError('live terminal exitCode must be null or nonnegative');
  }
  if (
    value.signal !== null &&
    (typeof value.signal !== 'string' || !/^SIG[A-Z0-9]+$/.test(value.signal))
  ) {
    throw new TypeError('live terminal signal must be null or a signal name');
  }

  exactKeys(value.output, OUTPUT_KEYS, 'live terminal output summary');
  for (const key of [
    'capturedBytes',
    'maxBytes',
    'stderrBytes',
    'stdoutBytes',
  ]) {
    nonnegativeInteger(value.output[key], `output.${key}`);
  }
  digest(value.output.stdoutSha256, 'output.stdoutSha256');
  digest(value.output.stderrSha256, 'output.stderrSha256');
  if (typeof value.output.truncated !== 'boolean') {
    throw new TypeError('output.truncated must be boolean');
  }
  if (
    value.output.capturedBytes > value.output.maxBytes ||
    value.output.capturedBytes >
      value.output.stdoutBytes + value.output.stderrBytes
  ) {
    throw new TypeError('live terminal output accounting is inconsistent');
  }

  exactKeys(value.cleanup, CLEANUP_KEYS, 'live terminal cleanup summary');
  if (value.cleanup.method !== 'posix-process-group') {
    throw new TypeError('live terminal cleanup method is unsupported');
  }
  for (const key of [
    'groupGone',
    'killSent',
    'orphanDetected',
    'termSent',
  ]) {
    if (typeof value.cleanup[key] !== 'boolean') {
      throw new TypeError(`cleanup.${key} must be boolean`);
    }
  }
  if (value.cleanup.killSent && !value.cleanup.termSent) {
    throw new TypeError('SIGKILL escalation requires a SIGTERM attempt');
  }
  if (value.ok && (!value.cleanup.groupGone || value.cleanup.orphanDetected)) {
    throw new TypeError('successful live terminal has incomplete cleanup');
  }
  return value;
}

export function createTerminalEnvelope({
  state,
  reason,
  exitCode = null,
  signal = null,
  output,
  cleanup,
  canStop = false,
}) {
  return validateTerminalEnvelope({
    schema: LIVE_TERMINAL_SCHEMA,
    state,
    ok: state === 'succeeded',
    canStop,
    exitCode,
    signal,
    reason,
    output: structuredClone(output),
    cleanup: structuredClone(cleanup),
  });
}

export function replaceTerminalState(terminal, {
  state,
  reason,
}) {
  const current = validateTerminalEnvelope(terminal);
  return createTerminalEnvelope({
    state,
    reason,
    exitCode: current.exitCode,
    signal: current.signal,
    output: current.output,
    cleanup: current.cleanup,
    canStop: false,
  });
}

export function bindNormalizedCompletion(terminal, canStop) {
  const current = validateTerminalEnvelope(terminal);
  if (current.state !== 'succeeded') {
    throw new TypeError('only a successful process can bind normalization');
  }
  if (typeof canStop !== 'boolean') {
    throw new TypeError('normalized canStop must be boolean');
  }
  return createTerminalEnvelope({
    state: current.state,
    reason: current.reason,
    exitCode: current.exitCode,
    signal: current.signal,
    output: current.output,
    cleanup: current.cleanup,
    canStop,
  });
}
