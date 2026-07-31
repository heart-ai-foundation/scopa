import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  scanPrivateText,
} from '../../release-readiness/src/package-privacy.js';
import {
  authorizeS18ObserveHardeningMatrix,
  assertS18ObserveHardeningAuthorized,
  createClosedS18ObserveHardeningMatrix,
  createS18ObserveHardeningApproval,
  validateS18ObserveHardeningMatrix,
} from '../src/observe-hardening-policy.js';
import {
  assertS18V3RetainedEvidence,
  parseS18ObserveHardeningArguments,
} from '../src/s18-observe-hardening-cli.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));

function rehash(matrix) {
  const copy = structuredClone(matrix);
  delete copy.matrixSha256;
  copy.matrixSha256 = jsonHash(copy);
  return copy;
}

test('S18-v3 is a closed Codex-only two-call continuation', () => {
  const matrix = createClosedS18ObserveHardeningMatrix();
  assert.equal(validateS18ObserveHardeningMatrix(matrix), matrix);
  assert.equal(matrix.authorization.providerGate,
    'closed-pending-explicit-approval');
  assert.equal(matrix.constraints.providerTrafficAllowed, false);
  assert.equal(matrix.constraints.totalProviderCallsPlanned, 2);
  assert.equal(matrix.constraints.totalProviderCallsAuthorized, 0);
  assert.equal(matrix.retainedEvidence.retainedProviderCalls, 2);
  assert.deepEqual(matrix.scenarios.map(({ id }) => id),
    ['clean', 'cold-restart']);
  assert.equal(matrix.sequencePolicy.maxExtraCalls, 1);
  assert.equal(matrix.sequencePolicy.repeatableTools[0].tool, 'scopa_check');
  assert.equal(matrix.rejectIf.length, 8);
});

test('committed S18-v3 matrix is the exact generated closed posture', async () => {
  const committed = JSON.parse(await readFile(path.join(
    ROOT, 'evidence/S18/closed-observe-hardening-v3.json'), 'utf8'));
  assert.deepEqual(committed, createClosedS18ObserveHardeningMatrix());
});

test('committed S18-v3 approval opens only the exact approved matrix', async () => {
  const closed = createClosedS18ObserveHardeningMatrix();
  const approval = JSON.parse(await readFile(path.join(
    ROOT, 'evidence/S18/observe-hardening-approval-v3.json'), 'utf8'));
  assert.deepEqual(approval, createS18ObserveHardeningApproval(closed, {
    approvedOn: '2026-07-31', expiresOn: '2026-08-01',
  }));
  const authorized = authorizeS18ObserveHardeningMatrix(closed, approval);
  assert.equal(authorized.matrixSha256,
    '620c7111a120c6301577a434cb1371a979ab6bb4f8781edf1c7ad0857b0a2d00');
  assert.equal(assertS18ObserveHardeningAuthorized(
    authorized, approval, { executionDate: '2026-07-31' }), authorized);
  assert.throws(() => assertS18ObserveHardeningAuthorized(
    authorized, approval, { executionDate: '2026-08-02' }), /not valid/);
});

test('fresh approval binds matrix, retained evidence, policy, calls, and expiry', () => {
  const closed = createClosedS18ObserveHardeningMatrix();
  const approval = createS18ObserveHardeningApproval(closed, {
    approvedOn: '2026-07-31', expiresOn: '2026-08-01',
  });
  const authorized = authorizeS18ObserveHardeningMatrix(closed, approval);
  assert.equal(authorized.authorization.providerGate, 'authorized');
  assert.equal(authorized.constraints.providerTrafficAllowed, true);
  assert.equal(authorized.constraints.totalProviderCallsAuthorized, 2);
  assert.equal(authorized.authorization.closedMatrixSha256,
    closed.matrixSha256);
  assert.throws(() => createS18ObserveHardeningApproval(closed, {
    approvedOn: '2026-07-31', expiresOn: '2026-08-02',
  }), /must not exceed one day/);
});

test('rehashing cannot widen sequence, evidence, traffic, or failure posture', () => {
  const closed = createClosedS18ObserveHardeningMatrix();
  for (const mutate of [
    (x) => { x.sequencePolicy.maxExtraCalls = 2; },
    (x) => { x.sequencePolicy.repeatableTools[0].tool = 'scopa_read_file'; },
    (x) => { x.retainedEvidence.claudeCleanPublicSha256 = '0'.repeat(64); },
    (x) => { x.constraints.totalProviderCallsPlanned = 3; },
    (x) => { x.constraints.providerTrafficAllowed = true; },
    (x) => { x.evidence.privateDestination = 'evidence/S18'; },
    (x) => { x.rejectIf.pop(); },
    (x) => { x.onFailure.sequenceViolation = 'accept'; },
    (x) => { x.ifAmbiguous.action = 'continue'; },
  ]) {
    const hostile = structuredClone(closed);
    mutate(hostile);
    assert.throws(() => validateS18ObserveHardeningMatrix(rehash(hostile)));
  }
});

test('approval transplant and self-rehashed approval remain rejected', () => {
  const closed = createClosedS18ObserveHardeningMatrix();
  const approval = createS18ObserveHardeningApproval(closed, {
    approvedOn: '2026-07-31', expiresOn: '2026-08-01',
  });
  for (const mutate of [
    (x) => { x.closedMatrixSha256 = '0'.repeat(64); },
    (x) => { x.providerCalls.total = 3; },
    (x) => { x.codexUsage.campaignTotalTokens += 1; },
    (x) => { x.sequencePolicySha256 = '0'.repeat(64); },
    (x) => { x.retainedV2CampaignStopSha256 = '0'.repeat(64); },
  ]) {
    const hostile = structuredClone(approval);
    mutate(hostile);
    const { approvalSha256: ignored, ...body } = hostile;
    assert.equal(typeof ignored, 'string');
    hostile.approvalSha256 = jsonHash(body);
    assert.throws(() => authorizeS18ObserveHardeningMatrix(closed, hostile));
  }
});

test('v3 controller binds retained evidence and requires an external root', async () => {
  assert.equal((await assertS18V3RetainedEvidence(ROOT))[
    'campaign-stop.public.json'],
  '22f73ea041b73a4166339b9d345684c285843331e08204005db24cb6497f699c');
  const parsed = parseS18ObserveHardeningArguments([
    '--matrix', 'matrix.json', '--approval', 'approval.json',
    '--candidate', 'candidate.tgz', '--private-root', '/tmp/scopa-s18-v3',
  ]);
  assert.equal(parsed.privateRoot, '/tmp/scopa-s18-v3');
  assert.throws(() => parseS18ObserveHardeningArguments([
    '--matrix', 'matrix.json', '--approval', 'approval.json',
    '--candidate', 'candidate.tgz', '--private-root',
    path.join(ROOT, 'private'),
  ]), /outside the repository/);
});

test('recovered v3 evidence binds two accepted calls and closes replay', async () => {
  const live = path.join(ROOT, 'evidence/S18/live-v3');
  const text = await readFile(path.join(
    live, 'campaign-recovery.public.json'), 'utf8');
  const recovery = JSON.parse(text);
  assert.equal(recovery.result, 'accepted-after-publication-only-recovery');
  assert.equal(recovery.providerCallsAuthorized, 2);
  assert.equal(recovery.providerCallsConsumed, 2);
  assert.equal(recovery.replayAllowed, false);
  assert.equal(recovery.aggregateUsage.total_tokens, 103405);
  assert.deepEqual(recovery.runs.map(({ scenario }) => scenario),
    ['clean', 'cold-restart']);
  assert.deepEqual(recovery.runs.map(({ extraObserveCalls }) =>
    extraObserveCalls), [0, 0]);
  assert.equal(recovery.cleanup.controllerTemporaryRootAbsent, true);
  for (const run of recovery.runs) {
    const bytes = await readFile(path.join(live, `${run.scenario}.public.json`));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),
      run.publicEvidenceSha256);
  }
  const registry = JSON.parse(await readFile(path.join(
    ROOT, 'evidence/S18/consumed-approvals.json'), 'utf8'));
  assert.ok(registry.approvals.some((entry) =>
    entry.approvalSha256 ===
      '9f66842e03e3405a00388f0127ced5f72ebcb63ab35d32e38937fbfb9751df9f' &&
    entry.providerCallsConsumed === 2));
  assert.deepEqual(scanPrivateText(text), []);
});
