import assert from 'node:assert/strict';
import {
  access,
  mkdtemp,
  readFile,
  readdir,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  BoundaryCardError,
  beginSlice,
  createBoundaryCard,
  renderBoundaryCardHtml,
  renderBoundaryCardTerminal,
  validateBoundaryCard,
} from '../src/index.js';
import {
  executeCommand,
} from '../../cli/src/command.js';
import {
  runCli,
} from '../../cli/src/app.js';
import {
  canonicalJsonPretty,
  jsonHash,
} from '../../enforcement/src/index.js';

const PRIVATE_TOKENS = [
  'private-API-key-SECRET',
  'prompt-injection-DO-NOT-SHARE',
  'customer-gate-name',
];

function request() {
  return {
    schema: 'scopa.begin-request.v1',
    sliceId: 'S40-card',
    outcome: 'Render a privacy-minimized Boundary Card',
    allowedPaths: [`${PRIVATE_TOKENS[0]}/**`],
    gates: [{
      id: PRIVATE_TOKENS[2],
      command: ['/usr/bin/true'],
      cwd: '.',
      timeoutMs: 5_000,
    }],
    nonGoals: [PRIVATE_TOKENS[1]],
    clientProfile: 'generic',
  };
}

async function repository() {
  return mkdtemp(path.join(os.tmpdir(), 'scopa-s40-'));
}

async function initialized() {
  const root = await repository();
  const result = await beginSlice({ repoRoot: root, request: request() });
  return { root, map: result.boundaryMap };
}

function assertPrivateTokensAbsent(value) {
  for (const token of PRIVATE_TOKENS) assert.equal(value.includes(token), false);
}

test('one validated card preserves canonical polarity while withholding source detail', async () => {
  const { map } = await initialized();
  const card = createBoundaryCard(map);
  assert.equal(card.schema, 'scopa.boundary-card.v1');
  assert.equal(card.sourceMapSha256, jsonHash(map));
  assert.equal(card.completion.status, map.completion.status);
  assert.equal(card.completion.canStop, map.completion.canStop);
  assert.equal(card.assurance.level, 'partial');
  assert.deepEqual(card.surfaces, map.summary);
  assert.deepEqual(card.scope, { allowedPathRules: 1, nonGoals: 1 });
  assertPrivateTokensAbsent(canonicalJsonPretty(card));
  assert.equal(Object.hasOwn(card, 'paths'), false);
});

test('terminal, JSON, and accessible standalone HTML render deterministic card semantics', async () => {
  const { map } = await initialized();
  const card = createBoundaryCard(map);
  const terminal = renderBoundaryCardTerminal(card);
  const html = renderBoundaryCardHtml(card);
  assert.equal(renderBoundaryCardTerminal(card), terminal);
  assert.equal(renderBoundaryCardHtml(card), html);
  for (const rendered of [terminal, html, canonicalJsonPretty(card)]) {
    assertPrivateTokensAbsent(rendered);
    assert.match(rendered, new RegExp(card.sourceMapSha256, 'u'));
  }
  assert.match(terminal, /PARTIAL — an active route can bypass SCOPA/u);
  assert.match(html, /^<!doctype html>/u);
  assert.match(html, /<html lang="en">/u);
  assert.match(html, /<main [^>]*data-completion="satisfied"/u);
  assert.match(html, /aria-labelledby="card-title"/u);
  assert.match(html, /name="viewport"/u);
  assert.match(html, /prefers-color-scheme/u);
  assert.doesNotMatch(html, /<script|\son[a-z]+=|https?:|url\(/iu);
  assert.match(html, /not a safety, security, compliance, readiness, certification, or sandbox claim/u);
});

test('card validator rejects favorable or inconsistent semantic drift', async () => {
  const { map } = await initialized();
  const card = createBoundaryCard(map);
  const mutations = [
    (value) => { value.assurance.level = 'full'; },
    (value) => { value.surfaces.unknown += 1; },
    (value) => { value.completion.canStop = false; },
    (value) => { value.completion.gates.passed = 0; },
    (value) => { value.scope.allowedPathRules = 0; },
    (value) => { value.score = 100; },
  ];
  for (const mutate of mutations) {
    const candidate = structuredClone(card);
    mutate(candidate);
    assert.throws(() => validateBoundaryCard(candidate), BoundaryCardError);
  }
});

test('CLI default view is read-only and explicit export is exact and no-replace', async () => {
  const { root } = await initialized();
  const before = await readdir(root, { recursive: true });
  let output = '';
  const exitCode = await runCli(['view', '--repo', root], {
    write(value) { output += value; },
  });
  assert.equal(exitCode, 0);
  assert.match(output, /^SCOPA BOUNDARY CARD/u);
  assert.deepEqual(await readdir(root, { recursive: true }), before);

  const viewed = await executeCommand([
    'view', '--format', 'html', '--output', 'boundary.html', '--repo', root,
  ]);
  assert.equal(viewed.exitCode, 0);
  const bytes = await readFile(path.join(root, 'boundary.html'), 'utf8');
  assert.equal(bytes, viewed.envelope.result.content);
  assert.equal(viewed.envelope.result.export.bytes, Buffer.byteLength(bytes));
  assertPrivateTokensAbsent(bytes);
  await assert.rejects(
    executeCommand([
      'view', '--format', 'html', '--output', 'boundary.html', '--repo', root,
    ]),
    (error) => error.code === 'SCOPA_BOUNDARY_CARD_CONFLICT',
  );
  await assert.rejects(
    executeCommand([
      'view', '--format', 'json', '--output', '../escape.json', '--repo', root,
    ]),
    BoundaryCardError,
  );
  await assert.rejects(access(path.join(path.dirname(root), 'escape.json')));
});
