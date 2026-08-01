import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { jsonHash } from '../../enforcement/src/index.js';
import { scanPrivateText } from '../../release-readiness/src/package-privacy.js';
import {
  S21_PROVIDER_GATE_CLOSED,
  assertS21ProviderAuthorized,
  authorizeS21LiveMatrix,
  createClosedS21LiveMatrix,
  createS21LiveApproval,
  validateS21LiveMatrix,
} from '../src/s21-requalification-policy.js';
import { parseS21LiveArguments } from '../src/s21-production-live-cli.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const MATRIX_PATH = path.join(ROOT, 'evidence/S21/closed-production-live-matrix.json');
const APPROVAL_PATH = path.join(ROOT, 'evidence/S21/production-live-approval.json');
const CAMPAIGN_PATH = path.join(ROOT, 'evidence/S21/live/campaign.public.json');
const CONSUMED_PATH = path.join(ROOT, 'evidence/S21/consumed-approvals.json');
const CLOSEOUT_PATH = path.join(ROOT, 'evidence/S21/closeout.json');

function rehash(matrix) {
  const copy = structuredClone(matrix);
  delete copy.matrixSha256;
  copy.matrixSha256 = jsonHash(copy);
  return copy;
}

test('committed S21 matrix binds the bundled candidate and remains closed', async () => {
  const text = await readFile(MATRIX_PATH, 'utf8');
  const matrix = JSON.parse(text);
  assert.deepEqual(matrix, createClosedS21LiveMatrix());
  assert.equal(validateS21LiveMatrix(matrix), matrix);
  assert.equal(matrix.authorization.providerGate, S21_PROVIDER_GATE_CLOSED);
  assert.equal(matrix.constraints.providerTrafficAllowed, false);
  assert.equal(matrix.constraints.totalProviderCallsAuthorized, 0);
  assert.equal(matrix.goal.packageSha256,
    '49b62ac4b4d869dbca8459aa08f515427e0a04349f014c85cc422d7e0625f147');
  assert.equal(matrix.goal.closureSha256,
    '6071fda7b96dbe6bb87ed154ef3dc3d94e5f53be114148e663a7e9523e76180e');
  assert.equal(matrix.goal.bundledPayloadSha256,
    matrix.goal.installedPayloadSha256);
  assert.deepEqual(matrix.goal.calls.map(({ id }) => id), [
    'claude-clean', 'claude-cold-restart',
    'codex-clean', 'codex-cold-restart',
  ]);
  assert.deepEqual(scanPrivateText(text), []);
});

test('approval names every call, client, model, budget, expiry, and custody', () => {
  const closed = createClosedS21LiveMatrix();
  const approval = createS21LiveApproval(closed);
  assert.equal(approval.closedMatrixSha256, closed.matrixSha256);
  assert.equal(approval.calls.length, 4);
  assert.deepEqual(approval.calls.map(({ ordinal }) => ordinal), [1, 2, 3, 4]);
  for (const call of approval.calls) {
    assert.equal(typeof call.client, 'string');
    assert.equal(typeof call.requestedModel, 'string');
    assert.match(call.custodyDestination,
      /^SCOPA_PRIVATE_EVIDENCE_ROOT\/S21\/(claude|codex)$/);
    assert.equal(typeof call.limits.timeoutMsPerRun, 'number');
  }
  assert.equal(approval.notBefore, '2026-08-01T02:33:34Z');
  assert.equal(approval.expiresAt, '2026-08-02T02:33:34Z');
  assert.equal(approval.singleUse, true);
  assert.equal(approval.experimentUseAllowed, false);
  assert.equal(approval.publicationAllowed, false);
});

test('committed principal approval is the exact deterministic approval', async () => {
  const approval = JSON.parse(await readFile(APPROVAL_PATH, 'utf8'));
  assert.deepEqual(approval,
    createS21LiveApproval(createClosedS21LiveMatrix()));
  assert.equal(approval.approvalSha256,
    '81df2d47f24251ff6d743d0d026fef0a5eb9dd10a484f26a6eb1a3f9117096c9');
});

test('production CLI requires exact arguments and external private custody', () => {
  assert.throws(() => parseS21LiveArguments([]), /usage/);
  assert.throws(() => parseS21LiveArguments([
    '--matrix', MATRIX_PATH, '--approval', APPROVAL_PATH,
    '--candidate', '/tmp/candidate.tgz', '--private-root', ROOT,
  ]), /outside the repository/);
  const parsed = parseS21LiveArguments([
    '--matrix', MATRIX_PATH, '--approval', APPROVAL_PATH,
    '--candidate', '/tmp/candidate.tgz',
    '--private-root', '/tmp/scopa-s21-private-test',
  ]);
  assert.equal(parsed.privateRoot, '/tmp/scopa-s21-private-test');
});

test('closed posture refuses provider intent and drift cannot self-authorize', () => {
  const closed = createClosedS21LiveMatrix();
  assert.throws(() => assertS21ProviderAuthorized(closed, null),
    /provider gate is closed/);
  for (const mutate of [
    (matrix) => { matrix.goal.packageSha256 = '0'.repeat(64); },
    (matrix) => { matrix.goal.closureSha256 = '0'.repeat(64); },
    (matrix) => { matrix.goal.installedPayloadSha256 = '0'.repeat(64); },
    (matrix) => { matrix.goal.calls[0].client = 'claude-code@drift'; },
    (matrix) => { matrix.goal.calls.reverse(); },
    (matrix) => { matrix.providers.claude.limits.maxCampaignBudgetUsd = '0.41'; },
    (matrix) => { matrix.providers.codex.limits.maxCampaignTotalTokens += 1; },
    (matrix) => { matrix.approvalTerms.expiresAt = '2026-08-03T02:33:34Z'; },
    (matrix) => { matrix.providers.codex.privateEvidenceDestination = 'evidence/S21'; },
    (matrix) => { matrix.constraints.providerTrafficAllowed = true; },
  ]) {
    const hostile = structuredClone(closed);
    mutate(hostile);
    assert.throws(() => validateS21LiveMatrix(rehash(hostile)));
  }
});

test('exact approval opens only the exact matrix inside its one-day window', () => {
  const closed = createClosedS21LiveMatrix();
  const approval = createS21LiveApproval(closed);
  const authorized = authorizeS21LiveMatrix(closed, approval);
  assert.equal(authorized.constraints.providerTrafficAllowed, true);
  assert.equal(authorized.constraints.totalProviderCallsAuthorized, 4);
  assert.equal(assertS21ProviderAuthorized(authorized, approval, {
    executionInstant: '2026-08-01T12:00:00Z',
  }), authorized);
  assert.throws(() => assertS21ProviderAuthorized(authorized, approval, {
    executionInstant: '2026-08-02T02:33:35Z',
  }), /not valid/);
  const transplanted = structuredClone(approval);
  transplanted.calls[0].requestedModel = 'drift';
  const { approvalSha256: ignored, ...body } = transplanted;
  assert.equal(typeof ignored, 'string');
  transplanted.approvalSha256 = jsonHash(body);
  assert.throws(() => authorizeS21LiveMatrix(closed, transplanted),
    /differs from the frozen S21 value/);
});

test('S21 public campaign proves four bounded calls without private topology', async () => {
  const text = await readFile(CAMPAIGN_PATH, 'utf8');
  const campaign = JSON.parse(text);
  assert.equal(createHash('sha256').update(text).digest('hex'),
    '5aa21c4815b1e55a862eb8f862467e884414810eecd1792477ba4a1d9e64ffd6');
  assert.equal(campaign.closedMatrixSha256,
    createClosedS21LiveMatrix().matrixSha256);
  assert.equal(campaign.approvalSha256,
    createS21LiveApproval(createClosedS21LiveMatrix()).approvalSha256);
  assert.equal(campaign.invocationCount, 4);
  assert.deepEqual(campaign.callOrder, [
    'claude-clean', 'claude-cold-restart',
    'codex-clean', 'codex-cold-restart',
  ]);
  for (const run of [...campaign.claude.scenarios, ...campaign.codex.scenarios]) {
    assert.equal(run.terminalState, 'succeeded');
    assert.equal(run.expectedCanStop, true);
    assert.equal(run.observedCanStop, true);
  }
  assert.ok(campaign.claude.scenarios.every(({ costUsd }) =>
    Number(costUsd) <= 0.20));
  assert.ok(Number(campaign.claude.totalCostUsd) <= 0.40);
  const codexTotals = campaign.codex.scenarios.map(({ usage }) =>
    usage.input_tokens + usage.output_tokens + usage.reasoning_output_tokens);
  assert.ok(codexTotals.every((total) => total <= 126000));
  assert.ok(codexTotals.reduce((sum, value) => sum + value, 0) <= 252000);
  for (const cleanup of [campaign.claude.cleanup, campaign.codex.cleanup]) {
    assert.ok(Object.values(cleanup).every((value) => value === true));
  }
  assert.equal(campaign.privateEvidence.destinationAlias,
    'SCOPA_PRIVATE_EVIDENCE_ROOT/S21');
  assert.deepEqual(scanPrivateText(text), []);
});

test('single-use registry consumes the exact approval for four calls', async () => {
  const registry = JSON.parse(await readFile(CONSUMED_PATH, 'utf8'));
  assert.deepEqual(registry, {
    schema: 'scopa.s21-consumed-approvals.v1',
    approvals: [{
      approvalSha256:
        '81df2d47f24251ff6d743d0d026fef0a5eb9dd10a484f26a6eb1a3f9117096c9',
      executedAt: '2026-08-01T02:52:37.425Z',
      invocationCount: 4,
      publicCampaignSha256:
        '5aa21c4815b1e55a862eb8f862467e884414810eecd1792477ba4a1d9e64ffd6',
    }],
  });
});

test('S21 closeout binds the accepted campaign and hosted gate', async () => {
  const closeout = JSON.parse(await readFile(CLOSEOUT_PATH, 'utf8'));
  const { receiptSha256, ...body } = closeout;
  assert.equal(receiptSha256, jsonHash(body));
  assert.equal(receiptSha256,
    'e61d4e92748bde8aab83ea26cbc80357f7f47951ac858b9e0e53417765cb5953');
  assert.equal(closeout.result, 'accepted');
  assert.equal(closeout.authorization.singleUseConsumed, true);
  assert.equal(closeout.campaign.invocationCount, 4);
  assert.equal(closeout.hosted.conclusion, 'success');
  assert.equal(closeout.traffic.providerCalls,
    closeout.traffic.providerCallsAuthorized);
  assert.equal(closeout.traffic.publicationActions, 0);
  assert.equal(closeout.traffic.experimentCalls, 0);
});
