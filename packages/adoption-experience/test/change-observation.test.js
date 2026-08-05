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
import Ajv2020 from 'ajv/dist/2020.js';
import {
  canonicalJsonPretty,
  observeVersionControlledChanges,
} from '../../enforcement/src/index.js';
import {
  beginSlice,
  createBoundaryCard,
  renderBoundaryCardHtml,
  renderBoundaryCardTerminal,
  validateBoundaryCard,
} from '../src/index.js';
import { executeCommand } from '../../cli/src/command.js';

const execFileAsync = promisify(execFile);
const cardSchema = JSON.parse(await readFile(
  new URL('../../../schemas/scopa.boundary-card.v1.schema.json', import.meta.url),
  'utf8',
));
const validateSchema = new Ajv2020({ strict: true }).compile(cardSchema);

async function git(root, args) {
  return execFileAsync('git', args, { cwd: root, encoding: 'utf8' });
}

async function repository(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s46-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'src/index.js'), 'export const value = 1;\n');
  await writeFile(path.join(root, 'package.json'), '{"name":"s46-fixture"}\n');
  await git(root, ['init', '-q']);
  await git(root, ['add', 'src/index.js', 'package.json']);
  await git(root, [
    '-c', 'user.name=SCOPA Test',
    '-c', 'user.email=scopa@example.invalid',
    'commit', '-q', '-m', 'fixture',
  ]);
  return root;
}

function request() {
  return {
    schema: 'scopa.begin-request.v1',
    sliceId: 'S46-observation',
    outcome: 'observe without claiming enforcement',
    allowedPaths: ['src/**'],
    gates: [{
      id: 'passing-gate',
      command: [process.execPath, '-e', 'process.exit(0)'],
      cwd: '.',
      timeoutMs: 5000,
    }],
    nonGoals: ['changing dependencies'],
    clientProfile: 'generic',
  };
}

async function observation(root, map) {
  return observeVersionControlledChanges({
    repoRoot: root,
    allowedPaths: map.scope.allowedPaths,
    nonGoals: map.scope.nonGoals,
  });
}

test('real Git polarity separates tracked, outside, and non-goal counts', async (context) => {
  const root = await repository(context);
  const { boundaryMap } = await beginSlice({ repoRoot: root, request: request() });

  const clean = await observation(root, boundaryMap);
  assert.deepEqual(clean.summary, {
    versionControlledChanges: 0,
    untrackedChanges: 0,
    outsideAllowedPaths: 0,
    declaredNonGoalContacts: 0,
  });

  await writeFile(path.join(root, 'src/index.js'), 'export const value = 2;\n');
  const inside = await observation(root, boundaryMap);
  assert.deepEqual(inside.summary, {
    versionControlledChanges: 1,
    untrackedChanges: 0,
    outsideAllowedPaths: 0,
    declaredNonGoalContacts: 0,
  });

  await writeFile(path.join(root, 'package.json'), '{"name":"s46-fixture","dependencies":{}}\n');
  const outside = await observation(root, boundaryMap);
  assert.deepEqual(outside.summary, {
    versionControlledChanges: 2,
    untrackedChanges: 0,
    outsideAllowedPaths: 1,
    declaredNonGoalContacts: 1,
  });
  assert.deepEqual(outside.changes.map((item) => item.path), [
    'package.json',
    'src/index.js',
  ]);
});

test('card qualifies only the headline and never projects observed paths', async (context) => {
  const root = await repository(context);
  const { boundaryMap } = await beginSlice({ repoRoot: root, request: request() });
  await writeFile(path.join(root, 'package.json'), '{"name":"s46-fixture","dependencies":{}}\n');
  const observed = await observation(root, boundaryMap);
  const card = createBoundaryCard(boundaryMap, { observation: observed });
  const terminal = renderBoundaryCardTerminal(card);
  const html = renderBoundaryCardHtml(card);
  const json = canonicalJsonPretty(card);

  assert.equal(card.completion.status, 'satisfied');
  assert.equal(card.completion.canStop, true);
  assert.match(terminal, /SATISFIED — WITH UNVERIFIED CHANGES/u);
  assert.match(html, /SATISFIED — WITH UNVERIFIED CHANGES/iu);
  assert.equal(validateSchema(card), true, JSON.stringify(validateSchema.errors));
  for (const rendered of [terminal, html, json]) {
    assert.equal(rendered.includes('package.json'), false);
    assert.equal(rendered.includes('changing dependencies'), false);
    assert.equal(rendered.includes(root), false);
  }
  assert.match(terminal, /Observed does not mean prevented, controlled, attributed, or unauthorized\./u);
});

test('view command wires the real observation into the privacy-minimized card', async (context) => {
  const root = await repository(context);
  const begun = await beginSlice({ repoRoot: root, request: request() });
  await writeFile(path.join(root, 'package.json'), '{"name":"s46-fixture","dependencies":{}}\n');
  const viewed = await executeCommand([
    'view', '--format', 'json', '--repo', root,
  ]);

  assert.equal(viewed.exitCode, 0);
  assert.deepEqual(viewed.envelope.result.card.observed, {
    basis: 'git-working-tree-observation-not-enforcement',
    declaredNonGoalContacts: 1,
    outsideAllowedPaths: 1,
    untrackedChanges: 0,
    versionControlledChanges: 1,
  });
  assert.equal(viewed.envelope.result.card.completion.canStop, true);
  assert.equal(viewed.envelope.result.card.completion.status, 'satisfied');
  assert.equal(
    viewed.envelope.result.card.sourceMapSha256,
    createBoundaryCard(begun.boundaryMap).sourceMapSha256,
  );
  assert.equal(viewed.envelope.result.content.includes('package.json'), false);
  assert.equal(viewed.envelope.result.content.includes('changing dependencies'), false);
});

test('ordinary untracked files are counted and classified without path disclosure', async (context) => {
  const root = await repository(context);
  const begun = await beginSlice({ repoRoot: root, request: request() });
  await writeFile(path.join(root, 'new-root-file.txt'), 'untracked outside scope\n');
  await writeFile(path.join(root, 'src/new-file.js'), 'export const fresh = true;\n');

  const observed = await observation(root, begun.boundaryMap);
  assert.deepEqual(observed.summary, {
    versionControlledChanges: 0,
    untrackedChanges: 2,
    outsideAllowedPaths: 1,
    declaredNonGoalContacts: 0,
  });
  const card = createBoundaryCard(begun.boundaryMap, { observation: observed });
  const terminal = renderBoundaryCardTerminal(card);
  const json = canonicalJsonPretty(card);
  assert.match(terminal, /Tracked 0 \| Untracked 2 \| Outside allowed paths 1/u);
  for (const output of [terminal, json]) {
    assert.equal(output.includes('new-root-file.txt'), false);
    assert.equal(output.includes('src/new-file.js'), false);
  }
});

test('legacy cards remain valid and do not invent observation', async (context) => {
  const root = await repository(context);
  const { boundaryMap } = await beginSlice({ repoRoot: root, request: request() });
  const legacy = createBoundaryCard(boundaryMap);
  assert.equal(Object.hasOwn(legacy, 'observed'), false);
  assert.deepEqual(validateBoundaryCard(legacy), legacy);
  assert.equal(validateSchema(legacy), true, JSON.stringify(validateSchema.errors));
  assert.match(renderBoundaryCardTerminal(legacy), /SATISFIED — all declared gates passed/u);
});

test('non-Git repositories preserve the optional observation boundary', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s46-no-git-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const observed = await observeVersionControlledChanges({
    repoRoot: root,
    allowedPaths: ['src/**'],
    nonGoals: [],
  });
  assert.equal(observed, null);
});
