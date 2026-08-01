import { canonicalJson, jsonHash } from '../../enforcement/src/index.js';

const PLAN_SHA256 =
  '703cc8df4d92442730cb913e32d94dfb75c20e02a8c5928f4311c4ad85bcb696';
const EVIDENCE_COMMIT = '46afe0e63355b09c03b5f7e261eca30af952e818';
const V2_PLAN_SHA256 =
  '0ce3db317fc90b7cb7d64a71bc1b1a0e84ef9805b90342b544ce7d44a8d52670';
const V2_EVIDENCE_COMMIT = '853b85fc39b9bf1394655f8ed67e87649ebe078a';
const V2_APPROVAL_SHA256 =
  '5dae71515d698401cfc70761991081c7042bad47338ab585132344f7d37e94da';
const SOURCE_COMMIT = 'd56440195dcb24cb6dd43c24e484641b1646a5a9';
const ROLES = ['artifact', 'evidence', 'runtime'];
const DIGEST = /^[0-9a-f]{64}$/;

const CANDIDATE = Object.freeze({
  packageSha256:
    '49b62ac4b4d869dbca8459aa08f515427e0a04349f014c85cc422d7e0625f147',
  productionBundleManifestSha256:
    'd975f5914611d4185504acd58a25384de4a72ff89a54a6015a3c63b8b733e686',
  closureSha256:
    '6071fda7b96dbe6bb87ed154ef3dc3d94e5f53be114148e663a7e9523e76180e',
  bundledPayloadSha256:
    'd876bb115d8dd8755dfbddcbdabf84bf931487b177f24daf29a3d90aef5d7477',
  installedPayloadSha256:
    'd876bb115d8dd8755dfbddcbdabf84bf931487b177f24daf29a3d90aef5d7477',
  licenseInventorySha256:
    'a4066aa11d8d819047753fc841322b607807152f30a3a8342efc31f2fa7d84af',
});

function exactKeys(value, expected, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join('\0') !== [...expected].sort().join('\0')) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function stringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) =>
    typeof item !== 'string' || item.trim().length === 0)) {
    throw new TypeError(`${label} must contain nonempty strings`);
  }
}

function assertCandidate(value) {
  exactKeys(value, Object.keys(CANDIDATE), 'S23 candidate identity');
  if (canonicalJson(value) !== canonicalJson(CANDIDATE)) {
    throw new TypeError('S23 candidate identity drifted');
  }
}

export function createS23ExactIdentityReviewPlan() {
  const body = {
    schema: 'scopa.s23-exact-identity-review-plan.v1',
    slice: 'S23',
    evidenceCommit: EVIDENCE_COMMIT,
    sourceCommit: SOURCE_COMMIT,
    candidate: structuredClone(CANDIDATE),
    upstreamReceipts: {
      s20QualificationSha256:
        'ad9d2dc7e22cfd6e5de07ebce0b430f3970e2eb1072f0e1a78711a82559cec2f',
      s21CloseoutSha256:
        'e61d4e92748bde8aab83ea26cbc80357f7f47951ac858b9e0e53417765cb5953',
      s22SoakSha256:
        '333eb7c93b67e3edc7b19834f7593ba2ae9a3d17e93bfad6e021d77ef1b9248d',
      s22CloseoutSha256:
        'c7bc9077a968618ab575bc66491efd72bc39c842fdb3e21b0549d335cca3ff65',
    },
    roles: [
      { id: 'artifact', objective: 'Reproduce package, bundled closure, installed surface, dependency graph, license, and offline installation identities.' },
      { id: 'evidence', objective: 'Verify S20-S22 receipt chains, approval consumption, privacy boundaries, traffic counts, and claim separation.' },
      { id: 'runtime', objective: 'Reproduce installed CLI/runtime allow-deny-status-check-cold-reload polarity and cleanup without provider traffic.' },
    ],
    independence: {
      freshToExactPacket: true,
      priorVerdictsMayNotBeInherited: true,
      crossRoleCommunicationBeforeVerdict: false,
      reviewerCount: 3,
    },
    acceptance: {
      requiredVerdictPerRole: 'ACCEPT',
      maxCriticalFindings: 0,
      maxHighFindings: 0,
      maxMediumFindings: 0,
      allLowFindingsRequireAdjudication: true,
      exactIdentityAgreementRequired: true,
    },
    traffic: {
      maxProviderCalls: 0,
      maxExperimentCalls: 0,
      maxPublicationActions: 0,
    },
  };
  return { ...body, planSha256: jsonHash(body) };
}

export function validateS23ExactIdentityReviewPlan(value) {
  const expected = createS23ExactIdentityReviewPlan();
  if (canonicalJson(value) !== canonicalJson(expected) ||
      value.planSha256 !== PLAN_SHA256) {
    throw new TypeError('S23 review plan differs from the frozen plan');
  }
  return value;
}

export function createS23V2ExactIdentityReviewPlan() {
  const prior = createS23ExactIdentityReviewPlan();
  const body = {
    schema: 'scopa.s23-v2-exact-identity-review-plan.v1',
    slice: 'S23-v2',
    evidenceCommit: V2_EVIDENCE_COMMIT,
    sourceCommit: SOURCE_COMMIT,
    remediationApprovalSha256: V2_APPROVAL_SHA256,
    supersedes: {
      rejectedPlanSha256: prior.planSha256,
      stopReceiptSha256:
        'b3a9978df68a7c7825b8b2e0a7f3b78fe212d849503065d9225a4815a1dc9e9a',
    },
    candidate: structuredClone(CANDIDATE),
    upstreamReceipts: structuredClone(prior.upstreamReceipts),
    roles: structuredClone(prior.roles),
    independence: structuredClone(prior.independence),
    acceptance: structuredClone(prior.acceptance),
    authorizedChanges: ['review-packet-binding-only'],
    forbiddenChanges: ['dependency', 'candidate', 'runtime'],
    traffic: {
      maxProviderCalls: 0,
      maxExperimentCalls: 0,
      maxNetworkRequests: 0,
      maxPublicationActions: 0,
      maxReleaseActions: 0,
    },
  };
  return { ...body, planSha256: jsonHash(body) };
}

export function validateS23V2ExactIdentityReviewPlan(value) {
  const expected = createS23V2ExactIdentityReviewPlan();
  if (canonicalJson(value) !== canonicalJson(expected) ||
      value.planSha256 !== V2_PLAN_SHA256) {
    throw new TypeError('S23-v2 review plan differs from the frozen plan');
  }
  return value;
}

function reportBinding(value) {
  if (value.schema === 'scopa.s23-exact-identity-review-report.v1') {
    return { slice: 'S23', planSha256: PLAN_SHA256,
      evidenceCommit: EVIDENCE_COMMIT };
  }
  if (value.schema === 'scopa.s23-v2-exact-identity-review-report.v1') {
    return { slice: 'S23-v2', planSha256: V2_PLAN_SHA256,
      evidenceCommit: V2_EVIDENCE_COMMIT };
  }
  throw new TypeError('S23 review report schema is unknown');
}

export function validateS23ExactIdentityReviewReport(value) {
  exactKeys(value, [
    'candidate', 'checksExecuted', 'cleanup', 'falsePositives', 'findings',
    'freshToExactPacket', 'limitations', 'planSha256', 'priorVerdictsInherited',
    'reportSha256', 'reviewedEvidenceCommit', 'reviewerRunId', 'role', 'schema',
    'slice', 'sourceCommit', 'traffic', 'verdict',
  ], 'S23 review report');
  const binding = reportBinding(value);
  if (value.slice !== binding.slice || value.planSha256 !== binding.planSha256 ||
      value.reviewedEvidenceCommit !== binding.evidenceCommit ||
      value.sourceCommit !== SOURCE_COMMIT || !ROLES.includes(value.role) ||
      typeof value.reviewerRunId !== 'string' ||
      value.reviewerRunId.trim().length < 8 ||
      value.freshToExactPacket !== true || value.priorVerdictsInherited !== false) {
    throw new TypeError('S23 review report identity or independence drifted');
  }
  assertCandidate(value.candidate);
  stringArray(value.checksExecuted, 'S23 checks');
  if (value.checksExecuted.length === 0) {
    throw new TypeError('S23 review must execute at least one check');
  }
  stringArray(value.falsePositives, 'S23 false positives');
  stringArray(value.limitations, 'S23 limitations');
  exactKeys(value.findings, ['critical', 'high', 'low', 'medium'], 'S23 findings');
  for (const severity of ['critical', 'high', 'medium', 'low']) {
    if (!Array.isArray(value.findings[severity])) {
      throw new TypeError(`S23 ${severity} findings must be an array`);
    }
    for (const finding of value.findings[severity]) {
      exactKeys(finding, ['id', 'summary'], `S23 ${severity} finding`);
      if (typeof finding.id !== 'string' || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(finding.id) ||
          typeof finding.summary !== 'string' || finding.summary.trim().length === 0) {
        throw new TypeError(`S23 ${severity} finding is invalid`);
      }
    }
  }
  const hasMaterialFinding = value.findings.critical.length > 0 ||
    value.findings.high.length > 0 || value.findings.medium.length > 0;
  if (!['ACCEPT', 'REJECT'].includes(value.verdict) ||
      (hasMaterialFinding && value.verdict !== 'REJECT') ||
      (!hasMaterialFinding && value.verdict !== 'ACCEPT')) {
    throw new TypeError('S23 review verdict contradicts its findings');
  }
  exactKeys(value.traffic, [
    'experimentCalls', 'networkRequests', 'providerCalls', 'publicationActions',
  ], 'S23 review traffic');
  if (Object.values(value.traffic).some((count) => count !== 0)) {
    throw new TypeError('S23 review observed forbidden traffic');
  }
  exactKeys(value.cleanup,
    ['disposableMaterialRemoved', 'repositoryModified'], 'S23 review cleanup');
  if (value.cleanup.disposableMaterialRemoved !== true ||
      value.cleanup.repositoryModified !== false) {
    throw new TypeError('S23 review cleanup failed');
  }
  if (!DIGEST.test(value.reportSha256 ?? '')) {
    throw new TypeError('S23 report digest is invalid');
  }
  const { reportSha256, ...body } = value;
  if (reportSha256 !== jsonHash(body)) {
    throw new TypeError('S23 report digest mismatch');
  }
  return value;
}

export function createS23ReviewConsistencyReceipt({ reports, adjudications }) {
  return createConsistencyReceipt({ reports, adjudications, version: 'v1' });
}

export function createS23V2ReviewConsistencyReceipt({ reports, adjudications }) {
  return createConsistencyReceipt({ reports, adjudications, version: 'v2' });
}

function createConsistencyReceipt({ reports, adjudications, version }) {
  if (!Array.isArray(reports) || reports.length !== 3) {
    throw new TypeError('S23 consistency requires exactly three reports');
  }
  const validated = reports.map(validateS23ExactIdentityReviewReport);
  const expected = version === 'v2'
    ? { schema: 'scopa.s23-v2-exact-identity-review-report.v1', slice: 'S23-v2',
      planSha256: V2_PLAN_SHA256, evidenceCommit: V2_EVIDENCE_COMMIT }
    : { schema: 'scopa.s23-exact-identity-review-report.v1', slice: 'S23',
      planSha256: PLAN_SHA256, evidenceCommit: EVIDENCE_COMMIT };
  if (validated.some((report) => report.schema !== expected.schema)) {
    throw new TypeError('S23 consistency cannot mix review packet versions');
  }
  if (validated.some((report) => report.verdict !== 'ACCEPT' ||
      report.findings.critical.length > 0 || report.findings.high.length > 0 ||
      report.findings.medium.length > 0)) {
    throw new TypeError('S23 consistency cannot accept a rejected report');
  }
  const byRole = new Map(validated.map((report) => [report.role, report]));
  if (byRole.size !== 3 || ROLES.some((role) => !byRole.has(role))) {
    throw new TypeError('S23 reports must cover each role exactly once');
  }
  if (new Set(validated.map((report) => report.reviewerRunId)).size !== 3) {
    throw new TypeError('S23 reviewer identities must be distinct');
  }
  if (!Array.isArray(adjudications)) {
    throw new TypeError('S23 adjudications must be an array');
  }
  const lowFindings = validated.flatMap((report) =>
    report.findings.low.map((finding) => ({ ...finding, role: report.role })));
  const expectedFindingKeys = new Set(lowFindings.map(({ role, id }) => `${role}:${id}`));
  const seen = new Set();
  for (const adjudication of adjudications) {
    exactKeys(adjudication, ['disposition', 'findingId', 'rationale', 'role'],
      'S23 adjudication');
    const key = `${adjudication.role}:${adjudication.findingId}`;
    if (!expectedFindingKeys.has(key) || seen.has(key) ||
        !['accepted-limitation', 'resolved-no-change'].includes(adjudication.disposition) ||
        typeof adjudication.rationale !== 'string' ||
        adjudication.rationale.trim().length === 0) {
      throw new TypeError('S23 adjudication is missing, duplicate, or invalid');
    }
    seen.add(key);
  }
  if (seen.size !== expectedFindingKeys.size) {
    throw new TypeError('Every S23 low finding requires one adjudication');
  }
  const body = {
    schema: version === 'v2'
      ? 'scopa.s23-v2-review-consistency-receipt.v1'
      : 'scopa.s23-review-consistency-receipt.v1',
    slice: expected.slice,
    planSha256: expected.planSha256,
    reviewedEvidenceCommit: expected.evidenceCommit,
    candidate: structuredClone(CANDIDATE),
    reports: Object.fromEntries(ROLES.map((role) => [role, byRole.get(role).reportSha256])),
    verdicts: Object.fromEntries(ROLES.map((role) => [role, byRole.get(role).verdict])),
    findingCounts: {
      critical: 0,
      high: 0,
      medium: 0,
      low: lowFindings.length,
    },
    adjudications: structuredClone(adjudications),
    independence: {
      distinctReviewers: true,
      allFreshToExactPacket: true,
      priorVerdictsInherited: false,
    },
    traffic: {
      providerCalls: 0,
      experimentCalls: 0,
      networkRequests: 0,
      publicationActions: 0,
    },
    result: 'accepted',
  };
  return { ...body, receiptSha256: jsonHash(body) };
}
