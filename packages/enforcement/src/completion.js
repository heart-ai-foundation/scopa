import { runVerificationGates } from './gate-runner.js';
import { verifySliceLock } from './lock.js';

const STOP_KEYS = new Set([
  'canStop',
  'condition',
  'failedGates',
  'gates',
  'lockHash',
  'schema',
  'sliceId',
  'status',
]);
const GATE_KEYS = new Set([
  'command',
  'durationMs',
  'exitCode',
  'id',
  'passed',
  'schema',
  'stderr',
  'stdout',
  'timedOut',
]);

function hasExactKeys(value, expected) {
  return (
    value &&
    !Array.isArray(value) &&
    typeof value === 'object' &&
    Object.keys(value).length === expected.size &&
    Object.keys(value).every((key) => expected.has(key))
  );
}

export class CompletionDeniedError extends Error {
  constructor(state) {
    super(`completion denied; failed gates: ${state.failedGates.join(', ')}`);
    this.name = 'CompletionDeniedError';
    this.code = 'SCOPA_COMPLETION_DENIED';
    this.state = state;
  }
}

export async function evaluateStopCondition({ lock, repoRoot }) {
  const verified = verifySliceLock(lock);
  const gates = await runVerificationGates({ lock: verified, repoRoot });
  const failedGates = gates.filter((gate) => !gate.passed).map((gate) => gate.id);
  return {
    schema: 'scopa.stop-state.v1',
    sliceId: verified.definition.sliceId,
    lockHash: verified.definitionHash,
    condition: verified.definition.stopCondition.kind,
    status: failedGates.length === 0 ? 'satisfied' : 'blocked',
    canStop: failedGates.length === 0,
    failedGates,
    gates,
  };
}

export function validateStopState(state, expectedLockHash) {
  if (
    !hasExactKeys(state, STOP_KEYS) ||
    state.schema !== 'scopa.stop-state.v1' ||
    state.lockHash !== expectedLockHash ||
    state.condition !== 'all-gates-pass' ||
    !['satisfied', 'blocked'].includes(state.status) ||
    typeof state.canStop !== 'boolean' ||
    !Array.isArray(state.failedGates) ||
    state.failedGates.some((id) => typeof id !== 'string') ||
    !Array.isArray(state.gates) ||
    state.gates.length === 0
  ) {
    throw new Error('invalid stop state');
  }
  for (const gate of state.gates) {
    if (
      !hasExactKeys(gate, GATE_KEYS) ||
      gate.schema !== 'scopa.gate-result.v1' ||
      typeof gate.id !== 'string' ||
      !Array.isArray(gate.command) ||
      typeof gate.passed !== 'boolean' ||
      typeof gate.timedOut !== 'boolean' ||
      !Number.isSafeInteger(gate.durationMs) ||
      typeof gate.stdout !== 'string' ||
      typeof gate.stderr !== 'string' ||
      !(gate.exitCode === null || Number.isSafeInteger(gate.exitCode))
    ) {
      throw new Error('invalid gate result in stop state');
    }
  }
  const actualFailed = state.gates.filter((gate) => !gate.passed).map((gate) => gate.id);
  if (
    actualFailed.join('\0') !== state.failedGates.join('\0') ||
    state.canStop !== (actualFailed.length === 0) ||
    state.status !== (actualFailed.length === 0 ? 'satisfied' : 'blocked')
  ) {
    throw new Error('inconsistent stop state');
  }
  return state;
}

export async function assertCompletion(options) {
  const state = await evaluateStopCondition(options);
  if (!state.canStop) throw new CompletionDeniedError(state);
  return state;
}
