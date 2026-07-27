import { decodeDcbor, encodeDcbor } from '../../journal/src/dcbor.js';
import { hashHex } from '../../journal/src/hash.js';
import {
  link,
  mkdir,
  open,
  readFile,
  rename,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';

let persistentTempSequence = 0;

function clone(value) {
  return decodeDcbor(encodeDcbor(value));
}

export class IdempotencyConflictError extends Error {
  constructor(key) {
    super(`idempotency key is bound to a different ACT effect: ${key}`);
    this.name = 'IdempotencyConflictError';
    this.code = 'SCOPA_IDEMPOTENCY_CONFLICT';
    this.key = key;
  }
}

export class PendingActError extends Error {
  constructor(key) {
    super(`ACT effect has an unresolved pending reservation: ${key}`);
    this.name = 'PendingActError';
    this.code = 'SCOPA_ACT_PENDING';
    this.key = key;
  }
}

export class MemoryIdempotencyLedger {
  #entries = new Map();

  claim(key, descriptorHash) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new TypeError('idempotency key must be a non-empty string');
    }
    const existing = this.#entries.get(key);
    if (!existing) {
      this.#entries.set(key, {
        descriptorHash,
        state: 'pending',
      });
      return { state: 'claimed' };
    }
    if (existing.descriptorHash !== descriptorHash) {
      throw new IdempotencyConflictError(key);
    }
    if (existing.state === 'pending') {
      throw new PendingActError(key);
    }
    return {
      state: 'completed',
      value: clone(existing.value),
      recoveryRecord: existing.recoveryRecord?.slice(),
    };
  }

  complete(key, descriptorHash, value, recoveryRecord) {
    const existing = this.#entries.get(key);
    if (
      !existing ||
      existing.state !== 'pending' ||
      existing.descriptorHash !== descriptorHash
    ) {
      throw new IdempotencyConflictError(key);
    }
    existing.state = 'completed';
    existing.value = clone(value);
    if (recoveryRecord !== undefined) {
      if (!(recoveryRecord instanceof Uint8Array)) {
        throw new TypeError('recoveryRecord must be a Uint8Array');
      }
      existing.recoveryRecord = recoveryRecord.slice();
    }
  }

  inspect(key) {
    const entry = this.#entries.get(key);
    return entry ? clone(entry) : null;
  }
}

export class PersistentIdempotencyLedger {
  #owned = new Set();

  constructor(root) {
    if (typeof root !== 'string' || root.length === 0) {
      throw new TypeError('persistent ledger requires a directory path');
    }
    this.root = root;
  }

  #pathFor(key) {
    const digest = hashHex(new TextEncoder().encode(key));
    return path.join(this.root, digest.slice(0, 2), `${digest.slice(2)}.cbor`);
  }

  async #writeTemp(target, bytes) {
    await mkdir(path.dirname(target), { recursive: true });
    const temp = `${target}.${process.pid}.${persistentTempSequence += 1}.tmp`;
    const handle = await open(temp, 'wx', 0o600);
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    return temp;
  }

  async #read(target) {
    const entry = decodeDcbor(new Uint8Array(await readFile(target)));
    const keys = Object.keys(entry ?? {}).sort().join('\0');
    const pendingKeys = ['descriptorHash', 'key', 'schema', 'state'].sort().join('\0');
    const completedKeys = [
      'descriptorHash',
      'fulfillment',
      'key',
      'recoveryRecord',
      'schema',
      'state',
    ].sort().join('\0');
    if (
      !entry ||
      Array.isArray(entry) ||
      (keys !== pendingKeys && keys !== completedKeys) ||
      entry.schema !== 'scopa.idempotency-entry.v1' ||
      typeof entry.key !== 'string' ||
      entry.key.length === 0 ||
      typeof entry.descriptorHash !== 'string' ||
      !/^[0-9a-f]{64}$/.test(entry.descriptorHash) ||
      !['pending', 'completed'].includes(entry.state) ||
      (entry.state === 'pending' && keys !== pendingKeys) ||
      (entry.state === 'completed' &&
        (keys !== completedKeys ||
          !(entry.recoveryRecord instanceof Uint8Array)))
    ) {
      throw new Error('invalid persistent idempotency entry');
    }
    return entry;
  }

  async claim(key, descriptorHash) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new TypeError('idempotency key must be a non-empty string');
    }
    if (typeof descriptorHash !== 'string' || !/^[0-9a-f]{64}$/.test(descriptorHash)) {
      throw new TypeError('descriptorHash must be a lowercase SHA-256 digest');
    }
    const target = this.#pathFor(key);
    const pending = encodeDcbor({
      descriptorHash,
      key,
      schema: 'scopa.idempotency-entry.v1',
      state: 'pending',
    });
    const temp = await this.#writeTemp(target, pending);
    try {
      await link(temp, target);
      this.#owned.add(key);
      return { state: 'claimed' };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    } finally {
      await unlink(temp).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
    const existing = await this.#read(target);
    if (existing.key !== key || existing.descriptorHash !== descriptorHash) {
      throw new IdempotencyConflictError(key);
    }
    if (existing.state === 'pending') throw new PendingActError(key);
    return {
      state: 'completed',
      value: clone(existing.fulfillment),
      recoveryRecord: existing.recoveryRecord.slice(),
    };
  }

  async complete(key, descriptorHash, fulfillment, recoveryRecord) {
    if (!this.#owned.has(key) || !(recoveryRecord instanceof Uint8Array)) {
      throw new IdempotencyConflictError(key);
    }
    const target = this.#pathFor(key);
    const existing = await this.#read(target);
    if (
      existing.state !== 'pending' ||
      existing.key !== key ||
      existing.descriptorHash !== descriptorHash
    ) {
      throw new IdempotencyConflictError(key);
    }
    const completed = encodeDcbor({
      descriptorHash,
      fulfillment: clone(fulfillment),
      key,
      recoveryRecord: recoveryRecord.slice(),
      schema: 'scopa.idempotency-entry.v1',
      state: 'completed',
    });
    const temp = await this.#writeTemp(target, completed);
    try {
      await rename(temp, target);
      this.#owned.delete(key);
    } finally {
      await unlink(temp).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }

  async inspect(key) {
    try {
      return clone(await this.#read(this.#pathFor(key)));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }
}
