import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createSliceLock } from '../../enforcement/src/index.js';
import { createWorkflowBoundaryMap } from '../../workflow-boundary-map/src/index.js';
import { executeCommand } from '../src/command.js';

function unknownMap() {
  const lock = createSliceLock({
    schema: 'scopa.slice-definition.v1', sliceId: 'assessment-cli',
    allowedPaths: ['src/**'], amendmentPath: '.scopa/amendment.json',
    gates: [{ id: 'test', command: ['node'], cwd: '.', timeoutMs: 30000 }],
    nonGoals: [], stopCondition: { kind: 'all-gates-pass' },
  });
  return createWorkflowBoundaryMap({
    lock,
    stopState: {
      schema: 'scopa.stop-state.v1', sliceId: 'assessment-cli',
      lockHash: lock.definitionHash, condition: 'all-gates-pass', status: 'satisfied',
      canStop: true, failedGates: [], gates: [{
        schema: 'scopa.gate-result.v1', id: 'test', command: ['node'], passed: true,
        exitCode: 0, stdout: '', stderr: '', timedOut: false, durationMs: 1,
        stdoutBytes: 0, stderrBytes: 0, stdoutTruncated: false, stderrTruncated: false,
      }],
    },
  });
}

test('assess emits one closed offline packet and accepts an optional baseline', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-assess-cli-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.git'));
  const map = unknownMap();
  await writeFile(path.join(root, 'current.json'), `${JSON.stringify(map)}\n`);
  await writeFile(path.join(root, 'baseline.json'), `${JSON.stringify(map)}\n`);
  const result = await executeCommand([
    'assess', '--repo', root, '--map', 'current.json', '--baseline', 'baseline.json',
  ]);
  assert.equal(result.exitCode, 0);
  assert.equal(result.envelope.result.schema, 'scopa.boundary-assessment-packet.v1');
  assert.equal(result.envelope.result.posture.status, 'review-required');
  assert.equal(result.envelope.result.comparison.total, 0);
  const source = await readFile(
    new URL('../../workflow-boundary-map/src/assessment.js', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /node:https|node:http|\bfetch\s*\(/);
});

test('assess rejects unreadable or malformed maps', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-assess-cli-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'bad.json'), '{}\n');
  await assert.rejects(() => executeCommand([
    'assess', '--repo', root, '--map', 'bad.json',
  ]));
  await assert.rejects(() => executeCommand([
    'assess', '--repo', root, '--map', 'missing.json',
  ]));
});
