import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runCli } from '../../cli/src/app.js';

const execFileAsync = promisify(execFile);

async function invoke(args, options = {}) {
  let stdout = '';
  const exitCode = await runCli(args, {
    ...options,
    write(value) { stdout += value; },
  });
  return { exitCode, stdout };
}

async function repository(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s52-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'src/index.js'), 'export const value = 1;\n');
  await writeFile(path.join(root, 'package.json'), '{"name":"s52-fixture"}\n');
  await execFileAsync('git', ['init', '-q'], { cwd: root });
  await execFileAsync('git', ['add', 'src/index.js', 'package.json'], { cwd: root });
  await execFileAsync('git', [
    '-c', 'user.name=SCOPA Test',
    '-c', 'user.email=scopa@example.invalid',
    'commit', '-q', '-m', 'fixture',
  ], { cwd: root });
  return root;
}

function request() {
  return JSON.stringify({
    schema: 'scopa.begin-request.v1',
    sliceId: 'first-time-hardening',
    outcome: 'prove the complete first-time finish loop',
    allowedPaths: ['src/**'],
    gates: [{
      id: 'passing-gate',
      command: ['node', '-e', 'process.exit(0)'],
      cwd: '.',
      timeoutMs: 30000,
    }],
    nonGoals: ['changing dependencies'],
    clientProfile: 'generic',
  });
}

test('cold snapshot gives one self-contained local continuation', async (context) => {
  const root = await repository(context);
  const result = await invoke([], { isTty: true, repo: root });
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /^SCOPA boundary snapshot$/mu);
  assert.match(
    result.stdout,
    /Run scopa assistant install --dry-run to preview the reversible project-local agent setup\./u,
  );
});

test('assistant preview and install are human at a terminal and JSON for automation', async (context) => {
  const root = await repository(context);
  const preview = await invoke([
    'assistant', 'install', '--dry-run', '--repo', root,
  ], { isTty: true });
  assert.equal(preview.exitCode, 0);
  assert.match(preview.stdout, /^SCOPA ASSISTANT SETUP PREVIEW$/mu);
  assert.match(preview.stdout, /Client {4}generic/u);
  assert.match(preview.stdout, /\.agents\/skills\/scopa\/SKILL\.md/u);
  assert.match(preview.stdout, /No files changed\./u);
  assert.throws(() => JSON.parse(preview.stdout));

  const json = await invoke([
    'assistant', 'install', '--dry-run', '--format', 'json', '--repo', root,
  ], { isTty: true });
  assert.equal(JSON.parse(json.stdout).result.plan.client, 'generic');

  const installed = await invoke([
    'assistant', 'install', '--repo', root,
  ], { isTty: true });
  assert.match(installed.stdout, /^SCOPA ASSISTANT SETUP INSTALLED$/mu);
  assert.match(installed.stdout, /Created/u);
  const skill = await readFile(path.join(root, '.agents/skills/scopa/SKILL.md'), 'utf8');
  assert.match(skill, /scopa check --format json.*, then `scopa view --format json`/su);
});

test('malformed begin gives human recovery while explicit JSON stays canonical', async (context) => {
  const root = await repository(context);
  const human = await invoke([
    'begin', '--request-json', '{bad-json', '--repo', root,
  ], { isTty: true });
  assert.equal(human.exitCode, 2);
  assert.match(human.stdout, /^SCOPA COULD NOT BEGIN THIS TASK$/mu);
  assert.match(human.stdout, /Correct the boundary request/u);
  assert.equal(human.stdout.includes('"schema"'), false);

  const json = await invoke([
    'begin', '--format', 'json', '--request-json', '{bad-json', '--repo', root,
  ], { isTty: true });
  const envelope = JSON.parse(json.stdout);
  assert.equal(envelope.ok, false);
  assert.equal(envelope.error.code, 'SCOPA_CLI_USAGE');
});

test('human check and final card surface tracked and untracked boundary contacts', async (context) => {
  const root = await repository(context);
  await invoke([
    'begin', '--format', 'json', '--request-json', request(), '--repo', root,
  ]);
  await writeFile(path.join(root, 'src/index.js'), 'export const value = 2;\n');
  await writeFile(path.join(root, 'package.json'), '{"name":"s52-fixture","dependencies":{}}\n');
  await writeFile(path.join(root, 'src/new.js'), 'export const fresh = true;\n');
  await writeFile(path.join(root, 'new-root.txt'), 'outside and untracked\n');

  const checked = await invoke(['check', '--repo', root], { isTty: true });
  assert.equal(checked.exitCode, 0);
  assert.match(checked.stdout, /Observation {2}2 tracked \/ 2 untracked \/ 2 outside \/ 1 non-goal contacts/u);
  assert.match(checked.stdout, /SATISFIED — WITH UNVERIFIED CHANGES/u);

  const viewed = await invoke([
    'view', '--format', 'json', '--repo', root,
  ]);
  const card = JSON.parse(viewed.stdout);
  assert.deepEqual(card.observed, {
    basis: 'git-working-tree-observation-not-enforcement',
    declaredNonGoalContacts: 1,
    outsideAllowedPaths: 2,
    untrackedChanges: 2,
    versionControlledChanges: 2,
  });
  for (const privatePath of ['package.json', 'src/new.js', 'new-root.txt', root]) {
    assert.equal(viewed.stdout.includes(privatePath), false);
  }
});

test('explicit exports disclose their separate write boundary and remain observable', async (context) => {
  const root = await repository(context);
  await invoke([
    'begin', '--format', 'json', '--request-json', request(), '--repo', root,
  ]);
  const exported = await invoke([
    'view', '--format', 'badge', '--output', 'boundary.svg', '--repo', root,
  ]);
  assert.match(exported.stdout, /outside the locked task mutation boundary/u);
  assert.match(exported.stdout, /not a governed task write/u);

  const viewed = JSON.parse((await invoke([
    'view', '--format', 'json', '--repo', root,
  ])).stdout);
  assert.equal(viewed.observed.untrackedChanges, 1);
  assert.equal(viewed.observed.outsideAllowedPaths, 1);
  assert.equal(JSON.stringify(viewed).includes('boundary.svg'), false);
});
