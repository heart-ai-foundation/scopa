import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { scanPrivateText } from '../../release-readiness/src/package-privacy.js';
import {
  S26R1_PROVIDER_GATE_CLOSED,
  createClosedS26R1LiveMatrix,
  createS26R1LiveApproval,
  validateS26R1LiveMatrix,
} from '../../../fixtures/S26R1/s26r1-requalification-policy.mjs';
import {
  assertS26R1StaticPreflight,
  retainThenValidateS26R1Run,
} from '../../../fixtures/S26R1/s26r1-production-live-cli.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const MATRIX = path.join(
  ROOT,
  'evidence/S26R1/closed-production-live-matrix.json',
);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function failedRun() {
  return {
    receipt: { schema: 'fixture.receipt.v1' },
    terminal: {
      state: 'provider-refused',
      canStop: false,
      cleanup: { groupGone: true, orphanDetected: false },
    },
    normalized: null,
    privateCapture: { stdout: 'fixture failure\n', stderr: '' },
  };
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
      final: { canStop: true },
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

test('S26R1 matrix is closed and binds the stopped S26 evidence and new runner', async () => {
  const text = await readFile(MATRIX, 'utf8');
  const matrix = JSON.parse(text);
  assert.deepEqual(matrix, createClosedS26R1LiveMatrix());
  assert.equal(validateS26R1LiveMatrix(matrix), matrix);
  assert.equal(matrix.authorization.providerGate, S26R1_PROVIDER_GATE_CLOSED);
  assert.equal(matrix.constraints.providerTrafficAllowed, false);
  assert.equal(matrix.constraints.totalProviderCallsAuthorized, 0);
  const files = {
    promptsSha256: 'fixtures/S26R1/prompts.json',
    productionLiveRunnerSha256:
      'fixtures/S26R1/s26r1-production-live-cli.mjs',
    s26StopFileSha256: 'evidence/S26/stop.json',
    s26ConsumedApprovalsFileSha256: 'evidence/S26/consumed-approvals.json',
    supersededRunnerSha256: 'fixtures/S26/s26-production-live-cli.mjs',
  };
  for (const [field, relative] of Object.entries(files)) {
    assert.equal(
      sha256(await readFile(path.join(ROOT, relative))),
      matrix.deterministicPrerequisites[field],
    );
  }
  assert.deepEqual(matrix.deterministicPrerequisites.retentionContracts, [
    'returned-success-retained-before-validation',
    'returned-failure-retained-before-validation',
    'retention-failure-stops-before-qualification-assertion',
  ]);
});

test('S26R1 remediation approval grants deterministic work but zero calls', async () => {
  const text = await readFile(
    path.join(ROOT, 'evidence/S26R1/macro-delta-approval.json'),
    'utf8',
  );
  const approval = JSON.parse(text);
  assert.equal(approval.providerCallsAuthorized, 0);
  assert.equal(approval.historicalS26ApprovalConsumed, true);
  assert.equal(
    approval.closedS26R1MatrixSha256,
    createClosedS26R1LiveMatrix().matrixSha256,
  );
  assert.equal(approval.experimentUseAllowed, false);
  assert.equal(approval.publicationAllowed, false);
  assert.equal(approval.releaseAllowed, false);
  assert.equal(
    sha256(await readFile(path.join(ROOT, approval.macroDeltaPath))),
    approval.macroDeltaFileSha256,
  );
  assert.equal(
    sha256(await readFile(path.join(ROOT, approval.protocolPath))),
    approval.protocolFileSha256,
  );
  assert.deepEqual(scanPrivateText(text), []);
});

test('a rejected returned run is retained before the qualification error', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s26r1-test-'));
  try {
    const filename = path.join(temporary, 'failure.private.json');
    await assert.rejects(
      retainThenValidateS26R1Run({
        provider: 'claude',
        run: failedRun(),
        filename,
      }),
      /did not reach normalized success/,
    );
    const retained = JSON.parse(await readFile(filename, 'utf8'));
    assert.equal(retained.terminal.state, 'provider-refused');
    assert.equal(retained.normalized, null);
    assert.equal(retained.privateCapture.stdout, 'fixture failure\n');
    assert.equal((await stat(filename)).mode & 0o777, 0o600);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('retention collision stops before qualification and never overwrites evidence', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s26r1-test-'));
  try {
    const filename = path.join(temporary, 'collision.private.json');
    await writeFile(filename, 'sentinel\n', { mode: 0o600 });
    await assert.rejects(
      retainThenValidateS26R1Run({
        provider: 'claude',
        run: passingClaudeRun(),
        filename,
      }),
      (error) => error?.code === 'EEXIST',
    );
    assert.equal(await readFile(filename, 'utf8'), 'sentinel\n');
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('retained qualifying run passes and exact prospective authority stays bounded', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s26r1-test-'));
  try {
    const filename = path.join(temporary, 'success.private.json');
    const result = await retainThenValidateS26R1Run({
      provider: 'claude',
      run: passingClaudeRun(),
      filename,
    });
    assert.equal(result.run.terminal.state, 'succeeded');
    assert.match(result.retained.sha256, /^[0-9a-f]{64}$/);
    const closed = createClosedS26R1LiveMatrix();
    const approval = createS26R1LiveApproval(closed);
    const authorized = assertS26R1StaticPreflight({
      matrix: closed,
      approval,
      candidateSha256: closed.goal.packageSha256,
      promptsSha256: closed.deterministicPrerequisites.promptsSha256,
      claudeVersion: '2.1.220 (Claude Code)',
      codexVersion: 'codex-cli 0.146.0',
      executionInstant: '2026-08-02T12:00:00Z',
    });
    assert.equal(authorized.constraints.totalProviderCallsAuthorized, 2);
    assert.equal(approval.releaseAllowed, false);
    assert.equal(approval.experimentUseAllowed, false);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
