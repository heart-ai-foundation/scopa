import assert from 'node:assert/strict';
import { appendFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { FileAppendOnlyStore } from '../../journal/src/file-store.js';
import { decodeRecord } from '../../journal/src/record.js';
import {
  ACT_CHECKPOINTS,
  executeLiveWorkflow,
} from '../src/executor.js';
import {
  PendingActError,
  PersistentIdempotencyLedger,
} from '../src/idempotency.js';

const SCRIPT_HASH = '7'.repeat(64);
const RUN_ID = 's17-crash-resume';
const ACT = Object.freeze({
  category: 'TOOL.COMMAND',
  idempotencyKey: 's17-crash-resume-command',
  payload: { command: 'publish-once' },
  scope: 'root',
});

function workflow() {
  return (function* () {
    return yield ACT;
  })();
}

async function actionCount(actionPath) {
  try {
    const text = await readFile(actionPath, 'utf8');
    return text.trim().length === 0 ? 0 : text.trim().split('\n').length;
  } catch (error) {
    if (error.code === 'ENOENT') return 0;
    throw error;
  }
}

function runtime(root, actionPath, options = {}) {
  return executeLiveWorkflow({
    workflow,
    shell: {
      async fulfill() {
        await appendFile(actionPath, 'mutation\n', { mode: 0o600 });
        return { value: { receipt: 'mutation-receipt' } };
      },
    },
    store: new FileAppendOnlyStore(path.join(root, 'journal.scopa')),
    idempotency: new PersistentIdempotencyLedger(
      path.join(root, 'idempotency'),
    ),
    runId: RUN_ID,
    scriptHash: SCRIPT_HASH,
    scope: 'root',
    ...options,
  });
}

test('ACT crash checkpoints are a frozen, closed lifecycle', () => {
  assert.equal(Object.isFrozen(ACT_CHECKPOINTS), true);
  assert.deepEqual(ACT_CHECKPOINTS, [
    'reservation-durable',
    'fulfillment-returned',
    'receipt-durable',
    'journal-durable',
  ]);
});

for (const checkpoint of ACT_CHECKPOINTS) {
  test(`restart at ${checkpoint} never duplicates an admitted mutation`, async (context) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s17-crash-'));
    context.after(() => rm(root, { recursive: true, force: true }));
    const actionPath = path.join(root, 'actions.log');
    let injected = false;

    await assert.rejects(
      () => runtime(root, actionPath, {
        onActCheckpoint(observed) {
          assert.equal(Object.isFrozen(observed), true);
          assert.equal(observed.idempotencyKey, ACT.idempotencyKey);
          assert.equal(observed.runId, RUN_ID);
          assert.equal(observed.scope, 'root');
          assert.equal(observed.seq, 0);
          assert.match(observed.descriptorHash, /^[0-9a-f]{64}$/);
          if (observed.checkpoint !== checkpoint) return;
          injected = true;
          throw new Error(`simulated crash at ${checkpoint}`);
        },
      }),
      new RegExp(`simulated crash at ${checkpoint}`),
    );
    assert.equal(injected, true);

    const mutationWasAdmitted = checkpoint !== 'reservation-durable';
    assert.equal(await actionCount(actionPath), mutationWasAdmitted ? 1 : 0);

    if (
      checkpoint === 'reservation-durable' ||
      checkpoint === 'fulfillment-returned'
    ) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await assert.rejects(
          () => runtime(root, actionPath),
          (error) => {
            assert.equal(error instanceof PendingActError, true);
            assert.equal(error.code, 'SCOPA_ACT_PENDING');
            assert.equal(error.disposition, 'reconciliation-required');
            assert.equal(error.key, ACT.idempotencyKey);
            assert.match(error.descriptorHash, /^[0-9a-f]{64}$/);
            return true;
          },
        );
      }
      assert.equal(await actionCount(actionPath), mutationWasAdmitted ? 1 : 0);
      return;
    }

    const resumed = await runtime(root, actionPath);
    const repeated = await runtime(root, actionPath);
    assert.deepEqual(resumed.output, { receipt: 'mutation-receipt' });
    assert.deepEqual(repeated.output, resumed.output);
    assert.equal(await actionCount(actionPath), 1);
    assert.equal(decodeRecord(resumed.records[0]).outcome.status, 'fulfilled');
    assert.equal(resumed.stats.recoveredActs, checkpoint === 'receipt-durable' ? 1 : 0);
    assert.equal(resumed.stats.resumedRecords, checkpoint === 'journal-durable' ? 1 : 0);
  });
}

test('non-function ACT checkpoint observers fail before mutation admission', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s17-hook-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const actionPath = path.join(root, 'actions.log');
  await assert.rejects(
    () => runtime(root, actionPath, { onActCheckpoint: true }),
    /onActCheckpoint must be a function/,
  );
  assert.equal(await actionCount(actionPath), 0);
});
