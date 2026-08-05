import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  AssistantInstallError,
  installAssistant,
} from '../src/index.js';
import { runCli } from '../../cli/src/app.js';

async function temporaryRoot(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s47-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function invoke(args, options = {}) {
  let stdout = '';
  const exitCode = await runCli(args, {
    ...options,
    write(value) {
      stdout += value;
    },
  });
  return { exitCode, stdout };
}

function request() {
  return JSON.stringify({
    schema: 'scopa.begin-request.v1',
    sliceId: 'front-door-contract',
    outcome: 'prove the documented agent output contract',
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

test('marker-free auto install uses only the reversible generic project path', async (context) => {
  const root = await temporaryRoot(context);
  const preview = await installAssistant({ repoRoot: root, dryRun: true });
  assert.equal(preview.plan.client, 'generic');
  assert.equal(preview.plan.targets[0].path, '.agents/skills/scopa/SKILL.md');
  assert.deepEqual(await readdir(root), []);

  const installed = await installAssistant({ repoRoot: root });
  assert.equal(installed.plan.client, 'generic');
  assert.deepEqual(installed.created, [
    '.agents/skills/scopa/SKILL.md',
    '.scopa/assistant-install.json',
  ]);
  const skill = await readFile(
    path.join(root, '.agents/skills/scopa/SKILL.md'),
    'utf8',
  );
  assert.match(skill, /portable Agent Skills entry/u);
  assert.match(skill, /scopa begin --format json --request-json/u);
  assert.match(skill, /scopa check --format json/u);
});

test('ambiguous detection stays closed and enumerates every valid explicit client', async (context) => {
  const root = await temporaryRoot(context);
  await mkdir(path.join(root, '.claude'));
  await mkdir(path.join(root, '.codex'));
  await assert.rejects(
    installAssistant({ repoRoot: root }),
    (error) => {
      assert.ok(error instanceof AssistantInstallError);
      assert.match(error.message, /auto-detection is ambiguous/u);
      for (const client of ['claude-code', 'codex', 'generic']) {
        assert.match(error.message, new RegExp(`\\b${client}\\b`, 'u'));
      }
      return true;
    },
  );
  assert.deepEqual((await readdir(root)).sort(), ['.claude', '.codex']);
});

test('agent-consumed begin and check commands stay JSON under a terminal harness', async (context) => {
  const agentEntry = await readFile(new URL('../../../SCOPA_AGENT.md', import.meta.url), 'utf8');
  assert.match(agentEntry, /scopa begin --format json --request-json/u);
  assert.match(agentEntry, /^scopa check --format json$/mu);

  const root = await temporaryRoot(context);
  const begin = await invoke([
    'begin', '--format', 'json', '--repo', root, '--request-json', request(),
  ], { isTty: true });
  assert.equal(begin.exitCode, 0);
  const beginEnvelope = JSON.parse(begin.stdout);
  assert.equal(beginEnvelope.schema, 'scopa.cli-result.v1');
  assert.equal(beginEnvelope.result.boundaryMap.completion.canStop, true);

  const check = await invoke([
    'check', '--format', 'json', '--repo', root,
  ], { isTty: true });
  assert.equal(check.exitCode, 0);
  const checkEnvelope = JSON.parse(check.stdout);
  assert.equal(checkEnvelope.result.canStop, true);
});

test('the three front-door copies and output-mode guidance stay prominent and exact', async () => {
  const readme = await readFile(new URL('../../../README.md', import.meta.url), 'utf8');
  const prompt = 'Read https://raw.githubusercontent.com/heart-ai-foundation/scopa/main/SCOPA_AGENT.md';
  const snapshot = 'npx --yes --package @heart-ai-foundation/scopa@0.4.0 scopa';
  const demo = `${snapshot} demo`;
  assert.ok(readme.indexOf(prompt) < readme.indexOf('Next-Prompt Protocol'));
  assert.ok(readme.indexOf(snapshot) < readme.indexOf(demo));
  assert.doesNotMatch(readme, /development build that includes the first-run snapshot/iu);

  for (const relative of [
    'README.md',
    'docs/BEGIN.md',
    'docs/QUICKSTART.md',
    'docs/TROUBLESHOOTING.md',
  ]) {
    const text = await readFile(new URL(`../../../${relative}`, import.meta.url), 'utf8');
    assert.match(text, /terminal/iu, `${relative} omits terminal behavior`);
    assert.match(text, /--format json/iu, `${relative} omits explicit JSON guidance`);
  }

  const manual = await readFile(new URL('../../../docs/MANUAL_SETUP.md', import.meta.url), 'utf8');
  assert.match(manual, /scopa status --format json/u);
  assert.match(manual, /scopa check --format json/u);
});
