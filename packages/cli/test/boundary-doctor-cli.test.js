import assert from 'node:assert/strict';
import {
  access,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  executeCommand,
  failureResult,
} from '../src/command.js';

async function temporaryRoot(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-doctor-cli-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function invoke(args) {
  try {
    const outcome = await executeCommand(args);
    return {
      exitCode: outcome.exitCode,
      stdout: canonicalJsonPretty(outcome.envelope),
      stderr: '',
    };
  } catch (error) {
    const outcome = failureResult(args[0], error);
    return {
      exitCode: outcome.exitCode,
      stdout: canonicalJsonPretty(outcome.envelope),
      stderr: '',
    };
  }
}

test('doctor succeeds before initialization and returns stable canonical JSON', async (context) => {
  const root = await temporaryRoot(context);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    scripts: { test: 'node --test' },
  }));
  await writeFile(path.join(root, 'AGENTS.md'), 'do not echo this content\n');
  const before = await readdir(root);

  const first = await invoke(['doctor', '--repo', root]);
  const second = await invoke(['doctor', '--repo', root]);
  assert.equal(first.exitCode, 0, first.stderr || first.stdout);
  assert.equal(second.exitCode, 0, second.stderr || second.stdout);
  assert.equal(first.stderr, '');
  assert.equal(first.stdout, second.stdout);
  const envelope = JSON.parse(first.stdout);
  assert.equal(envelope.schema, 'scopa.cli-result.v1');
  assert.equal(envelope.ok, true);
  assert.equal(envelope.command, 'doctor');
  assert.equal(envelope.result.schema, 'scopa.boundary-diagnostic.v1');
  assert.equal(envelope.result.subject.scopaInitialized, false);
  assert.deepEqual(await readdir(root), before);
  await assert.rejects(() => access(path.join(root, '.scopa')), { code: 'ENOENT' });
  assert.equal(first.stdout.includes(root), false);
  assert.equal(first.stdout.includes('do not echo this content'), false);
});

test('doctor requires the complete lock declaration set before creating state', async (context) => {
  const root = await temporaryRoot(context);
  const outcome = await invoke(['doctor', '--lock', '--repo', root]);
  assert.equal(outcome.exitCode, 2);
  const envelope = JSON.parse(outcome.stdout);
  assert.equal(envelope.ok, false);
  assert.equal(envelope.error.code, 'SCOPA_CLI_USAGE');
  await assert.rejects(() => readFile(path.join(root, '.scopa/config.json')), {
    code: 'ENOENT',
  });
});
