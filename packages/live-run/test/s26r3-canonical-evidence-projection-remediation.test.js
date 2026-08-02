import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { scanPrivateText } from '../../release-readiness/src/package-privacy.js';
import { normalizedEvidenceProjection } from '../../integrations/claude/src/production-live-probe.js';
import {
  S26R3_PROVIDER_GATE_CLOSED,
  createClosedS26R3LiveMatrix,
  createS26R3LiveApproval,
  validateS26R3LiveMatrix,
} from '../../../fixtures/S26R3/s26r3-requalification-policy.mjs';
import {
  assertS26R3ClaudeEvidenceProjection,
  assertS26R3ScenarioBinding,
  assertS26R3StaticPreflight,
  createS26R3ScenarioBinding,
  retainThenValidateS26R3Run,
} from '../../../fixtures/S26R3/s26r3-production-live-cli.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const MATRIX = path.join(
  ROOT,
  'evidence/S26R3/closed-production-live-matrix.json',
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
      final: { canStop: true, scenario: 'S26R3-claude-clean' },
      result: { costUsd: 0.0533924, turns: 1 },
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

test('S26R3 matrix is closed and binds the S26R2 stop and replacement runner', async () => {
  const text = await readFile(MATRIX, 'utf8');
  const matrix = JSON.parse(text);
  assert.deepEqual(matrix, createClosedS26R3LiveMatrix());
  assert.equal(validateS26R3LiveMatrix(matrix), matrix);
  assert.equal(matrix.authorization.providerGate, S26R3_PROVIDER_GATE_CLOSED);
  assert.equal(matrix.constraints.providerTrafficAllowed, false);
  assert.equal(matrix.constraints.totalProviderCallsAuthorized, 0);
  const files = {
    promptsSha256: 'fixtures/S26R3/prompts.json',
    productionLiveRunnerSha256:
      'fixtures/S26R3/s26r3-production-live-cli.mjs',
    s26r2StopFileSha256: 'evidence/S26R2/stop.json',
    s26r2ConsumedApprovalsFileSha256:
      'evidence/S26R2/consumed-approvals.json',
    supersededRunnerSha256:
      'fixtures/S26R2/s26r2-production-live-cli.mjs',
  };
  for (const [field, relative] of Object.entries(files)) {
    assert.equal(
      sha256(await readFile(path.join(ROOT, relative))),
      matrix.deterministicPrerequisites[field],
    );
  }
  assert.deepEqual(scanPrivateText(text), []);
});

test('S26R3 Macro Delta approval grants deterministic work and zero calls', async () => {
  const text = await readFile(
    path.join(ROOT, 'evidence/S26R3/macro-delta-approval.json'),
    'utf8',
  );
  const approval = JSON.parse(text);
  assert.equal(approval.providerCallsAuthorized, 0);
  assert.equal(approval.historicalS26R2ApprovalConsumed, true);
  assert.equal(
    approval.closedS26R3MatrixSha256,
    createClosedS26R3LiveMatrix().matrixSha256,
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

test('installed Claude evidence projection canonicalizes bounded decimals and rejects malformed costs', () => {
  assert.equal(
    assertS26R3ClaudeEvidenceProjection(normalizedEvidenceProjection),
    normalizedEvidenceProjection,
  );
  for (const [value, expected] of [
    [0, '0'],
    [0.0533924, '0.0533924'],
    [0.2, '0.2'],
  ]) {
    assert.equal(
      normalizedEvidenceProjection({ result: { costUsd: value } })
        .result.costUsd,
      expected,
    );
  }
  assert.throws(
    () => assertS26R3ClaudeEvidenceProjection((value) => value),
    /cost projection drifted/,
  );
  assert.throws(
    () => assertS26R3ClaudeEvidenceProjection((value) => ({
      ...value,
      result: {
        ...value.result,
        costUsd: String(value.result.costUsd),
      },
    })),
    /malformed Claude cost was accepted/,
  );
});

test('Claude and Codex runtime scenario identities exactly equal their session identities', () => {
  const matrix = createClosedS26R3LiveMatrix();
  for (const call of matrix.goal.calls) {
    const binding = createS26R3ScenarioBinding(call);
    assert.equal(binding.matrixScenario, 'clean');
    assert.equal(binding.sessionId, `S26R3-${call.id}`);
    assert.equal(binding.runtimeScenario.id, binding.sessionId);
    assert.equal(binding.runtimeScenario.version, 'S26R3.v1');
  }
});

test('scenario/session mismatch and classification drift fail closed', () => {
  assert.throws(
    () => assertS26R3ScenarioBinding({
      matrixScenario: 'clean',
      sessionId: 'S26R3-claude-clean',
      runtimeScenario: { id: 'clean', version: 'S26R3.v1' },
    }),
    /exactly bind the SCOPA session identifier/,
  );
  assert.throws(
    () => assertS26R3ScenarioBinding({
      matrixScenario: 'cold-restart',
      sessionId: 'S26R3-claude-clean',
      runtimeScenario: {
        id: 'S26R3-claude-clean',
        version: 'S26R3.v1',
      },
    }),
    /matrix scenario must remain clean/,
  );
  assert.throws(
    () => assertS26R3ScenarioBinding({
      matrixScenario: 'clean',
      sessionId: 'S26R3-codex-clean',
      runtimeScenario: {
        id: 'S26R3-codex-clean',
        version: 'S26R1.v1',
      },
    }),
    /exactly bind the SCOPA session identifier/,
  );
  assert.throws(
    () => createS26R3ScenarioBinding({
      id: 'claude-cold-restart',
      provider: 'claude',
      scenario: 'clean',
    }),
    /cannot produce an exact scenario binding/,
  );
  assert.throws(
    () => createS26R3ScenarioBinding({
      id: 'claude-clean',
      provider: 'other',
      scenario: 'clean',
    }),
    /cannot produce an exact scenario binding/,
  );
});

test('retain-before-validate remains exact after scenario-binding remediation', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s26r3-test-'));
  try {
    const filename = path.join(temporary, 'success.private.json');
    const result = await retainThenValidateS26R3Run({
      provider: 'claude',
      run: passingClaudeRun(),
      filename,
      expectedScenarioId: 'S26R3-claude-clean',
      projectClaudeEvidence: normalizedEvidenceProjection,
    });
    assert.equal(result.run.terminal.state, 'succeeded');
    const retained = JSON.parse(await readFile(filename, 'utf8'));
    assert.equal(retained.normalized.result.costUsd, '0.0533924');
    assert.match(result.retained.sha256, /^[0-9a-f]{64}$/);
    assert.equal((await stat(filename)).mode & 0o777, 0o600);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('transcript scenario mismatch is retained before it rejects', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s26r3-test-'));
  try {
    const filename = path.join(temporary, 'mismatch.private.json');
    const run = passingClaudeRun();
    run.normalized.final.scenario = 'clean';
    await assert.rejects(
      retainThenValidateS26R3Run({
        provider: 'claude',
        run,
        filename,
        expectedScenarioId: 'S26R3-claude-clean',
        projectClaudeEvidence: normalizedEvidenceProjection,
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

test('projected fractional evidence remains collision-safe and never overwrites', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s26r3-test-'));
  try {
    const filename = path.join(temporary, 'collision.private.json');
    await writeFile(filename, 'sentinel\n', { mode: 0o600 });
    await assert.rejects(
      retainThenValidateS26R3Run({
        provider: 'claude',
        run: passingClaudeRun(),
        filename,
        expectedScenarioId: 'S26R3-claude-clean',
        projectClaudeEvidence: normalizedEvidenceProjection,
      }),
      (error) => error?.code === 'EEXIST',
    );
    assert.equal(await readFile(filename, 'utf8'), 'sentinel\n');
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('prospective S26R3 authority is exact, ordered, and still grants no release', () => {
  const closed = createClosedS26R3LiveMatrix();
  const approval = createS26R3LiveApproval(closed);
  const authorized = assertS26R3StaticPreflight({
    matrix: closed,
    approval,
    candidateSha256: closed.goal.packageSha256,
    promptsSha256: closed.deterministicPrerequisites.promptsSha256,
    claudeVersion: '2.1.220 (Claude Code)',
    codexVersion: 'codex-cli 0.146.0',
    executionInstant: '2026-08-02T15:00:00Z',
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
