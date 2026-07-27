import { open } from 'node:fs/promises';

const HEADER_BYTES = 4;
const MAX_RECORD_BYTES = 64 * 1024 * 1024;

function frame(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('append requires a Uint8Array');
  }
  if (bytes.byteLength > MAX_RECORD_BYTES) {
    throw new RangeError(`record exceeds ${MAX_RECORD_BYTES} bytes`);
  }
  const framed = new Uint8Array(HEADER_BYTES + bytes.byteLength);
  new DataView(framed.buffer).setUint32(0, bytes.byteLength, false);
  framed.set(bytes, HEADER_BYTES);
  return framed;
}

async function readExact(handle, length, position) {
  const bytes = new Uint8Array(length);
  let cursor = 0;
  while (cursor < length) {
    const { bytesRead } = await handle.read(
      bytes,
      cursor,
      length - cursor,
      position + cursor,
    );
    if (bytesRead === 0) break;
    cursor += bytesRead;
  }
  return bytes.subarray(0, cursor);
}

async function readFrame(handle, offset, fileSize) {
  if (offset === fileSize) return null;
  const header = await readExact(handle, HEADER_BYTES, offset);
  if (header.byteLength !== HEADER_BYTES) {
    throw new Error(`truncated journal frame header at byte ${offset}`);
  }
  const length = new DataView(
    header.buffer,
    header.byteOffset,
    header.byteLength,
  ).getUint32(0, false);
  if (length > MAX_RECORD_BYTES) {
    throw new Error(`journal frame at byte ${offset} exceeds size limit`);
  }
  const bytes = await readExact(handle, length, offset + HEADER_BYTES);
  if (bytes.byteLength !== length) {
    throw new Error(`truncated journal frame body at byte ${offset}`);
  }
  return {
    offset,
    nextOffset: offset + HEADER_BYTES + length,
    bytes: bytes.slice(),
  };
}

export class FileAppendOnlyStore {
  #writes = Promise.resolve();

  constructor(filePath) {
    if (typeof filePath !== 'string' || filePath.length === 0) {
      throw new TypeError('filePath must be a non-empty string');
    }
    this.filePath = filePath;
  }

  append(bytes) {
    const framed = frame(bytes);
    const operation = async () => {
      const handle = await open(this.filePath, 'a+');
      try {
        const { size } = await handle.stat();
        await handle.writeFile(framed);
        await handle.sync();
        return size;
      } finally {
        await handle.close();
      }
    };
    const result = this.#writes.then(operation, operation);
    this.#writes = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async read(offset) {
    if (!Number.isSafeInteger(offset) || offset < 0) {
      throw new RangeError('offset must be a non-negative safe integer');
    }
    const handle = await open(this.filePath, 'a+');
    try {
      const { size } = await handle.stat();
      const found = await readFrame(handle, offset, size);
      if (!found) throw new RangeError(`unknown journal offset: ${offset}`);
      return found.bytes;
    } finally {
      await handle.close();
    }
  }

  async *iterate() {
    const handle = await open(this.filePath, 'a+');
    try {
      const { size } = await handle.stat();
      let offset = 0;
      while (offset < size) {
        const found = await readFrame(handle, offset, size);
        yield { offset: found.offset, bytes: found.bytes };
        offset = found.nextOffset;
      }
    } finally {
      await handle.close();
    }
  }

  async head() {
    let head = null;
    for await (const entry of this.iterate()) head = entry;
    return head;
  }
}
