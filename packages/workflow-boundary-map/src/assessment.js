import {
  canonicalJson,
  canonicalJsonPretty,
  deepFreeze,
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  validateWorkflowBoundaryMap,
  WorkflowBoundaryMapError,
} from './map.js';

export const WORKFLOW_BOUNDARY_DIFF_SCHEMA = 'scopa.workflow-boundary-diff.v1';
export const BOUNDARY_ASSESSMENT_PACKET_SCHEMA =
  'scopa.boundary-assessment-packet.v1';

const STATUS_RISK = Object.freeze({
  disabled: 0,
  controlled: 1,
  'authority-required': 1,
  unknown: 3,
  uncontrolled: 4,
});

function polarity(before, after) {
  if (before === after) return 'neutral';
  return STATUS_RISK[after] > STATUS_RISK[before]
    ? 'regression'
    : 'improvement';
}

function change(kind, category, id, before, after, changePolarity) {
  return { kind, category, id, before, after, polarity: changePolarity };
}

export function compareWorkflowBoundaryMaps(beforeValue, afterValue) {
  const before = validateWorkflowBoundaryMap(beforeValue);
  const after = validateWorkflowBoundaryMap(afterValue);
  const changes = [];
  const beforePaths = new Set(before.scope.allowedPaths);
  const afterPaths = new Set(after.scope.allowedPaths);
  for (const path of [...afterPaths].filter((item) => !beforePaths.has(item)).sort()) {
    changes.push(change('scope-path-added', 'repository', path, null, 'present', 'regression'));
  }
  for (const path of [...beforePaths].filter((item) => !afterPaths.has(item)).sort()) {
    changes.push(change('scope-path-removed', 'repository', path, 'present', null, 'improvement'));
  }

  const beforeSurfaces = new Map(before.surfaces.map((surface) => [surface.id, surface]));
  const afterSurfaces = new Map(after.surfaces.map((surface) => [surface.id, surface]));
  const ids = [...new Set([...beforeSurfaces.keys(), ...afterSurfaces.keys()])].sort();
  for (const id of ids) {
    const left = beforeSurfaces.get(id);
    const right = afterSurfaces.get(id);
    if (!left) {
      changes.push(change(
        'surface-added',
        right.category,
        id,
        null,
        right.status,
        ['unknown', 'uncontrolled'].includes(right.status) ? 'regression' : 'neutral',
      ));
    } else if (!right) {
      changes.push(change('surface-removed', left.category, id, left.status, null, 'regression'));
    } else if (left.status !== right.status) {
      changes.push(change(
        'surface-status-changed',
        right.category,
        id,
        left.status,
        right.status,
        polarity(left.status, right.status),
      ));
    } else if (left.control !== right.control) {
      changes.push(change(
        'surface-control-changed',
        right.category,
        id,
        left.control,
        right.control,
        'neutral',
      ));
    }
  }
  if (before.completion.status !== after.completion.status) {
    changes.push(change(
      'completion-changed',
      'completion',
      'scopa.completion',
      before.completion.status,
      after.completion.status,
      after.completion.canStop ? 'improvement' : 'regression',
    ));
  }
  changes.sort((left, right) =>
    `${left.kind}\0${left.id}`.localeCompare(`${right.kind}\0${right.id}`));
  const summary = {
    total: changes.length,
    regressions: changes.filter((item) => item.polarity === 'regression').length,
    improvements: changes.filter((item) => item.polarity === 'improvement').length,
    neutral: changes.filter((item) => item.polarity === 'neutral').length,
  };
  return deepFreeze(JSON.parse(canonicalJsonPretty({
    schema: WORKFLOW_BOUNDARY_DIFF_SCHEMA,
    beforeMapSha256: jsonHash(before),
    afterMapSha256: jsonHash(after),
    changes,
    summary,
  })));
}

function posture(current, comparison) {
  const reasons = [];
  if (!current.completion.canStop) reasons.push('completion-blocked');
  if (current.summary.unknown > 0) reasons.push('unknown-surfaces');
  if (current.summary.uncontrolled > 0) reasons.push('uncontrolled-surfaces');
  if (comparison?.summary.regressions > 0) reasons.push('baseline-regressions');
  return {
    status: reasons.length === 0 ? 'bounded' : 'review-required',
    reasons,
  };
}

function sanitizedChange(item) {
  return {
    kind: item.kind,
    category: item.category,
    idSha256: jsonHash(item.id),
    before: item.before,
    after: item.after,
    polarity: item.polarity,
  };
}

export function createBoundaryAssessmentPacket({
  currentMap: currentValue,
  baselineMap: baselineValue = null,
}) {
  const current = validateWorkflowBoundaryMap(currentValue);
  const baseline = baselineValue === null
    ? null
    : validateWorkflowBoundaryMap(baselineValue);
  const comparison = baseline === null
    ? null
    : compareWorkflowBoundaryMaps(baseline, current);
  const changes = comparison?.changes.map(sanitizedChange) ?? [];
  const packet = {
    schema: BOUNDARY_ASSESSMENT_PACKET_SCHEMA,
    bindings: {
      currentMapSha256: jsonHash(current),
      baselineMapSha256: baseline === null ? null : jsonHash(baseline),
    },
    posture: posture(current, comparison),
    metrics: {
      canStop: current.completion.canStop,
      assurance: current.assurance.level,
      surfaces: { ...current.summary },
    },
    comparison: {
      total: changes.length,
      regressions: changes.filter((item) => item.polarity === 'regression').length,
      improvements: changes.filter((item) => item.polarity === 'improvement').length,
      neutral: changes.filter((item) => item.polarity === 'neutral').length,
      changes,
    },
    privacy: {
      projection: 'structural-v1',
      excluded: [
        'absolute-paths',
        'capability-evidence-prose',
        'credentials',
        'gate-output',
        'non-goal-prose',
        'prompts',
        'provider-output',
        'relative-path-text',
      ],
    },
  };
  return validateBoundaryAssessmentPacket(packet);
}

function plain(value, label) {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new WorkflowBoundaryMapError(`${label} must be an object`);
  }
}

function exact(value, keys, label) {
  plain(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.join('\0') !== expected.join('\0')) {
    throw new WorkflowBoundaryMapError(`${label} schema mismatch`);
  }
}

export function validateBoundaryAssessmentPacket(value) {
  exact(value, ['bindings', 'comparison', 'metrics', 'posture', 'privacy', 'schema'], 'assessment packet');
  if (value.schema !== BOUNDARY_ASSESSMENT_PACKET_SCHEMA) {
    throw new WorkflowBoundaryMapError('unsupported assessment packet schema');
  }
  exact(value.bindings, ['baselineMapSha256', 'currentMapSha256'], 'packet bindings');
  if (!/^[0-9a-f]{64}$/.test(value.bindings.currentMapSha256)) {
    throw new WorkflowBoundaryMapError('current map binding is invalid');
  }
  if (!(value.bindings.baselineMapSha256 === null || /^[0-9a-f]{64}$/.test(value.bindings.baselineMapSha256))) {
    throw new WorkflowBoundaryMapError('baseline map binding is invalid');
  }
  exact(value.posture, ['reasons', 'status'], 'packet posture');
  if (
    !['bounded', 'review-required'].includes(value.posture.status) ||
    !Array.isArray(value.posture.reasons) ||
    value.posture.reasons.some((reason) => ![
      'baseline-regressions',
      'completion-blocked',
      'uncontrolled-surfaces',
      'unknown-surfaces',
    ].includes(reason))
  ) {
    throw new WorkflowBoundaryMapError('packet posture is invalid');
  }
  exact(value.metrics, ['assurance', 'canStop', 'surfaces'], 'packet metrics');
  if (
    typeof value.metrics.canStop !== 'boolean' ||
    !['full', 'partial', 'unknown'].includes(value.metrics.assurance)
  ) {
    throw new WorkflowBoundaryMapError('packet metrics are invalid');
  }
  exact(
    value.metrics.surfaces,
    ['authorityRequired', 'controlled', 'disabled', 'total', 'uncontrolled', 'unknown'],
    'packet surface metrics',
  );
  for (const count of Object.values(value.metrics.surfaces)) {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new WorkflowBoundaryMapError('packet surface count is invalid');
    }
  }
  exact(value.comparison, ['changes', 'improvements', 'neutral', 'regressions', 'total'], 'packet comparison');
  if (!Array.isArray(value.comparison.changes)) {
    throw new WorkflowBoundaryMapError('packet changes must be an array');
  }
  for (const [index, item] of value.comparison.changes.entries()) {
    exact(item, ['after', 'before', 'category', 'idSha256', 'kind', 'polarity'], `packet changes[${index}]`);
    if (!/^[0-9a-f]{64}$/.test(item.idSha256)) {
      throw new WorkflowBoundaryMapError('packet change identifier is invalid');
    }
    if (
      typeof item.kind !== 'string' || item.kind.length === 0 ||
      typeof item.category !== 'string' || item.category.length === 0 ||
      !['improvement', 'neutral', 'regression'].includes(item.polarity) ||
      ![item.before, item.after].every((entry) =>
        entry === null || typeof entry === 'string')
    ) {
      throw new WorkflowBoundaryMapError('packet change is invalid');
    }
  }
  const counts = {
    total: value.comparison.changes.length,
    regressions: value.comparison.changes.filter((item) => item.polarity === 'regression').length,
    improvements: value.comparison.changes.filter((item) => item.polarity === 'improvement').length,
    neutral: value.comparison.changes.filter((item) => item.polarity === 'neutral').length,
  };
  for (const [key, count] of Object.entries(counts)) {
    if (value.comparison[key] !== count) {
      throw new WorkflowBoundaryMapError(`packet comparison ${key} is inconsistent`);
    }
  }
  if (value.bindings.baselineMapSha256 === null && counts.total !== 0) {
    throw new WorkflowBoundaryMapError('comparison requires a baseline binding');
  }
  const expectedReasons = [];
  if (!value.metrics.canStop) expectedReasons.push('completion-blocked');
  if (value.metrics.surfaces.unknown > 0) expectedReasons.push('unknown-surfaces');
  if (value.metrics.surfaces.uncontrolled > 0) expectedReasons.push('uncontrolled-surfaces');
  if (counts.regressions > 0) expectedReasons.push('baseline-regressions');
  if (
    value.posture.reasons.join('\0') !== expectedReasons.join('\0') ||
    value.posture.status !== (expectedReasons.length === 0 ? 'bounded' : 'review-required')
  ) {
    throw new WorkflowBoundaryMapError('packet posture is inconsistent');
  }
  exact(value.privacy, ['excluded', 'projection'], 'packet privacy');
  if (value.privacy.projection !== 'structural-v1' || !Array.isArray(value.privacy.excluded)) {
    throw new WorkflowBoundaryMapError('packet privacy projection is invalid');
  }
  return deepFreeze(JSON.parse(canonicalJsonPretty(value)));
}

export function verifyBoundaryAssessmentPacket(
  packetValue,
  { currentMap, baselineMap = null },
) {
  const packet = validateBoundaryAssessmentPacket(packetValue);
  const expected = createBoundaryAssessmentPacket({ currentMap, baselineMap });
  if (canonicalJson(packet) !== canonicalJson(expected)) {
    throw new WorkflowBoundaryMapError(
      'assessment packet does not match caller-supplied maps',
    );
  }
  return deepFreeze({
    schema: 'scopa.boundary-assessment-verification.v1',
    ok: true,
    currentMapSha256: packet.bindings.currentMapSha256,
    baselineMapSha256: packet.bindings.baselineMapSha256,
  });
}
