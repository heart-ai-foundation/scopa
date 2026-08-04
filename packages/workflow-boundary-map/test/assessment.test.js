import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  canonicalJson,
  createSliceLock,
} from '../../enforcement/src/index.js';
import {
  compareWorkflowBoundaryMaps,
  createBoundaryAssessmentPacket,
  createWorkflowBoundaryMap,
  validateBoundaryAssessmentPacket,
  verifyBoundaryAssessmentPacket,
} from '../src/index.js';

const baseMatrix = JSON.parse(await readFile(
  new URL('../../../fixtures/S10/capability-matrix.json', import.meta.url),
  'utf8',
));
const packetSchema = JSON.parse(await readFile(
  new URL('../../../schemas/scopa.boundary-assessment-packet.v1.schema.json', import.meta.url),
  'utf8',
));
const validatePacketSchema = new Ajv2020({ strict: true }).compile(packetSchema);
const declarations = [
  { id: 'browser', status: 'disabled' },
  { id: 'credentials', status: 'authority-required' },
  { id: 'deployment', status: 'authority-required' },
  { id: 'external-systems', status: 'authority-required' },
  { id: 'provider', status: 'authority-required' },
  { id: 'publication', status: 'authority-required' },
];

function map({ expanded = false, uncontrolled = false } = {}) {
  const lock = createSliceLock({
    schema: 'scopa.slice-definition.v1',
    sliceId: 'SECRET_CUSTOMER_WORKFLOW',
    allowedPaths: expanded ? ['private-client/**', 'secret-ops/**'] : ['private-client/**'],
    amendmentPath: '.scopa/amendment.json',
    gates: [{ id: 'secret-gate', command: ['node', '-e', 'process.exit(0)'], cwd: '.', timeoutMs: 30000 }],
    nonGoals: ['SECRET_NON_GOAL_TEXT'],
    stopCondition: { kind: 'all-gates-pass' },
  });
  const matrix = structuredClone(baseMatrix);
  if (uncontrolled) {
    const capability = matrix.capabilities.find((item) => item.id === 'native.filesystem-write');
    capability.exposure = 'native';
    capability.mediation = 'uncontrolled';
    capability.effect = 'MUTATE';
    capability.evidence = 'SECRET_CAPABILITY_EVIDENCE';
    matrix.assurance = 'partial';
  }
  const stopState = {
    schema: 'scopa.stop-state.v1', sliceId: lock.definition.sliceId,
    lockHash: lock.definitionHash, condition: 'all-gates-pass', status: 'satisfied',
    canStop: true, failedGates: [],
    gates: [{
      schema: 'scopa.gate-result.v1', id: 'secret-gate', command: ['node'],
      passed: true, exitCode: 0, stdout: 'SECRET_GATE_OUTPUT', stderr: '',
      timedOut: false, durationMs: 1, stdoutBytes: 18, stderrBytes: 0,
      stdoutTruncated: false, stderrTruncated: false,
    }],
  };
  return createWorkflowBoundaryMap({
    lock, stopState, capabilityMatrix: matrix, authorityDeclarations: declarations,
  });
}

test('semantic comparison detects scope expansion and uncontrolled regression', () => {
  const difference = compareWorkflowBoundaryMaps(
    map(),
    map({ expanded: true, uncontrolled: true }),
  );
  assert.equal(difference.summary.regressions, 2);
  assert.ok(difference.changes.some((item) => item.kind === 'scope-path-added'));
  assert.ok(difference.changes.some((item) =>
    item.kind === 'surface-status-changed' &&
    item.before === 'disabled' && item.after === 'uncontrolled'));
});

test('portable packet is deterministic and excludes raw workflow content', () => {
  const baseline = map();
  const current = map({ expanded: true, uncontrolled: true });
  const first = createBoundaryAssessmentPacket({ currentMap: current, baselineMap: baseline });
  const second = createBoundaryAssessmentPacket({
    currentMap: structuredClone(current), baselineMap: structuredClone(baseline),
  });
  assert.equal(canonicalJson(first), canonicalJson(second));
  assert.equal(first.posture.status, 'review-required');
  assert.equal(validatePacketSchema(first), true, JSON.stringify(validatePacketSchema.errors));
  assert.deepEqual(first.posture.reasons, [
    'uncontrolled-surfaces',
    'baseline-regressions',
  ]);
  const bytes = canonicalJson(first);
  for (const secret of [
    'SECRET_CUSTOMER_WORKFLOW', 'private-client', 'secret-ops',
    'SECRET_NON_GOAL_TEXT', 'secret-gate', 'SECRET_GATE_OUTPUT',
    'SECRET_CAPABILITY_EVIDENCE',
  ]) {
    assert.doesNotMatch(bytes, new RegExp(secret));
  }
  assert.equal(
    verifyBoundaryAssessmentPacket(first, { currentMap: current, baselineMap: baseline }).ok,
    true,
  );
});

test('packet validation and expected-map verification fail closed on tampering', () => {
  const current = map({ uncontrolled: true });
  const packet = createBoundaryAssessmentPacket({ currentMap: current });
  for (const mutation of [
    (value) => { value.extra = true; },
    (value) => { value.comparison.regressions = 5; },
    (value) => { value.posture.status = 'bounded'; },
    (value) => { value.metrics.surfaces.unknown = 1; },
    (value) => { value.comparison.changes.push({
      kind: 'invented', category: 'network', idSha256: '0'.repeat(64),
      before: null, after: 'uncontrolled', polarity: 'regression',
    }); },
  ]) {
    const candidate = structuredClone(packet);
    mutation(candidate);
    assert.throws(() => validateBoundaryAssessmentPacket(candidate));
  }
  const changed = map({ expanded: true, uncontrolled: true });
  assert.throws(
    () => verifyBoundaryAssessmentPacket(packet, { currentMap: changed }),
    /does not match/,
  );
});
