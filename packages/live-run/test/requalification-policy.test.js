import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  fileURLToPath,
} from 'node:url';
import {
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  scanPrivateText,
} from '../../release-readiness/src/package-privacy.js';
import {
  S18_PROVIDER_GATE_CLOSED,
  assertS18ProviderAuthorized,
  authorizeS18LiveMatrix,
  createClosedS18LiveMatrix,
  createS18LiveApproval,
  validateS18LiveMatrix,
} from '../src/requalification-policy.js';
import {
  assertCandidateClientBindings,
  parseS18LiveArguments,
} from '../src/s18-production-live-cli.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);
const MATRIX_PATH = path.join(
  ROOT,
  'evidence/S18/closed-production-live-matrix.json',
);
const V1_MATRIX_PATH = path.join(
  ROOT,
  'evidence/S18/closed-production-live-matrix.v1.json',
);
const APPROVAL_PATH = path.join(
  ROOT,
  'evidence/S18/production-live-approval.json',
);
const V1_APPROVAL_PATH = path.join(
  ROOT,
  'evidence/S18/production-live-approval.v1.json',
);

function rehash(matrix) {
  const copy = structuredClone(matrix);
  delete copy.matrixSha256;
  copy.matrixSha256 = jsonHash(copy);
  return copy;
}

test('committed S18 matrix is exact-candidate-bound and closed by default', async () => {
  const text = await readFile(MATRIX_PATH, 'utf8');
  const committed = JSON.parse(text);
  assert.deepEqual(committed, createClosedS18LiveMatrix());
  assert.equal(validateS18LiveMatrix(committed), committed);
  assert.equal(
    committed.authorization.providerGate,
    S18_PROVIDER_GATE_CLOSED,
  );
  assert.equal(committed.constraints.providerTrafficAllowed, false);
  assert.equal(committed.constraints.totalProviderCallsPlanned, 4);
  assert.equal(committed.constraints.totalProviderCallsAuthorized, 0);
  assert.equal(committed.providers.claude.plannedCalls, 2);
  assert.equal(committed.providers.codex.plannedCalls, 2);
  assert.equal(committed.providers.claude.providerCallsAuthorized, 0);
  assert.equal(committed.providers.codex.providerCallsAuthorized, 0);
  assert.deepEqual(
    committed.providers.claude.scenarios.map(({ id }) => id),
    ['clean', 'cold-restart'],
  );
  assert.deepEqual(
    committed.providers.codex.scenarios,
    committed.providers.claude.scenarios,
  );
  assert.equal(committed.rejectIf.length, 8);
  assert.deepEqual(scanPrivateText(text), []);
});

test('closed matrix refuses provider intent without exact separate approval', () => {
  const closed = createClosedS18LiveMatrix();
  assert.throws(
    () => assertS18ProviderAuthorized(closed, null, {
      executionDate: '2026-07-31',
    }),
    /provider gate is closed/,
  );
  for (const mutate of [
    (matrix) => { matrix.constraints.providerTrafficAllowed = true; },
    (matrix) => { matrix.constraints.totalProviderCallsAuthorized = 4; },
    (matrix) => { matrix.providers.claude.providerCallsAuthorized = 2; },
    (matrix) => { matrix.authorization.principalApproval = 'conversation-explicit'; },
    (matrix) => { matrix.authorization.approvedOn = '2026-07-31'; },
  ]) {
    const falseOpen = structuredClone(closed);
    mutate(falseOpen);
    assert.throws(() => validateS18LiveMatrix(rehash(falseOpen)));
  }
});

test('approval transition binds exact digest, budgets, destinations, calls, and expiry', () => {
  const closed = createClosedS18LiveMatrix();
  const approval = createS18LiveApproval(closed, {
    approvedOn: '2026-07-31',
    expiresOn: '2026-08-01',
  });
  const authorized = authorizeS18LiveMatrix(closed, approval);
  assert.equal(
    assertS18ProviderAuthorized(authorized, approval, {
      executionDate: '2026-07-31',
    }),
    authorized,
  );
  assert.equal(authorized.constraints.providerTrafficAllowed, true);
  assert.equal(authorized.constraints.totalProviderCallsAuthorized, 4);
  assert.equal(authorized.providers.claude.providerCallsAuthorized, 2);
  assert.equal(authorized.providers.codex.providerCallsAuthorized, 2);
  assert.equal(
    authorized.authorization.closedMatrixSha256,
    closed.matrixSha256,
  );
  assert.throws(
    () => assertS18ProviderAuthorized(authorized, approval, {
      executionDate: '2026-08-02',
    }),
    /not valid on the execution date/,
  );
  assert.throws(
    () => createS18LiveApproval(closed, {
      approvedOn: '2026-07-31',
      expiresOn: '2026-08-02',
    }),
    /must not exceed one day/,
  );
  assert.throws(
    () => createS18LiveApproval(closed, {
      approvedOn: '2026-02-30',
      expiresOn: '2026-02-30',
    }),
    /real calendar date/,
  );
});

test('committed principal approval opens only the exact approved matrix', async () => {
  const closed = JSON.parse(await readFile(MATRIX_PATH, 'utf8'));
  const approval = JSON.parse(await readFile(APPROVAL_PATH, 'utf8'));
  const expected = createS18LiveApproval(closed, {
    approvedOn: '2026-07-31',
    expiresOn: '2026-08-01',
  });
  assert.deepEqual(approval, expected);
  const authorized = authorizeS18LiveMatrix(closed, approval);
  assert.equal(authorized.matrixSha256,
    '94be00df2eeee1838946f53fcf20137741c942daa18d8f59631be18caef364ee');
  assert.equal(assertS18ProviderAuthorized(authorized, approval, {
    executionDate: '2026-07-31',
  }), authorized);
});

test('stopped v1 approval remains historically verifiable', async () => {
  const closed = JSON.parse(await readFile(V1_MATRIX_PATH, 'utf8'));
  const approval = JSON.parse(await readFile(V1_APPROVAL_PATH, 'utf8'));
  assert.deepEqual(approval, createS18LiveApproval(closed, {
    approvedOn: '2026-07-31', expiresOn: '2026-08-01',
  }));
  assert.equal(authorizeS18LiveMatrix(closed, approval).matrixSha256,
    '65c04e950f630fa229776df3307af078cc1cd4eaa5844f8b89707e5ceff89317');
});

test('recomputed digest cannot authorize candidate, policy, call, or custody drift', () => {
  const closed = createClosedS18LiveMatrix();
  for (const mutate of [
    (matrix) => { matrix.goal.candidateSha256 = '0'.repeat(64); },
    (matrix) => { matrix.goal.sourceCommit = '0'.repeat(40); },
    (matrix) => { matrix.providers.claude.plannedCalls = 3; },
    (matrix) => { matrix.providers.codex.limits.maxCampaignTotalTokens += 1; },
    (matrix) => { matrix.providers.claude.limits.maxCampaignBudgetUsd = '0.41'; },
    (matrix) => { matrix.providers.codex.privateEvidenceDestination = 'evidence/S18'; },
    (matrix) => { matrix.stopConditions.pop(); },
    (matrix) => { matrix.rejectIf.pop(); },
    (matrix) => { matrix.ifAmbiguous.action = 'continue'; },
    (matrix) => { matrix.extra = true; },
  ]) {
    const hostile = structuredClone(closed);
    mutate(hostile);
    assert.throws(() => validateS18LiveMatrix(rehash(hostile)));
  }
});

test('approval transplant and recomputed approval digest remain rejected', () => {
  const closed = createClosedS18LiveMatrix();
  const approval = createS18LiveApproval(closed, {
    approvedOn: '2026-07-31',
    expiresOn: '2026-08-01',
  });
  for (const mutate of [
    (candidate) => { candidate.closedMatrixSha256 = '0'.repeat(64); },
    (candidate) => { candidate.candidateSha256 = '0'.repeat(64); },
    (candidate) => { candidate.providerCalls.total = 5; },
    (candidate) => { candidate.claudeBudget.campaignUsd = '0.41'; },
    (candidate) => { candidate.codexUsage.campaignTotalTokens += 1; },
    (candidate) => {
      candidate.privateEvidenceDestinationApproval = 'not-granted';
    },
  ]) {
    const hostile = structuredClone(approval);
    mutate(hostile);
    const { approvalSha256: ignored, ...body } = hostile;
    assert.equal(typeof ignored, 'string');
    hostile.approvalSha256 = jsonHash(body);
    assert.throws(
      () => authorizeS18LiveMatrix(closed, hostile),
      /differs from the frozen S18 value/,
    );
  }
});

test('S18 live CLI requires exact arguments and an external private root', () => {
  const parsed = parseS18LiveArguments([
    '--matrix', 'matrix.json', '--approval', 'approval.json',
    '--candidate', 'candidate.tgz', '--private-root', '/tmp/scopa-s18-private',
  ]);
  assert.equal(parsed.privateRoot, '/tmp/scopa-s18-private');
  assert.throws(() => parseS18LiveArguments([
    '--matrix', 'matrix.json', '--approval', 'approval.json',
    '--candidate', 'candidate.tgz', '--private-root',
    path.join(ROOT, 'private'),
  ]), /outside the repository/);
  assert.throws(() => parseS18LiveArguments([]), /usage/);
});

test('S18 preflight rejects matrix versions that disagree with candidate bytes', () => {
  const matrix = createClosedS18LiveMatrix();
  const v1 = createClosedS18LiveMatrix({ version: 1 });
  const installed = {
    claudeIntegration: { EXPECTED_CLAUDE_CODE_VERSION: '2.1.220' },
    codexIntegration: { EXPECTED_CODEX_CLI_VERSION: '0.146.0' },
  };
  assert.equal(assertCandidateClientBindings(matrix, installed), matrix);
  assert.throws(
    () => assertCandidateClientBindings(v1, installed),
    /differ from candidate bytes/,
  );
});

test('v1 approval cannot transplant onto the corrected v2 matrix', async () => {
  const v1Approval = JSON.parse(await readFile(V1_APPROVAL_PATH, 'utf8'));
  const v2 = createClosedS18LiveMatrix();
  assert.throws(
    () => authorizeS18LiveMatrix(v2, v1Approval),
    /differs from the frozen S18 value/,
  );
});
