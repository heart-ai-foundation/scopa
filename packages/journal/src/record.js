import { decodeDcbor, encodeDcbor } from './dcbor.js';
import { bytesEqual } from './bytes.js';
import { hashHex } from './hash.js';
import { assertEffectDescriptor } from './effect-schema.js';

export const RECORD_SCHEMA_VERSION = 'scopa.run-record.v1';
export const KERNEL_VERSION = '0.1.0';
export const GENESIS_HASH = null;

export class JournalVerificationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'JournalVerificationError';
    this.code = 'SCOPA_JOURNAL_INVALID';
    this.details = details;
  }
}

const RECORD_KEYS = new Set([
  'blobRefs',
  'effect',
  'hash',
  'kernelVersion',
  'outcome',
  'previousHash',
  'runId',
  'schemaVersion',
  'scope',
  'scriptHash',
  'seq',
]);

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new JournalVerificationError(`${label} must be a non-empty string`);
  }
}

function assertExactKeys(value, expected, label) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new JournalVerificationError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value);
  const missing = [...expected].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !expected.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new JournalVerificationError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function assertRecordShape(record) {
  assertExactKeys(record, RECORD_KEYS, 'journal record');
  if (record.schemaVersion !== RECORD_SCHEMA_VERSION) {
    throw new JournalVerificationError('unsupported schemaVersion');
  }
  if (record.kernelVersion !== KERNEL_VERSION) {
    throw new JournalVerificationError('unsupported kernelVersion');
  }
  nonEmptyString(record.runId, 'runId');
  if (
    typeof record.scriptHash !== 'string' ||
    !/^[0-9a-f]{64}$/.test(record.scriptHash)
  ) {
    throw new JournalVerificationError(
      'scriptHash must be a lowercase SHA-256 digest',
    );
  }
  nonEmptyString(record.scope, 'scope');
  if (!Number.isSafeInteger(record.seq) || record.seq < 0) {
    throw new JournalVerificationError('seq must be a non-negative safe integer');
  }
  if (
    record.previousHash !== null &&
    (typeof record.previousHash !== 'string' ||
      !/^[0-9a-f]{64}$/.test(record.previousHash))
  ) {
    throw new JournalVerificationError('invalid previousHash');
  }
  if (typeof record.hash !== 'string' || !/^[0-9a-f]{64}$/.test(record.hash)) {
    throw new JournalVerificationError('invalid record hash');
  }
  if (
    !Array.isArray(record.blobRefs) ||
    record.blobRefs.some(
      (digest) => typeof digest !== 'string' || !/^[0-9a-f]{64}$/.test(digest),
    ) ||
    new Set(record.blobRefs).size !== record.blobRefs.length ||
    record.blobRefs.some(
      (digest, index) => index > 0 && record.blobRefs[index - 1] > digest,
    )
  ) {
    throw new JournalVerificationError(
      'blobRefs must be unique, sorted SHA-256 digests',
    );
  }
  assertExactKeys(record.outcome, new Set(['status', 'value']), 'record outcome');
  if (!['fulfilled', 'suppressed'].includes(record.outcome.status)) {
    throw new JournalVerificationError(`invalid outcome status: ${record.outcome.status}`);
  }
  try {
    assertEffectDescriptor(record.effect);
  } catch (error) {
    throw new JournalVerificationError(`invalid effect descriptor: ${error.message}`);
  }
}

function bodyFromRecord(record) {
  const { hash, ...body } = record;
  return body;
}

export function sealRecord({
  runId,
  scriptHash,
  seq,
  scope,
  effect,
  outcome,
  previousHash = GENESIS_HASH,
  blobRefs = [],
  schemaVersion = RECORD_SCHEMA_VERSION,
  kernelVersion = KERNEL_VERSION,
}) {
  if (schemaVersion !== RECORD_SCHEMA_VERSION) {
    throw new JournalVerificationError(`unsupported schemaVersion: ${schemaVersion}`);
  }
  if (kernelVersion !== KERNEL_VERSION) {
    throw new JournalVerificationError(`unsupported kernelVersion: ${kernelVersion}`);
  }
  nonEmptyString(runId, 'runId');
  if (typeof scriptHash !== 'string' || !/^[0-9a-f]{64}$/.test(scriptHash)) {
    throw new JournalVerificationError(
      'scriptHash must be a lowercase SHA-256 digest',
    );
  }
  nonEmptyString(scope, 'scope');
  if (!Number.isSafeInteger(seq) || seq < 0) {
    throw new JournalVerificationError('seq must be a non-negative safe integer');
  }
  if (
    previousHash !== null &&
    (typeof previousHash !== 'string' || !/^[0-9a-f]{64}$/.test(previousHash))
  ) {
    throw new JournalVerificationError(
      'previousHash must be null or a lowercase SHA-256 digest',
    );
  }
  if (
    !Array.isArray(blobRefs) ||
    blobRefs.some((digest) => typeof digest !== 'string' || !/^[0-9a-f]{64}$/.test(digest))
  ) {
    throw new JournalVerificationError('blobRefs must contain SHA-256 digests');
  }
  const body = {
    blobRefs: [...new Set(blobRefs)].sort(),
    effect,
    kernelVersion,
    outcome,
    previousHash,
    runId,
    schemaVersion,
    scope,
    scriptHash,
    seq,
  };
  const hash = hashHex(encodeDcbor(body));
  const record = { ...body, hash };
  assertRecordShape(record);
  return {
    record,
    bytes: encodeDcbor(record),
    hash,
  };
}

export function decodeRecord(bytes) {
  const record = decodeDcbor(bytes);
  if (!record || Array.isArray(record) || typeof record !== 'object') {
    throw new JournalVerificationError('journal record must be an object');
  }
  assertRecordShape(record);
  return record;
}

export function createChainCommitment(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new JournalVerificationError('cannot commit an empty journal');
  }
  const last = records.at(-1);
  const record = last instanceof Uint8Array ? decodeRecord(last) : last;
  assertRecordShape(record);
  return {
    algorithm: 'sha256',
    length: records.length,
    rootHash: record.hash,
    schema: 'scopa.chain-commitment.v1',
  };
}

export function verifyChain(recordBytes, commitment) {
  if (!Array.isArray(recordBytes)) {
    throw new JournalVerificationError('recordBytes must be an array');
  }
  try {
    assertExactKeys(
      commitment,
      new Set(['algorithm', 'length', 'rootHash', 'schema']),
      'chain commitment',
    );
  } catch {
    throw new JournalVerificationError('a valid external chain commitment is required');
  }
  if (
    commitment.schema !== 'scopa.chain-commitment.v1' ||
    commitment.algorithm !== 'sha256' ||
    !Number.isSafeInteger(commitment.length) ||
    commitment.length <= 0 ||
    typeof commitment.rootHash !== 'string' ||
    !/^[0-9a-f]{64}$/.test(commitment.rootHash)
  ) {
    throw new JournalVerificationError('a valid external chain commitment is required');
  }
  if (recordBytes.length !== commitment.length) {
    throw new JournalVerificationError('journal length does not match commitment', {
      expected: commitment.length,
      actual: recordBytes.length,
    });
  }

  let previousHash = GENESIS_HASH;
  let runPins = null;
  const records = [];
  for (let index = 0; index < recordBytes.length; index += 1) {
    const bytes = recordBytes[index];
    const record = decodeRecord(bytes);
    if (record.seq !== index) {
      throw new JournalVerificationError(`non-contiguous sequence at record ${index}`);
    }
    if (record.previousHash !== previousHash) {
      throw new JournalVerificationError(`broken previousHash at record ${index}`);
    }
    const calculated = hashHex(encodeDcbor(bodyFromRecord(record)));
    if (record.hash !== calculated) {
      throw new JournalVerificationError(`record hash mismatch at record ${index}`);
    }
    const pins = {
      kernelVersion: record.kernelVersion,
      runId: record.runId,
      schemaVersion: record.schemaVersion,
      scope: record.scope,
      scriptHash: record.scriptHash,
    };
    if (runPins === null) {
      runPins = pins;
    } else if (!bytesEqual(encodeDcbor(runPins), encodeDcbor(pins))) {
      throw new JournalVerificationError(`run pins changed at record ${index}`);
    }
    previousHash = record.hash;
    records.push(record);
  }
  if (previousHash !== commitment.rootHash) {
    throw new JournalVerificationError('journal root hash does not match commitment');
  }
  return {
    schema: 'scopa.chain-verification.v1',
    ok: true,
    length: records.length,
    rootHash: previousHash,
    records,
  };
}
