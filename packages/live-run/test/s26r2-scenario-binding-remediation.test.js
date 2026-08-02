import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { scanPrivateText } from '../../release-readiness/src/package-privacy.js';
import {
  S26R2_PROVIDER_GATE_CLOSED,
  createClosedS26R2LiveMatrix,
  createS26R2LiveApproval,
  validateS26R2LiveMatrix,
} from '../../../fixtures/S26R2/s26r2-requalification-policy.mjs';
import {
  assertS26R2ScenarioBinding,
  assertS26R2StaticPreflight,
  createS26R2ScenarioBinding,
  retainThenValidateS26R2Run,
} from '../../../fixtures/S26R2/s26r2-production-live-cli.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const MATRIX = path.join(
  ROOT,
  'evidence/S26R2/closed-production-live-matrix.json',
);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function passingClaudeRun() {
  return {
    receipt: { schema: 'fixture.receipt.v1' },
    terminal: {
      state: 'succeeded',
      canStop: true,
      cleanup: { groupGone: true, orphanDetected: false },
    },
    normalized: {
      final: { canStop: true, scenario: 'S26R2-claude-clean' },
      result: { costUsd: 0, turns: 1 },
      toolCalls: [
        'scopa_orientation',
        'scopa_read_file',
        'scopa_write_file',
        'scopa_check',
        'scopa_assurance',
        'scopa_transcript',
      ].map((name) => ({ name: `mcp__scopa__${name}` })),
    },
    privateCapture: { stdout: 'fixture success\n', stderr: '' },
  };
}

test('S26R2 matrix is closed and binds the S26R1 stop and replacement runner', async () => {
  const text = await readFile(MATRIX, 'utf8');
  const matrix = JSON.parse(text);
  assert.deepEqual(matrix, createClosedS26R2LiveMatrix());
  assert.equal(validateS26R2LiveMatrix(matrix), matrix);
  assert.equal(matrix.authorization.providerGate, S26R2_PROVIDER_GATE_CLOSED);
  assert.equal(matrix.constraints.providerTrafficAllowed, false);
  assert.equal(matrix.constraints.totalProviderCallsAuthorized, 0);
  const files = {
    promptsSha256: 'fixtures/S26R2/prompts.json',
    productionLiveRunnerSha256:
      'fixtures/S26R2/s26r2-production-live-cli.mjs',
    s26r1StopFileSha256: 'evidence/S26R1/stop.json',
    s26r1ConsumedApprovalsFileSha256:
      'evidence/S26R1/consumed-approvals.json',
    supersededRunnerSha256:
      'fixtures/S26R1/s26r1-production-live-cli.mjs',
  };
  for (const [field, relative] of Object.entries(files)) {
    assert.equal(
      sha256(await readFile(path.join(ROOT, relative))),
      matrix.deterministicPrerequisites[field],
    );
  }
  assert.deepEqual(scanPrivateText(text), []);
});

test('S26R2 Macro Delta approval grants deterministic work and zero calls', async () => {
  const text = await readFile(
    path.join(ROOT, 'evidence/S26R2/macro-delta-approval.json'),
    'utf8',
  );
  const approval = JSON.parse(text);
  assert.equal(approval.providerCallsAuthorized, 0);
  assert.equal(approval.historicalS26R1ApprovalConsumed, true);
  assert.equal(
    approval.closedS26R2MatrixSha256,
    createClosedS26R2LiveMatrix().matrixSha256,
  );
  assert.equal(
    sha256(await readFile(path.join(ROOT, approval.macroDeltaPath))),
    approval.macroDeltaFileSha256,
  );
  assert.equal(
    sha256(await readFile(path.join(ROOT, approval.protocolPath))),
    approval.protocolFileSha256,
  );
  assert.equal(approval.candidateChangeAllowed, false);
  assert.equal(approval.dependencyChangeAllowed, false);
  assert.equal(approval.experimentUseAllowed, false);
  assert.equal(approval.publicationAllowed, false);
  assert.equal(approval.releaseAllowed, false);
  assert.deepEqual(scanPrivateText(text), []);
});

test('committed S26R2 approval is the exact bounded two-call authority', async () => {
  const text = await readFile(
    path.join(ROOT, 'evidence/S26R2/production-live-approval.json'),
    'utf8',
  );
  const approval = JSON.parse(text);
  const expected = createS26R2LiveApproval(createClosedS26R2LiveMatrix());
  assert.deepEqual(approval, expected);
  assert.equal(
    approval.approvalSha256,
    '2af383b52ccdacf6c5d233760f0627e22089be1d1bf8e63b6df084e7d9734ab1',
  );
  assert.deepEqual(approval.calls.map(({ id }) => id), [
    'claude-clean',
    'codex-clean',
  ]);
  assert.equal(approval.singleUse, true);
  assert.equal(approval.experimentUseAllowed, false);
  assert.equal(approval.publicationAllowed, false);
  assert.equal(approval.releaseAllowed, false);
  assert.deepEqual(scanPrivateText(text), []);
});

test('S26R2 stop consumes replay after retention projection failure', async () => {
  const [stopText, consumedText] = await Promise.all([
    readFile(path.join(ROOT, 'evidence/S26R2/stop.json'), 'utf8'),
    readFile(path.join(ROOT, 'evidence/S26R2/consumed-approvals.json'), 'utf8'),
  ]);
  const stop = JSON.parse(stopText);
  const consumed = JSON.parse(consumedText);
  assert.equal(stop.approvalSha256, createS26R2LiveApproval(
    createClosedS26R2LiveMatrix(),
  ).approvalSha256);
  assert.equal(
    stop.stop.classification,
    'canonical-private-projection-rejected-fractional-cost',
  );
  assert.equal(stop.stop.providerResultReturned, true);
  assert.equal(stop.stop.qualificationAssertionReached, false);
  assert.equal(stop.stop.privateRunRetained, false);
  assert.equal(stop.callAccounting.claudeAttempted, true);
  assert.equal(stop.callAccounting.codexAttempted, false);
  assert.equal(stop.callAccounting.replayAllowed, false);
  assert.equal(consumed.approvals.length, 1);
  assert.equal(consumed.approvals[0].approvalSha256, stop.approvalSha256);
  assert.equal(consumed.approvals[0].completedSequence, false);
  assert.equal(consumed.approvals[0].codexAttempted, false);
  assert.equal(consumed.approvals[0].replayAllowed, false);
  assert.deepEqual(scanPrivateText(`${stopText}\n${consumedText}`), []);
});

test('Claude and Codex runtime scenario identities exactly equal their session identities', () => {
  const matrix = createClosedS26R2LiveMatrix();
  for (const call of matrix.goal.calls) {
    const binding = createS26R2ScenarioBinding(call);
    assert.equal(binding.matrixScenario, 'clean');
    assert.equal(binding.sessionId, `S26R2-${call.id}`);
    assert.equal(binding.runtimeScenario.id, binding.sessionId);
    assert.equal(binding.runtimeScenario.version, 'S26R2.v1');
  }
});

test('scenario/session mismatch and classification drift fail closed', () => {
  assert.throws(
    () => assertS26R2ScenarioBinding({
      matrixScenario: 'clean',
      sessionId: 'S26R2-claude-clean',
      runtimeScenario: { id: 'clean', version: 'S26R2.v1' },
    }),
    /exactly bind the SCOPA session identifier/,
  );
  assert.throws(
    () => assertS26R2ScenarioBinding({
      matrixScenario: 'cold-restart',
      sessionId: 'S26R2-claude-clean',
      runtimeScenario: {
        id: 'S26R2-claude-clean',
        version: 'S26R2.v1',
      },
    }),
    /matrix scenario must remain clean/,
  );
  assert.throws(
    () => assertS26R2ScenarioBinding({
      matrixScenario: 'clean',
      sessionId: 'S26R2-codex-clean',
      runtimeScenario: {
        id: 'S26R2-codex-clean',
        version: 'S26R1.v1',
      },
    }),
    /exactly bind the SCOPA session identifier/,
  );
  assert.throws(
    () => createS26R2ScenarioBinding({
      id: 'claude-cold-restart',
      provider: 'claude',
      scenario: 'clean',
    }),
    /cannot produce an exact scenario binding/,
  );
  assert.throws(
    () => createS26R2ScenarioBinding({
      id: 'claude-clean',
      provider: 'other',
      scenario: 'clean',
    }),
    /cannot produce an exact scenario binding/,
  );
});

test('retain-before-validate remains exact after scenario-binding remediation', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s26r2-test-'));
  try {
    const filename = path.join(temporary, 'success.private.json');
    const result = await retainThenValidateS26R2Run({
      provider: 'claude',
      run: passingClaudeRun(),
      filename,
      expectedScenarioId: 'S26R2-claude-clean',
    });
    assert.equal(result.run.terminal.state, 'succeeded');
    assert.match(result.retained.sha256, /^[0-9a-f]{64}$/);
    assert.equal((await stat(filename)).mode & 0o777, 0o600);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('transcript scenario mismatch is retained before it rejects', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s26r2-test-'));
  try {
    const filename = path.join(temporary, 'mismatch.private.json');
    const run = passingClaudeRun();
    run.normalized.final.scenario = 'clean';
    await assert.rejects(
      retainThenValidateS26R2Run({
        provider: 'claude',
        run,
        filename,
        expectedScenarioId: 'S26R2-claude-clean',
      }),
      /transcript scenario did not match the bound session/,
    );
    const retained = JSON.parse(await readFile(filename, 'utf8'));
    assert.equal(retained.normalized.final.scenario, 'clean');
    assert.equal((await stat(filename)).mode & 0o777, 0o600);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('prospective S26R2 authority is exact, ordered, and still grants no release', () => {
  const closed = createClosedS26R2LiveMatrix();
  const approval = createS26R2LiveApproval(closed);
  const authorized = assertS26R2StaticPreflight({
    matrix: closed,
    approval,
    candidateSha256: closed.goal.packageSha256,
    promptsSha256: closed.deterministicPrerequisites.promptsSha256,
    claudeVersion: '2.1.220 (Claude Code)',
    codexVersion: 'codex-cli 0.146.0',
    executionInstant: '2026-08-02T14:00:00Z',
  });
  assert.equal(authorized.constraints.totalProviderCallsAuthorized, 2);
  assert.deepEqual(approval.calls.map(({ id }) => id), [
    'claude-clean',
    'codex-clean',
  ]);
  assert.equal(approval.singleUse, true);
  assert.equal(approval.experimentUseAllowed, false);
  assert.equal(approval.publicationAllowed, false);
  assert.equal(approval.releaseAllowed, false);
});
