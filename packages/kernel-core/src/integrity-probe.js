#!/usr/bin/env node

import { encodeDcbor } from '../../journal/src/dcbor.js';
import {
  createChainCommitment,
  sealRecord,
  verifyChain,
} from '../../journal/src/record.js';

function makeRecord(seq, previousHash) {
  return sealRecord({
    runId: 'integrity-probe',
    scriptHash: 'c'.repeat(64),
    seq,
    scope: 'root',
    effect: {
      category: 'CLOCK',
      payload: { clock: 'wall' },
      scope: 'root',
    },
    outcome: { status: 'fulfilled', value: 1_700_000_000_000 + seq },
    previousHash,
  });
}

const first = makeRecord(0, null);
const second = makeRecord(1, first.hash);
const records = [first.bytes, second.bytes];
const commitment = createChainCommitment(records);
const clean = verifyChain(records, commitment);

const changed = {
  ...second.record,
  outcome: {
    ...second.record.outcome,
    value: second.record.outcome.value + 1,
  },
};

function finding(operation) {
  try {
    operation();
    return { rejected: false, code: null };
  } catch (error) {
    return {
      rejected: true,
      code: error.code ?? null,
      message: error.message,
    };
  }
}

const report = {
  schema: 'scopa.integrity-probe.v1',
  ok: clean.ok,
  commitment,
  clean: {
    verified: clean.ok,
    length: clean.length,
    rootHash: clean.rootHash,
  },
  mutation: finding(() =>
    verifyChain([first.bytes, encodeDcbor(changed)], commitment),
  ),
  truncation: finding(() => verifyChain([first.bytes], commitment)),
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (
  !report.ok ||
  !report.mutation.rejected ||
  !report.truncation.rejected
) {
  process.exitCode = 1;
}
