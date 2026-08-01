import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { jsonHash } from '../../enforcement/src/index.js';
import {
  createS23ExactIdentityReviewPlan,
  createS23ReviewConsistencyReceipt,
  validateS23ExactIdentityReviewPlan,
  validateS23ExactIdentityReviewReport,
} from '../src/exact-identity-review.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const PLAN_PATH = path.join(ROOT, 'fixtures/S23/exact-identity-review-plan.json');
const EVIDENCE_REPORT_PATH = path.join(ROOT, 'evidence/S23/reviews/evidence.json');
const STOP_PATH = path.join(ROOT, 'evidence/S23/stop.json');

function report(role, reviewerRunId = `fresh-${role}-reviewer`) {
  const plan = createS23ExactIdentityReviewPlan();
  const body = {
    schema: 'scopa.s23-exact-identity-review-report.v1',
    slice: 'S23',
    planSha256: plan.planSha256,
    role,
    reviewerRunId,
    reviewedEvidenceCommit: plan.evidenceCommit,
    sourceCommit: plan.sourceCommit,
    candidate: structuredClone(plan.candidate),
    freshToExactPacket: true,
    priorVerdictsInherited: false,
    checksExecuted: [`${role} independent check`],
    findings: { critical: [], high: [], medium: [], low: [] },
    verdict: 'ACCEPT',
    traffic: { providerCalls: 0, experimentCalls: 0, networkRequests: 0,
      publicationActions: 0 },
    cleanup: { disposableMaterialRemoved: true, repositoryModified: false },
    falsePositives: [],
    limitations: [],
  };
  return { ...body, reportSha256: jsonHash(body) };
}

function rehash(value) {
  const copy = structuredClone(value);
  delete copy.reportSha256;
  return { ...copy, reportSha256: jsonHash(copy) };
}

test('committed S23 plan is exact, fresh-review, and provider-off', async () => {
  const committed = JSON.parse(await readFile(PLAN_PATH, 'utf8'));
  assert.deepEqual(committed, createS23ExactIdentityReviewPlan());
  assert.equal(validateS23ExactIdentityReviewPlan(committed), committed);
  assert.deepEqual(committed.roles.map(({ id }) => id),
    ['artifact', 'evidence', 'runtime']);
  assert.equal(committed.independence.freshToExactPacket, true);
  assert.equal(committed.traffic.maxProviderCalls, 0);
});

test('S23 report rejects identity, independence, verdict, and traffic drift', () => {
  const valid = report('artifact');
  assert.equal(validateS23ExactIdentityReviewReport(valid), valid);
  for (const mutate of [
    (value) => { value.candidate.packageSha256 = '0'.repeat(64); },
    (value) => { value.freshToExactPacket = false; },
    (value) => { value.priorVerdictsInherited = true; },
    (value) => { value.findings.medium.push({ id: 'medium-drift', summary: 'material' }); },
    (value) => { value.verdict = 'REJECT'; },
    (value) => { value.traffic.providerCalls = 1; },
    (value) => { value.cleanup.repositoryModified = true; },
    (value) => { value.extra = true; },
  ]) {
    const hostile = structuredClone(valid);
    mutate(hostile);
    assert.throws(() => validateS23ExactIdentityReviewReport(rehash(hostile)));
  }
});

test('S23 report preserves a material rejection but cannot convert it to consistency', () => {
  const rejected = report('evidence');
  rejected.findings.high.push({
    id: 'missing-bound-closeout',
    summary: 'The frozen packet omits a receipt required by its plan.',
  });
  rejected.verdict = 'REJECT';
  const normalized = rehash(rejected);
  assert.equal(validateS23ExactIdentityReviewReport(normalized), normalized);
  assert.throws(() => createS23ReviewConsistencyReceipt({
    reports: [report('artifact'), normalized, report('runtime')],
    adjudications: [],
  }), /rejected report/);
});

test('committed S23 evidence review preserves the exact stop verdict', async () => {
  const committed = JSON.parse(await readFile(EVIDENCE_REPORT_PATH, 'utf8'));
  assert.equal(validateS23ExactIdentityReviewReport(committed), committed);
  assert.equal(committed.reportSha256,
    '3706c19af750b6fc64cc6cae3669efd9755d0ec5babaa9807009f2407e6ea4ed');
  assert.equal(committed.verdict, 'REJECT');
  assert.equal(committed.findings.high.length, 1);
  assert.equal(committed.findings.medium.length, 1);
});

test('S23 stop receipt refuses silent retarget or review replay', async () => {
  const stop = JSON.parse(await readFile(STOP_PATH, 'utf8'));
  const { receiptSha256, ...body } = stop;
  assert.equal(receiptSha256, jsonHash(body));
  assert.equal(receiptSha256,
    'b3a9978df68a7c7825b8b2e0a7f3b78fe212d849503065d9225a4815a1dc9e9a');
  assert.equal(stop.result, 'stopped-rejected-packet');
  assert.equal(stop.trigger.verdict, 'REJECT');
  assert.equal(stop.authority.silentRetargetAllowed, false);
  assert.equal(stop.authority.reviewReplayAllowed, false);
  assert.equal(stop.authority.remediationRequiresFreshAuthority, true);
});

test('S23 consistency requires three distinct roles and adjudicates every low', () => {
  const reports = ['artifact', 'evidence', 'runtime'].map((role) => report(role));
  const receipt = createS23ReviewConsistencyReceipt({ reports, adjudications: [] });
  assert.equal(receipt.result, 'accepted');
  assert.equal(receipt.findingCounts.low, 0);
  assert.throws(() => createS23ReviewConsistencyReceipt({
    reports: [reports[0], reports[0], reports[2]], adjudications: [],
  }));
  const withLow = structuredClone(reports);
  withLow[1].findings.low.push({ id: 'local-attestation', summary: 'Local evidence only.' });
  withLow[1] = rehash(withLow[1]);
  assert.throws(() => createS23ReviewConsistencyReceipt({
    reports: withLow, adjudications: [],
  }));
  const accepted = createS23ReviewConsistencyReceipt({
    reports: withLow,
    adjudications: [{ role: 'evidence', findingId: 'local-attestation',
      disposition: 'accepted-limitation', rationale: 'Claim remains local and bounded.' }],
  });
  assert.equal(accepted.findingCounts.low, 1);
});
