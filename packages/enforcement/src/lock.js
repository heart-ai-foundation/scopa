import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { canonicalJsonPretty, deepFreeze, jsonHash } from './canonical-json.js';

const DEFINITION_KEYS = new Set([
  'allowedPaths',
  'amendmentPath',
  'gates',
  'nonGoals',
  'schema',
  'sliceId',
  'stopCondition',
]);
const ENVELOPE_KEYS = new Set(['definition', 'definitionHash']);
const GATE_KEYS = new Set(['command', 'cwd', 'id', 'timeoutMs']);
const STOP_KEYS = new Set(['kind']);
const DECISION_KEYS = new Set([
  'approved',
  'binding',
  'category',
  'decisionId',
  'principalId',
]);
const DECISION_BINDING_KEYS = new Set(['lockHash', 'operation']);

function exactKeys(value, keys, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new SliceLockError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value);
  const unknown = actual.filter((key) => !keys.has(key));
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0 || missing.length > 0) {
    throw new SliceLockError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new SliceLockError(`${label} must be a non-empty string`);
  }
}

function validateRelativePath(value, label, { glob = false, allowDot = false } = {}) {
  nonEmptyString(value, label);
  const base = glob && value.endsWith('/**') ? value.slice(0, -3) : value;
  if (
    path.posix.isAbsolute(base) ||
    base === '..' ||
    base.startsWith('../') ||
    base.includes('/../') ||
    base.includes('\\') ||
    (!glob && value.includes('*')) ||
    base.includes('*')
  ) {
    throw new SliceLockError(`${label} must be a normalized repository-relative path`);
  }
  if (path.posix.normalize(base) !== base || (!allowDot && base === '.')) {
    throw new SliceLockError(`${label} must be normalized`);
  }
}

export class SliceLockError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SliceLockError';
    this.code = 'SCOPA_SLICE_LOCK_INVALID';
  }
}

export function validateSliceDefinition(definition) {
  exactKeys(definition, DEFINITION_KEYS, 'slice definition');
  if (definition.schema !== 'scopa.slice-definition.v1') {
    throw new SliceLockError('unsupported slice definition schema');
  }
  nonEmptyString(definition.sliceId, 'sliceId');
  validateRelativePath(definition.amendmentPath, 'amendmentPath');
  if (
    !Array.isArray(definition.allowedPaths) ||
    definition.allowedPaths.length === 0 ||
    definition.allowedPaths.some((entry) => typeof entry !== 'string') ||
    new Set(definition.allowedPaths).size !== definition.allowedPaths.length
  ) {
    throw new SliceLockError('allowedPaths must contain unique path rules');
  }
  for (const [index, rule] of definition.allowedPaths.entries()) {
    validateRelativePath(rule, `allowedPaths[${index}]`, { glob: true });
  }
  if (
    !Array.isArray(definition.nonGoals) ||
    definition.nonGoals.some((item) => typeof item !== 'string' || item.length === 0)
  ) {
    throw new SliceLockError('nonGoals must be strings');
  }
  if (!Array.isArray(definition.gates) || definition.gates.length === 0) {
    throw new SliceLockError('at least one verification gate is required');
  }
  const gateIds = new Set();
  for (const [index, gate] of definition.gates.entries()) {
    exactKeys(gate, GATE_KEYS, `gates[${index}]`);
    nonEmptyString(gate.id, `gates[${index}].id`);
    if (gateIds.has(gate.id)) throw new SliceLockError(`duplicate gate id: ${gate.id}`);
    gateIds.add(gate.id);
    if (
      !Array.isArray(gate.command) ||
      gate.command.length === 0 ||
      gate.command.some((part) => typeof part !== 'string' || part.length === 0)
    ) {
      throw new SliceLockError(`gates[${index}].command must be a non-empty argv`);
    }
    validateRelativePath(gate.cwd, `gates[${index}].cwd`, { allowDot: true });
    if (!Number.isSafeInteger(gate.timeoutMs) || gate.timeoutMs < 1 || gate.timeoutMs > 300_000) {
      throw new SliceLockError(`gates[${index}].timeoutMs is out of range`);
    }
  }
  exactKeys(definition.stopCondition, STOP_KEYS, 'stopCondition');
  if (definition.stopCondition.kind !== 'all-gates-pass') {
    throw new SliceLockError('unsupported stop condition');
  }
  return definition;
}

export function createSliceLock(definition) {
  validateSliceDefinition(definition);
  const stableDefinition = JSON.parse(canonicalJsonPretty(definition));
  return deepFreeze({
    definition: stableDefinition,
    definitionHash: jsonHash(stableDefinition),
  });
}

export function verifySliceLock(envelope) {
  exactKeys(envelope, ENVELOPE_KEYS, 'slice lock envelope');
  validateSliceDefinition(envelope.definition);
  if (
    typeof envelope.definitionHash !== 'string' ||
    !/^[0-9a-f]{64}$/.test(envelope.definitionHash) ||
    jsonHash(envelope.definition) !== envelope.definitionHash
  ) {
    throw new SliceLockError('slice definition hash mismatch');
  }
  return deepFreeze(JSON.parse(canonicalJsonPretty(envelope)));
}

export async function loadSliceLock(filePath) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw new SliceLockError(`cannot load slice lock: ${error.message}`);
  }
  return verifySliceLock(parsed);
}

export function assertGateAmendmentDecision(decision, lockHash) {
  exactKeys(decision, DECISION_KEYS, 'principal decision');
  exactKeys(decision.binding, DECISION_BINDING_KEYS, 'principal decision binding');
  if (
    decision.category !== 'DECISION' ||
    decision.approved !== true ||
    decision.binding.operation !== 'amend-slice-lock' ||
    decision.binding.lockHash !== lockHash
  ) {
    throw new SliceLockError('slice-lock amendment requires a bound principal DECISION');
  }
  nonEmptyString(decision.decisionId, 'decisionId');
  nonEmptyString(decision.principalId, 'principalId');
  return decision;
}
