import { createChainCommitment, decodeRecord, sealRecord } from '../../journal/src/record.js';
import { assertExactKeys, assertDigest } from './schema.js';

function pinIds(inferPins) {
  const ids = inferPins.map((pin) => pin.pinId);
  for (const id of ids) assertDigest(id, 'INFER pin id');
  if (new Set(ids).size !== ids.length) {
    throw new Error('evidence packet contains duplicate INFER pin ids');
  }
  return ids;
}

export function appendInferPinRecords(records, inferPins) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new TypeError('records must be a non-empty array');
  }
  const ids = pinIds(inferPins);
  const output = [...records];
  let previous = decodeRecord(output.at(-1));
  for (const pinId of ids) {
    const sealed = sealRecord({
      runId: previous.runId,
      scriptHash: previous.scriptHash,
      seq: previous.seq + 1,
      scope: previous.scope,
      effect: {
        category: 'INFER',
        payload: { pinId },
        scope: previous.scope,
      },
      outcome: {
        status: 'fulfilled',
        value: {
          inferPinId: pinId,
          retention: 'packet',
        },
      },
      previousHash: previous.hash,
    });
    output.push(sealed.bytes);
    previous = sealed.record;
  }
  return Object.freeze({
    records: Object.freeze(output),
    commitment: Object.freeze(createChainCommitment(output)),
  });
}

export function verifyInferPinLinkage(records, inferPins) {
  const expected = pinIds(inferPins);
  const linked = [];
  for (const record of records) {
    if (record.effect.category !== 'INFER') continue;
    assertExactKeys(record.effect.payload, ['pinId'], 'INFER effect payload');
    assertDigest(record.effect.payload.pinId, 'INFER effect pinId');
    linked.push(record.effect.payload.pinId);
  }
  if (new Set(linked).size !== linked.length) {
    throw new Error('journal contains duplicate INFER pin references');
  }
  const missing = expected.filter((id) => !linked.includes(id));
  const unresolved = linked.filter((id) => !expected.includes(id));
  if (missing.length > 0 || unresolved.length > 0) {
    throw new Error(
      `journal/INFER pin linkage mismatch; missing=[${missing.sort()}] unresolved=[${unresolved.sort()}]`,
    );
  }
  return Object.freeze({
    schema: 'scopa.infer-pin-linkage-verification.v1',
    ok: true,
    linkedRecordCount: linked.length,
    linkedPinIds: Object.freeze([...linked]),
  });
}
