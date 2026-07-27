import { bytesToHex, concatBytes } from '../../journal/src/bytes.js';
import { MemoryAppendOnlyStore } from '../../journal/src/memory-store.js';
import { hashHex } from '../../journal/src/hash.js';
import { executeLiveWorkflow } from './executor.js';
import { MemoryIdempotencyLedger } from './idempotency.js';
import { compileLockedWorkflow } from './locked-workflow.js';

export const CROSS_RUNTIME_WORKFLOW_SOURCE = `function* () {
  const clock = yield {
    category: 'CLOCK',
    payload: { clock: 'wall' },
    scope: 'root'
  };
  const entropy = yield {
    category: 'ENTROPY',
    payload: { bytes: 4 },
    scope: 'root'
  };
  const receipt = yield {
    category: 'TOOL.COMMAND',
    idempotencyKey: 'vector-command-v1',
    payload: { command: 'publish', value: clock + entropy },
    scope: 'root'
  };
  return { clock, entropy, receipt };
}`;

export async function runCrossRuntimeVector() {
  const store = new MemoryAppendOnlyStore();
  const shell = {
    async fulfill(effect) {
      if (effect.category === 'CLOCK') return { value: 1_700_000_000_000 };
      if (effect.category === 'ENTROPY') return { value: 42 };
      if (effect.category === 'TOOL.COMMAND') {
        return { value: { accepted: true, receipt: 'fixed-receipt-v1' } };
      }
      throw new Error(`unexpected category: ${effect.category}`);
    },
  };
  const execution = await executeLiveWorkflow({
    workflow: () => compileLockedWorkflow(CROSS_RUNTIME_WORKFLOW_SOURCE),
    shell,
    store,
    idempotency: new MemoryIdempotencyLedger(),
    runId: 'cross-runtime-vector-v1',
    scriptHash: hashHex(new TextEncoder().encode(CROSS_RUNTIME_WORKFLOW_SOURCE)),
    scope: 'root',
  });
  return {
    schema: 'scopa.cross-runtime-vector.v1',
    commitment: execution.commitment,
    output: execution.output,
    recordHex: execution.records.map(bytesToHex),
    recordsSha256: hashHex(concatBytes(...execution.records)),
  };
}
