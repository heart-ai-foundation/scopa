import assert from 'node:assert/strict';
import { access, mkdir, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { mkdtemp } from 'node:fs/promises';
import {
  BEGIN_CLIENT_PROFILES,
  BeginRequestError,
  beginSlice,
  createBeginState,
  loadBeginState,
  validateBeginRequest,
} from '../src/index.js';

function request(overrides = {}) {
  return {
    schema: 'scopa.begin-request.v1',
    sliceId: 'S38-test',
    outcome: 'Return one bounded implementation with truthful gate results',
    allowedPaths: ['workspace/**'],
    gates: [{
      id: 'acceptance',
      command: ['/usr/bin/true'],
      cwd: '.',
      timeoutMs: 5_000,
    }],
    nonGoals: ['No network or publication'],
    clientProfile: 'generic',
    ...overrides,
  };
}

async function repository() {
  return mkdtemp(path.join(os.tmpdir(), 'scopa-s38-'));
}

async function noScopaState(root) {
  await assert.rejects(access(path.join(root, '.scopa')));
}

test('begin owns closed declarations, initializes exactly three control files, and returns the real map', async () => {
  const root = await repository();
  const result = await beginSlice({ repoRoot: root, request: request() });
  assert.equal(result.schema, 'scopa.begin-result.v1');
  assert.equal(result.status, 'satisfied');
  assert.equal(result.boundaryMap.completion.canStop, true);
  assert.equal(result.boundaryMap.assurance.level, 'partial');
  assert.equal(result.boundaryMap.summary.unknown, 0);
  assert.equal(result.boundaryMap.summary.authorityRequired, 6);
  assert.equal(result.boundaryMap.summary.uncontrolled >= 4, true);
  assert.deepEqual(
    await readdir(path.join(root, '.scopa')),
    ['begin-state.json', 'config.json', 'slice-lock.json'],
  );
  const state = await loadBeginState(root);
  assert.equal(state.request.outcome, request().outcome);
  assert.equal(state.capabilityMatrix.assurance, 'partial');
  assert.equal(
    state.authorityDeclarations.declarations.every(
      (declaration) => declaration.status === 'authority-required',
    ),
    true,
  );
});

test('blocked gates remain blocked and never become an initialization success claim', async () => {
  const root = await repository();
  const result = await beginSlice({
    repoRoot: root,
    request: request({
      gates: [{
        id: 'acceptance',
        command: ['/usr/bin/false'],
        cwd: '.',
        timeoutMs: 5_000,
      }],
    }),
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.boundaryMap.completion.canStop, false);
  assert.deepEqual(result.boundaryMap.completion.failedGates, ['acceptance']);
});

test('malformed and shell-shaped requests fail before repository mutation', async () => {
  const mutations = [
    (value) => { delete value.outcome; },
    (value) => { value.allowedPaths = ['../escape/**']; },
    (value) => { value.gates[0].cwd = '../outside'; },
    (value) => { value.gates[0].command = ['npm test']; },
    (value) => { value.gates[0].command = ['/bin/sh', '-c', 'true']; },
    (value) => { value.gates[0].command = ['npm', 'test', '&&', 'publish']; },
    (value) => { value.clientProfile = 'best-effort'; },
    (value) => { value.gates[0].timeoutMs = 0; },
  ];
  for (const mutate of mutations) {
    const root = await repository();
    const candidate = request();
    mutate(candidate);
    await assert.rejects(
      beginSlice({ repoRoot: root, request: candidate }),
      (error) => error instanceof BeginRequestError ||
        error.code === 'SCOPA_SLICE_LOCK_INVALID',
    );
    await noScopaState(root);
  }
});

test('all named profiles are explicit and conservatively partial', () => {
  for (const clientProfile of BEGIN_CLIENT_PROFILES) {
    const state = createBeginState(request({ clientProfile }));
    assert.equal(state.capabilityMatrix.assurance, 'partial');
    assert.equal(
      state.capabilityMatrix.capabilities
        .filter((capability) => capability.id.startsWith('native.'))
        .every((capability) => capability.mediation === 'uncontrolled'),
      true,
    );
  }
  assert.throws(
    () => validateBeginRequest(request({ clientProfile: 'unknown' })),
    BeginRequestError,
  );
});

test('conflicting begin state is refused before lock or config creation', async () => {
  const root = await repository();
  await mkdir(path.join(root, '.scopa'));
  await writeFile(path.join(root, '.scopa', 'begin-state.json'), '{}\n');
  await assert.rejects(
    beginSlice({ repoRoot: root, request: request() }),
    (error) => error.code === 'SCOPA_INIT_CONFLICT',
  );
  assert.deepEqual(await readdir(path.join(root, '.scopa')), ['begin-state.json']);
});
