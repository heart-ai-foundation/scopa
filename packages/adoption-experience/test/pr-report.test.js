import assert from 'node:assert/strict';
import {
  copyFile,
  mkdtemp,
  readFile,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  PullRequestReportError,
  createPullRequestReport,
  loadPullRequestBoundaryCard,
  runPullRequestReport,
} from '../src/index.js';

const ROOT = path.resolve(new URL('../../..', import.meta.url).pathname);
const VALID_CARD = JSON.parse(await readFile(
  path.join(ROOT, 'fixtures/S41/valid-card.json'),
  'utf8',
));
const PRIVATE_TOKENS = [
  'PRIVATE_PATH_DO_NOT_SHARE',
  'PROMPT_INJECTION_DO_NOT_SHARE',
  'TOKEN_ghp_DO_NOT_SHARE',
];

async function workspace() {
  return mkdtemp(path.join(os.tmpdir(), 'scopa-s41-'));
}

function environment(root, overrides = {}) {
  return {
    GITHUB_WORKSPACE: root,
    GITHUB_STEP_SUMMARY: path.join(root, 'summary.md'),
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_EVENT_PATH: path.join(ROOT, 'fixtures/S41/pull-request-event.json'),
    INPUT_CARD_PATH: 'scopa-boundary.json',
    INPUT_COMMENT: 'false',
    INPUT_GITHUB_TOKEN: '',
    ...overrides,
  };
}

function assertSanitized(value) {
  for (const token of PRIVATE_TOKENS) assert.equal(value.includes(token), false);
  assert.doesNotMatch(value, /::(?:set-output|error|warning|notice)/u);
}

test('valid and missing evidence produce truthful sanitized fixed summaries', () => {
  const valid = createPullRequestReport(VALID_CARD);
  assert.equal(valid.evidence, 'validated-card');
  assert.match(valid.summary, /Completion: \*\*SATISFIED\*\*/u);
  assert.match(valid.summary, /Assurance: \*\*PARTIAL\*\*/u);
  assert.match(valid.summary, /not independent attestation/u);
  assert.match(valid.summary, /not approval, certification, or a safe-to-merge claim/u);
  assertSanitized(valid.summary);

  const missing = createPullRequestReport(null);
  assert.equal(missing.evidence, 'unavailable');
  assert.match(missing.summary, /Completion: \*\*UNKNOWN/u);
  assert.match(missing.summary, /No gate or project command was executed/u);
  assert.equal(missing.cardSha256, null);
});

test('report runner publishes only after bounded card validation and makes no default network call', async () => {
  const root = await workspace();
  await writeFile(
    path.join(root, 'scopa-boundary.json'),
    `${JSON.stringify(VALID_CARD)}\n`,
  );
  let fetchCalled = false;
  const report = await runPullRequestReport(environment(root), {
    fetchImpl() {
      fetchCalled = true;
      throw new Error('network must remain unused');
    },
  });
  assert.equal(fetchCalled, false);
  assert.equal(report.evidence, 'validated-card');
  assert.equal(await readFile(path.join(root, 'summary.md'), 'utf8'), report.summary);

  const missingRoot = await workspace();
  const missing = await runPullRequestReport(environment(missingRoot));
  assert.equal(missing.evidence, 'unavailable');
  assert.match(await readFile(path.join(missingRoot, 'summary.md'), 'utf8'), /UNKNOWN/u);
});

test('malformed, oversized, aliased, escaping, and injected cards fail before summary publication', async () => {
  const cases = [];

  const malformed = await workspace();
  await writeFile(
    path.join(malformed, 'scopa-boundary.json'),
    JSON.stringify({ ...VALID_CARD, prompt: PRIVATE_TOKENS[1] }),
  );
  cases.push([malformed, 'scopa-boundary.json']);

  const oversized = await workspace();
  await writeFile(
    path.join(oversized, 'scopa-boundary.json'),
    'x'.repeat(256 * 1024 + 1),
  );
  cases.push([oversized, 'scopa-boundary.json']);

  const aliased = await workspace();
  const outside = path.join(await workspace(), 'outside.json');
  await writeFile(outside, `${JSON.stringify(VALID_CARD)}\n`);
  await symlink(outside, path.join(aliased, 'scopa-boundary.json'));
  cases.push([aliased, 'scopa-boundary.json']);

  for (const [root, cardPath] of cases) {
    await assert.rejects(
      runPullRequestReport(environment(root, { INPUT_CARD_PATH: cardPath })),
      PullRequestReportError,
    );
    await assert.rejects(readFile(path.join(root, 'summary.md')));
  }

  const escaping = await workspace();
  await assert.rejects(
    loadPullRequestBoundaryCard({ workspace: escaping, cardPath: '../card.json' }),
    PullRequestReportError,
  );
});

test('comment transport is closed unless every explicit guard passes', async () => {
  const root = await workspace();
  await copyFile(
    path.join(ROOT, 'fixtures/S41/valid-card.json'),
    path.join(root, 'scopa-boundary.json'),
  );
  for (const overrides of [
    { INPUT_COMMENT: 'true' },
    { INPUT_COMMENT: 'true', INPUT_GITHUB_TOKEN: 'test-token', GITHUB_EVENT_NAME: 'push' },
    { INPUT_COMMENT: 'yes', INPUT_GITHUB_TOKEN: 'test-token' },
  ]) {
    const isolated = await workspace();
    await copyFile(
      path.join(ROOT, 'fixtures/S41/valid-card.json'),
      path.join(isolated, 'scopa-boundary.json'),
    );
    await assert.rejects(
      runPullRequestReport(environment(isolated, overrides)),
      PullRequestReportError,
    );
    await assert.rejects(readFile(path.join(isolated, 'summary.md')));
  }

  let request = null;
  const report = await runPullRequestReport(environment(root, {
    INPUT_COMMENT: 'true',
    INPUT_GITHUB_TOKEN: 'test-token',
  }), {
    async fetchImpl(url, options) {
      request = { url, options };
      return { ok: true, status: 201 };
    },
  });
  assert.equal(
    request.url,
    'https://api.github.com/repos/example/scopa-consumer/issues/42/comments',
  );
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(request.options.body), { body: report.comment });
  assert.equal(report.comment.includes('test-token'), false);
  assertSanitized(report.comment);
});

test('action and workflow keep the default pull-request path least privilege', async () => {
  const [action, workflow] = await Promise.all([
    readFile(path.join(ROOT, '.github/actions/scopa-boundary-check/action.yml'), 'utf8'),
    readFile(path.join(ROOT, '.github/workflows/scopa-boundary-check.yml'), 'utf8'),
  ]);
  assert.match(action, /default: "false"/u);
  assert.match(action, /github-token:[\s\S]*default: ""/u);
  assert.doesNotMatch(action, /actions\/github-script|pull-requests: write/u);
  assert.match(workflow, /^on:\n  pull_request:/mu);
  assert.match(workflow, /permissions:\n  contents: read/u);
  assert.doesNotMatch(workflow, /pull-requests:\s*write|issues:\s*write/u);
  assert.match(workflow, /persist-credentials: false/u);
  assert.match(workflow, /comment: "false"/u);
  assert.doesNotMatch(
    workflow,
    /npm (?:ci|install)|scopa (?:begin|check)|run:\s*[^\n]*\$\{\{/u,
  );
});
