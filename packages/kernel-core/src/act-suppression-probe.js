#!/usr/bin/env node

import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MemoryAppendOnlyStore } from '../../journal/src/memory-store.js';
import { executeLiveWorkflow } from './executor.js';
import { PersistentIdempotencyLedger } from './idempotency.js';

function workflow() {
  return (function* () {
    return yield {
      category: 'TOOL.COMMAND',
      idempotencyKey: 'suppression-probe-v1',
      payload: { command: 'publish' },
      scope: 'root',
    };
  })();
}

const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-suppression-probe-'));
const ledgerPath = path.join(root, 'idempotency');
let executions = 0;
const shell = {
  async fulfill() {
    executions += 1;
    return { value: { receipt: 'durable-receipt-v1' } };
  },
};

async function run(runId) {
  return executeLiveWorkflow({
    workflow,
    shell,
    store: new MemoryAppendOnlyStore(),
    idempotency: new PersistentIdempotencyLedger(ledgerPath),
    runId,
    scriptHash: 'd'.repeat(64),
    scope: 'root',
  });
}

try {
  const first = await run('suppression-probe-first');
  const second = await run('suppression-probe-resumed');
  const report = {
    schema: 'scopa.act-suppression-probe.v1',
    ok: executions === 1 && second.stats.suppressedActs === 1,
    shellExecutions: executions,
    first: first.stats,
    resumed: second.stats,
    receipt: second.output,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
