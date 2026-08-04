import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createSliceLock } from '../../enforcement/src/index.js';
import {
  createWorkflowBoundaryMap,
  validateWorkflowBoundaryMap,
} from '../src/index.js';

function unknownMap() {
  const lock = createSliceLock({
    schema: 'scopa.slice-definition.v1', sliceId: 'adversarial',
    allowedPaths: ['src/**'], amendmentPath: '.scopa/amendment.json',
    gates: [{ id: 'test', command: ['node'], cwd: '.', timeoutMs: 30000 }],
    nonGoals: [], stopCondition: { kind: 'all-gates-pass' },
  });
  return createWorkflowBoundaryMap({
    lock,
    stopState: {
      schema: 'scopa.stop-state.v1', sliceId: 'adversarial',
      lockHash: lock.definitionHash, condition: 'all-gates-pass', status: 'satisfied',
      canStop: true, failedGates: [], gates: [{
        schema: 'scopa.gate-result.v1', id: 'test', command: ['node'],
        passed: true, exitCode: 0, stdout: '', stderr: '', timedOut: false,
        durationMs: 1, stdoutBytes: 0, stderrBytes: 0,
        stdoutTruncated: false, stderrTruncated: false,
      }],
    },
  });
}

test('missing evidence cannot be relabeled controlled for a false green', () => {
  const original = unknownMap();
  for (const id of [
    'capability.native.filesystem-write',
    'authority.credentials',
  ]) {
    const forged = structuredClone(original);
    const surface = forged.surfaces.find((item) => item.id === id);
    surface.status = 'controlled';
    surface.control = 'invented-control';
    forged.summary.unknown -= 1;
    forged.summary.controlled += 1;
    assert.throws(
      () => validateWorkflowBoundaryMap(forged),
      /missing evidence cannot claim/,
    );
  }
});

test('authority declarations cannot forge runtime mediation', () => {
  const forged = structuredClone(unknownMap());
  const surface = forged.surfaces.find((item) => item.id === 'authority.deployment');
  surface.source = 'authority-declaration';
  surface.status = 'controlled';
  surface.control = 'scopa-dispatcher';
  forged.bindings.authorityDeclarationsSha256 = '0'.repeat(64);
  forged.summary.unknown -= 1;
  forged.summary.controlled += 1;
  assert.throws(
    () => validateWorkflowBoundaryMap(forged),
    /authority declaration surface is inconsistent/,
  );
});

test('public journey leads with one file and discloses assurance limits', async () => {
  const root = new URL('../../../', import.meta.url);
  const [readme, quickstart, agent] = await Promise.all([
    readFile(new URL('README.md', root), 'utf8'),
    readFile(new URL('docs/QUICKSTART.md', root), 'utf8'),
    readFile(new URL('SCOPA_AGENT.md', root), 'utf8'),
  ]);
  assert.ok(readme.indexOf('## Start with one prompt') < readme.indexOf('## Manual setup'));
  assert.match(quickstart, /two things:[\s\S]*SCOPA_AGENT\.md[\s\S]*task you want completed/);
  assert.match(quickstart, /partial assurance/);
  assert.ok(agent.indexOf('scopa map') < agent.indexOf('### 4. Work'));
  assert.match(agent, /Simplicity must not become a false security claim/);
});
