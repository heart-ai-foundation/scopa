import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { MemoryAppendOnlyStore } from '../../journal/src/memory-store.js';
import { createChainCommitment, decodeRecord } from '../../journal/src/record.js';
import { evaluateReplayEquivalence } from '../../conformance/src/replay-equivalence.js';
import {
  ACT_CATEGORIES,
  EFFECT_CATEGORIES,
  OBSERVE_CATEGORIES,
  PRINCIPAL_CATEGORIES,
  EffectDescriptorError,
  assertEffectDescriptor,
} from '../src/effects.js';
import { executeLiveWorkflow, replayWorkflow } from '../src/executor.js';
import {
  IdempotencyConflictError,
  MemoryIdempotencyLedger,
  PendingActError,
} from '../src/idempotency.js';

const SCRIPT_HASH = 'b'.repeat(64);

function workflow() {
  return (function* () {
    const clock = yield {
      category: 'CLOCK',
      payload: { clock: 'wall' },
      scope: 'root',
    };
    const receipt = yield {
      category: 'TOOL.COMMAND',
      idempotencyKey: 'command-1',
      payload: { command: 'deploy', clock },
      scope: 'root',
    };
    return { clock, receipt };
  })();
}

function shell(counter) {
  return {
    async fulfill(effect) {
      counter.push(effect.category);
      if (effect.category === 'CLOCK') return { value: 1_700_000_000_000 };
      return { value: { accepted: true, receipt: 'receipt-1' } };
    },
  };
}

async function live(options = {}) {
  const calls = options.calls ?? [];
  const result = await executeLiveWorkflow({
    workflow,
    shell: shell(calls),
    store: options.store ?? new MemoryAppendOnlyStore(),
    idempotency: options.idempotency ?? new MemoryIdempotencyLedger(),
    runId: options.runId ?? 'run-1',
    scriptHash: SCRIPT_HASH,
    scope: 'root',
  });
  return { result, calls };
}

test('effect taxonomy is the exact frozen ABI', () => {
  assert.deepEqual(EFFECT_CATEGORIES, [
    'CLOCK',
    'ENTROPY',
    'SOURCE.INGEST',
    'SOURCE.EXTRACT',
    'INFER',
    'TOOL.QUERY',
    'TOOL.COMMAND',
    'EMIT',
    'SIGN',
    'DECISION',
  ]);
  assert.equal(Object.isFrozen(EFFECT_CATEGORIES), true);
  assert.equal(Object.isFrozen(OBSERVE_CATEGORIES), true);
  assert.equal(Object.isFrozen(ACT_CATEGORIES), true);
  assert.equal(Object.isFrozen(PRINCIPAL_CATEGORIES), true);
});

test('effect descriptors use a closed schema and ACT requires idempotency', () => {
  assert.throws(
    () =>
      assertEffectDescriptor({
        category: 'NETWORK',
        payload: {},
        scope: 'root',
      }),
    EffectDescriptorError,
  );
  assert.throws(
    () =>
      assertEffectDescriptor({
        category: 'TOOL.COMMAND',
        payload: {},
        scope: 'root',
      }),
    /requires an idempotencyKey/,
  );
  assert.throws(
    () =>
      assertEffectDescriptor({
        category: 'CLOCK',
        idempotencyKey: 'not-allowed',
        payload: {},
        scope: 'root',
      }),
    /cannot carry an idempotencyKey/,
  );
  assert.throws(
    () =>
      assertEffectDescriptor({
        category: 'CLOCK',
        payload: {},
        scope: 'root',
        hidden: true,
      }),
    /unknown fields/,
  );
});

test('execution loop yields, fulfills, seals, and replays without a shell', async () => {
  const { result, calls } = await live();
  assert.deepEqual(calls, ['CLOCK', 'TOOL.COMMAND']);
  assert.equal(result.records.length, 2);
  assert.deepEqual(result.output, {
    clock: 1_700_000_000_000,
    receipt: { accepted: true, receipt: 'receipt-1' },
  });

  const replay = await replayWorkflow({
    workflow,
    records: result.records,
    commitment: result.commitment,
    runId: 'run-1',
    scriptHash: SCRIPT_HASH,
    scope: 'root',
  });
  assert.deepEqual(replay.output, result.output);
  assert.equal(replay.recordsConsumed, 2);
  assert.equal(replay.stats.suppressedActs, 1);
});

test('a completed ACT idempotency key suppresses second execution', async () => {
  const ledger = new MemoryIdempotencyLedger();
  const firstCalls = [];
  const secondCalls = [];
  const first = await live({ idempotency: ledger, calls: firstCalls });
  const second = await live({
    idempotency: ledger,
    calls: secondCalls,
    runId: 'run-2',
  });

  assert.deepEqual(firstCalls, ['CLOCK', 'TOOL.COMMAND']);
  assert.deepEqual(secondCalls, ['CLOCK']);
  assert.equal(first.result.stats.suppressedActs, 0);
  assert.equal(second.result.stats.suppressedActs, 1);
  assert.equal(decodeRecord(second.result.records[1]).outcome.status, 'suppressed');
});

test('pending and conflicting ACT reservations fail safely', () => {
  const ledger = new MemoryIdempotencyLedger();
  ledger.claim('key', 'hash-a');
  assert.throws(() => ledger.claim('key', 'hash-a'), PendingActError);
  assert.throws(() => ledger.claim('key', 'hash-b'), IdempotencyConflictError);
});

test('real core composes with the S0 replay-equivalence harness', async () => {
  let commitment;
  const report = await evaluateReplayEquivalence({
    async runLive() {
      const execution = (await live()).result;
      commitment = execution.commitment;
      return {
        output: execution.output,
        journal: execution.records,
        emitted: [],
      };
    },
    async runReplay(source) {
      const records = [source.next(), source.next()];
      const replay = await replayWorkflow({
        workflow,
        records,
        commitment,
        runId: 'run-1',
        scriptHash: SCRIPT_HASH,
        scope: 'root',
      });
      return { output: replay.output, emitted: [] };
    },
  });
  assert.equal(report.ok, true);
  assert.equal(report.consumedEffects, 2);
});

test('lockdown removes ambient authority and dependencies still execute', (context) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'scopa-lockdown-'));
  context.after(() => rmSync(tempRoot, { recursive: true, force: true }));
  const outputPath = path.join(tempRoot, 'lockdown.json');
  const result = spawnSync(process.execPath, [
    'packages/kernel-core/src/lockdown-probe.js',
    '--output',
    outputPath,
  ], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(readFileSync(outputPath, 'utf8'));
  assert.equal(report.ok, true);
  assert.deepEqual(
    report.authorities.map(({ name, denied }) => ({ name, denied })),
    [
      { name: 'Date.now', denied: true },
      { name: 'Math.random', denied: true },
      { name: 'Math.sin', denied: true },
      { name: 'process', denied: true },
      { name: 'fetch', denied: true },
      { name: 'Deno', denied: true },
      { name: 'crypto', denied: true },
      { name: 'performance', denied: true },
      { name: 'setTimeout', denied: true },
      { name: 'console', denied: true },
      { name: 'WebSocket', denied: true },
    ],
  );
  assert.match(report.vectorRootHash, /^[0-9a-f]{64}$/);
});
