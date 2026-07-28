import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);
const CLI = path.join(ROOT, 'packages/cli/src/cli.js');
const execFileAsync = promisify(execFile);
const CLEAN_DEFINITION = JSON.parse(
  await readFile(
    path.join(ROOT, 'fixtures/S6/scopa.slice-definition.json'),
    'utf8',
  ),
);

async function repository(context, {
  definition = CLEAN_DEFINITION,
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-cli-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'workspace'));
  await writeFile(
    path.join(root, 'scopa.slice-definition.json'),
    `${JSON.stringify(definition, null, 2)}\n`,
  );
  return root;
}

async function invoke(cli, cwd, args, { env = process.env } = {}) {
  const childEnv = { ...env };
  delete childEnv.NODE_TEST_CONTEXT;
  let status = 0;
  let stdout = '';
  let stderr = '';
  let childError = null;
  try {
    const result = await execFileAsync(cli, args, {
      cwd,
      encoding: 'utf8',
      env: childEnv,
      maxBuffer: 10 * 1024 * 1024,
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error) {
    childError = error;
    status = Number.isSafeInteger(error.code) ? error.code : null;
    stdout = error.stdout ?? '';
    stderr = error.stderr ?? '';
  }
  let report = null;
  try {
    report = JSON.parse(stdout);
  } catch {
    // Help and package-manager commands intentionally do not emit JSON.
  }
  return { status, stdout, stderr, error: childError, report };
}

async function sourceCli(cwd, args) {
  return invoke(process.execPath, cwd, [CLI, ...args]);
}

async function initialize(cwd) {
  return sourceCli(cwd, [
    'init',
    '--definition',
    'scopa.slice-definition.json',
  ]);
}

test('init is idempotent and refuses conflicting overwrite', async (context) => {
  const root = await repository(context);
  const first = await initialize(root);
  assert.equal(first.status, 0, first.stdout || first.stderr);
  assert.equal(first.report.schema, 'scopa.cli-result.v1');
  assert.equal(first.report.ok, true);
  assert.deepEqual(first.report.result.created, [
    '.scopa/slice-lock.json',
    '.scopa/config.json',
  ]);

  const lockBefore = await readFile(
    path.join(root, '.scopa/slice-lock.json'),
    'utf8',
  );
  const second = await initialize(root);
  assert.equal(second.status, 0, second.stdout || second.stderr);
  assert.deepEqual(second.report.result.created, []);
  assert.deepEqual(second.report.result.unchanged, [
    '.scopa/slice-lock.json',
    '.scopa/config.json',
  ]);

  const changed = structuredClone(CLEAN_DEFINITION);
  changed.gates[0].command = ['node', '-e', 'process.exit(9)'];
  await writeFile(
    path.join(root, 'scopa.slice-definition.json'),
    `${JSON.stringify(changed, null, 2)}\n`,
  );
  const conflict = await initialize(root);
  assert.equal(conflict.status, 2, conflict.stdout || conflict.stderr);
  assert.equal(conflict.report.ok, false);
  assert.equal(conflict.report.error.code, 'SCOPA_INIT_CONFLICT');
  assert.deepEqual(conflict.report.error.details, {
    path: '.scopa/slice-lock.json',
  });
  assert.equal(
    await readFile(path.join(root, '.scopa/slice-lock.json'), 'utf8'),
    lockBefore,
  );
});

test('init rejects a symlinked control directory without writing outside', async (context) => {
  const root = await repository(context);
  const outside = await mkdtemp(path.join(os.tmpdir(), 'scopa-cli-outside-'));
  context.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, path.join(root, '.scopa'));
  const result = await initialize(root);
  assert.equal(result.status, 2, result.stdout || result.stderr);
  assert.equal(result.report.ok, false);
  assert.equal(result.report.error.code, 'SCOPA_INIT_CONFLICT');
  assert.deepEqual(result.report.error.details, { path: '.scopa' });
  await assert.rejects(() => access(path.join(outside, 'config.json')), {
    code: 'ENOENT',
  });
  await assert.rejects(() => access(path.join(outside, 'slice-lock.json')), {
    code: 'ENOENT',
  });
});

test('status on an uninitialized repository does not create control state', async (context) => {
  const root = await repository(context);
  const result = await sourceCli(root, ['status']);
  assert.equal(result.status, 2, result.stdout || result.stderr);
  assert.equal(result.report.ok, false);
  assert.equal(result.report.error.code, 'SCOPA_PROJECT_CONFIG_INVALID');
  await assert.rejects(() => access(path.join(root, '.scopa')), {
    code: 'ENOENT',
  });
});

test('status observes and check rejects a real failing gate', async (context) => {
  const failing = structuredClone(CLEAN_DEFINITION);
  failing.sliceId = 'S6-failing-gate';
  failing.gates[0].command = ['node', '-e', 'process.exit(7)'];
  const root = await repository(context, { definition: failing });
  assert.equal((await initialize(root)).status, 0);

  const status = await sourceCli(root, ['status']);
  assert.equal(status.status, 0, status.stdout || status.stderr);
  assert.equal(status.report.ok, true);
  assert.equal(status.report.result.schema, 'scopa.orientation.v1');
  assert.equal(status.report.result.canStop, false);
  assert.equal(status.report.result.gateStatus, 'blocked');

  const check = await sourceCli(root, ['check']);
  assert.equal(check.status, 4, check.stdout || check.stderr);
  assert.equal(check.report.ok, false);
  assert.equal(check.report.error.code, 'SCOPA_COMPLETION_BLOCKED');
  assert.deepEqual(check.report.error.details.failedGates, ['fixture-gate']);
  assert.equal(check.report.error.details.gates[0].exitCode, 7);
});

test('run permits an allowed write and denies scope before execution', async (context) => {
  const root = await repository(context);
  assert.equal((await initialize(root)).status, 0);

  const allowed = await sourceCli(root, [
    'run',
    '--request-json',
    JSON.stringify({
      name: 'write_file',
      arguments: {
        path: 'workspace/allowed.txt',
        content: 'allowed',
      },
    }),
  ]);
  assert.equal(allowed.status, 0, allowed.stdout || allowed.stderr);
  assert.equal(allowed.report.ok, true);
  assert.equal(
    await readFile(path.join(root, 'workspace/allowed.txt'), 'utf8'),
    'allowed',
  );

  const denied = await sourceCli(root, [
    'run',
    '--request-json',
    JSON.stringify({
      name: 'write_file',
      arguments: {
        path: 'outside.txt',
        content: 'must not exist',
      },
    }),
  ]);
  assert.equal(denied.status, 3, denied.stdout || denied.stderr);
  assert.equal(denied.report.error.code, 'SCOPA_SCOPE_DENIED');
  assert.equal(
    denied.report.error.details.reason,
    'target is outside the active slice',
  );
  await assert.rejects(() => access(path.join(root, 'outside.txt')), {
    code: 'ENOENT',
  });
});

test('verify checks a retained signed packet with caller trust policy', async (context) => {
  const root = await repository(context);
  await copyFile(
    path.join(ROOT, 'evidence/S4/2026-07-26-freetsa-packet.json'),
    path.join(root, 'packet.json'),
  );
  await copyFile(
    path.join(ROOT, 'fixtures/S4/freetsa-root.pem'),
    path.join(root, 'freetsa-root.pem'),
  );
  const result = await sourceCli(root, [
    'verify',
    '--packet',
    'packet.json',
    '--timestamp-roots',
    'freetsa-root.pem',
    '--require-timestamp',
    '--timestamp-authority-id',
    'freetsa.org-2026',
    '--timestamp-signer-sha256',
    '32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc',
  ]);
  assert.equal(result.status, 0, result.stdout || result.stderr);
  assert.equal(result.report.ok, true);
  assert.equal(result.report.result.type, 'native-packet');
  assert.equal(result.report.result.report.ok, true);
});

test('verify maps evidence and trust tampering to the stable verification exit', async (context) => {
  const root = await repository(context);
  const packet = JSON.parse(
    await readFile(
      path.join(ROOT, 'evidence/S4/2026-07-26-freetsa-packet.json'),
      'utf8',
    ),
  );
  await copyFile(
    path.join(ROOT, 'fixtures/S4/freetsa-root.pem'),
    path.join(root, 'freetsa-root.pem'),
  );
  const baseArguments = [
    'verify',
    '--packet',
    'packet.json',
    '--timestamp-roots',
    'freetsa-root.pem',
    '--require-timestamp',
    '--timestamp-authority-id',
    'freetsa.org-2026',
    '--timestamp-signer-sha256',
    '32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc',
  ];
  const mutateDigest = (digest) =>
    `${digest[0] === '0' ? '1' : '0'}${digest.slice(1)}`;
  const mutations = [
    {
      name: 'commitment root',
      mutate(value) {
        value.commitment.rootHash = mutateDigest(value.commitment.rootHash);
      },
    },
    {
      name: 'Ed25519 signature',
      mutate(value) {
        const signature = value.signature.signatureBase64;
        value.signature.signatureBase64 =
          `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
      },
    },
    {
      name: 'INFER prompt digest',
      mutate(value) {
        value.inferPins[0].prompt.digest = mutateDigest(
          value.inferPins[0].prompt.digest,
        );
      },
    },
  ];
  for (const mutation of mutations) {
    const mutated = structuredClone(packet);
    mutation.mutate(mutated);
    await writeFile(
      path.join(root, 'packet.json'),
      `${JSON.stringify(mutated)}\n`,
    );
    const result = await sourceCli(root, baseArguments);
    assert.equal(
      result.status,
      5,
      `${mutation.name}: ${result.stdout || result.stderr}`,
    );
    assert.equal(result.report.ok, false);
    assert.equal(
      result.report.error.code,
      'SCOPA_EVIDENCE_VERIFICATION_FAILED',
    );
    assert.deepEqual(result.report.error.details, {
      category: 'invalid-evidence-or-trust-policy',
    });
  }

  await writeFile(
    path.join(root, 'packet.json'),
    `${JSON.stringify(packet)}\n`,
  );
  for (const [flag, value] of [
    ['--timestamp-authority-id', 'wrong.example'],
    [
      '--timestamp-signer-sha256',
      '42e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc',
    ],
  ]) {
    const argumentsWithWrongTrust = [...baseArguments];
    argumentsWithWrongTrust[
      argumentsWithWrongTrust.indexOf(flag) + 1
    ] = value;
    const result = await sourceCli(root, argumentsWithWrongTrust);
    assert.equal(result.status, 5, result.stdout || result.stderr);
    assert.equal(
      result.report.error.code,
      'SCOPA_EVIDENCE_VERIFICATION_FAILED',
    );
  }

  const unreadable = await sourceCli(root, [
    'verify',
    '--packet',
    'missing-packet.json',
  ]);
  assert.equal(unreadable.status, 1, unreadable.stdout || unreadable.stderr);
  assert.equal(unreadable.report.ok, false);

  const usage = await sourceCli(root, ['verify']);
  assert.equal(usage.status, 2, usage.stdout || usage.stderr);
  assert.equal(usage.report.error.code, 'SCOPA_CLI_USAGE');
});

test('packed artifact installs and runs without leaking private build surfaces', async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-pack-'));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const pack = await invoke('npm', ROOT, [
    'pack',
    '--json',
    '--pack-destination',
    temporary,
  ]);
  assert.equal(pack.status, 0, pack.stderr || pack.stdout);
  const manifests = JSON.parse(pack.stdout);
  assert.equal(manifests.length, 1);
  const manifest = manifests[0];
  const paths = manifest.files.map((entry) => entry.path);
  for (const forbidden of [
    '.github/',
    'evidence/',
    'next-prompt-protocols/',
    'notes/',
    'runs/',
    'spec/',
  ]) {
    assert.equal(
      paths.some((entry) => entry.startsWith(forbidden)),
      false,
      `tarball leaked ${forbidden}`,
    );
  }
  assert.deepEqual(
    paths.filter((entry) => entry.startsWith('fixtures/')).sort(),
    [
      'fixtures/S10/2026-07-26-freetsa-packet.json',
      'fixtures/S10/capability-matrix.json',
      'fixtures/S10/clean.slice-definition.json',
      'fixtures/S10/consumer-client.mjs',
      'fixtures/S10/failing.slice-definition.json',
      'fixtures/S10/freetsa-root.pem',
      'fixtures/S10/session.json',
    ],
    'tarball must contain only the reviewed S10 public fixtures',
  );
  assert.equal(
    paths.some(
      (entry) =>
        /\.(?:log|tmp)$/.test(entry) ||
        (
          entry.endsWith('.pem') &&
          entry !== 'fixtures/S10/freetsa-root.pem'
        ),
    ),
    false,
    'tarball leaked a log, unreviewed certificate, or temporary file',
  );
  assert.equal(paths.includes('packages/cli/src/cli.js'), true);
  assert.equal(paths.includes('packages/enforcement/src/lock.js'), true);

  const consumer = path.join(temporary, 'consumer');
  await mkdir(consumer);
  await writeFile(
    path.join(consumer, 'package.json'),
    '{"name":"scopa-consumer","version":"1.0.0","private":true}\n',
  );
  const archive = path.join(temporary, manifest.filename);
  const install = await invoke('npm', consumer, [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
    archive,
  ]);
  assert.equal(install.status, 0, install.stderr || install.stdout);

  await mkdir(path.join(consumer, '.git'));
  await mkdir(path.join(consumer, 'workspace'));
  await writeFile(
    path.join(consumer, 'scopa.slice-definition.json'),
    `${JSON.stringify(CLEAN_DEFINITION, null, 2)}\n`,
  );
  const binary = path.join(consumer, 'node_modules/.bin/scopa');
  assert.equal(
    (await realpath(binary)).startsWith(
      await realpath(path.join(consumer, 'node_modules')),
    ),
    true,
  );

  const init = await invoke(binary, consumer, [
    'init',
    '--definition',
    'scopa.slice-definition.json',
  ]);
  assert.equal(init.status, 0, init.stdout || init.stderr);
  const status = await invoke(binary, consumer, ['status']);
  assert.equal(status.status, 0, status.stdout || status.stderr);
  assert.equal(status.report.result.canStop, true);
  const check = await invoke(binary, consumer, ['check']);
  assert.equal(check.status, 0, check.stdout || check.stderr);
  assert.equal(check.report.result.canStop, true);
  const run = await invoke(binary, consumer, [
    'run',
    '--request-json',
    JSON.stringify({
      name: 'write_file',
      arguments: {
        path: 'workspace/from-package.txt',
        content: 'installed',
      },
    }),
  ]);
  assert.equal(run.status, 0, run.stdout || run.stderr);
  assert.equal(
    await readFile(path.join(consumer, 'workspace/from-package.txt'), 'utf8'),
    'installed',
  );

  await copyFile(
    path.join(ROOT, 'evidence/S4/2026-07-26-freetsa-packet.json'),
    path.join(consumer, 'packet.json'),
  );
  await copyFile(
    path.join(ROOT, 'fixtures/S4/freetsa-root.pem'),
    path.join(consumer, 'freetsa-root.pem'),
  );
  const verifyArguments = [
    'verify',
    '--packet',
    'packet.json',
    '--timestamp-roots',
    'freetsa-root.pem',
    '--require-timestamp',
    '--timestamp-authority-id',
    'freetsa.org-2026',
    '--timestamp-signer-sha256',
    '32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc',
  ];
  const verify = await invoke(binary, consumer, verifyArguments);
  assert.equal(verify.status, 0, verify.stdout || verify.stderr);
  assert.equal(verify.report.result.report.ok, true);

  const installedPacket = JSON.parse(
    await readFile(path.join(consumer, 'packet.json'), 'utf8'),
  );
  const installedMutations = [
    (value) => {
      value.commitment.rootHash =
        `0${value.commitment.rootHash.slice(1)}`;
    },
    (value) => {
      value.signature.signatureBase64 =
        `A${value.signature.signatureBase64.slice(1)}`;
    },
    (value) => {
      value.inferPins[0].prompt.digest =
        `0${value.inferPins[0].prompt.digest.slice(1)}`;
    },
  ];
  for (const mutate of installedMutations) {
    const mutated = structuredClone(installedPacket);
    mutate(mutated);
    await writeFile(
      path.join(consumer, 'packet.json'),
      `${JSON.stringify(mutated)}\n`,
    );
    const rejected = await invoke(binary, consumer, verifyArguments);
    assert.equal(rejected.status, 5, rejected.stdout || rejected.stderr);
    assert.equal(
      rejected.report.error.code,
      'SCOPA_EVIDENCE_VERIFICATION_FAILED',
    );
  }
  await writeFile(
    path.join(consumer, 'packet.json'),
    `${JSON.stringify(installedPacket)}\n`,
  );
  for (const [flag, value] of [
    ['--timestamp-authority-id', 'wrong.example'],
    [
      '--timestamp-signer-sha256',
      '42e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc',
    ],
  ]) {
    const wrongPolicyArguments = [...verifyArguments];
    wrongPolicyArguments[wrongPolicyArguments.indexOf(flag) + 1] = value;
    const rejected = await invoke(binary, consumer, wrongPolicyArguments);
    assert.equal(rejected.status, 5, rejected.stdout || rejected.stderr);
    assert.equal(
      rejected.report.error.code,
      'SCOPA_EVIDENCE_VERIFICATION_FAILED',
    );
  }

  const unreadable = await invoke(binary, consumer, [
    'verify',
    '--packet',
    'missing-packet.json',
  ]);
  assert.equal(unreadable.status, 1, unreadable.stdout || unreadable.stderr);
  const usage = await invoke(binary, consumer, ['verify']);
  assert.equal(usage.status, 2, usage.stdout || usage.stderr);
});
