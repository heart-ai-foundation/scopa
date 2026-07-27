export class MemoryAppendOnlyStore {
  #entries = [];

  async append(bytes) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError('append requires a Uint8Array');
    }
    const offset = this.#entries.length;
    this.#entries.push(bytes.slice());
    return offset;
  }

  async read(offset) {
    if (!Number.isSafeInteger(offset) || offset < 0 || offset >= this.#entries.length) {
      throw new RangeError(`unknown journal offset: ${offset}`);
    }
    return this.#entries[offset].slice();
  }

  async *iterate() {
    for (let offset = 0; offset < this.#entries.length; offset += 1) {
      yield { offset, bytes: this.#entries[offset].slice() };
    }
  }

  async head() {
    if (this.#entries.length === 0) return null;
    const offset = this.#entries.length - 1;
    return { offset, bytes: this.#entries[offset].slice() };
  }
}
