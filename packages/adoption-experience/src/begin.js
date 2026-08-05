import { constants as fsConstants } from 'node:fs';
import {
  lstat,
  open,
  realpath,
} from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJson,
  createSliceLock,
  deepFreeze,
  evaluateStopCondition,
} from '../../enforcement/src/index.js';
import {
  validateCapabilityMatrix,
} from '../../adapter-host/src/assurance.js';
import {
  createWorkflowBoundaryMap,
  validateAuthorityDeclarationDocument,
} from '../../workflow-boundary-map/src/index.js';
import {
  initializeProjectFromBeginDefinition,
  loadProject,
  PROJECT_BEGIN_STATE_PATH,
} from '../../cli/src/project.js';

export const BEGIN_REQUEST_SCHEMA = 'scopa.begin-request.v1';
export const BEGIN_STATE_SCHEMA = 'scopa.begin-state.v1';
export const BEGIN_RESULT_SCHEMA = 'scopa.begin-result.v1';
export const BEGIN_REQUEST_MAX_BYTES = 128 * 1024;
export const BEGIN_CLIENT_PROFILES = Object.freeze([
  'claude-code',
  'codex',
  'generic',
]);
export const BEGIN_REQUEST_INPUT_SCHEMA = Object.freeze({
  type: 'object',
  properties: Object.freeze({
    schema: Object.freeze({ const: BEGIN_REQUEST_SCHEMA }),
    sliceId: Object.freeze({ type: 'string', minLength: 1, maxLength: 128 }),
    outcome: Object.freeze({ type: 'string', minLength: 1, maxLength: 4096 }),
    allowedPaths: Object.freeze({
      type: 'array',
      minItems: 1,
      maxItems: 64,
      uniqueItems: true,
      items: Object.freeze({ type: 'string', minLength: 1, maxLength: 4096 }),
    }),
    gates: Object.freeze({
      type: 'array',
      minItems: 1,
      maxItems: 16,
      items: Object.freeze({
        type: 'object',
        properties: Object.freeze({
          id: Object.freeze({ type: 'string', minLength: 1, maxLength: 128 }),
          command: Object.freeze({
            type: 'array',
            minItems: 1,
            maxItems: 64,
            items: Object.freeze({ type: 'string', minLength: 1, maxLength: 4096 }),
          }),
          cwd: Object.freeze({ type: 'string', minLength: 1, maxLength: 4096 }),
          timeoutMs: Object.freeze({
            type: 'integer',
            minimum: 1,
            maximum: 300000,
          }),
        }),
        required: Object.freeze(['command', 'cwd', 'id', 'timeoutMs']),
        additionalProperties: false,
      }),
    }),
    nonGoals: Object.freeze({
      type: 'array',
      maxItems: 64,
      uniqueItems: true,
      items: Object.freeze({ type: 'string', minLength: 1, maxLength: 4096 }),
    }),
    clientProfile: Object.freeze({ enum: BEGIN_CLIENT_PROFILES }),
  }),
  required: Object.freeze([
    'allowedPaths',
    'clientProfile',
    'gates',
    'nonGoals',
    'outcome',
    'schema',
    'sliceId',
  ]),
  additionalProperties: false,
});

const REQUEST_KEYS = new Set([
  'allowedPaths',
  'clientProfile',
  'gates',
  'nonGoals',
  'outcome',
  'schema',
  'sliceId',
]);
const GATE_KEYS = new Set(['command', 'cwd', 'id', 'timeoutMs']);
const STATE_KEYS = new Set([
  'authorityDeclarations',
  'capabilityMatrix',
  'definitionHash',
  'request',
  'schema',
]);
const PROFILE_SUBJECTS = Object.freeze({
  'claude-code': 'claude-code@unverified',
  codex: 'codex-mcp-client@unverified',
  generic: 'generic-agent@unverified',
});
const SHELL_PROGRAMS = new Set([
  'bash',
  'cmd',
  'cmd.exe',
  'csh',
  'dash',
  'fish',
  'ksh',
  'powershell',
  'powershell.exe',
  'pwsh',
  'sh',
  'tcsh',
  'zsh',
]);
const SHELL_TOKENS = new Set([
  '&',
  '&&',
  ';',
  '<',
  '>',
  '>>',
  '|',
  '||',
]);

export class BeginRequestError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'BeginRequestError';
    this.code = 'SCOPA_BEGIN_REQUEST_INVALID';
    this.details = details;
  }
}

function plainObject(value, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new BeginRequestError(`${label} must be a plain object`);
  }
}

function exactObject(value, keys, label) {
  plainObject(value, label);
  const actual = Object.keys(value);
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !keys.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new BeginRequestError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function boundedString(value, label, maximum) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    Buffer.byteLength(value) > maximum ||
    /[\0\r\n]/u.test(value)
  ) {
    throw new BeginRequestError(
      `${label} must be a non-empty single-line string no larger than ${maximum} bytes`,
    );
  }
  return value;
}

function stringArray(value, label, { minimum = 0, maximum = 64 } = {}) {
  if (
    !Array.isArray(value) ||
    value.length < minimum ||
    value.length > maximum
  ) {
    throw new BeginRequestError(
      `${label} must contain from ${minimum} to ${maximum} strings`,
    );
  }
  const normalized = value.map((entry, index) =>
    boundedString(entry, `${label}[${index}]`, 4096));
  if (new Set(normalized).size !== normalized.length) {
    throw new BeginRequestError(`${label} must not contain duplicates`);
  }
  return normalized;
}

function validateGateCommand(command, label) {
  if (!Array.isArray(command) || command.length === 0 || command.length > 64) {
    throw new BeginRequestError(`${label} must be an argv array with 1 to 64 items`);
  }
  const normalized = command.map((entry, index) =>
    boundedString(entry, `${label}[${index}]`, 4096));
  if (Buffer.byteLength(normalized.join('\0')) > 32 * 1024) {
    throw new BeginRequestError(`${label} exceeds the 32768-byte argv limit`);
  }
  const program = path.win32.basename(
    path.posix.basename(normalized[0]),
  ).toLowerCase();
  if (
    normalized[0].trim() !== normalized[0] ||
    /\s/u.test(normalized[0]) ||
    SHELL_PROGRAMS.has(program) ||
    normalized.some((entry) =>
      SHELL_TOKENS.has(entry) || entry.includes('$(') || entry.includes('`'))
  ) {
    throw new BeginRequestError(
      `${label} must be direct argv and cannot contain shell syntax or a shell interpreter`,
    );
  }
  return normalized;
}

export function validateBeginRequest(value) {
  exactObject(value, REQUEST_KEYS, 'begin request');
  if (value.schema !== BEGIN_REQUEST_SCHEMA) {
    throw new BeginRequestError('unsupported begin request schema');
  }
  let serialized;
  try {
    serialized = canonicalJson(value);
  } catch (error) {
    throw new BeginRequestError(`begin request is not canonical JSON data: ${error.message}`);
  }
  if (Buffer.byteLength(serialized) > BEGIN_REQUEST_MAX_BYTES) {
    throw new BeginRequestError(
      `begin request exceeds ${BEGIN_REQUEST_MAX_BYTES}-byte limit`,
    );
  }
  const sliceId = boundedString(value.sliceId, 'sliceId', 128);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u.test(sliceId)) {
    throw new BeginRequestError('sliceId must be a simple identifier');
  }
  const outcome = boundedString(value.outcome, 'outcome', 4096);
  if (!BEGIN_CLIENT_PROFILES.includes(value.clientProfile)) {
    throw new BeginRequestError(
      `clientProfile must be one of: ${BEGIN_CLIENT_PROFILES.join(', ')}`,
    );
  }
  if (!Array.isArray(value.gates) || value.gates.length < 1 || value.gates.length > 16) {
    throw new BeginRequestError('gates must contain from 1 to 16 gate declarations');
  }
  const gates = value.gates.map((gate, index) => {
    const label = `gates[${index}]`;
    exactObject(gate, GATE_KEYS, label);
    return {
      id: boundedString(gate.id, `${label}.id`, 128),
      command: validateGateCommand(gate.command, `${label}.command`),
      cwd: boundedString(gate.cwd, `${label}.cwd`, 4096),
      timeoutMs: gate.timeoutMs,
    };
  });
  const gateIds = gates.map((gate) => gate.id);
  if (new Set(gateIds).size !== gateIds.length) {
    throw new BeginRequestError('gates must use unique ids');
  }
  const request = {
    schema: BEGIN_REQUEST_SCHEMA,
    sliceId,
    outcome,
    allowedPaths: stringArray(value.allowedPaths, 'allowedPaths', { minimum: 1 }),
    gates,
    nonGoals: stringArray(value.nonGoals, 'nonGoals'),
    clientProfile: value.clientProfile,
  };
  // The enforcement validator is the final authority for path, cwd, timeout,
  // and direct gate shape. It runs before any repository mutation.
  createSliceLock(buildDefinition(request));
  return deepFreeze(JSON.parse(canonicalJson(request)));
}

function buildDefinition(request) {
  return {
    schema: 'scopa.slice-definition.v1',
    sliceId: request.sliceId,
    allowedPaths: [...request.allowedPaths],
    amendmentPath: `.scopa/amendments/${request.sliceId}.json`,
    gates: request.gates.map((gate) => ({
      id: gate.id,
      command: [...gate.command],
      cwd: gate.cwd,
      timeoutMs: gate.timeoutMs,
    })),
    nonGoals: [...request.nonGoals],
    stopCondition: { kind: 'all-gates-pass' },
  };
}

export function createDefinition(requestValue) {
  return buildDefinition(validateBeginRequest(requestValue));
}

function advertised(id, category, mediation, effect, evidence) {
  return { id, category, exposure: 'advertised', mediation, effect, evidence };
}

function uncontrolled(id, category, evidence) {
  return {
    id,
    category,
    exposure: 'native',
    mediation: 'uncontrolled',
    effect: null,
    evidence,
  };
}

export function createBeginCapabilityMatrix(clientProfile) {
  if (!BEGIN_CLIENT_PROFILES.includes(clientProfile)) {
    throw new BeginRequestError(
      `clientProfile must be one of: ${BEGIN_CLIENT_PROFILES.join(', ')}`,
    );
  }
  const profileEvidence =
    `selected ${clientProfile} bootstrap profile; native client controls are not runtime-verified`;
  return validateCapabilityMatrix({
    schema: 'scopa.capability-matrix.v1',
    subject: {
      adapter: 'scopa-bootstrap@0.4.0',
      client: PROFILE_SUBJECTS[clientProfile],
      transport: 'scopa-bootstrap-v1',
    },
    capabilities: [
      advertised('scopa.orientation', 'observe', 'read-only', 'OBSERVE', 'SCOPA adapter tool'),
      advertised('scopa.read_file', 'observe', 'read-only', 'OBSERVE', 'SCOPA adapter tool'),
      advertised('scopa.write_file', 'mutate', 'scopa-dispatcher', 'MUTATE', 'SCOPA path dispatcher'),
      advertised('scopa.check', 'observe', 'scopa-gate', 'OBSERVE', 'SCOPA gate runner'),
      advertised('scopa.assurance', 'observe', 'read-only', 'OBSERVE', 'SCOPA adapter tool'),
      advertised('scopa.transcript', 'observe', 'read-only', 'OBSERVE', 'SCOPA adapter tool'),
      uncontrolled('native.extensions', 'extension', profileEvidence),
      uncontrolled('native.filesystem-write', 'mutate', profileEvidence),
      uncontrolled('native.network', 'network', profileEvidence),
      uncontrolled('native.process-execution', 'execute', profileEvidence),
    ],
    assurance: 'partial',
  });
}

export function createDefaultAuthorityDeclarations() {
  return validateAuthorityDeclarationDocument({
    schema: 'scopa.authority-declarations.v1',
    declarations: [
      'browser',
      'credentials',
      'deployment',
      'external-systems',
      'provider',
      'publication',
    ].map((id) => ({ id, status: 'authority-required' })),
  });
}

export function createBeginState(requestValue) {
  const request = validateBeginRequest(requestValue);
  const lock = createSliceLock(createDefinition(request));
  return deepFreeze({
    schema: BEGIN_STATE_SCHEMA,
    request,
    definitionHash: lock.definitionHash,
    capabilityMatrix: createBeginCapabilityMatrix(request.clientProfile),
    authorityDeclarations: createDefaultAuthorityDeclarations(),
  });
}

export function validateBeginState(value) {
  exactObject(value, STATE_KEYS, 'begin state');
  if (value.schema !== BEGIN_STATE_SCHEMA) {
    throw new BeginRequestError('unsupported begin state schema');
  }
  const expected = createBeginState(value.request);
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new BeginRequestError('begin state does not match its validated request');
  }
  return expected;
}

async function readBeginStateFile(repoRoot, { optional = false } = {}) {
  const root = await realpath(repoRoot);
  const candidate = path.join(root, PROJECT_BEGIN_STATE_PATH);
  let metadata;
  let resolved;
  let handle;
  try {
    metadata = await lstat(candidate);
    resolved = await realpath(candidate);
    handle = await open(candidate, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    throw new BeginRequestError('begin state is unavailable');
  }
  try {
    const opened = await handle.stat();
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.nlink !== 1 ||
      resolved !== candidate ||
      !opened.isFile() ||
      opened.nlink !== 1 ||
      opened.dev !== metadata.dev ||
      opened.ino !== metadata.ino ||
      opened.size > BEGIN_REQUEST_MAX_BYTES * 4
    ) {
      throw new BeginRequestError('begin state must be an unaliased bounded regular file');
    }
    const bytes = await handle.readFile();
    return validateBeginState(JSON.parse(bytes.toString('utf8')));
  } catch (error) {
    if (error instanceof BeginRequestError) throw error;
    throw new BeginRequestError('begin state is invalid');
  } finally {
    await handle.close().catch(() => {});
  }
}

export function loadBeginState(repoRoot) {
  return readBeginStateFile(repoRoot);
}

export function tryLoadBeginState(repoRoot) {
  return readBeginStateFile(repoRoot, { optional: true });
}

export async function beginSlice({ repoRoot, request: requestValue }) {
  // Construct and cross-validate the whole transaction before .scopa exists.
  const beginState = createBeginState(requestValue);
  const definition = createDefinition(beginState.request);
  const lock = createSliceLock(definition);
  const initialization = await initializeProjectFromBeginDefinition({
    repoRoot,
    definition,
    beginState,
  });
  const project = await loadProject(repoRoot);
  if (project.lock.definitionHash !== lock.definitionHash) {
    throw new BeginRequestError('initialized lock does not match the begin transaction');
  }
  const stopState = await evaluateStopCondition({
    lock: project.lock,
    repoRoot: project.repoRoot,
  });
  const boundaryMap = createWorkflowBoundaryMap({
    lock: project.lock,
    stopState,
    capabilityMatrix: beginState.capabilityMatrix,
    authorityDeclarations: beginState.authorityDeclarations.declarations,
  });
  return deepFreeze({
    schema: BEGIN_RESULT_SCHEMA,
    status: boundaryMap.completion.canStop ? 'satisfied' : 'blocked',
    outcome: beginState.request.outcome,
    clientProfile: beginState.request.clientProfile,
    initialization,
    boundaryMap,
  });
}
