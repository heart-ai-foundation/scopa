import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runCli } from '../src/app.js';

const PASSING_GATE = ['node', '-e', 'process.exit(0)'];
const FAILING_GATE = ['node', '-e', 'process.exit(1)'];

async function temporaryRoot(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s44-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    name: 's44-fixture',
    version: '1.0.0',
  }));
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

function beginRequest(command) {
  return JSON.stringify({
    schema: 'scopa.begin-request.v1',
    sliceId: 'render-check',
    outcome: 'exercise the human renderer',
    allowedPaths: ['src/**'],
    gates: [{ id: 'declared-gate', command, cwd: '.', timeoutMs: 30000 }],
    nonGoals: ['changing dependencies'],
    clientProfile: 'generic',
  });
}

async function beganRoot(context, command = PASSING_GATE) {
  const root = await temporaryRoot(context);
  const outcome = await invoke([
    'begin', '--repo', root, '--request-json', beginRequest(command),
  ]);
  return { root, outcome };
}

// Gate wall-clock timing is nondeterministic and appears both as a canonical
// field and inside captured gate output.
function normalizeTiming(text) {
  return text
    .replaceAll(/"durationMs": \d+/gu, '"durationMs": 0')
    .replaceAll(/duration_ms:? \d+(\.\d+)?/gu, 'duration_ms 0');
}

function nonblankLines(text) {
  return text.split('\n').filter((line) => line.trim() !== '');
}

test('piped default and explicit json produce the same canonical envelope', async (context) => {
  const { root } = await beganRoot(context);
  for (const command of ['status', 'check']) {
    const piped = await invoke([command, '--repo', root]);
    const explicit = await invoke([command, '--repo', root, '--format', 'json']);
    assert.equal(
      normalizeTiming(piped.stdout),
      normalizeTiming(explicit.stdout),
      `${command} piped default diverged from --format json`,
    );
    const parsed = JSON.parse(piped.stdout);
    assert.equal(parsed.schema, 'scopa.cli-result.v1');
    assert.equal(parsed.command, command);
  }
});

test('doctor json envelope is preserved and markdown is not json wrapped', async (context) => {
  const root = await temporaryRoot(context);
  const json = await invoke(['doctor', '--repo', root, '--format', 'json']);
  const parsed = JSON.parse(json.stdout);
  assert.equal(parsed.schema, 'scopa.cli-result.v1');
  assert.equal(parsed.result.schema, 'scopa.boundary-diagnostic.v1');

  const markdown = await invoke(['doctor', '--repo', root, '--format', 'markdown']);
  assert.equal(markdown.exitCode, 0);
  assert.match(markdown.stdout, /^# SCOPA boundary doctor proof$/mu);
  assert.equal(markdown.stdout.includes('"schema"'), false);
  assert.equal(markdown.stdout.includes('\\n'), false);
  assert.throws(() => JSON.parse(markdown.stdout));
});

test('doctor rejects an unsupported format', async (context) => {
  const root = await temporaryRoot(context);
  const outcome = await invoke(['doctor', '--repo', root, '--format', 'yaml']);
  const parsed = JSON.parse(outcome.stdout);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, 'SCOPA_CLI_USAGE');
  assert.match(parsed.error.message, /--format must be human, json, or markdown/u);
});

test('a terminal invocation renders human text without an envelope', async (context) => {
  const { root } = await beganRoot(context);
  const outcome = await invoke(['status', '--repo', root], { isTty: true });
  assert.equal(outcome.exitCode, 0);
  assert.match(outcome.stdout, /^SCOPA TASK STATUS$/mu);
  assert.equal(outcome.stdout.includes('"schema"'), false);
  assert.throws(() => JSON.parse(outcome.stdout));
});

test('begin renders the established boundary and a truthful blocked baseline', async (context) => {
  const root = await temporaryRoot(context);
  const outcome = await invoke([
    'begin', '--repo', root, '--format', 'human',
    '--request-json', beginRequest(FAILING_GATE),
  ]);
  assert.equal(outcome.exitCode, 4);
  assert.match(outcome.stdout, /^SCOPA TASK BOUNDARY ESTABLISHED$/mu);
  assert.match(outcome.stdout, /Completion {2}BLOCKED/u);
  assert.match(outcome.stdout, /Gates {7}0 passed \/ 1 failed \/ 0 timed out/u);
  assert.match(outcome.stdout, /Assurance {3}PARTIAL/u);
  assert.match(outcome.stdout, /truthful baseline/u);
  assert.match(outcome.stdout, /declared-gate/u);
});

test('check renders a satisfied result and preserves exit zero', async (context) => {
  const { root } = await beganRoot(context);
  const outcome = await invoke(['check', '--repo', root, '--format', 'human']);
  assert.equal(outcome.exitCode, 0);
  assert.match(outcome.stdout, /^SCOPA COMPLETION CHECK$/mu);
  assert.match(outcome.stdout, /Completion {2}SATISFIED/u);
  assert.match(outcome.stdout, /Gates {7}1 passed \/ 0 failed \/ 0 timed out/u);
  assert.match(outcome.stdout, /^PASS {2}declared-gate/mu);
});

test('check renders a blocked result from the stop state and preserves exit four', async (context) => {
  const { root } = await beganRoot(context, FAILING_GATE);
  const outcome = await invoke(['check', '--repo', root, '--format', 'human']);
  assert.equal(outcome.exitCode, 4);
  assert.match(outcome.stdout, /^SCOPA COMPLETION CHECK$/mu);
  assert.match(outcome.stdout, /Completion {2}BLOCKED/u);
  assert.match(outcome.stdout, /Gates {7}0 passed \/ 1 failed \/ 0 timed out/u);
  assert.match(outcome.stdout, /^FAIL {2}declared-gate — fail \(exit 1\)/mu);
  assert.match(outcome.stdout, /Model prose cannot override a blocked gate\./u);
});

test('status observes blocked state with exit zero and does not run gates', async (context) => {
  const { root } = await beganRoot(context, FAILING_GATE);
  const outcome = await invoke(['status', '--repo', root, '--format', 'human']);
  assert.equal(outcome.exitCode, 0);
  assert.match(outcome.stdout, /Completion {2}BLOCKED/u);
  assert.match(outcome.stdout, /Failing gates {2}declared-gate/u);
  assert.match(outcome.stdout, /it does not run the gates\./u);
});

test('human output stays bounded and free of machine vocabulary', async (context) => {
  const { root } = await beganRoot(context);
  const cases = [
    ['status', '--repo', root, '--format', 'human'],
    ['check', '--repo', root, '--format', 'human'],
    ['doctor', '--repo', root, '--format', 'human'],
  ];
  for (const args of cases) {
    const outcome = await invoke(args);
    const lines = nonblankLines(outcome.stdout);
    assert.ok(
      lines.length <= 20,
      `${args[0]} produced ${lines.length} nonblank lines`,
    );
    for (const term of ['schema', 'sha256', 'SHA-256', 'canStop', 'lockHash']) {
      assert.equal(
        outcome.stdout.includes(term),
        false,
        `${args[0]} human output leaked machine vocabulary: ${term}`,
      );
    }
  }
});

test('human output never presents an absent or unknown surface favorably', async (context) => {
  const { root } = await beganRoot(context);
  for (const args of [['status'], ['check'], ['begin']]) {
    const outcome = args[0] === 'begin'
      ? await invoke(['begin', '--repo', await temporaryRoot(context), '--format', 'human',
        '--request-json', beginRequest(PASSING_GATE)])
      : await invoke([args[0], '--repo', root, '--format', 'human']);
    for (const claim of ['secure', 'safe', 'sandboxed', 'fully controlled', 'certified']) {
      assert.equal(
        outcome.stdout.toLowerCase().includes(claim),
        false,
        `${args[0]} human output claimed: ${claim}`,
      );
    }
  }
});

test('begin human and json renders agree on completion and assurance', async (context) => {
  const root = await temporaryRoot(context);
  const json = await invoke([
    'begin', '--repo', root, '--format', 'json',
    '--request-json', beginRequest(PASSING_GATE),
  ]);
  const map = JSON.parse(json.stdout).result.boundaryMap;

  const humanRoot = await temporaryRoot(context);
  const human = await invoke([
    'begin', '--repo', humanRoot, '--format', 'human',
    '--request-json', beginRequest(PASSING_GATE),
  ]);
  assert.equal(map.completion.canStop, true);
  assert.match(human.stdout, /Completion {2}SATISFIED/u);
  assert.match(
    human.stdout,
    new RegExp(`Controlled ${map.summary.controlled} \\| Uncontrolled ${map.summary.uncontrolled}`, 'u'),
  );
  assert.equal(human.stdout.includes(map.bindings.sliceLockSha256), false);
});
