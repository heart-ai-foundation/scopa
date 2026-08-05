import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import test from 'node:test';
import { invokeCaptured } from '../src/subprocess.js';

const ROOT = path.resolve(new URL('../../..', import.meta.url).pathname);
const FIRST_INSIGHT_LIMIT_MS = 30_000;
const PRIVATE_NON_GOAL = 'changing dependencies';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    assert.fail(`${label} did not return JSON: ${error.message}`);
  }
}

async function inventory(root) {
  return (await readdir(root, { recursive: true })).sort();
}

async function invokeCli(cli, cwd, args, expectedExitCodes = [0]) {
  return invokeCaptured(process.execPath, [cli, ...args], {
    cwd,
    env: { PATH: process.env.PATH },
    expectedExitCodes,
  });
}

async function packAndInstall(temporary) {
  const packed = await invokeCaptured('npm', [
    'pack', '--json', '--pack-destination', temporary,
  ], {
    cwd: ROOT,
    env: {
      PATH: process.env.PATH,
      npm_config_audit: 'false',
      npm_config_fund: 'false',
      npm_config_update_notifier: 'false',
    },
  });
  const records = parseJson(packed.stdout, 'npm pack');
  assert.equal(records.length, 1);
  const record = records[0];
  assert.equal(record.name, '@heart-ai-foundation/scopa');
  const archive = path.join(temporary, record.filename);
  const archiveBytes = await readFile(archive);
  assert.equal(archiveBytes.length, record.size);
  assert.match(record.integrity, /^sha512-/u);

  const toolRoot = path.join(temporary, 'tool');
  await mkdir(toolRoot);
  await writeFile(
    path.join(toolRoot, 'package.json'),
    '{"name":"scopa-s50-tool","private":true}\n',
  );
  await invokeCaptured('npm', [
    'install', '--ignore-scripts', '--no-audit', '--no-fund', '--offline',
    '--package-lock=false', archive,
  ], {
    cwd: toolRoot,
    env: {
      PATH: process.env.PATH,
      npm_config_audit: 'false',
      npm_config_fund: 'false',
      npm_config_offline: 'true',
      npm_config_update_notifier: 'false',
    },
  });
  const installed = path.join(
    toolRoot,
    'node_modules/@heart-ai-foundation/scopa',
  );
  const cli = path.join(installed, 'packages/cli/src/cli.js');
  await readFile(cli);
  await readFile(path.join(installed, 'packages/adoption-experience/src/boundary-card.js'));
  return {
    archive,
    archiveSha256: sha256(archiveBytes),
    cli,
    installed,
    packedFiles: record.files.map((entry) => entry.path).sort(),
  };
}

function beginRequest() {
  return JSON.stringify({
    schema: 'scopa.begin-request.v1',
    sliceId: 's50-native-non-goal',
    outcome: 'qualify native out-of-scope presentation',
    allowedPaths: ['src/**'],
    gates: [{
      id: 'candidate-gate',
      command: ['node', '-e', 'process.exit(0)'],
      cwd: '.',
      timeoutMs: 30000,
    }],
    nonGoals: [PRIVATE_NON_GOAL],
    clientProfile: 'generic',
  });
}

async function initializeGitTarget(root) {
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'src/index.js'), 'export const value = 1;\n');
  await writeFile(
    path.join(root, 'package.json'),
    '{"name":"s50-target","version":"1.0.0"}\n',
  );
  await invokeCaptured('git', ['init', '--quiet'], { cwd: root });
  await invokeCaptured('git', ['add', 'package.json', 'src/index.js'], { cwd: root });
  await invokeCaptured('git', [
    '-c', 'user.name=SCOPA Qualification',
    '-c', 'user.email=scopa-qualification@example.invalid',
    'commit', '--quiet', '-m', 'baseline',
  ], { cwd: root });
}

function assertPrivateProjection(value, temporary, target) {
  for (const forbidden of [
    temporary,
    target,
    'package.json',
    'new-root.txt',
    'src/new.js',
    PRIVATE_NON_GOAL,
  ]) assert.equal(value.includes(forbidden), false, `projection disclosed ${forbidden}`);
}

test('packed candidate closes the native non-goal presentation exposure', async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s50-'));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const candidate = await packAndInstall(temporary);

  for (const required of [
    'README.md',
    'SCOPA_AGENT.md',
    'packages/adoption-experience/src/boundary-card.js',
    'packages/adoption-experience/src/pr-report.js',
    'packages/enforcement/src/change-observation.js',
    'packages/cli/src/cli.js',
  ]) assert.ok(candidate.packedFiles.includes(required), `candidate omitted ${required}`);

  const firstContact = path.join(temporary, 'first-contact');
  await mkdir(firstContact);
  await writeFile(
    path.join(firstContact, 'package.json'),
    '{"name":"s50-first-contact","private":true}\n',
  );
  const firstBefore = await inventory(firstContact);
  const started = performance.now();
  const insight = await invokeCli(candidate.cli, firstContact, []);
  const firstInsightMs = performance.now() - started;
  assert.ok(firstInsightMs < FIRST_INSIGHT_LIMIT_MS, `first insight took ${firstInsightMs}ms`);
  assert.match(insight.stdout, /^SCOPA boundary snapshot$/mu);
  assert.equal(insight.stderr, '');
  assert.deepEqual(await inventory(firstContact), firstBefore);

  const preview = parseJson((await invokeCli(candidate.cli, firstContact, [
    'assistant', 'install', '--dry-run', '--repo', firstContact,
  ])).stdout, 'marker-free assistant preview');
  assert.equal(preview.result.plan.client, 'generic');
  assert.equal(preview.result.plan.targets[0].path, '.agents/skills/scopa/SKILL.md');
  assert.deepEqual(await inventory(firstContact), firstBefore);

  const installedAssistant = parseJson((await invokeCli(candidate.cli, firstContact, [
    'assistant', 'install', '--format', 'json', '--repo', firstContact,
  ])).stdout, 'installed generic assistant');
  assert.equal(installedAssistant.result.status, 'installed');
  const installedSkill = await readFile(path.join(
    firstContact,
    '.agents/skills/scopa/SKILL.md',
  ), 'utf8');
  assert.match(installedSkill, /scopa check --format json/u);
  assert.match(installedSkill, /scopa view --format json/u);
  const installedAgentEntry = await readFile(
    path.join(candidate.installed, 'SCOPA_AGENT.md'),
    'utf8',
  );
  assert.match(installedAgentEntry, /^scopa view --format json$/mu);

  const target = path.join(temporary, 'native-violation');
  await mkdir(target);
  await initializeGitTarget(target);
  const begun = parseJson((await invokeCli(candidate.cli, target, [
    'begin', '--format', 'json', '--request-json', beginRequest(), '--repo', target,
  ])).stdout, 'installed begin');
  assert.equal(begun.result.boundaryMap.completion.canStop, true);

  await writeFile(
    path.join(target, 'package.json'),
    '{"name":"s50-target","version":"1.0.0","dependencies":{}}\n',
  );
  await writeFile(path.join(target, 'src/new.js'), 'export const fresh = true;\n');
  await writeFile(path.join(target, 'new-root.txt'), 'outside and untracked\n');

  const checked = parseJson((await invokeCli(candidate.cli, target, [
    'check', '--format', 'json', '--repo', target,
  ])).stdout, 'installed final check');
  assert.equal(checked.result.canStop, true);

  const installedApp = await import(pathToFileURL(path.join(
    candidate.installed,
    'packages/cli/src/app.js',
  )).href);
  let humanCheck = '';
  const humanCheckExit = await installedApp.runCli([
    'check', '--repo', target,
  ], {
    isTty: true,
    write(value) { humanCheck += value; },
  });
  assert.equal(humanCheckExit, 0);
  assert.match(humanCheck, /SATISFIED — WITH UNVERIFIED CHANGES/u);
  assert.match(humanCheck, /1 tracked \/ 2 untracked \/ 2 outside \/ 1 non-goal contacts/u);

  const jsonCardText = (await invokeCli(candidate.cli, target, [
    'view', '--format', 'json', '--repo', target,
  ])).stdout;
  const card = parseJson(jsonCardText, 'installed Boundary Card');
  assert.equal(card.completion.status, 'satisfied');
  assert.equal(card.completion.canStop, true);
  assert.deepEqual(card.observed, {
    basis: 'git-working-tree-observation-not-enforcement',
    declaredNonGoalContacts: 1,
    outsideAllowedPaths: 2,
    untrackedChanges: 2,
    versionControlledChanges: 1,
  });

  const terminal = (await invokeCli(candidate.cli, target, [
    'view', '--format', 'terminal', '--repo', target,
  ])).stdout;
  assert.match(terminal, /SATISFIED — WITH UNVERIFIED CHANGES/u);
  assert.match(terminal, /Tracked 1 \| Untracked 2 \| Outside allowed paths 2 \| Recognized non-goal contacts 1/u);

  const badge = (await invokeCli(candidate.cli, target, [
    'view', '--format', 'badge', '--repo', target,
  ])).stdout;
  assert.match(badge, /PARTIAL · ACTIVE UNCONTROLLED ROUTE/u);
  assert.match(badge, /2 UNTRACKED · 2 OUTSIDE · 1 NON-GOAL CONTACT/u);
  assert.doesNotMatch(badge, /\b(?:grade|score|pass|approved|certified)\b/iu);

  const installedReport = await import(pathToFileURL(path.join(
    candidate.installed,
    'packages/adoption-experience/src/pr-report.js',
  )).href);
  const pr = installedReport.createPullRequestReport(card);
  assert.match(pr.summary, /SATISFIED — WITH UNVERIFIED CHANGES/u);
  assert.match(pr.summary, /1 tracked, 2 untracked, 2 outside allowed paths, 1 recognized non-goal contacts/u);

  for (const projection of [jsonCardText, terminal, badge, pr.summary]) {
    assertPrivateProjection(projection, temporary, target);
  }

  assert.match(candidate.archiveSha256, /^[0-9a-f]{64}$/u);
});

test('public 0.4.0 remains an exact immutable compatibility baseline', async () => {
  const baseline = parseJson(await readFile(
    path.join(ROOT, 'fixtures/S50/public-0.4.0-baseline.json'),
    'utf8',
  ), 'public baseline manifest');
  assert.equal(baseline.schema, 'scopa.public-baseline.v1');
  assert.equal(baseline.version, '0.4.0');
  assert.equal(baseline.tag, 'v0.4.0');

  const tagType = await invokeCaptured('git', ['cat-file', '-t', baseline.tag], {
    cwd: ROOT,
  });
  assert.equal(tagType.stdout.trim(), 'tag');
  const resolved = await invokeCaptured('git', [
    'rev-parse', `${baseline.tag}^{commit}`,
  ], { cwd: ROOT });
  assert.equal(resolved.stdout.trim(), baseline.commit);

  const taggedPackage = await invokeCaptured('git', [
    'show', `${baseline.tag}:package.json`,
  ], { cwd: ROOT });
  assert.equal(parseJson(taggedPackage.stdout, 'tagged package').version, '0.4.0');

  for (const fixture of baseline.fixtures) {
    const bytes = await readFile(path.join(ROOT, fixture.path));
    assert.equal(sha256(bytes), fixture.sha256, `${fixture.path} drifted`);
    const envelope = parseJson(bytes.toString('utf8'), fixture.path);
    assert.equal(envelope.schema, 'scopa.cli-result.v1');
  }
});
