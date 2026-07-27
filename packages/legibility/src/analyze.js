import { encodeDcbor } from '../../journal/src/dcbor.js';
import { effectKind } from '../../journal/src/effect-schema.js';
import { hashHex } from '../../journal/src/hash.js';
import { verifyChain } from '../../journal/src/record.js';
import {
  CODING_AGENT_PROFILE,
  declarationMatches,
  parseCodingAgentObservation,
  validateDeclaredBoundaries,
} from './profile.js';

const SUMMARY_KEYS = new Set([
  'attemptedEvents',
  'captureGapCount',
  'captureGaps',
  'profileId',
  'recordedEvents',
  'runId',
  'schema',
  'scope',
]);
const GAP_KEYS = new Set(['eventId', 'reasonCode']);

export class LegibilityAnalysisError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LegibilityAnalysisError';
    this.code = 'SCOPA_LEGIBILITY_INVALID';
  }
}

function exactKeys(value, expected, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new LegibilityAnalysisError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value);
  const missing = [...expected].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !expected.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new LegibilityAnalysisError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function validateSummary(summary, verification, profile) {
  exactKeys(summary, SUMMARY_KEYS, 'observation summary');
  if (summary.schema !== 'scopa.observation-session-summary.v1') {
    throw new LegibilityAnalysisError('unsupported observation summary schema');
  }
  if (summary.profileId !== profile.profileId) {
    throw new LegibilityAnalysisError('summary profile does not match analysis profile');
  }
  const profileHash = hashHex(encodeDcbor(profile));
  if (verification.records[0]?.scriptHash !== profileHash) {
    throw new LegibilityAnalysisError('journal is not bound to the analysis profile');
  }
  if (
    typeof summary.runId !== 'string' ||
    summary.runId.length === 0 ||
    summary.runId !== verification.records[0]?.runId
  ) {
    throw new LegibilityAnalysisError('summary runId does not match journal');
  }
  if (
    typeof summary.scope !== 'string' ||
    summary.scope.length === 0 ||
    summary.scope !== verification.records[0]?.scope
  ) {
    throw new LegibilityAnalysisError('summary scope does not match journal');
  }
  for (const field of ['attemptedEvents', 'recordedEvents', 'captureGapCount']) {
    if (!Number.isSafeInteger(summary[field]) || summary[field] < 0) {
      throw new LegibilityAnalysisError(`${field} must be a non-negative integer`);
    }
  }
  if (
    summary.attemptedEvents === 0 ||
    summary.recordedEvents !== verification.records.length ||
    summary.recordedEvents + summary.captureGapCount !== summary.attemptedEvents
  ) {
    throw new LegibilityAnalysisError(
      'summary counts do not reconcile with the verified journal',
    );
  }
  if (
    !Array.isArray(summary.captureGaps) ||
    summary.captureGaps.length !== summary.captureGapCount
  ) {
    throw new LegibilityAnalysisError('captureGaps do not match captureGapCount');
  }
  for (const [index, gap] of summary.captureGaps.entries()) {
    exactKeys(gap, GAP_KEYS, `capture gap ${index}`);
    if (
      (gap.eventId !== null &&
        (typeof gap.eventId !== 'string' || gap.eventId.length === 0)) ||
      typeof gap.reasonCode !== 'string' ||
      gap.reasonCode.length === 0
    ) {
      throw new LegibilityAnalysisError(`invalid capture gap ${index}`);
    }
  }
}

function boundaryKey(observation) {
  return `${observation.operation}\u0000${observation.target}`;
}

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function buildBoundaries(observations) {
  const grouped = new Map();
  for (const observation of observations) {
    const key = boundaryKey(observation);
    const current = grouped.get(key) ?? {
      category: observation.category,
      kind: effectKind(observation.category),
      observationCount: 0,
      operation: observation.operation,
      resultStatusCounts: { fulfilled: 0, rejected: 0 },
      target: observation.target,
      toolNames: new Set(),
    };
    current.observationCount += 1;
    current.resultStatusCounts[observation.resultStatus] += 1;
    current.toolNames.add(observation.toolName);
    grouped.set(key, current);
  }
  return [...grouped.values()]
    .map((boundary) => ({
      category: boundary.category,
      kind: boundary.kind,
      observationCount: boundary.observationCount,
      operation: boundary.operation,
      resultStatusCounts: boundary.resultStatusCounts,
      target: boundary.target,
      toolNames: [...boundary.toolNames].sort(),
    }))
    .sort(
      (left, right) =>
        compareText(left.operation, right.operation) ||
        compareText(left.target, right.target),
    );
}

function buildCoverage(observations, summary, profile, unclassifiedRecordCount) {
  return {
    schema: 'scopa.observation-coverage.v1',
    profileId: profile.profileId,
    operations: profile.operations.map(({ category, operation }) => {
      const count = observations.filter(
        (observation) => observation.operation === operation,
      ).length;
      return {
        category,
        count,
        operation,
        status: count > 0 ? 'observed' : 'not-observed',
      };
    }),
    attemptedEventCount: summary.attemptedEvents,
    recordedEventCount: summary.recordedEvents,
    captureGapCount: summary.captureGapCount,
    unclassifiedRecordCount,
    epistemicRule:
      'not-observed means this session supplied no evidence; it never means not-present',
  };
}

function buildFindings(boundaries, declarations) {
  const findings = [];
  for (const boundary of boundaries) {
    if (
      !declarations.some((declaration) =>
        declarationMatches(declaration, boundary),
      )
    ) {
      findings.push({
        kind: 'observed-not-declared',
        operation: boundary.operation,
        target: boundary.target,
        status: 'observed',
      });
    }
  }
  for (const declaration of declarations) {
    if (
      !boundaries.some((boundary) =>
        declarationMatches(declaration, boundary),
      )
    ) {
      findings.push({
        kind: 'declared-not-observed',
        operation: declaration.operation,
        target: declaration.targetPattern,
        status: 'not-observed',
      });
    }
  }
  return findings.sort(
    (left, right) =>
      compareText(left.kind, right.kind) ||
      compareText(left.operation, right.operation) ||
      compareText(left.target, right.target),
  );
}

export function analyzeObservationSession({
  records,
  commitment,
  summary,
  declaredBoundaries = [],
  profile = CODING_AGENT_PROFILE,
}) {
  if (!Array.isArray(records) || records.length === 0 || !commitment) {
    throw new LegibilityAnalysisError(
      'analysis requires a non-empty externally committed journal',
    );
  }
  if (profile?.profileId !== CODING_AGENT_PROFILE.profileId) {
    throw new LegibilityAnalysisError('unsupported observation profile');
  }
  const verification = verifyChain(records, commitment);
  validateSummary(summary, verification, profile);
  const declarations = validateDeclaredBoundaries(declaredBoundaries);
  const observations = verification.records
    .map(parseCodingAgentObservation)
    .filter(Boolean);
  const unclassifiedRecordCount =
    verification.records.length - observations.length;
  const boundaries = buildBoundaries(observations);
  const completeEventCount = observations.length;
  const scoreBasisPoints = Math.floor(
    (completeEventCount * 10_000) / summary.attemptedEvents,
  );
  const body = {
    schema: 'scopa.boundary-map.v1',
    claimBoundary: {
      scope: 'observed-host-events-only',
      summaryAuthority: 'host-reported-not-cryptographically-bound',
      statement:
        'This map describes captured events, not a forensic reconstruction of all activity.',
    },
    run: {
      runId: summary.runId,
      scope: summary.scope,
      journalLength: verification.length,
      journalRootHash: verification.rootHash,
      profileHash: verification.records[0].scriptHash,
    },
    boundaries,
    coverage: buildCoverage(
      observations,
      summary,
      profile,
      unclassifiedRecordCount,
    ),
    findings: buildFindings(boundaries, declarations),
    reconstructability: {
      schema: 'scopa.reconstructability-score.v1',
      attemptedEventCount: summary.attemptedEvents,
      completeEventCount,
      scoreBasisPoints,
      status:
        scoreBasisPoints === 10_000
          ? 'complete-for-captured-boundary-events'
          : 'partial-for-captured-boundary-events',
      claim: 'boundary-event-completeness-only',
    },
  };
  return deepFreeze({
    ...body,
    mapId: hashHex(encodeDcbor(body)),
  });
}
