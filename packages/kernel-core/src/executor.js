import { bytesEqual } from '../../journal/src/bytes.js';
import { decodeDcbor, encodeDcbor, validateDcborValue } from '../../journal/src/dcbor.js';
import {
  createChainCommitment,
  decodeRecord,
  sealRecord,
  verifyChain,
} from '../../journal/src/record.js';
import { assertEffectDescriptor, effectHash, effectKind } from './effects.js';

export class WorkflowExecutionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WorkflowExecutionError';
    this.code = 'SCOPA_WORKFLOW_EXECUTION_INVALID';
    this.details = details;
  }
}

function clone(value) {
  return decodeDcbor(encodeDcbor(value));
}

function startWorkflow(workflow) {
  const iterator = typeof workflow === 'function' ? workflow() : workflow;
  if (!iterator || typeof iterator.next !== 'function') {
    throw new WorkflowExecutionError('workflow must be a generator or generator factory');
  }
  return iterator;
}

function nextPure(iterator, input) {
  const step = iterator.next(input);
  if (!step || typeof step !== 'object' || typeof step.then === 'function') {
    throw new WorkflowExecutionError('kernel core must be a synchronous pure generator');
  }
  return step;
}

function validateRunOptions({ runId, scriptHash, scope }) {
  for (const [label, value] of Object.entries({ runId, scope })) {
    if (typeof value !== 'string' || value.length === 0) {
      throw new WorkflowExecutionError(`${label} must be a non-empty string`);
    }
  }
  if (typeof scriptHash !== 'string' || !/^[0-9a-f]{64}$/.test(scriptHash)) {
    throw new WorkflowExecutionError(
      'scriptHash must be a lowercase SHA-256 digest',
    );
  }
}

async function appendSealed({
  store,
  recordBytes,
  previousHash,
  runId,
  scriptHash,
  scope,
  seq,
  effect,
  outcome,
  blobRefs,
}) {
  const sealed = sealRecord({
    runId,
    scriptHash,
    seq,
    scope,
    effect,
    outcome,
    previousHash,
    blobRefs,
  });
  await store.append(sealed.bytes);
  recordBytes.push(sealed.bytes);
  return sealed.hash;
}

async function appendRecoveryRecord({ store, recordBytes, sealed }) {
  if (typeof store.iterate !== 'function') {
    throw new WorkflowExecutionError(
      'ACT recovery requires a readable append-only store',
    );
  }
  const existing = [];
  for await (const entry of store.iterate()) existing.push(entry.bytes);
  const matching = existing.find((bytes) => bytesEqual(bytes, sealed.bytes));
  if (!matching) {
    if (existing.length !== sealed.record.seq) {
      throw new WorkflowExecutionError(
        'recovery journal position does not match sealed ACT record',
      );
    }
    if (sealed.record.seq > 0) {
      const head = decodeRecord(existing.at(-1));
      if (head.hash !== sealed.record.previousHash) {
        throw new WorkflowExecutionError(
          'recovery journal head does not match sealed ACT record',
        );
      }
    }
    await store.append(sealed.bytes);
  }
  recordBytes.push(sealed.bytes);
}

function normalizeFulfillment(fulfillment) {
  if (
    !fulfillment ||
    typeof fulfillment !== 'object' ||
    Array.isArray(fulfillment) ||
    !Object.hasOwn(fulfillment, 'value')
  ) {
    throw new WorkflowExecutionError(
      'shell.fulfill must return { value, blobRefs? }',
    );
  }
  const allowed = new Set(['value', 'blobRefs']);
  const unknown = Object.keys(fulfillment).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new WorkflowExecutionError(
      `shell fulfillment contains unknown fields: ${unknown.sort().join(', ')}`,
    );
  }
  validateDcborValue(fulfillment.value, '$.fulfillment.value');
  const blobRefs = fulfillment.blobRefs ?? [];
  if (
    !Array.isArray(blobRefs) ||
    blobRefs.some((digest) => typeof digest !== 'string' || !/^[0-9a-f]{64}$/.test(digest))
  ) {
    throw new WorkflowExecutionError('fulfillment.blobRefs must be SHA-256 digests');
  }
  return {
    value: clone(fulfillment.value),
    blobRefs: [...new Set(blobRefs)].sort(),
  };
}

export const ACT_CHECKPOINTS = Object.freeze([
  'reservation-durable',
  'fulfillment-returned',
  'receipt-durable',
  'journal-durable',
]);

async function notifyActCheckpoint(onActCheckpoint, checkpoint, context) {
  if (onActCheckpoint === undefined) return;
  await onActCheckpoint(Object.freeze({
    checkpoint,
    descriptorHash: context.descriptorHash,
    idempotencyKey: context.effect.idempotencyKey,
    runId: context.runId,
    scope: context.scope,
    seq: context.seq,
  }));
}

export async function executeLiveWorkflow({
  workflow,
  shell,
  store,
  idempotency,
  runId,
  scriptHash,
  scope = 'root',
  onActCheckpoint,
}) {
  validateRunOptions({ runId, scriptHash, scope });
  if (!shell || typeof shell.fulfill !== 'function') {
    throw new WorkflowExecutionError('live execution requires shell.fulfill');
  }
  if (!store || typeof store.append !== 'function') {
    throw new WorkflowExecutionError('live execution requires an append-only store');
  }
  if (onActCheckpoint !== undefined && typeof onActCheckpoint !== 'function') {
    throw new WorkflowExecutionError('onActCheckpoint must be a function');
  }

  const iterator = startWorkflow(workflow);
  const recordBytes = [];
  const stats = {
    fulfilled: 0,
    recoveredActs: 0,
    resumedRecords: 0,
    suppressedActs: 0,
  };
  let previousHash = null;
  let input;
  let seq = 0;

  if (typeof store.iterate === 'function') {
    const existingBytes = [];
    for await (const entry of store.iterate()) existingBytes.push(entry.bytes);
    if (existingBytes.length > 0) {
      const verified = verifyChain(
        existingBytes,
        createChainCommitment(existingBytes),
      );
      for (const record of verified.records) {
        const step = nextPure(iterator, input);
        if (step.done) {
          throw new WorkflowExecutionError(
            'existing journal extends beyond workflow completion',
          );
        }
        const effect = assertEffectDescriptor(step.value);
        if (
          record.runId !== runId ||
          record.scriptHash !== scriptHash ||
          record.scope !== scope ||
          !bytesEqual(encodeDcbor(effect), encodeDcbor(record.effect))
        ) {
          throw new WorkflowExecutionError(
            `existing journal diverged at effect ${record.seq}`,
          );
        }
        recordBytes.push(existingBytes[record.seq].slice());
        input = clone(record.outcome.value);
        previousHash = record.hash;
        seq += 1;
        stats.resumedRecords += 1;
      }
    }
  }

  while (true) {
    const step = nextPure(iterator, input);
    if (step.done) {
      validateDcborValue(step.value, '$.workflow.output');
      if (recordBytes.length === 0) {
        throw new WorkflowExecutionError('workflow must yield at least one effect');
      }
      return {
        schema: 'scopa.workflow-execution.v1',
        mode: 'live',
        output: clone(step.value),
        records: recordBytes,
        commitment: createChainCommitment(recordBytes),
        stats,
      };
    }

    const effect = assertEffectDescriptor(step.value);
    if (effect.scope !== scope) {
      throw new WorkflowExecutionError(
        `effect scope ${effect.scope} does not match active scope ${scope}`,
      );
    }
    const kind = effectKind(effect.category);
    let fulfillment;
    let status = 'fulfilled';
    let recovered = null;

    if (kind === 'ACT') {
      if (!idempotency || typeof idempotency.claim !== 'function') {
        throw new WorkflowExecutionError('ACT execution requires an idempotency ledger');
      }
      const descriptorHash = effectHash(effect);
      const claim = await idempotency.claim(effect.idempotencyKey, descriptorHash);
      if (claim.state === 'completed') {
        fulfillment = normalizeFulfillment(claim.value);
        if (claim.recoveryRecord instanceof Uint8Array) {
          const record = decodeRecord(claim.recoveryRecord);
          if (
            record.runId === runId &&
            record.scriptHash === scriptHash &&
            record.scope === scope &&
            record.seq === seq &&
            record.previousHash === previousHash &&
            record.outcome.status === 'fulfilled' &&
            bytesEqual(encodeDcbor(record.effect), encodeDcbor(effect)) &&
            bytesEqual(
              encodeDcbor(record.outcome.value),
              encodeDcbor(fulfillment.value),
            ) &&
            bytesEqual(
              encodeDcbor(record.blobRefs),
              encodeDcbor(fulfillment.blobRefs),
            )
          ) {
            recovered = {
              bytes: claim.recoveryRecord.slice(),
              hash: record.hash,
              record,
            };
            stats.recoveredActs += 1;
          }
        }
        if (!recovered) {
          status = 'suppressed';
          stats.suppressedActs += 1;
        }
      } else {
        const checkpointContext = {
          descriptorHash,
          effect,
          runId,
          scope,
          seq,
        };
        await notifyActCheckpoint(
          onActCheckpoint,
          'reservation-durable',
          checkpointContext,
        );
        fulfillment = normalizeFulfillment(await shell.fulfill(clone(effect)));
        await notifyActCheckpoint(
          onActCheckpoint,
          'fulfillment-returned',
          checkpointContext,
        );
        const sealed = sealRecord({
          runId,
          scriptHash,
          seq,
          scope,
          effect,
          outcome: {
            status,
            value: fulfillment.value,
          },
          previousHash,
          blobRefs: fulfillment.blobRefs,
        });
        await idempotency.complete(
          effect.idempotencyKey,
          descriptorHash,
          fulfillment,
          sealed.bytes,
        );
        await notifyActCheckpoint(
          onActCheckpoint,
          'receipt-durable',
          checkpointContext,
        );
        await store.append(sealed.bytes);
        await notifyActCheckpoint(
          onActCheckpoint,
          'journal-durable',
          checkpointContext,
        );
        recordBytes.push(sealed.bytes);
        previousHash = sealed.hash;
        stats.fulfilled += 1;
        input = fulfillment.value;
        seq += 1;
        continue;
      }
    } else {
      fulfillment = normalizeFulfillment(await shell.fulfill(clone(effect)));
      stats.fulfilled += 1;
    }

    if (recovered) {
      await appendRecoveryRecord({ store, recordBytes, sealed: recovered });
      previousHash = recovered.hash;
    } else {
      previousHash = await appendSealed({
      store,
      recordBytes,
      previousHash,
      runId,
      scriptHash,
      scope,
      seq,
      effect,
      outcome: {
        status,
        value: fulfillment.value,
      },
      blobRefs: fulfillment.blobRefs,
      });
    }
    input = fulfillment.value;
    seq += 1;
  }
}

export async function replayWorkflow({
  workflow,
  records,
  commitment,
  runId,
  scriptHash,
  scope = 'root',
}) {
  validateRunOptions({ runId, scriptHash, scope });
  const verified = verifyChain(records, commitment);
  const iterator = startWorkflow(workflow);
  let input;
  let cursor = 0;
  let suppressedActs = 0;

  while (true) {
    const step = nextPure(iterator, input);
    if (step.done) {
      if (cursor !== records.length) {
        throw new WorkflowExecutionError('replay did not consume every journal record');
      }
      validateDcborValue(step.value, '$.workflow.output');
      return {
        schema: 'scopa.workflow-execution.v1',
        mode: 'replay',
        output: clone(step.value),
        recordsConsumed: cursor,
        rootHash: commitment.rootHash,
        stats: { suppressedActs },
      };
    }
    if (cursor >= records.length) {
      throw new WorkflowExecutionError(`replay journal exhausted at effect ${cursor}`);
    }

    const effect = assertEffectDescriptor(step.value);
    const record = verified.records[cursor] ?? decodeRecord(records[cursor]);
    if (
      record.runId !== runId ||
      record.scriptHash !== scriptHash ||
      record.scope !== scope
    ) {
      throw new WorkflowExecutionError(`replay pin mismatch at effect ${cursor}`);
    }
    if (!bytesEqual(encodeDcbor(effect), encodeDcbor(record.effect))) {
      throw new WorkflowExecutionError(`replay effect diverged at effect ${cursor}`);
    }
    if (effectKind(effect.category) === 'ACT') suppressedActs += 1;
    input = clone(record.outcome.value);
    cursor += 1;
  }
}
