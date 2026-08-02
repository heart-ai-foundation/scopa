import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { jsonHash } from '../../enforcement/src/index.js';
import { scanPrivateText } from '../../release-readiness/src/package-privacy.js';
import {
  S26_PROVIDER_GATE_CLOSED,
  assertS26ProviderAuthorized,
  authorizeS26LiveMatrix,
  createClosedS26LiveMatrix,
  createS26LiveApproval,
  validateS26LiveMatrix,
} from '../../../fixtures/S26/s26-requalification-policy.mjs';
import {
  assertS26StaticPreflight,
  parseS26LiveArguments,
} from '../../../fixtures/S26/s26-production-live-cli.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const MATRIX_PATH = path.join(
  ROOT,
  'evidence/S26/closed-production-live-matrix.json',
);
const APPROVAL_PATH = path.join(
  ROOT,
  'evidence/S26/production-live-approval.json',
);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function rehash(matrix) {
  const copy = structuredClone(matrix);
  delete copy.matrixSha256;
  copy.matrixSha256 = jsonHash(copy);
  return copy;
}

test('committed S26 matrix binds exact S25 bytes and remains provider-closed', async () => {
  const text = await readFile(MATRIX_PATH, 'utf8');
  const matrix = JSON.parse(text);
  assert.deepEqual(matrix, createClosedS26LiveMatrix());
  assert.equal(validateS26LiveMatrix(matrix), matrix);
  assert.equal(matrix.authorization.providerGate, S26_PROVIDER_GATE_CLOSED);
  assert.equal(matrix.constraints.providerTrafficAllowed, false);
  assert.equal(matrix.constraints.totalProviderCallsAuthorized, 0);
  assert.equal(
    matrix.goal.packageSha256,
    'aa744c45c8d28bc609205748f4594a9dc6fa829fd996e63c3917a0693165e8d6',
  );
  assert.deepEqual(matrix.goal.calls.map(({ id }) => id), [
    'claude-clean',
    'codex-clean',
  ]);
  assert.deepEqual(scanPrivateText(text), []);
});

test('S26 prerequisites bind prompts, S25 receipts, and process-tree proof', async () => {
  const matrix = createClosedS26LiveMatrix();
  const bindings = matrix.deterministicPrerequisites;
  const files = {
    promptsSha256: 'fixtures/S26/prompts.json',
    qualificationFileSha256: 'evidence/S25/exact-candidate-qualification.json',
    s25CloseoutFileSha256: 'evidence/S25/closeout.json',
    processTreeFixtureSha256: 'fixtures/S24/gate-process-tree-fixture.mjs',
    productionLiveRunnerSha256: 'fixtures/S26/s26-production-live-cli.mjs',
  };
  for (const [field, relative] of Object.entries(files)) {
    assert.equal(sha256(await readFile(path.join(ROOT, relative))), bindings[field]);
  }
  assert.deepEqual(bindings.processTreeContracts, ['PTC1', 'PTC2', 'PTC3']);
  assert.equal(bindings.candidateInstallExternalRequests, 0);
});

test('S26 runner closes before provider intent on authority or byte drift', () => {
  const closed = createClosedS26LiveMatrix();
  const approval = createS26LiveApproval(closed);
  const valid = {
    matrix: closed,
    approval,
    candidateSha256:
      'aa744c45c8d28bc609205748f4594a9dc6fa829fd996e63c3917a0693165e8d6',
    promptsSha256: closed.deterministicPrerequisites.promptsSha256,
    claudeVersion: '2.1.220 (Claude Code)',
    codexVersion: 'codex-cli 0.146.0',
    executionInstant: '2026-08-02T12:00:00Z',
  };
  const authorized = assertS26StaticPreflight(valid);
  assert.equal(authorized.constraints.totalProviderCallsAuthorized, 2);
  for (const [field, value, pattern] of [
    ['candidateSha256', '0'.repeat(64), /candidate tarball digest drifted/],
    ['promptsSha256', '0'.repeat(64), /prompt bytes drifted/],
    ['claudeVersion', 'drift', /client version drifted/],
    ['codexVersion', 'drift', /client version drifted/],
    ['executionInstant', '2026-08-03T04:45:01Z', /not valid/],
  ]) {
    assert.throws(() => assertS26StaticPreflight({
      ...valid,
      [field]: value,
    }), pattern);
  }
  assert.throws(() => assertS26StaticPreflight({
    ...valid,
    approval: null,
  }));
});

test('S26 runner argument contract rejects repository custody and drift', () => {
  assert.deepEqual(parseS26LiveArguments([
    '--matrix', '/tmp/matrix.json',
    '--approval', '/tmp/approval.json',
    '--candidate', '/tmp/candidate.tgz',
    '--private-root', '/tmp/scopa-private',
  ]), {
    matrixPath: '/tmp/matrix.json',
    approvalPath: '/tmp/approval.json',
    candidatePath: '/tmp/candidate.tgz',
    privateRoot: '/tmp/scopa-private',
  });
  assert.throws(() => parseS26LiveArguments([]), /usage/);
  assert.throws(() => parseS26LiveArguments([
    '--matrix', '/tmp/matrix.json',
    '--approval', '/tmp/approval.json',
    '--candidate', '/tmp/candidate.tgz',
    '--private-root', path.join(ROOT, 'private'),
  ]), /outside the repository/);
});

test('S26 approval is exactly two calls with bounded custody and no release grant', () => {
  const closed = createClosedS26LiveMatrix();
  const approval = createS26LiveApproval(closed);
  assert.equal(approval.closedMatrixSha256, closed.matrixSha256);
  assert.equal(approval.calls.length, 2);
  assert.deepEqual(approval.calls.map(({ ordinal }) => ordinal), [1, 2]);
  assert.deepEqual(approval.calls.map(({ provider }) => provider), [
    'claude',
    'codex',
  ]);
  for (const call of approval.calls) {
    assert.match(
      call.custodyDestination,
      /^SCOPA_PRIVATE_EVIDENCE_ROOT\/S26\/(claude|codex)$/,
    );
    assert.equal(call.limits.maxProviderInvocations, 1);
  }
  assert.equal(approval.notBefore, '2026-08-02T04:45:00Z');
  assert.equal(approval.expiresAt, '2026-08-03T04:45:00Z');
  assert.equal(approval.singleUse, true);
  assert.equal(approval.experimentUseAllowed, false);
  assert.equal(approval.publicationAllowed, false);
  assert.equal(approval.releaseAllowed, false);
});

test('committed S26 approval is exact and opens only the frozen matrix', async () => {
  const closed = createClosedS26LiveMatrix();
  const approvalText = await readFile(APPROVAL_PATH, 'utf8');
  const approval = JSON.parse(approvalText);
  assert.deepEqual(approval, createS26LiveApproval(closed));
  assert.equal(
    approval.approvalSha256,
    '6a93ad966927c64bdaa2ea89c1cdf812352e9d44bb11878025c96f58a691f312',
  );
  assert.deepEqual(scanPrivateText(approvalText), []);
  const authorized = authorizeS26LiveMatrix(closed, approval);
  assert.equal(authorized.constraints.totalProviderCallsAuthorized, 2);
});

test('S26 stop consumes replay and proves Codex was never attempted', async () => {
  const [stopText, consumedText] = await Promise.all([
    readFile(path.join(ROOT, 'evidence/S26/stop.json'), 'utf8'),
    readFile(path.join(ROOT, 'evidence/S26/consumed-approvals.json'), 'utf8'),
  ]);
  const stop = JSON.parse(stopText);
  const consumed = JSON.parse(consumedText);
  assert.equal(stop.result, 'stopped-non-qualifying');
  assert.equal(stop.callAccounting.approved, 2);
  assert.equal(stop.callAccounting.attempted, 1);
  assert.equal(stop.callAccounting.conservativelyConsumed, 1);
  assert.equal(stop.callAccounting.claudeAttempted, true);
  assert.equal(stop.callAccounting.codexAttempted, false);
  assert.equal(stop.callAccounting.replayAllowed, false);
  assert.equal(stop.stop.normalizedSuccessObserved, false);
  assert.equal(stop.stop.rawRunRetained, false);
  assert.equal(stop.reconciliation.qualificationAccepted, false);
  assert.equal(stop.reconciliation.s27Authorized, false);
  assert.equal(consumed.approvals.length, 1);
  assert.equal(
    consumed.approvals[0].approvalSha256,
    '6a93ad966927c64bdaa2ea89c1cdf812352e9d44bb11878025c96f58a691f312',
  );
  assert.equal(consumed.approvals[0].completedSequence, false);
  assert.equal(consumed.approvals[0].replayAllowed, false);
  assert.deepEqual(scanPrivateText(stopText), []);
  assert.deepEqual(scanPrivateText(consumedText), []);
});

test('closed S26 posture refuses provider intent and all authority drift', () => {
  const closed = createClosedS26LiveMatrix();
  assert.throws(
    () => assertS26ProviderAuthorized(closed, null),
    /provider gate is closed/,
  );
  for (const mutate of [
    (matrix) => { matrix.goal.packageSha256 = '0'.repeat(64); },
    (matrix) => { matrix.goal.calls.reverse(); },
    (matrix) => { matrix.goal.calls[0].client = 'claude-code@drift'; },
    (matrix) => { matrix.goal.calls[1].requestedModel = 'drift'; },
    (matrix) => { matrix.deterministicPrerequisites.promptsSha256 = '0'.repeat(64); },
    (matrix) => { matrix.providers.claude.limits.maxCampaignBudgetUsd = '0.21'; },
    (matrix) => { matrix.providers.codex.limits.maxCampaignTotalTokens += 1; },
    (matrix) => { matrix.constraints.providerTrafficAllowed = true; },
    (matrix) => { matrix.constraints.experimentUseAllowed = true; },
    (matrix) => { matrix.constraints.releaseAllowed = true; },
  ]) {
    const hostile = structuredClone(closed);
    mutate(hostile);
    assert.throws(() => validateS26LiveMatrix(rehash(hostile)));
  }
});

test('only exact S26 approval opens two calls inside its bounded window', () => {
  const closed = createClosedS26LiveMatrix();
  const approval = createS26LiveApproval(closed);
  const authorized = authorizeS26LiveMatrix(closed, approval);
  assert.equal(authorized.constraints.providerTrafficAllowed, true);
  assert.equal(authorized.constraints.totalProviderCallsAuthorized, 2);
  assert.equal(authorized.providers.claude.providerCallsAuthorized, 1);
  assert.equal(authorized.providers.codex.providerCallsAuthorized, 1);
  assert.equal(assertS26ProviderAuthorized(authorized, approval, {
    executionInstant: '2026-08-02T12:00:00Z',
  }), authorized);
  assert.throws(() => assertS26ProviderAuthorized(authorized, approval, {
    executionInstant: '2026-08-03T04:45:01Z',
  }), /not valid/);

  const transplanted = structuredClone(approval);
  transplanted.calls[0].requestedModel = 'drift';
  const { approvalSha256: ignored, ...body } = transplanted;
  assert.equal(typeof ignored, 'string');
  transplanted.approvalSha256 = jsonHash(body);
  assert.throws(
    () => authorizeS26LiveMatrix(closed, transplanted),
    /differs from the frozen S26 value/,
  );
});
