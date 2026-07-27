import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { MemoryAppendOnlyStore } from '../../journal/src/memory-store.js';
import { decodeRecord } from '../../journal/src/record.js';
import { effectHash } from '../src/effects.js';
import { executeLiveWorkflow } from '../src/executor.js';
import {
  PendingActError,
  PersistentIdempotencyLedger,
} from '../src/idempotency.js';

const ACT = {
  category: 'TOOL.COMMAND',
  idempotencyKey: 'persistent-command-v1',
  payload: { command: 'publish' },
  scope: 'root',
};
const SCRIPT_HASH = 'e'.repeat(64);

function workflow() {
  return (function* () {
    return yield ACT;
  })();
}

function run(ledger, shell, runId = 'persistent-ledger-run') {
  return executeLiveWorkflow({
    workflow,
    shell,
    store: new MemoryAppendOnlyStore(),
    idempotency: ledger,
    runId,
    scriptHash: SCRIPT_HASH,
    scope: 'root',
  });
}

test('persistent ACT receipt suppresses execution after process-style restart', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-ledger-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const ledgerPath = path.join(root, 'idempotency');
  const digest = 'a'.repeat(64);
  let calls = 0;
  const shell = {
    async fulfill() {
      calls += 1;
      return {
        value: { receipt: 'durable-receipt' },
        blobRefs: [digest],
      };
    },
  };

  const first = await run(
    new PersistentIdempotencyLedger(ledgerPath),
    shell,
  );
  const second = await run(
    new PersistentIdempotencyLedger(ledgerPath),
    shell,
    'persistent-ledger-run-2',
  );

  assert.equal(calls, 1);
  assert.equal(first.stats.suppressedActs, 0);
  assert.equal(second.stats.suppressedActs, 1);
  const suppressed = decodeRecord(second.records[0]);
  assert.equal(suppressed.outcome.status, 'suppressed');
  assert.deepEqual(suppressed.blobRefs, [digest]);
  assert.deepEqual(suppressed.outcome.value, { receipt: 'durable-receipt' });
});

test('a durable pending reservation blocks uncertain ACT re-execution', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-pending-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const ledgerPath = path.join(root, 'idempotency');
  const descriptorHash = effectHash(ACT);
  const first = new PersistentIdempotencyLedger(ledgerPath);
  await first.claim(ACT.idempotencyKey, descriptorHash);

  const resumed = new PersistentIdempotencyLedger(ledgerPath);
  await assert.rejects(
    () => resumed.claim(ACT.idempotencyKey, descriptorHash),
    PendingActError,
  );
});

test('independent persistent ledger instances atomically select one claimant', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-claim-race-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const ledgerPath = path.join(root, 'idempotency');
  const descriptorHash = effectHash(ACT);
  const results = await Promise.allSettled([
    new PersistentIdempotencyLedger(ledgerPath).claim(
      ACT.idempotencyKey,
      descriptorHash,
    ),
    new PersistentIdempotencyLedger(ledgerPath).claim(
      ACT.idempotencyKey,
      descriptorHash,
    ),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const rejection = results.find((result) => result.status === 'rejected');
  assert.equal(rejection.reason instanceof PendingActError, true);
});

test('separate processes cannot both claim the same ACT key', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-process-claim-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const ledgerPath = path.join(root, 'idempotency');
  const actionPath = path.join(root, 'actions.log');
  const descriptorHash = effectHash(ACT);
  const worker = new URL('./idempotency-claim-worker.js', import.meta.url);
  const launch = () =>
    new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [
        worker.pathname,
        ledgerPath,
        actionPath,
        ACT.idempotencyKey,
        descriptorHash,
      ]);
      let output = '';
      let errors = '';
      child.stdout.on('data', (chunk) => {
        output += chunk;
      });
      child.stderr.on('data', (chunk) => {
        errors += chunk;
      });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve(output.trim());
        else reject(new Error(errors || `worker exited ${code}`));
      });
    });
  const outcomes = await Promise.all([launch(), launch()]);
  assert.deepEqual(outcomes.sort(), ['claimed', 'pending']);
  const actions = (await readFile(actionPath, 'utf8')).trim().split('\n');
  assert.equal(actions.length, 1);
});

test('completed ACT carries a sealed recovery record across append failure', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-act-recovery-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const ledgerPath = path.join(root, 'idempotency');
  let calls = 0;
  const shell = {
    async fulfill() {
      calls += 1;
      return { value: { receipt: 'recoverable' } };
    },
  };
  const failedStore = new MemoryAppendOnlyStore();
  failedStore.append = async () => {
    throw new Error('simulated journal append crash');
  };
  await assert.rejects(
    () =>
      executeLiveWorkflow({
        workflow,
        shell,
        store: failedStore,
        idempotency: new PersistentIdempotencyLedger(ledgerPath),
        runId: 'recoverable-run',
        scriptHash: SCRIPT_HASH,
        scope: 'root',
      }),
    /simulated journal append crash/,
  );

  const recovered = await executeLiveWorkflow({
    workflow,
    shell,
    store: new MemoryAppendOnlyStore(),
    idempotency: new PersistentIdempotencyLedger(ledgerPath),
    runId: 'recoverable-run',
    scriptHash: SCRIPT_HASH,
    scope: 'root',
  });
  assert.equal(calls, 1);
  assert.equal(recovered.stats.recoveredActs, 1);
  assert.equal(recovered.stats.suppressedActs, 0);
  assert.equal(decodeRecord(recovered.records[0]).outcome.status, 'fulfilled');
});

test('resume replays an existing OBSERVE prefix before repairing a sealed ACT', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-prefix-recovery-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const ledgerPath = path.join(root, 'idempotency');
  class FailActAppendOnceStore extends MemoryAppendOnlyStore {
    calls = 0;

    async append(bytes) {
      this.calls += 1;
      if (this.calls === 2) throw new Error('simulated ACT append crash');
      return super.append(bytes);
    }
  }
  const store = new FailActAppendOnceStore();
  const calls = [];
  const observeThenAct = () =>
    (function* () {
      const clock = yield {
        category: 'CLOCK',
        payload: { clock: 'wall' },
        scope: 'root',
      };
      return yield {
        category: 'TOOL.COMMAND',
        idempotencyKey: 'prefix-recovery-act',
        payload: { clock, command: 'publish' },
        scope: 'root',
      };
    })();
  const shell = {
    async fulfill(effect) {
      calls.push(effect.category);
      if (effect.category === 'CLOCK') return { value: 1_700_000_000_000 };
      return { value: { receipt: 'performed-once' } };
    },
  };
  const options = {
    workflow: observeThenAct,
    shell,
    store,
    runId: 'prefix-recovery-run',
    scriptHash: SCRIPT_HASH,
    scope: 'root',
  };
  await assert.rejects(
    () =>
      executeLiveWorkflow({
        ...options,
        idempotency: new PersistentIdempotencyLedger(ledgerPath),
      }),
    /simulated ACT append crash/,
  );
  const recovered = await executeLiveWorkflow({
    ...options,
    idempotency: new PersistentIdempotencyLedger(ledgerPath),
  });

  assert.deepEqual(calls, ['CLOCK', 'TOOL.COMMAND']);
  assert.equal(recovered.records.length, 2);
  assert.equal(recovered.stats.resumedRecords, 1);
  assert.equal(recovered.stats.recoveredActs, 1);
  assert.deepEqual(recovered.output, { receipt: 'performed-once' });
});
