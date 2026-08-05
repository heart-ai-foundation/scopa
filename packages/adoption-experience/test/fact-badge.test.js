import assert from 'node:assert/strict';
import {
  access,
  mkdtemp,
  readFile,
  rm,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  beginSlice,
  createBoundaryCard,
  renderBoundaryBadgeSvg,
} from '../src/index.js';
import { executeCommand } from '../../cli/src/command.js';
import { runCli } from '../../cli/src/app.js';

const PRIVATE = [
  'PRIVATE_BADGE_PATH',
  'PRIVATE_BADGE_NON_GOAL',
  'PRIVATE_BADGE_GATE',
];
const ROOT = path.resolve(new URL('../../..', import.meta.url).pathname);
const FIXED_CARD = JSON.parse(await readFile(
  path.join(ROOT, 'fixtures/S41/valid-card.json'),
  'utf8',
));
const EXPECTED_BADGE = await readFile(
  path.join(ROOT, 'fixtures/S49/expected-partial-badge.svg'),
  'utf8',
);

function request() {
  return {
    schema: 'scopa.begin-request.v1',
    sliceId: 's49-fact-badge',
    outcome: 'render a fact-only adopter badge',
    allowedPaths: [`${PRIVATE[0]}/**`],
    gates: [{
      id: PRIVATE[2],
      command: ['node', '-e', 'process.exit(0)'],
      cwd: '.',
      timeoutMs: 30000,
    }],
    nonGoals: [PRIVATE[1]],
    clientProfile: 'generic',
  };
}

async function initialized(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s49-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const result = await beginSlice({ repoRoot: root, request: request() });
  return { root, map: result.boundaryMap };
}

function observedCard(map, outside = 1, nonGoal = 1, untracked = 0) {
  const count = Math.max(outside, nonGoal, untracked, 1);
  const changes = Array.from({ length: count }, (_, index) => ({
    path: `observed-${index}.txt`,
    tracked: index >= untracked,
    outsideAllowedPaths: index < outside,
    declaredNonGoalContact: index < nonGoal,
  }));
  return createBoundaryCard(map, {
    observation: {
      schema: 'scopa.change-observation.v1',
      basis: 'git-working-tree-observation-not-enforcement',
      changes,
      summary: {
        versionControlledChanges: count - untracked,
        untrackedChanges: untracked,
        outsideAllowedPaths: outside,
        declaredNonGoalContacts: nonGoal,
      },
    },
  });
}

function assertFactOnly(svg) {
  for (const forbidden of [
    /\bgrade\b/iu,
    /\bscore\b/iu,
    /\bpass(?:ed)?\b/iu,
    /\bapprov(?:al|ed)\b/iu,
    /\bcertif(?:y|ied|ication)\b/iu,
    /safe.to.merge/iu,
    /risk.rank/iu,
  ]) assert.doesNotMatch(svg, forbidden);
}

test('badge is deterministic, accessible, source-bound, and fact-only', async (context) => {
  const { map } = await initialized(context);
  const card = observedCard(map);
  const svg = renderBoundaryBadgeSvg(card);
  assert.equal(renderBoundaryBadgeSvg(card), svg);
  assert.match(svg, /^<svg /u);
  assert.match(svg, /role="img"/u);
  assert.match(svg, /<title id="scopa-badge-title">/u);
  assert.match(svg, /<desc id="scopa-badge-description">/u);
  assert.match(svg, /PARTIAL · ACTIVE UNCONTROLLED ROUTE/u);
  assert.match(svg, /0 UNTRACKED · 1 OUTSIDE · 1 NON-GOAL CONTACT/u);
  assert.match(svg, new RegExp(card.sourceMapSha256, 'u'));
  assert.doesNotMatch(svg, /<script|<foreignObject|\son[a-z]+=|href=|url\(/iu);
  for (const value of PRIVATE) assert.equal(svg.includes(value), false);
  assertFactOnly(svg);
});

test('fixed validated card renders the exact reviewed badge bytes', () => {
  assert.equal(renderBoundaryBadgeSvg(FIXED_CARD), EXPECTED_BADGE);
  assertFactOnly(EXPECTED_BADGE);
});

test('unavailable and zero observation remain explicit rather than favorable', async (context) => {
  const { map } = await initialized(context);
  const unavailable = renderBoundaryBadgeSvg(createBoundaryCard(map));
  assert.match(unavailable, /WORKING-TREE OBSERVATION UNAVAILABLE/u);
  const zero = renderBoundaryBadgeSvg(observedCard(map, 0, 0));
  assert.match(zero, /0 UNTRACKED · 0 OUTSIDE · 0 NON-GOAL CONTACTS/u);
  const untracked = renderBoundaryBadgeSvg(observedCard(map, 1, 0, 1));
  assert.match(untracked, /1 UNTRACKED · 1 OUTSIDE · 0 NON-GOAL CONTACTS/u);
  assertFactOnly(unavailable);
  assertFactOnly(zero);
});

test('CLI badge stdout and no-replace export are exact projections', async (context) => {
  const { root } = await initialized(context);
  let stdout = '';
  const stdoutExit = await runCli([
    'view', '--format', 'badge', '--repo', root,
  ], {
    write(value) { stdout += value; },
  });
  assert.equal(stdoutExit, 0);
  assert.match(stdout, /^<svg /u);
  assert.doesNotMatch(stdout, /scopa\.cli-result\.v1/u);

  const viewed = await executeCommand([
    'view', '--format', 'badge', '--repo', root,
  ]);
  assert.equal(viewed.exitCode, 0);
  assert.equal(viewed.envelope.result.format, 'badge');
  assert.equal(
    viewed.envelope.result.content,
    renderBoundaryBadgeSvg(viewed.envelope.result.card),
  );

  const exported = await executeCommand([
    'view', '--format', 'badge', '--output', 'scopa-boundary.svg', '--repo', root,
  ]);
  const bytes = await readFile(path.join(root, 'scopa-boundary.svg'), 'utf8');
  assert.equal(bytes, exported.envelope.result.content);
  await assert.rejects(
    executeCommand([
      'view', '--format', 'badge', '--output', 'scopa-boundary.svg', '--repo', root,
    ]),
    (error) => error.code === 'SCOPA_BOUNDARY_CARD_CONFLICT',
  );
  await assert.rejects(access(path.join(root, '.scopa', 'scopa-boundary.svg')));
});
