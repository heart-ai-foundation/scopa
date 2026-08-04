import assert from 'node:assert/strict';
import {
  lstat,
  link,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  executeCommand,
  failureResult,
} from '../../cli/src/command.js';

async function temporaryRoot(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-doctor-lock-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function definition(exitCode = 0, sliceId = 'doctor-lock-test') {
  return {
    schema: 'scopa.slice-definition.v1',
    sliceId,
    allowedPaths: ['workspace/**'],
    amendmentPath: '.scopa/amendment.json',
    gates: [{
      id: 'deterministic-gate',
      command: [process.execPath, '-e', `process.exit(${exitCode})`],
      cwd: '.',
      timeoutMs: 5_000,
    }],
    nonGoals: ['No network or external-system use'],
    stopCondition: { kind: 'all-gates-pass' },
  };
}

function matrix() {
  return {
    schema: 'scopa.capability-matrix.v1',
    subject: {
      adapter: 'doctor-test',
      client: 'node-test',
      transport: 'in-process',
    },
    capabilities: [
      {
        id: 'scopa.write_file',
        category: 'mutate',
        exposure: 'advertised',
        mediation: 'scopa-dispatcher',
        effect: 'MUTATE',
        evidence: 'declared SCOPA dispatcher',
      },
      {
        id: 'native.filesystem-write',
        category: 'mutate',
        exposure: 'native',
        mediation: 'uncontrolled',
        effect: 'MUTATE',
        evidence: 'test harness authors declarations',
      },
      {
        id: 'native.process-execution',
        category: 'execute',
        exposure: 'native',
        mediation: 'uncontrolled',
        effect: 'OBSERVE',
        evidence: 'declared gate execution',
      },
      {
        id: 'native.network',
        category: 'network',
        exposure: 'disabled',
        mediation: 'disabled',
        effect: null,
        evidence: 'no network route',
      },
      {
        id: 'native.extensions',
        category: 'extension',
        exposure: 'disabled',
        mediation: 'disabled',
        effect: null,
        evidence: 'no extension route',
      },
    ],
    assurance: 'partial',
  };
}

function authority() {
  return {
    schema: 'scopa.authority-declarations.v1',
    declarations: [
      { id: 'browser', status: 'disabled' },
      { id: 'credentials', status: 'authority-required' },
      { id: 'deployment', status: 'authority-required' },
      { id: 'external-systems', status: 'authority-required' },
      { id: 'provider', status: 'authority-required' },
      { id: 'publication', status: 'authority-required' },
    ],
  };
}

async function declarations(root, sliceDefinition = definition()) {
  await writeFile(
    path.join(root, 'slice.json'),
    `${JSON.stringify(sliceDefinition, null, 2)}\n`,
  );
  await writeFile(
    path.join(root, 'matrix.json'),
    `${JSON.stringify(matrix(), null, 2)}\n`,
  );
  await writeFile(
    path.join(root, 'authority.json'),
    `${JSON.stringify(authority(), null, 2)}\n`,
  );
}

function argumentsFor(root, definitionPath = 'slice.json') {
  return [
    'doctor',
    '--lock',
    '--definition', definitionPath,
    '--matrix', 'matrix.json',
    '--authority', 'authority.json',
    '--repo', root,
  ];
}

async function invoke(args) {
  try {
    return await executeCommand(args);
  } catch (error) {
    return failureResult(args[0], error);
  }
}

async function repositorySnapshot(root, prefix = '') {
  const snapshot = [];
  for (const entry of await readdir(path.join(root, prefix), {
    withFileTypes: true,
  })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      snapshot.push([relative, 'directory']);
      snapshot.push(...await repositorySnapshot(root, relative));
    } else if (entry.isFile()) {
      snapshot.push([relative, 'file', await readFile(path.join(root, relative), 'utf8')]);
    } else {
      snapshot.push([relative, 'other']);
    }
  }
  return snapshot;
}

test('doctor --lock converts a clean diagnosis into a passing boundary map and repeats idempotently', async (context) => {
  const root = await temporaryRoot(context);
  await declarations(root);
  const declarationBytes = await Promise.all([
    readFile(path.join(root, 'slice.json')),
    readFile(path.join(root, 'matrix.json')),
    readFile(path.join(root, 'authority.json')),
  ]);

  const first = await invoke(argumentsFor(root));
  assert.equal(first.exitCode, 0);
  assert.equal(first.envelope.ok, true);
  assert.equal(first.envelope.result.schema, 'scopa.doctor-lock-result.v1');
  assert.equal(first.envelope.result.status, 'satisfied');
  assert.equal(first.envelope.result.before.subject.scopaInitialized, false);
  assert.equal(first.envelope.result.after.schema, 'scopa.workflow-boundary-map.v1');
  assert.equal(first.envelope.result.after.completion.canStop, true);
  assert.equal(first.envelope.result.after.assurance.level, 'partial');
  assert.deepEqual(first.envelope.result.initialization.created, [
    '.scopa/slice-lock.json',
    '.scopa/config.json',
  ]);

  const lockBytes = await readFile(path.join(root, '.scopa/slice-lock.json'));
  const second = await invoke(argumentsFor(root));
  assert.equal(second.exitCode, 0);
  assert.equal(second.envelope.result.before.subject.scopaInitialized, true);
  assert.deepEqual(second.envelope.result.initialization.created, []);
  assert.deepEqual(second.envelope.result.initialization.unchanged, [
    '.scopa/slice-lock.json',
    '.scopa/config.json',
  ]);
  assert.deepEqual(await readFile(path.join(root, '.scopa/slice-lock.json')), lockBytes);
  for (const [index, file] of ['slice.json', 'matrix.json', 'authority.json'].entries()) {
    assert.deepEqual(await readFile(path.join(root, file)), declarationBytes[index]);
  }
});

test('doctor --lock rejects malformed or escaping inputs without mutation', async (context) => {
  const root = await temporaryRoot(context);
  await declarations(root);
  await writeFile(path.join(root, 'matrix.json'), '{not-json\n');
  const beforeMalformed = await repositorySnapshot(root);
  const malformed = await invoke(argumentsFor(root));
  assert.equal(malformed.exitCode, 2);
  assert.equal(malformed.envelope.ok, false);
  assert.deepEqual(await repositorySnapshot(root), beforeMalformed);

  await declarations(root);
  const beforeEscape = await repositorySnapshot(root);
  const escaping = await invoke(argumentsFor(root, '../outside.json'));
  assert.equal(escaping.exitCode, 2);
  assert.equal(escaping.envelope.ok, false);
  assert.deepEqual(await repositorySnapshot(root), beforeEscape);
  await assert.rejects(() => lstat(path.join(root, '.scopa')), { code: 'ENOENT' });
});

test('doctor --lock rejects symlinked declarations before mutation', async (context) => {
  const root = await temporaryRoot(context);
  await declarations(root);
  await symlink('slice.json', path.join(root, 'slice-link.json'));
  const before = await repositorySnapshot(root);
  const outcome = await invoke(argumentsFor(root, 'slice-link.json'));
  assert.equal(outcome.exitCode, 2);
  assert.deepEqual(await repositorySnapshot(root), before);
  await assert.rejects(() => lstat(path.join(root, '.scopa')), { code: 'ENOENT' });
});

test('doctor --lock rejects hard-linked declarations before mutation', async (context) => {
  const root = await temporaryRoot(context);
  await declarations(root);
  await link(path.join(root, 'slice.json'), path.join(root, 'slice-link.json'));
  const before = await repositorySnapshot(root);
  const outcome = await invoke(argumentsFor(root, 'slice-link.json'));
  assert.equal(outcome.exitCode, 2);
  assert.deepEqual(await repositorySnapshot(root), before);
  await assert.rejects(() => lstat(path.join(root, '.scopa')), { code: 'ENOENT' });
});

test('doctor --lock refuses a changed definition without overwriting the existing lock', async (context) => {
  const root = await temporaryRoot(context);
  await declarations(root);
  const first = await invoke(argumentsFor(root));
  assert.equal(first.exitCode, 0);
  const originalLock = await readFile(path.join(root, '.scopa/slice-lock.json'));
  await declarations(root, definition(0, 'changed-definition'));

  const conflict = await invoke(argumentsFor(root));
  assert.equal(conflict.exitCode, 2);
  assert.equal(conflict.envelope.error.code, 'SCOPA_INIT_CONFLICT');
  assert.deepEqual(
    await readFile(path.join(root, '.scopa/slice-lock.json')),
    originalLock,
  );
});

test('doctor --lock returns blocked exit with the actual failing boundary map', async (context) => {
  const root = await temporaryRoot(context);
  await declarations(root, definition(7));
  const outcome = await invoke(argumentsFor(root));
  assert.equal(outcome.exitCode, 4);
  assert.equal(outcome.envelope.ok, false);
  assert.equal(outcome.envelope.error.code, 'SCOPA_DOCTOR_LOCK_BLOCKED');
  const result = outcome.envelope.error.details;
  assert.equal(result.status, 'blocked');
  assert.equal(result.before.subject.scopaInitialized, false);
  assert.equal(result.after.completion.canStop, false);
  assert.deepEqual(result.after.completion.failedGates, ['deterministic-gate']);
  assert.equal(result.after.completion.gates[0].exitCode, 7);
  assert.equal((await lstat(path.join(root, '.scopa'))).isDirectory(), true);
});
