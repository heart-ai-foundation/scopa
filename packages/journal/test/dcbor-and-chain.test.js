import assert from 'node:assert/strict';
import test from 'node:test';
import { encode as encodeCbor } from 'cborg';
import {
  DcborValidationError,
  decodeDcbor,
  encodeDcbor,
} from '../src/dcbor.js';
import {
  JournalVerificationError,
  KERNEL_VERSION,
  RECORD_SCHEMA_VERSION,
  createChainCommitment,
  decodeRecord,
  sealRecord,
  verifyChain,
} from '../src/record.js';

const SCRIPT_HASH = 'a'.repeat(64);

function effect(seq) {
  return {
    category: 'CLOCK',
    payload: { clock: `clock-${seq}` },
    scope: 'root',
  };
}

function chain(length = 3) {
  const records = [];
  let previousHash = null;
  for (let seq = 0; seq < length; seq += 1) {
    const sealed = sealRecord({
      runId: 'chain-test',
      scriptHash: SCRIPT_HASH,
      seq,
      scope: 'root',
      effect: effect(seq),
      outcome: { status: 'fulfilled', value: seq },
      previousHash,
    });
    previousHash = sealed.hash;
    records.push(sealed.bytes);
  }
  return records;
}

test('SCOPA dCBOR encoding converges across object insertion order', () => {
  const left = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    kernelVersion: KERNEL_VERSION,
    payload: { z: 1, a: [true, null, new Uint8Array([1, 2, 3])] },
  };
  const right = {
    payload: { a: [true, null, new Uint8Array([1, 2, 3])], z: 1 },
    kernelVersion: KERNEL_VERSION,
    schemaVersion: RECORD_SCHEMA_VERSION,
  };
  assert.deepEqual(encodeDcbor(left), encodeDcbor(right));
  assert.deepEqual(decodeDcbor(encodeDcbor(left)), left);
});

test('SCOPA dCBOR subset rejects ambiguous values and text', () => {
  assert.throws(() => encodeDcbor({ value: 1.5 }), DcborValidationError);
  assert.throws(() => encodeDcbor({ value: undefined }), DcborValidationError);
  assert.throws(
    () => encodeDcbor({ value: 'e\u0301' }),
    (error) =>
      error instanceof DcborValidationError && /Unicode NFC/.test(error.message),
  );
  assert.throws(() => encodeDcbor(new Map([['a', 1]])), DcborValidationError);
  assert.throws(
    () => encodeDcbor({ value: '\ud800' }),
    (error) =>
      error instanceof DcborValidationError &&
      /unpaired surrogate/.test(error.message),
  );
  const arrayWithHiddenData = [1];
  arrayWithHiddenData.extra = 2;
  assert.throws(() => encodeDcbor(arrayWithHiddenData), DcborValidationError);
});

test('decoder rejects alternate encodings, duplicate keys, and non-NFC text', () => {
  assert.throws(
    () => decodeDcbor(new Uint8Array([0x18, 0x01])),
    DcborValidationError,
  );
  assert.throws(
    () =>
      decodeDcbor(
        new Uint8Array([0xa2, 0x61, 0x61, 0x01, 0x61, 0x61, 0x02]),
      ),
    DcborValidationError,
  );
  assert.throws(
    () => decodeDcbor(encodeCbor('e\u0301')),
    (error) =>
      error instanceof DcborValidationError && /Unicode NFC/.test(error.message),
  );
});

test('hash chain verifies against an external commitment', () => {
  const records = chain();
  const commitment = createChainCommitment(records);
  const report = verifyChain(records, commitment);

  assert.equal(report.ok, true);
  assert.equal(report.length, 3);
  assert.equal(report.rootHash, commitment.rootHash);
  assert.equal(report.records[0].schemaVersion, RECORD_SCHEMA_VERSION);
  assert.equal(report.records[0].kernelVersion, KERNEL_VERSION);
});

test('hash chain rejects mutation and suffix truncation', () => {
  const records = chain();
  const commitment = createChainCommitment(records);
  const mutated = records.map((bytes) => bytes.slice());
  mutated[1][mutated[1].length - 1] ^= 0x01;

  assert.throws(
    () => verifyChain(mutated, commitment),
    JournalVerificationError,
  );
  assert.throws(
    () => verifyChain(records.slice(0, -1), commitment),
    (error) =>
      error instanceof JournalVerificationError &&
      /length does not match commitment/.test(error.message),
  );
});

test('verification rejects injected fields and changed run pins', () => {
  const records = chain(2);
  const commitment = createChainCommitment(records);
  const injected = decodeRecord(records[0]);
  injected.uncommitted = true;
  assert.throws(
    () => verifyChain([encodeDcbor(injected), records[1]], commitment),
    JournalVerificationError,
  );

  const first = decodeRecord(records[0]);
  const second = sealRecord({
    runId: 'different-run',
    scriptHash: first.scriptHash,
    seq: 1,
    scope: first.scope,
    effect: effect(1),
    outcome: { status: 'fulfilled', value: 1 },
    previousHash: first.hash,
  });
  const changedPins = [records[0], second.bytes];
  assert.throws(
    () => verifyChain(changedPins, createChainCommitment(changedPins)),
    (error) =>
      error instanceof JournalVerificationError &&
      /run pins changed/.test(error.message),
  );
});

test('record hash covers schema, kernel pin, effect, result, and prior hash', () => {
  const records = chain(1);
  const record = decodeRecord(records[0]);
  assert.equal(record.schemaVersion, RECORD_SCHEMA_VERSION);
  assert.equal(record.kernelVersion, KERNEL_VERSION);
  assert.equal(record.previousHash, null);
  assert.match(record.hash, /^[0-9a-f]{64}$/);
  assert.deepEqual(record.effect, effect(0));
  assert.deepEqual(record.outcome, { status: 'fulfilled', value: 0 });
});

test('journal boundary rejects unknown effects and non-digest script pins', () => {
  assert.throws(
    () =>
      sealRecord({
        runId: 'bad-effect',
        scriptHash: SCRIPT_HASH,
        seq: 0,
        scope: 'root',
        effect: { category: 'NETWORK', payload: {}, scope: 'root' },
        outcome: { status: 'fulfilled', value: null },
      }),
    /invalid effect descriptor/,
  );
  assert.throws(
    () =>
      sealRecord({
        runId: 'bad-script-pin',
        scriptHash: 'not-a-digest',
        seq: 0,
        scope: 'root',
        effect: effect(0),
        outcome: { status: 'fulfilled', value: null },
      }),
    /scriptHash must be a lowercase SHA-256 digest/,
  );
});
