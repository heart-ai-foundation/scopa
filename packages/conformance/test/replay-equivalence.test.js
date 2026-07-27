import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  assertReplayEquivalent,
  evaluateReplayEquivalence,
  ReplayDivergenceError,
} from '../src/replay-equivalence.js';
import {
  runSyntheticWorkflow,
  sequenceObserver,
} from '../../kernel-core/src/synthetic-workflow.js';
import { generateReplayCases } from './generators.js';

async function fixture(relativePath) {
  return JSON.parse(
    await readFile(new URL(`../../../fixtures/${relativePath}`, import.meta.url), 'utf8'),
  );
}

function harnessFor(definition) {
  return {
    runLive: (context) =>
      runSyntheticWorkflow({
        plan: definition.plan,
        mode: 'live',
        observe: sequenceObserver(structuredClone(definition.observations)),
        observeHidden: sequenceObserver(structuredClone(definition.liveHidden ?? {})),
        onUnexpectedEffect: context.reportUnexpectedEffect,
      }),
    runReplay: (replaySource, context) =>
      runSyntheticWorkflow({
        plan: definition.plan,
        mode: 'replay',
        replaySource,
        observeHidden: sequenceObserver(
          structuredClone(definition.replayHidden ?? {}),
        ),
        onUnexpectedEffect: context.reportUnexpectedEffect,
      }),
  };
}

test('clean golden workflow replays equivalently', async () => {
  const report = await assertReplayEquivalent(
    harnessFor(await fixture('golden/replay-workflow.json')),
  );
  assert.deepEqual(report, await fixture('golden/replay-report.json'));
});

test('injected hidden effect fails loudly at the divergent output', async () => {
  const options = harnessFor(await fixture('faults/hidden-effect-workflow.json'));
  const report = await evaluateReplayEquivalence(options);

  assert.equal(report.ok, false);
  assert.deepEqual(report.differences, [
    {
      path: '$.output.value',
      reason: 'values differ',
      live: 23,
      replay: 31,
    },
    {
      path: '$.emitted[0].value',
      reason: 'values differ',
      live: 23,
      replay: 31,
    },
    {
      path: '$.unexpectedEffects',
      reason: 'an effect escaped the journal boundary',
      live: 0,
      replay: 2,
    },
  ]);

  await assert.rejects(
    assertReplayEquivalent(options),
    (error) =>
      error instanceof ReplayDivergenceError &&
      error.code === 'SCOPA_REPLAY_DIVERGENCE' &&
      error.report.differences[0].path === '$.output.value',
  );
});

test('actual journal consumption is measured by a harness-owned source', async () => {
  const report = await evaluateReplayEquivalence({
    runLive: async () => ({
      output: { value: 7 },
      emitted: [],
      journal: [
        {
          seq: 0,
          category: 'CLOCK',
          request: { key: 'clock' },
          result: { value: 7 },
        },
      ],
    }),
    runReplay: async () => ({
      output: { value: 7 },
      emitted: [],
      consumedEffects: 1,
    }),
  });

  assert.equal(report.ok, false);
  assert.deepEqual(report.differences, [
    {
      path: '$.consumedEffects',
      reason: 'replay did not consume every journal record through the harness',
      live: 1,
      replay: 0,
    },
  ]);
});

test('canceling hidden effects fail even when output and emissions match', async () => {
  const report = await evaluateReplayEquivalence(
    harnessFor(await fixture('faults/canceling-hidden-effects-workflow.json')),
  );

  assert.equal(report.output.value, 5);
  assert.deepEqual(report.differences, [
    {
      path: '$.unexpectedEffects',
      reason: 'an effect escaped the journal boundary',
      live: 0,
      replay: 4,
    },
  ]);
});

test('distinct Date outputs are compared by value', async () => {
  const report = await evaluateReplayEquivalence({
    runLive: async () => ({
      output: { observedAt: new Date(0) },
      journal: [],
    }),
    runReplay: async () => ({
      output: { observedAt: new Date(1) },
    }),
  });

  assert.equal(report.ok, false);
  assert.deepEqual(report.differences, [
    {
      path: '$.output.observedAt',
      reason: 'date values differ',
      live: '1970-01-01T00:00:00.000Z',
      replay: '1970-01-01T00:00:00.001Z',
    },
  ]);
});

test('generated synthetic workflows preserve the replay-equivalence property', async () => {
  const cases = generateReplayCases({ seed: 0x5c0fa, count: 256 });
  for (const definition of cases) {
    const report = await assertReplayEquivalent(harnessFor(definition));
    assert.equal(report.ok, true);
    assert.equal(
      report.journalEntries,
      definition.observations ? Object.keys(definition.observations).length : 0,
    );
  }
});

test('replay fails closed when a journal effect does not match the plan', async () => {
  const definition = await fixture('golden/replay-workflow.json');
  const options = harnessFor(definition);
  const live = await options.runLive({ reportUnexpectedEffect() {} });
  live.journal[1].category = 'TOOL.QUERY';

  await assert.rejects(
    options.runReplay(
      {
        next() {
          return live.journal.shift();
        },
      },
      { reportUnexpectedEffect() {} },
    ),
    /journal effect 1 does not match the synthetic plan/,
  );
});
