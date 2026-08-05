import assert from 'node:assert/strict';
import {
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
  runCli,
} from '../src/app.js';

async function temporaryRoot(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-first-run-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function invoke(args, cwd) {
  let stdout = '';
  const exitCode = await runCli(args, {
    repo: cwd,
    write(value) {
      stdout += value;
    },
  });
  return { exitCode, stdout, stderr: '' };
}

test('zero arguments returns a human-first snapshot without mutation', async (context) => {
  const root = await temporaryRoot(context);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    scripts: { test: 'node --test' },
  }));
  const before = await readdir(root);
  const outcome = await invoke([], root);
  assert.equal(outcome.exitCode, 0, outcome.stderr || outcome.stdout);
  assert.equal(outcome.stderr, '');
  assert.match(outcome.stdout, /^SCOPA boundary snapshot$/mu);
  assert.match(outcome.stdout, /A possible completion check is available: npm test\./u);
  assert.deepEqual(await readdir(root), before);
  assert.equal(outcome.stdout.includes(root), false);
  assert.equal(outcome.stdout.trimStart().startsWith('{'), false);
});

test('explicit help remains help and doctor remains canonical JSON', async (context) => {
  const root = await temporaryRoot(context);
  const help = await invoke(['--help'], root);
  assert.equal(help.exitCode, 0);
  assert.match(help.stdout, /Usage:/u);
  assert.match(help.stdout, /Run without arguments/u);
  const doctor = await invoke(['doctor'], root);
  assert.equal(doctor.exitCode, 0, doctor.stderr || doctor.stdout);
  const envelope = JSON.parse(doctor.stdout);
  assert.equal(envelope.command, 'doctor');
  assert.equal(envelope.result.schema, 'scopa.boundary-diagnostic.v1');
});

test('first-run output does not disclose hostile file names or contents', async (context) => {
  const root = await temporaryRoot(context);
  await writeFile(path.join(root, '.env.private-customer'), 'SCOPA_PRIVATE_TOKEN=secret\n');
  await writeFile(path.join(root, 'AGENTS.md'), 'private unreleased prompt\n');
  const outcome = await invoke([], root);
  assert.equal(outcome.exitCode, 0, outcome.stderr || outcome.stdout);
  for (const forbidden of [
    '.env.private-customer',
    'SCOPA_PRIVATE_TOKEN',
    'private unreleased prompt',
    root,
  ]) assert.equal(outcome.stdout.includes(forbidden), false);
  assert.equal(await readFile(path.join(root, 'AGENTS.md'), 'utf8'), 'private unreleased prompt\n');
});
