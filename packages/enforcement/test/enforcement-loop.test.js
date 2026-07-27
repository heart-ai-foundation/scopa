import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  access,
  link,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import {
  CompletionDeniedError,
  PathBoundary,
  ScopeDeniedError,
  assertCompletion,
  createEnforcedToolDispatcher,
  createSliceLock,
  evaluateStopCondition,
  loadRotationState,
  saveRotationState,
  verifySliceLock,
} from '../src/index.js';
import {
  denialPayload,
  createReferenceAgentHost,
  orientation,
} from '../../agent-surface/src/index.js';

const execFileAsync = promisify(execFile);

function definition({
  command = [process.execPath, '-e', 'process.exit(0)'],
} = {}) {
  return {
    schema: 'scopa.slice-definition.v1',
    sliceId: 'S2-enforcement-loop',
    allowedPaths: ['packages/enforcement/**', 'notes/S2/**'],
    amendmentPath: 'next-prompt-protocols/macro-deltas/amendment.md',
    gates: [
      {
        id: 'release',
        command,
        cwd: '.',
        timeoutMs: 5_000,
      },
    ],
    nonGoals: ['No publication'],
    stopCondition: { kind: 'all-gates-pass' },
  };
}

async function fixture(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-enforcement-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'packages/enforcement'), { recursive: true });
  await mkdir(path.join(root, 'packages/outside'), { recursive: true });
  return root;
}

function writeDispatcher(boundary, counter) {
  return createEnforcedToolDispatcher({
    boundary,
    tools: {
      write_file: {
        effect: 'MUTATE',
        pathArguments: ['path'],
        async execute({ path: target, content }) {
          counter.count += 1;
          await writeFile(target, content);
          return { ok: true };
        },
      },
    },
  });
}

test('pre-tool dispatcher blocks an out-of-scope write before execution', async (context) => {
  const root = await fixture(context);
  const lock = createSliceLock(definition());
  const boundary = new PathBoundary({ repoRoot: root, lock });
  const counter = { count: 0 };
  const dispatch = writeDispatcher(boundary, counter);
  const deniedPath = path.join(root, 'packages/outside/blocked.txt');

  await assert.rejects(
    () =>
      dispatch({
        name: 'write_file',
        arguments: { path: deniedPath, content: 'must not exist' },
      }),
    (error) => {
      assert.equal(error instanceof ScopeDeniedError, true);
      assert.deepEqual(denialPayload(error), {
        schema: 'scopa.scope-denial.v1',
        boundary: 'scope',
        requestedPath: 'packages/outside/blocked.txt',
        allowedPaths: ['packages/enforcement/**', 'notes/S2/**'],
        amendmentPath: 'next-prompt-protocols/macro-deltas/amendment.md',
        reason: 'target is outside the active slice',
      });
      return true;
    },
  );
  assert.equal(counter.count, 0);
  await assert.rejects(() => access(deniedPath), { code: 'ENOENT' });

  const allowedPath = path.join(root, 'packages/enforcement/allowed.txt');
  await dispatch({
    name: 'write_file',
    arguments: { path: allowedPath, content: 'written' },
  });
  assert.equal(counter.count, 1);
  assert.equal(await readFile(allowedPath, 'utf8'), 'written');
});

test('path boundary rejects repository escape through a symlink', async (context) => {
  const root = await fixture(context);
  const outside = await mkdtemp(path.join(os.tmpdir(), 'scopa-escape-'));
  context.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, path.join(root, 'packages/enforcement/link'));
  const boundary = new PathBoundary({ repoRoot: root, lock: createSliceLock(definition()) });
  await assert.rejects(
    () => boundary.authorize('packages/enforcement/link/escape.txt'),
    (error) =>
      error instanceof ScopeDeniedError &&
      error.details.reason === 'target resolves outside repository',
  );
});

test('authorization is invalidated when target topology changes', async (context) => {
  const root = await fixture(context);
  const outside = await mkdtemp(path.join(os.tmpdir(), 'scopa-revalidate-'));
  context.after(() => rm(outside, { recursive: true, force: true }));
  const boundary = new PathBoundary({
    repoRoot: root,
    lock: createSliceLock(definition()),
  });
  const authorization = await boundary.authorize(
    'packages/enforcement/link/new.txt',
  );
  await symlink(outside, path.join(root, 'packages/enforcement/link'));
  await assert.rejects(
    () => boundary.revalidate(authorization),
    (error) =>
      error instanceof ScopeDeniedError &&
      error.details.reason === 'target resolves outside repository',
  );
});

test('reference host accepts concurrent calls through its exclusive dispatcher', async (context) => {
  const root = await fixture(context);
  const lock = createSliceLock(definition());
  const host = createReferenceAgentHost({ repoRoot: root, lock });
  const first = path.join(root, 'packages/enforcement/first.txt');
  const second = path.join(root, 'packages/enforcement/second.txt');
  await Promise.all([
    host.invoke({
      name: 'write_file',
      arguments: { path: first, content: 'first' },
    }),
    host.invoke({
      name: 'write_file',
      arguments: { path: second, content: 'second' },
    }),
  ]);
  assert.equal(await readFile(first, 'utf8'), 'first');
  assert.equal(await readFile(second, 'utf8'), 'second');
});

test('dispatcher serializes mutation handlers within the trusted host', async (context) => {
  const root = await fixture(context);
  const boundary = new PathBoundary({
    repoRoot: root,
    lock: createSliceLock(definition()),
  });
  let active = 0;
  let maximumActive = 0;
  const dispatch = createEnforcedToolDispatcher({
    boundary,
    tools: {
      delayed_write: {
        effect: 'MUTATE',
        pathArguments: ['path'],
        async execute({ path: target, content }) {
          active += 1;
          maximumActive = Math.max(maximumActive, active);
          await new Promise((resolve) => setTimeout(resolve, 20));
          await writeFile(target, content);
          active -= 1;
        },
      },
    },
  });
  await Promise.all([
    dispatch({
      name: 'delayed_write',
      arguments: {
        path: 'packages/enforcement/serialized-a.txt',
        content: 'a',
      },
    }),
    dispatch({
      name: 'delayed_write',
      arguments: {
        path: 'packages/enforcement/serialized-b.txt',
        content: 'b',
      },
    }),
  ]);
  assert.equal(maximumActive, 1);
});

test('reference host process denies an out-of-scope agent tool call', async (context) => {
  const root = await fixture(context);
  const lockPath = path.join(root, 'slice-lock.json');
  const deniedPath = path.join(root, 'packages/outside/host-blocked.txt');
  await writeFile(lockPath, JSON.stringify(createSliceLock(definition())));
  const cli = path.resolve(
    'packages/agent-surface/src/host-cli.js',
  );
  const childEnv = { ...process.env };
  delete childEnv.NODE_TEST_CONTEXT;
  let child;
  try {
    await execFileAsync(
      process.execPath,
      [
        cli,
        root,
        lockPath,
        JSON.stringify({
        name: 'write_file',
        arguments: { path: deniedPath, content: 'must not exist' },
        }),
      ],
      { encoding: 'utf8', env: childEnv },
    );
    assert.fail('reference host unexpectedly accepted the denied write');
  } catch (error) {
    child = error;
  }
  const stdoutText = child.stdout;
  const stderrText = child.stderr;
  assert.equal(child.code, 3, `${stdoutText}\n${stderrText}`);
  const response = JSON.parse(stdoutText);
  assert.equal(response.ok, false);
  assert.equal(response.error.code, 'SCOPA_SCOPE_DENIED');
  await assert.rejects(() => access(deniedPath), { code: 'ENOENT' });
});

test('path boundary rejects hard-link alias mutation', async (context) => {
  const root = await fixture(context);
  const outside = path.join(root, 'packages/outside/source.txt');
  const alias = path.join(root, 'packages/enforcement/alias.txt');
  await writeFile(outside, 'sensitive');
  await link(outside, alias);
  const boundary = new PathBoundary({
    repoRoot: root,
    lock: createSliceLock(definition()),
  });
  await assert.rejects(
    () => boundary.authorize(alias),
    (error) =>
      error instanceof ScopeDeniedError &&
      error.details.reason === 'hard-linked mutation targets are not allowed',
  );
});

test('slice-lock and gate definition require a bound principal DECISION', async (context) => {
  const root = await fixture(context);
  const lock = createSliceLock(definition());
  const validDecision = {
    approved: true,
    binding: {
      lockHash: lock.definitionHash,
      operation: 'amend-slice-lock',
    },
    category: 'DECISION',
    decisionId: 'decision-1',
    principalId: 'principal-1',
  };
  const untrustedBoundary = new PathBoundary({ repoRoot: root, lock });
  await assert.rejects(
    () =>
      untrustedBoundary.authorize('scopa.slice-lock.json', {
        decision: validDecision,
      }),
    /scope denied/,
  );
  const boundary = new PathBoundary({
    repoRoot: root,
    lock,
    decisionVerifier: async (decision) => decision.decisionId === 'decision-1',
  });
  await assert.rejects(
    () => boundary.authorize('scopa.slice-lock.json'),
    /scope denied/,
  );
  const accepted = await boundary.authorize('scopa.slice-lock.json', {
    decision: validDecision,
  });
  assert.equal(accepted.principalDecision, true);

  const tampered = structuredClone(lock);
  tampered.definition.gates[0].command = [process.execPath, '-e', 'process.exit(0)'];
  tampered.definition.gates[0].id = 'self-certified';
  assert.throws(() => verifySliceLock(tampered), /hash mismatch/);
});

test('rotation state remains kernel-owned even under a broad allowed rule', async (context) => {
  const root = await fixture(context);
  const broad = definition();
  broad.allowedPaths.push('.scopa/**');
  const boundary = new PathBoundary({
    repoRoot: root,
    lock: createSliceLock(broad),
  });
  await assert.rejects(
    () => boundary.authorize('.scopa/rotation.json'),
    (error) =>
      error instanceof ScopeDeniedError &&
      error.details.reason === 'rotation state is kernel-owned continuity data',
  );
});

test('real failing gate refuses asserted completion', async (context) => {
  const root = await fixture(context);
  const lock = createSliceLock(
    definition({ command: [process.execPath, '-e', 'process.exit(7)'] }),
  );
  await assert.rejects(
    () => assertCompletion({ lock, repoRoot: root }),
    (error) => {
      assert.equal(error instanceof CompletionDeniedError, true);
      assert.equal(error.state.canStop, false);
      assert.equal(error.state.gates[0].exitCode, 7);
      return true;
    },
  );
});

test('gate runner rejects escaped cwd and enforces timeout', async (context) => {
  const root = await fixture(context);
  const outside = await mkdtemp(path.join(os.tmpdir(), 'scopa-gate-escape-'));
  context.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, path.join(root, 'escape'));
  const escapedDefinition = definition();
  escapedDefinition.gates[0].cwd = 'escape';
  const escaped = await evaluateStopCondition({
    lock: createSliceLock(escapedDefinition),
    repoRoot: root,
  });
  assert.equal(escaped.canStop, false);
  assert.match(escaped.gates[0].stderr, /outside repository/);

  const timeoutDefinition = definition({
    command: [process.execPath, '-e', 'setTimeout(() => {}, 10_000)'],
  });
  timeoutDefinition.gates[0].timeoutMs = 20;
  const timed = await evaluateStopCondition({
    lock: createSliceLock(timeoutDefinition),
    repoRoot: root,
  });
  assert.equal(timed.canStop, false);
  assert.equal(timed.gates[0].timedOut, true);
});

test('orientation is compact and rotation state survives cold reload', async (context) => {
  const root = await fixture(context);
  const lock = createSliceLock(definition());
  const stopState = await evaluateStopCondition({ lock, repoRoot: root });
  assert.equal(stopState.canStop, true);
  const status = orientation({ lock, stopState });
  assert.deepEqual(status.allowedPaths, definition().allowedPaths);
  assert.equal(status.gateStatus, 'satisfied');
  assert.equal(status.canStop, true);

  const statePath = path.join(root, '.scopa/rotation.json');
  const state = {
    schema: 'scopa.rotation-state.v1',
    activeProtocol: 'next-prompt-protocols/active/S2.md',
    gitCommit: 'a'.repeat(40),
    lockHash: lock.definitionHash,
    sliceId: lock.definition.sliceId,
    stopState,
  };
  const saved = await saveRotationState(statePath, state);
  const expected = {
    lockHash: lock.definitionHash,
    gitCommit: 'a'.repeat(40),
  };
  const restored = await loadRotationState(statePath, expected);
  assert.deepEqual(restored, saved);
  assert.deepEqual(
    orientation({ lock, stopState: restored.state.stopState }),
    status,
  );
  const tampered = structuredClone(saved);
  tampered.state.stopState.canStop = false;
  await writeFile(statePath, JSON.stringify(tampered));
  await assert.rejects(
    () => loadRotationState(statePath, expected),
    /inconsistent stop state|verification failed/,
  );
  await saveRotationState(statePath, state);
  await assert.rejects(
    () =>
      loadRotationState(statePath, {
        ...expected,
        gitCommit: 'b'.repeat(40),
      }),
    /verification failed/,
  );
});
