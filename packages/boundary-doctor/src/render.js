import {
  canonicalJsonPretty,
  deepFreeze,
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  validateWorkflowBoundaryMap,
} from '../../workflow-boundary-map/src/index.js';
import {
  BOUNDARY_DIAGNOSTIC_SCHEMA,
  validateBoundaryDiagnostic,
} from './diagnostic.js';

export const BOUNDARY_DOCTOR_REPORT_SCHEMA =
  'scopa.boundary-doctor-report.v1';
export const BOUNDARY_DOCTOR_LOCK_RESULT_SCHEMA =
  'scopa.doctor-lock-result.v1';

const REPORT_KEYS = new Set([
  'content',
  'format',
  'schema',
  'sourceSchema',
  'sourceSha256',
  'summary',
]);
const SUMMARY_KEYS = new Set(['before', 'kind', 'terminal']);
const BEFORE_KEYS = new Set([
  'completionCandidates',
  'detected',
  'posture',
  'scanTruncated',
  'scopaInitialized',
  'unknown',
]);
const TERMINAL_KEYS = new Set([
  'assurance',
  'authorityRequired',
  'canStop',
  'controlled',
  'disabled',
  'failedGates',
  'gates',
  'status',
  'uncontrolled',
  'unknown',
]);

export class BoundaryDoctorReportError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BoundaryDoctorReportError';
    this.code = 'SCOPA_BOUNDARY_DOCTOR_REPORT_INVALID';
  }
}

function plainObject(value, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new BoundaryDoctorReportError(`${label} must be a plain object`);
  }
}

function exactObject(value, keys, label) {
  plainObject(value, label);
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  const unknown = Object.keys(value).filter((key) => !keys.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new BoundaryDoctorReportError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function count(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new BoundaryDoctorReportError(`${label} must be a non-negative integer`);
  }
}

function validateDoctorSource(value) {
  if (value?.schema === BOUNDARY_DIAGNOSTIC_SCHEMA) {
    return {
      kind: 'diagnostic',
      before: validateBoundaryDiagnostic(value),
      terminal: null,
      source: value,
    };
  }
  if (value?.schema !== BOUNDARY_DOCTOR_LOCK_RESULT_SCHEMA) {
    throw new BoundaryDoctorReportError('unsupported doctor source schema');
  }
  exactObject(
    value,
    new Set(['after', 'before', 'initialization', 'schema', 'status']),
    'doctor lock result',
  );
  const before = validateBoundaryDiagnostic(value.before);
  const after = validateWorkflowBoundaryMap(value.after);
  if (
    !['blocked', 'satisfied'].includes(value.status) ||
    (value.status === 'satisfied') !== after.completion.canStop
  ) {
    throw new BoundaryDoctorReportError(
      'doctor lock status contradicts terminal completion',
    );
  }
  return {
    kind: 'lock-result',
    before,
    terminal: after,
    source: value,
  };
}

function sourceSummary(validated) {
  const { before, terminal } = validated;
  return {
    kind: validated.kind,
    before: {
      scopaInitialized: before.subject.scopaInitialized,
      scanTruncated: before.inventory.truncated,
      detected: before.summary.detected,
      unknown: before.summary.unknown,
      completionCandidates: before.summary.completionCandidates,
      posture: before.posture.level,
    },
    terminal: terminal === null ? null : {
      status: terminal.completion.status,
      canStop: terminal.completion.canStop,
      gates: terminal.completion.gates.length,
      failedGates: terminal.completion.failedGates.length,
      assurance: terminal.assurance.level,
      controlled: terminal.summary.controlled,
      uncontrolled: terminal.summary.uncontrolled,
      unknown: terminal.summary.unknown,
      authorityRequired: terminal.summary.authorityRequired,
      disabled: terminal.summary.disabled,
    },
  };
}

function markdownFor(sourceSha256, summary) {
  const lines = [
    '# SCOPA boundary doctor proof',
    '',
    `- Proof schema: \`${BOUNDARY_DOCTOR_REPORT_SCHEMA}\``,
    `- Source schema: \`${summary.kind === 'diagnostic' ? BOUNDARY_DIAGNOSTIC_SCHEMA : BOUNDARY_DOCTOR_LOCK_RESULT_SCHEMA}\``,
    `- Canonical source SHA-256: \`${sourceSha256}\``,
    '',
    '## Before',
    '',
    `- SCOPA initialized: \`${summary.before.scopaInitialized}\``,
    `- Scan truncated: \`${summary.before.scanTruncated}\``,
    `- Indicators detected: ${summary.before.detected}`,
    `- Indicators unknown: ${summary.before.unknown}`,
    `- Completion candidates: ${summary.before.completionCandidates}`,
    `- Posture: **${summary.before.posture}**`,
  ];
  if (summary.terminal !== null) {
    lines.push(
      '',
      '## After',
      '',
      `- Completion: **${summary.terminal.status}**`,
      `- Can stop: \`${summary.terminal.canStop}\``,
      `- Gates: ${summary.terminal.gates}; failed: ${summary.terminal.failedGates}`,
      `- Assurance: **${summary.terminal.assurance}**`,
      `- Surfaces: controlled ${summary.terminal.controlled}; uncontrolled ${summary.terminal.uncontrolled}; unknown ${summary.terminal.unknown}; authority required ${summary.terminal.authorityRequired}; disabled ${summary.terminal.disabled}`,
    );
  }
  lines.push(
    '',
    '> This proof is configuration-relative and does not claim OS sandboxing or',
    '> agent-wide safety. The shareable projection omits repository paths and',
    '> caller-supplied workflow identifiers; verify the canonical source digest',
    '> before relying on the projection.',
    '',
  );
  return lines.join('\n');
}

export function validateBoundaryDoctorReport(value, { source = null } = {}) {
  exactObject(value, REPORT_KEYS, 'boundary doctor report');
  if (value.schema !== BOUNDARY_DOCTOR_REPORT_SCHEMA) {
    throw new BoundaryDoctorReportError('unsupported boundary doctor report schema');
  }
  if (value.format !== 'markdown') {
    throw new BoundaryDoctorReportError('boundary doctor report format is unsupported');
  }
  if (
    ![BOUNDARY_DIAGNOSTIC_SCHEMA, BOUNDARY_DOCTOR_LOCK_RESULT_SCHEMA]
      .includes(value.sourceSchema)
  ) {
    throw new BoundaryDoctorReportError('boundary doctor source schema is unsupported');
  }
  if (typeof value.sourceSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(value.sourceSha256)) {
    throw new BoundaryDoctorReportError('sourceSha256 must be a SHA-256 digest');
  }
  if (typeof value.content !== 'string' || value.content.length === 0) {
    throw new BoundaryDoctorReportError('content must be non-empty Markdown');
  }
  exactObject(value.summary, SUMMARY_KEYS, 'summary');
  if (!['diagnostic', 'lock-result'].includes(value.summary.kind)) {
    throw new BoundaryDoctorReportError('summary.kind is unsupported');
  }
  exactObject(value.summary.before, BEFORE_KEYS, 'summary.before');
  for (const key of ['scopaInitialized', 'scanTruncated']) {
    if (typeof value.summary.before[key] !== 'boolean') {
      throw new BoundaryDoctorReportError(`summary.before.${key} must be boolean`);
    }
  }
  for (const key of ['detected', 'unknown', 'completionCandidates']) {
    count(value.summary.before[key], `summary.before.${key}`);
  }
  if (value.summary.before.posture !== 'review-required') {
    throw new BoundaryDoctorReportError('summary.before.posture is unsupported');
  }
  if (value.summary.terminal !== null) {
    exactObject(value.summary.terminal, TERMINAL_KEYS, 'summary.terminal');
    if (!['blocked', 'satisfied'].includes(value.summary.terminal.status)) {
      throw new BoundaryDoctorReportError('summary.terminal.status is unsupported');
    }
    if (
      typeof value.summary.terminal.canStop !== 'boolean' ||
      (value.summary.terminal.status === 'satisfied') !== value.summary.terminal.canStop
    ) {
      throw new BoundaryDoctorReportError('summary.terminal completion is inconsistent');
    }
    if (!['full', 'partial', 'unknown'].includes(value.summary.terminal.assurance)) {
      throw new BoundaryDoctorReportError('summary.terminal.assurance is unsupported');
    }
    for (const key of [
      'gates', 'failedGates', 'controlled', 'uncontrolled', 'unknown',
      'authorityRequired', 'disabled',
    ]) count(value.summary.terminal[key], `summary.terminal.${key}`);
    if (value.summary.terminal.failedGates > value.summary.terminal.gates) {
      throw new BoundaryDoctorReportError('failed gate count exceeds gate count');
    }
  }
  if (
    (value.summary.kind === 'diagnostic') !== (value.summary.terminal === null) ||
    (value.summary.kind === 'diagnostic') !==
      (value.sourceSchema === BOUNDARY_DIAGNOSTIC_SCHEMA)
  ) {
    throw new BoundaryDoctorReportError('summary kind contradicts source schema');
  }
  if (source !== null) {
    const validated = validateDoctorSource(source);
    const expectedSummary = sourceSummary(validated);
    if (canonicalJsonPretty(expectedSummary) !== canonicalJsonPretty(value.summary)) {
      throw new BoundaryDoctorReportError('report summary contradicts source');
    }
    if (jsonHash(validated.source) !== value.sourceSha256) {
      throw new BoundaryDoctorReportError('report digest contradicts source');
    }
    if (markdownFor(value.sourceSha256, expectedSummary) !== value.content) {
      throw new BoundaryDoctorReportError('report Markdown contradicts source');
    }
  }
  return deepFreeze(JSON.parse(canonicalJsonPretty(value)));
}

export function renderBoundaryDoctorMarkdown(value) {
  const validated = validateDoctorSource(value);
  const sourceSha256 = jsonHash(validated.source);
  const summary = sourceSummary(validated);
  return validateBoundaryDoctorReport({
    schema: BOUNDARY_DOCTOR_REPORT_SCHEMA,
    format: 'markdown',
    sourceSchema: validated.source.schema,
    sourceSha256,
    summary,
    content: markdownFor(sourceSha256, summary),
  }, { source: validated.source });
}
