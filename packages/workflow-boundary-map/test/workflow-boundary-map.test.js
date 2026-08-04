import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  canonicalJson,
  createSliceLock,
} from '../../enforcement/src/index.js';
import {
  createWorkflowBoundaryMap,
  validateWorkflowBoundaryMap,
} from '../src/index.js';

const schema = JSON.parse(await readFile(
  new URL('../../../schemas/scopa.workflow-boundary-map.v1.schema.json', import.meta.url),
  'utf8',
));
const matrix = JSON.parse(await readFile(
  new URL('../../../fixtures/S10/capability-matrix.json', import.meta.url),
  'utf8',
));
const validateSchema = new Ajv2020({ strict: true }).compile(schema);

function inputs({ capabilityMatrix = matrix, declarations = [] } = {}) {
  const lock = createSliceLock({
    schema: 'scopa.slice-definition.v1',
    sliceId: 'map-contract',
    allowedPaths: ['src/**', 'test/**'],
    amendmentPath: '.scopa/amendment.json',
    gates: [{
      id: 'tests',
      command: ['npm', 'test'],
      cwd: '.',
      timeoutMs: 120000,
    }],
    nonGoals: ['No deployment'],
    stopCondition: { kind: 'all-gates-pass' },
  });
  return {
    lock,
    capabilityMatrix,
    authorityDeclarations: declarations,
    stopState: {
      schema: 'scopa.stop-state.v1',
      sliceId: 'map-contract',
      lockHash: lock.definitionHash,
      condition: 'all-gates-pass',
      status: 'satisfied',
      canStop: true,
      failedGates: [],
      gates: [{
        schema: 'scopa.gate-result.v1',
        id: 'tests',
        command: ['npm', 'test'],
        passed: true,
        exitCode: 0,
        stdout: 'private output is hash-bound but not projected',
        stderr: '',
        timedOut: false,
        durationMs: 10,
        stdoutBytes: 46,
        stderrBytes: 0,
        stdoutTruncated: false,
        stderrTruncated: false,
      }],
    },
  };
}

const allDeclared = [
  { id: 'browser', status: 'disabled' },
  { id: 'credentials', status: 'authority-required' },
  { id: 'deployment', status: 'authority-required' },
  { id: 'external-systems', status: 'authority-required' },
  { id: 'provider', status: 'authority-required' },
  { id: 'publication', status: 'authority-required' },
];

test('pure projection is canonical, closed, schema-valid, and omits raw output', () => {
  const source = inputs({ declarations: allDeclared });
  const snapshot = structuredClone(source);
  const first = createWorkflowBoundaryMap(source);
  const second = createWorkflowBoundaryMap(structuredClone(source));
  assert.equal(canonicalJson(first), canonicalJson(second));
  assert.deepEqual(source, snapshot);
  assert.equal(validateSchema(first), true, JSON.stringify(validateSchema.errors));
  assert.equal(first.assurance.level, 'full');
  assert.equal(first.completion.canStop, true);
  assert.doesNotMatch(canonicalJson(first), /private output/);
  assert.ok(Object.isFrozen(first));
});

test('missing capability and authority evidence remains unknown', () => {
  const map = createWorkflowBoundaryMap(inputs({
    capabilityMatrix: null,
    declarations: [],
  }));
  assert.equal(map.assurance.level, 'unknown');
  assert.equal(map.assurance.basis, 'incomplete-capability-evidence');
  assert.equal(map.summary.unknown, 11);
  assert.ok(map.surfaces
    .filter((surface) => surface.status === 'unknown')
    .every((surface) => surface.source === 'missing-evidence'));
});

test('an active native bypass yields partial assurance when the surface is complete', () => {
  const uncontrolled = structuredClone(matrix);
  const write = uncontrolled.capabilities.find(
    (capability) => capability.id === 'native.filesystem-write',
  );
  write.exposure = 'native';
  write.mediation = 'uncontrolled';
  write.effect = 'MUTATE';
  uncontrolled.assurance = 'partial';
  const map = createWorkflowBoundaryMap(inputs({
    capabilityMatrix: uncontrolled,
    declarations: allDeclared,
  }));
  assert.equal(map.assurance.level, 'partial');
  assert.equal(map.assurance.basis, 'active-uncontrolled-route');
  assert.equal(map.summary.uncontrolled, 1);
});

test('runtime validator rejects false-green and structural drift', () => {
  const original = createWorkflowBoundaryMap(inputs({ declarations: allDeclared }));
  for (const mutate of [
    (value) => { value.extra = true; },
    (value) => { value.summary.unknown = 99; },
    (value) => { value.assurance.level = 'partial'; },
    (value) => { value.surfaces[0].control = 'invented-control'; },
    (value) => { value.surfaces.reverse(); },
    (value) => { value.surfaces = value.surfaces.filter((surface) => surface.id !== 'authority.provider'); },
    (value) => { value.completion.failedGates = ['tests']; },
  ]) {
    const candidate = structuredClone(original);
    mutate(candidate);
    assert.throws(() => validateWorkflowBoundaryMap(candidate));
  }
});

test('authority declarations cannot claim a controlled surface', () => {
  assert.throws(() => createWorkflowBoundaryMap(inputs({
    declarations: [{ id: 'deployment', status: 'controlled' }],
  })), /status is unsupported/);
});
