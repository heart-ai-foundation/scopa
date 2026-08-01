import assert from 'node:assert/strict';
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

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const MATRIX_PATH = path.join(ROOT, 'evidence/S21/closed-production-live-matrix.json');

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
