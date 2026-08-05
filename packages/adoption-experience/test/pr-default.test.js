import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  createPullRequestReport,
} from '../src/index.js';

const ROOT = path.resolve(new URL('../../..', import.meta.url).pathname);
const VALID_CARD = JSON.parse(await readFile(
  path.join(ROOT, 'fixtures/S41/valid-card.json'),
  'utf8',
));

test('missing evidence gives one fixed correction without a favorable result', () => {
  const report = createPullRequestReport(null);
  assert.equal(report.evidence, 'unavailable');
  assert.equal(report.cardSha256, null);
  assert.match(report.summary, /observed only that the configured card file is absent/u);
  assert.match(report.summary, /Completion: \*\*UNKNOWN/u);
  assert.match(report.summary, /Assurance: \*\*UNKNOWN/u);
  assert.match(report.summary, /Scope: \*\*UNKNOWN/u);
  assert.match(
    report.summary,
    /scopa view --format json --output scopa-boundary\.json/u,
  );
  assert.match(report.summary, /No gate or project command was executed/u);
  assert.match(report.summary, /No pull-request text or card-supplied command was executed/u);
  assert.match(report.summary, /Missing evidence is not a pass, approval, certification, or safe-to-merge result/u);
  assert.doesNotMatch(report.summary, /✅|SATISFIED|PASS(?:ED)?/u);
});

test('observed changes qualify the PR headline without changing canonical completion', () => {
  const observedCard = {
    ...VALID_CARD,
    observed: {
      basis: 'git-tracked-working-tree-observation-not-enforcement',
      versionControlledChanges: 2,
      outsideAllowedPaths: 1,
      declaredNonGoalContacts: 1,
    },
  };
  const report = createPullRequestReport(observedCard);
  assert.equal(observedCard.completion.status, 'satisfied');
  assert.equal(observedCard.completion.canStop, true);
  assert.match(report.summary, /Completion: \*\*SATISFIED — WITH UNVERIFIED CHANGES\*\*/u);
  assert.match(report.summary, /2 total, 1 outside allowed paths, 1 recognized non-goal contacts/u);
  assert.match(report.summary, /reporting only/u);
  assert.doesNotMatch(report.summary, /PRIVATE_PATH|package\.json|changing dependencies/u);
});

test('inside-only observation stays satisfied while retaining aggregate facts', () => {
  const report = createPullRequestReport({
    ...VALID_CARD,
    observed: {
      basis: 'git-tracked-working-tree-observation-not-enforcement',
      versionControlledChanges: 1,
      outsideAllowedPaths: 0,
      declaredNonGoalContacts: 0,
    },
  });
  assert.match(report.summary, /Completion: \*\*SATISFIED\*\*/u);
  assert.doesNotMatch(report.summary, /WITH UNVERIFIED CHANGES/u);
  assert.match(report.summary, /1 total, 0 outside allowed paths/u);
});
