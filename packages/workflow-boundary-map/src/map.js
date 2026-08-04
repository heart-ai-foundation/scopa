import {
  canonicalJsonPretty,
  deepFreeze,
  jsonHash,
  validateStopState,
  verifySliceLock,
} from '../../enforcement/src/index.js';
import {
  validateCapabilityMatrix,
} from '../../adapter-host/src/assurance.js';

export const WORKFLOW_BOUNDARY_MAP_SCHEMA = 'scopa.workflow-boundary-map.v1';
export const AUTHORITY_DECLARATIONS_SCHEMA = 'scopa.authority-declarations.v1';

const MAP_KEYS = new Set([
  'assurance',
  'bindings',
  'completion',
  'schema',
  'scope',
  'subject',
  'summary',
  'surfaces',
]);
const BINDING_KEYS = new Set([
  'authorityDeclarationsSha256',
  'capabilityMatrixSha256',
  'completionSha256',
  'sliceLockSha256',
]);
const SCOPE_KEYS = new Set([
  'allowedPaths',
  'amendmentPath',
  'nonGoals',
  'sliceId',
]);
const COMPLETION_KEYS = new Set([
  'canStop',
  'condition',
  'failedGates',
  'gates',
  'status',
]);
const GATE_KEYS = new Set(['exitCode', 'id', 'status']);
const SUBJECT_KEYS = new Set(['adapter', 'client', 'transport']);
const SUMMARY_KEYS = new Set([
  'authorityRequired',
  'controlled',
  'disabled',
  'total',
  'uncontrolled',
  'unknown',
]);
const SURFACE_KEYS = new Set([
  'category',
  'control',
  'evidence',
  'id',
  'source',
  'status',
]);

const STATUSES = new Set([
  'authority-required',
  'controlled',
  'disabled',
  'uncontrolled',
  'unknown',
]);
const SOURCES = new Set([
  'authority-declaration',
  'capability-matrix',
  'missing-evidence',
  'slice-lock',
  'stop-state',
]);
const CATEGORIES = new Set([
  'browser',
  'completion',
  'credentials',
  'deployment',
  'extension',
  'external-system',
  'network',
  'observe',
  'process',
  'provider',
  'publication',
  'repository',
]);
const AUTHORITY_IDS = Object.freeze({
  browser: 'browser',
  credentials: 'credentials',
  deployment: 'deployment',
  'external-systems': 'external-system',
  provider: 'provider',
  publication: 'publication',
});
const DECLARATION_STATUSES = new Set([
  'authority-required',
  'disabled',
  'uncontrolled',
]);
const REQUIRED_CAPABILITIES = Object.freeze([
  ['native.extensions', 'extension'],
  ['native.filesystem-write', 'repository'],
  ['native.network', 'network'],
  ['native.process-execution', 'process'],
  ['scopa.write_file', 'repository'],
]);
const REQUIRED_SURFACE_IDS = new Set([
  'authority.browser',
  'authority.credentials',
  'authority.deployment',
  'authority.external-systems',
  'authority.provider',
  'authority.publication',
  ...REQUIRED_CAPABILITIES.map(([id]) => `capability.${id}`),
  'scopa.completion',
  'scopa.repository-scope',
]);

export class WorkflowBoundaryMapError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkflowBoundaryMapError';
    this.code = 'SCOPA_WORKFLOW_BOUNDARY_MAP_INVALID';
  }
}

function plainObject(value, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new WorkflowBoundaryMapError(`${label} must be a plain object`);
  }
  return value;
}

function exactObject(value, keys, label) {
  plainObject(value, label);
  const actual = Object.keys(value);
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !keys.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new WorkflowBoundaryMapError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function stringValue(value, label, { nullable = false } = {}) {
  if (nullable && value === null) return value;
  if (typeof value !== 'string' || value.length === 0) {
    throw new WorkflowBoundaryMapError(`${label} must be a non-empty string`);
  }
  return value;
}

function sha256(value, label, { nullable = false } = {}) {
  if (nullable && value === null) return value;
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new WorkflowBoundaryMapError(`${label} must be a SHA-256 digest`);
  }
  return value;
}

function normalizeDeclarations(declarations) {
  if (!Array.isArray(declarations)) {
    throw new WorkflowBoundaryMapError('authorityDeclarations must be an array');
  }
  const normalized = declarations.map((declaration, index) => {
    exactObject(declaration, new Set(['id', 'status']), `authorityDeclarations[${index}]`);
    if (!Object.hasOwn(AUTHORITY_IDS, declaration.id)) {
      throw new WorkflowBoundaryMapError(
        `authorityDeclarations[${index}].id is unsupported`,
      );
    }
    if (!DECLARATION_STATUSES.has(declaration.status)) {
      throw new WorkflowBoundaryMapError(
        `authorityDeclarations[${index}].status is unsupported`,
      );
    }
    return { id: declaration.id, status: declaration.status };
  });
  normalized.sort((left, right) => left.id.localeCompare(right.id));
  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1].id === normalized[index].id) {
      throw new WorkflowBoundaryMapError(
        `duplicate authority declaration: ${normalized[index].id}`,
      );
    }
  }
  return normalized;
}

export function validateAuthorityDeclarationDocument(value) {
  exactObject(
    value,
    new Set(['declarations', 'schema']),
    'authority declaration document',
  );
  if (value.schema !== AUTHORITY_DECLARATIONS_SCHEMA) {
    throw new WorkflowBoundaryMapError(
      'unsupported authority declaration document schema',
    );
  }
  return deepFreeze({
    schema: AUTHORITY_DECLARATIONS_SCHEMA,
    declarations: normalizeDeclarations(value.declarations),
  });
}

function capabilityCategory(category) {
  return {
    execute: 'process',
    extension: 'extension',
    mutate: 'repository',
    network: 'network',
    observe: 'observe',
  }[category];
}

function capabilityStatus(capability) {
  if (capability.exposure === 'disabled') return 'disabled';
  if (capability.mediation === 'uncontrolled') return 'uncontrolled';
  return 'controlled';
}

function capabilityControl(capability, status) {
  if (status === 'disabled' || status === 'uncontrolled') return null;
  return capability.mediation;
}

function unknownSurface(id, category) {
  return {
    id,
    category,
    status: 'unknown',
    source: 'missing-evidence',
    control: null,
    evidence: 'not-declared',
  };
}

function summaryFor(surfaces) {
  const summary = {
    total: surfaces.length,
    controlled: 0,
    uncontrolled: 0,
    unknown: 0,
    authorityRequired: 0,
    disabled: 0,
  };
  for (const surface of surfaces) {
    if (surface.status === 'authority-required') summary.authorityRequired += 1;
    else summary[surface.status] += 1;
  }
  return summary;
}

function assuranceFor(summary) {
  if (summary.unknown > 0) {
    return {
      level: 'unknown',
      basis: 'incomplete-capability-evidence',
    };
  }
  if (summary.uncontrolled > 0) {
    return {
      level: 'partial',
      basis: 'active-uncontrolled-route',
    };
  }
  return {
    level: 'full',
    basis: 'complete-known-surface',
  };
}

function buildSurfaces(matrix, declarations) {
  const surfaces = [
    {
      id: 'scopa.completion',
      category: 'completion',
      status: 'controlled',
      source: 'stop-state',
      control: 'scopa-gate-runner',
      evidence: 'validated-stop-state',
    },
    {
      id: 'scopa.repository-scope',
      category: 'repository',
      status: 'controlled',
      source: 'slice-lock',
      control: 'scopa-path-dispatcher',
      evidence: 'validated-slice-lock',
    },
  ];

  if (matrix === null) {
    for (const [id, category] of REQUIRED_CAPABILITIES) {
      surfaces.push(unknownSurface(`capability.${id}`, category));
    }
  } else {
    for (const capability of matrix.capabilities) {
      const status = capabilityStatus(capability);
      surfaces.push({
        id: `capability.${capability.id}`,
        category: capabilityCategory(capability.category),
        status,
        source: 'capability-matrix',
        control: capabilityControl(capability, status),
        evidence: `capability-matrix:${capability.id}`,
      });
    }
  }

  const declarationMap = new Map(
    declarations.map((declaration) => [declaration.id, declaration]),
  );
  for (const [id, category] of Object.entries(AUTHORITY_IDS)) {
    const declaration = declarationMap.get(id);
    if (!declaration) {
      surfaces.push(unknownSurface(`authority.${id}`, category));
      continue;
    }
    surfaces.push({
      id: `authority.${id}`,
      category,
      status: declaration.status,
      source: 'authority-declaration',
      control: null,
      evidence: `authority-declaration:${id}`,
    });
  }

  return surfaces.sort((left, right) => left.id.localeCompare(right.id));
}

function gateProjection(gate) {
  return {
    id: gate.id,
    status: gate.timedOut ? 'timed-out' : gate.passed ? 'passed' : 'failed',
    exitCode: gate.exitCode,
  };
}

export function createWorkflowBoundaryMap({
  lock,
  stopState,
  capabilityMatrix = null,
  authorityDeclarations = [],
}) {
  const verifiedLock = verifySliceLock(lock);
  validateStopState(stopState, verifiedLock.definitionHash);
  const matrix = capabilityMatrix === null
    ? null
    : validateCapabilityMatrix(capabilityMatrix);
  const declarations = normalizeDeclarations(authorityDeclarations);
  const surfaces = buildSurfaces(matrix, declarations);
  const summary = summaryFor(surfaces);
  const completion = {
    condition: stopState.condition,
    status: stopState.status,
    canStop: stopState.canStop,
    failedGates: [...stopState.failedGates],
    gates: stopState.gates.map(gateProjection),
  };
  const map = {
    schema: WORKFLOW_BOUNDARY_MAP_SCHEMA,
    bindings: {
      sliceLockSha256: verifiedLock.definitionHash,
      completionSha256: jsonHash(completion),
      capabilityMatrixSha256: matrix === null ? null : jsonHash(matrix),
      authorityDeclarationsSha256:
        declarations.length === 0 ? null : jsonHash(declarations),
    },
    subject: matrix === null
      ? { adapter: null, client: null, transport: null }
      : { ...matrix.subject },
    scope: {
      sliceId: verifiedLock.definition.sliceId,
      allowedPaths: [...verifiedLock.definition.allowedPaths],
      amendmentPath: verifiedLock.definition.amendmentPath,
      nonGoals: [...verifiedLock.definition.nonGoals],
    },
    completion,
    surfaces,
    summary,
    assurance: assuranceFor(summary),
  };
  return validateWorkflowBoundaryMap(map);
}

function validateStringArray(value, label) {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'string' || item.length === 0) ||
    new Set(value).size !== value.length
  ) {
    throw new WorkflowBoundaryMapError(`${label} must be a string array`);
  }
}

export function validateWorkflowBoundaryMap(value) {
  exactObject(value, MAP_KEYS, 'workflow boundary map');
  if (value.schema !== WORKFLOW_BOUNDARY_MAP_SCHEMA) {
    throw new WorkflowBoundaryMapError('unsupported workflow boundary map schema');
  }
  exactObject(value.bindings, BINDING_KEYS, 'bindings');
  sha256(value.bindings.sliceLockSha256, 'bindings.sliceLockSha256');
  sha256(value.bindings.completionSha256, 'bindings.completionSha256');
  sha256(value.bindings.capabilityMatrixSha256, 'bindings.capabilityMatrixSha256', { nullable: true });
  sha256(value.bindings.authorityDeclarationsSha256, 'bindings.authorityDeclarationsSha256', { nullable: true });

  exactObject(value.subject, SUBJECT_KEYS, 'subject');
  for (const key of SUBJECT_KEYS) stringValue(value.subject[key], `subject.${key}`, { nullable: true });
  const nullSubject = [...SUBJECT_KEYS].filter((key) => value.subject[key] === null).length;
  if (nullSubject !== 0 && nullSubject !== SUBJECT_KEYS.size) {
    throw new WorkflowBoundaryMapError('subject must be entirely known or entirely null');
  }
  if (
    (nullSubject === SUBJECT_KEYS.size) !==
    (value.bindings.capabilityMatrixSha256 === null)
  ) {
    throw new WorkflowBoundaryMapError('subject and capability matrix binding disagree');
  }

  exactObject(value.scope, SCOPE_KEYS, 'scope');
  stringValue(value.scope.sliceId, 'scope.sliceId');
  stringValue(value.scope.amendmentPath, 'scope.amendmentPath');
  validateStringArray(value.scope.allowedPaths, 'scope.allowedPaths');
  validateStringArray(value.scope.nonGoals, 'scope.nonGoals');

  exactObject(value.completion, COMPLETION_KEYS, 'completion');
  if (value.completion.condition !== 'all-gates-pass') {
    throw new WorkflowBoundaryMapError('completion.condition is unsupported');
  }
  if (!['blocked', 'satisfied'].includes(value.completion.status)) {
    throw new WorkflowBoundaryMapError('completion.status is unsupported');
  }
  if (typeof value.completion.canStop !== 'boolean') {
    throw new WorkflowBoundaryMapError('completion.canStop must be boolean');
  }
  validateStringArray(value.completion.failedGates, 'completion.failedGates');
  if (!Array.isArray(value.completion.gates) || value.completion.gates.length === 0) {
    throw new WorkflowBoundaryMapError('completion.gates must be a non-empty array');
  }
  for (const [index, gate] of value.completion.gates.entries()) {
    exactObject(gate, GATE_KEYS, `completion.gates[${index}]`);
    stringValue(gate.id, `completion.gates[${index}].id`);
    if (!['failed', 'passed', 'timed-out'].includes(gate.status)) {
      throw new WorkflowBoundaryMapError(`completion.gates[${index}].status is unsupported`);
    }
    if (!(gate.exitCode === null || Number.isSafeInteger(gate.exitCode))) {
      throw new WorkflowBoundaryMapError(`completion.gates[${index}].exitCode is invalid`);
    }
  }
  if (value.completion.canStop !== (value.completion.status === 'satisfied')) {
    throw new WorkflowBoundaryMapError('completion stop state is inconsistent');
  }
  const actualFailed = value.completion.gates
    .filter((gate) => gate.status !== 'passed')
    .map((gate) => gate.id);
  if (actualFailed.join('\0') !== value.completion.failedGates.join('\0')) {
    throw new WorkflowBoundaryMapError('completion failed gate projection is inconsistent');
  }
  if (jsonHash(value.completion) !== value.bindings.completionSha256) {
    throw new WorkflowBoundaryMapError('completion binding is inconsistent');
  }

  if (!Array.isArray(value.surfaces) || value.surfaces.length === 0) {
    throw new WorkflowBoundaryMapError('surfaces must be a non-empty array');
  }
  let previousId = null;
  const surfaceIds = new Set();
  for (const [index, surface] of value.surfaces.entries()) {
    exactObject(surface, SURFACE_KEYS, `surfaces[${index}]`);
    stringValue(surface.id, `surfaces[${index}].id`);
    if (previousId !== null && previousId.localeCompare(surface.id) >= 0) {
      throw new WorkflowBoundaryMapError('surfaces must use unique sorted ids');
    }
    previousId = surface.id;
    surfaceIds.add(surface.id);
    if (!CATEGORIES.has(surface.category)) {
      throw new WorkflowBoundaryMapError(`surfaces[${index}].category is unsupported`);
    }
    if (!STATUSES.has(surface.status)) {
      throw new WorkflowBoundaryMapError(`surfaces[${index}].status is unsupported`);
    }
    if (!SOURCES.has(surface.source)) {
      throw new WorkflowBoundaryMapError(`surfaces[${index}].source is unsupported`);
    }
    stringValue(surface.control, `surfaces[${index}].control`, { nullable: true });
    stringValue(surface.evidence, `surfaces[${index}].evidence`);
    if (surface.status !== 'controlled' && surface.control !== null) {
      throw new WorkflowBoundaryMapError('only controlled surfaces may name a control');
    }
    if (surface.status === 'unknown' && surface.source !== 'missing-evidence') {
      throw new WorkflowBoundaryMapError('unknown surfaces require missing-evidence source');
    }
    if (
      surface.source === 'missing-evidence' &&
      (surface.status !== 'unknown' || surface.control !== null)
    ) {
      throw new WorkflowBoundaryMapError('missing evidence cannot claim a controlled surface');
    }
    if (
      surface.source === 'authority-declaration' &&
      (
        !surface.id.startsWith('authority.') ||
        !DECLARATION_STATUSES.has(surface.status) ||
        surface.control !== null
      )
    ) {
      throw new WorkflowBoundaryMapError('authority declaration surface is inconsistent');
    }
    if (
      surface.source === 'capability-matrix' &&
      (
        !surface.id.startsWith('capability.') ||
        !['controlled', 'disabled', 'uncontrolled'].includes(surface.status) ||
        (
          surface.status === 'controlled' &&
          !['read-only', 'scopa-dispatcher', 'scopa-gate'].includes(surface.control)
        )
      )
    ) {
      throw new WorkflowBoundaryMapError('capability surface is inconsistent');
    }
    if (
      surface.source === 'slice-lock' &&
      (
        surface.id !== 'scopa.repository-scope' ||
        surface.status !== 'controlled' ||
        surface.control !== 'scopa-path-dispatcher'
      )
    ) {
      throw new WorkflowBoundaryMapError('slice-lock surface is inconsistent');
    }
    if (
      surface.source === 'stop-state' &&
      (
        surface.id !== 'scopa.completion' ||
        surface.status !== 'controlled' ||
        surface.control !== 'scopa-gate-runner'
      )
    ) {
      throw new WorkflowBoundaryMapError('stop-state surface is inconsistent');
    }
  }
  const missingSurfaces = [...REQUIRED_SURFACE_IDS]
    .filter((id) => !surfaceIds.has(id));
  if (missingSurfaces.length > 0) {
    throw new WorkflowBoundaryMapError(
      `required workflow surfaces are missing: ${missingSurfaces.sort().join(', ')}`,
    );
  }
  const hasAuthorityDeclaration = value.surfaces.some(
    (surface) => surface.source === 'authority-declaration',
  );
  if (
    hasAuthorityDeclaration !==
    (value.bindings.authorityDeclarationsSha256 !== null)
  ) {
    throw new WorkflowBoundaryMapError('authority surfaces and declaration binding disagree');
  }
  const missingCapabilityEvidence = value.surfaces.some(
    (surface) =>
      surface.id.startsWith('capability.') &&
      surface.source === 'missing-evidence',
  );
  if (
    missingCapabilityEvidence !==
    (value.bindings.capabilityMatrixSha256 === null)
  ) {
    throw new WorkflowBoundaryMapError('capability surfaces and matrix binding disagree');
  }

  exactObject(value.summary, SUMMARY_KEYS, 'summary');
  const expectedSummary = summaryFor(value.surfaces);
  for (const [key, expected] of Object.entries(expectedSummary)) {
    if (!Number.isSafeInteger(value.summary[key]) || value.summary[key] !== expected) {
      throw new WorkflowBoundaryMapError(`summary.${key} is inconsistent`);
    }
  }
  exactObject(value.assurance, new Set(['basis', 'level']), 'assurance');
  const expectedAssurance = assuranceFor(expectedSummary);
  if (
    value.assurance.level !== expectedAssurance.level ||
    value.assurance.basis !== expectedAssurance.basis
  ) {
    throw new WorkflowBoundaryMapError('assurance is inconsistent with surfaces');
  }

  return deepFreeze(JSON.parse(canonicalJsonPretty(value)));
}
