import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  DemoError,
  renderDemoTerminal,
  runDemo,
  validateDemoResult,
} from '../src/index.js';
import {
  runCli,
} from '../../cli/src/app.js';

const ROOT = path.resolve(new URL('../../..', import.meta.url).pathname);
const EXPECTED = await readFile(
  path.join(ROOT, 'fixtures/S42/expected-output.txt'),
  'utf8',
);

test('demo uses real fault paths, reaches truthful correction, and is deterministic', async () => {
  const first = await runDemo();
  const second = await runDemo();
  assert.deepEqual(second, first);
  assert.deepEqual(first.faults, [
    {
      id: 'scope-escape',
      injected: true,
      accepted: false,
      evidenceCode: 'SCOPA_SCOPE_DENIED',
    },
    {
      id: 'asserted-completion',
      injected: true,
      accepted: false,
      evidenceCode: 'SCOPA_COMPLETION_BLOCKED',
    },
    {
      id: 'assurance-overclaim',
      injected: true,
      accepted: false,
      evidenceCode: 'SCOPA_ADAPTER_SCHEMA_INVALID',
    },
  ]);
  assert.deepEqual(first.terminal, {
    status: 'satisfied',
    canStop: true,
    assurance: 'partial',
    uncontrolled: 4,
    sourceMapSha256: first.terminal.sourceMapSha256,
  });
  assert.equal(first.cleanup.temporaryRepositoryRemoved, true);
  assert.equal(renderDemoTerminal(first), EXPECTED);
  assert.doesNotMatch(EXPECTED, /\/tmp\/|scopa-demo-[A-Za-z0-9]+/u);
});

test('demo validator rejects staged or false-green results', async () => {
  const result = await runDemo();
  const mutations = [
    (value) => { value.faults[0].accepted = true; },
    (value) => { value.faults[1].injected = false; },
    (value) => { value.faults[2].evidenceCode = 'claimed'; },
    (value) => { value.terminal.canStop = false; },
    (value) => { value.terminal.assurance = 'full'; },
    (value) => { value.cleanup.temporaryRepositoryRemoved = false; },
    (value) => { value.benchmark = 'fastest'; },
  ];
  for (const mutate of mutations) {
    const candidate = structuredClone(result);
    mutate(candidate);
    assert.throws(() => validateDemoResult(candidate), DemoError);
  }
});

test('one CLI command leaves the caller repository untouched and makes no network call', async () => {
  const caller = await mkdtemp(path.join(os.tmpdir(), 'scopa-demo-caller-'));
  await writeFile(path.join(caller, 'sentinel'), 'unchanged\n');
  const before = await readdir(caller, { recursive: true });
  const originalFetch = globalThis.fetch;
  let networkCalled = false;
  globalThis.fetch = async () => {
    networkCalled = true;
    throw new Error('demo network use is forbidden');
  };
  let output = '';
  try {
    const exitCode = await runCli(['demo'], {
      write(value) { output += value; },
    });
    assert.equal(exitCode, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(output, EXPECTED);
  assert.equal(networkCalled, false);
  assert.deepEqual(await readdir(caller, { recursive: true }), before);
  assert.equal(await readFile(path.join(caller, 'sentinel'), 'utf8'), 'unchanged\n');

  let jsonOutput = '';
  await runCli(['demo', '--format', 'json'], {
    write(value) { jsonOutput += value; },
  });
  assert.equal(JSON.parse(jsonOutput).schema, 'scopa.demo-result.v1');
});

test('README and demo guide contain the exact tested terminal proof', async () => {
  const [readme, guide, handoff] = await Promise.all([
    readFile(path.join(ROOT, 'README.md'), 'utf8'),
    readFile(path.join(ROOT, 'docs/DEMO.md'), 'utf8'),
    readFile(path.join(ROOT, 'docs/ORGANIZATIONAL_REVIEW.md'), 'utf8'),
  ]);
  assert.equal(readme.includes(EXPECTED.trimEnd()), true);
  assert.equal(guide.includes(EXPECTED.trimEnd()), true);
  assert.match(handoff, /optional/u);
  assert.match(handoff, /free result is complete/u);
  assert.match(handoff, /without an account,[\s\S]*telemetry, lead capture/u);
  assert.doesNotMatch(handoff, /<form|mailto:|tracking pixel/iu);
});
