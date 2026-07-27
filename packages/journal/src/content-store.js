import { link, mkdir, open, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { bytesEqual } from './bytes.js';
import { hashHex } from './hash.js';

let tempSequence = 0;

export class ContentAddressedFileStore {
  constructor(root) {
    if (typeof root !== 'string' || root.length === 0) {
      throw new TypeError('root must be a non-empty string');
    }
    this.root = root;
  }

  pathFor(digest) {
    if (typeof digest !== 'string' || !/^[0-9a-f]{64}$/.test(digest)) {
      throw new TypeError('digest must be a lowercase SHA-256 digest');
    }
    return path.join(this.root, digest.slice(0, 2), digest.slice(2));
  }

  async put(bytes) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError('put requires a Uint8Array');
    }
    const digest = hashHex(bytes);
    const target = this.pathFor(digest);
    await mkdir(path.dirname(target), { recursive: true });
    const temp = `${target}.${process.pid}.${tempSequence += 1}.tmp`;
    let handle;
    try {
      handle = await open(temp, 'wx', 0o600);
      await handle.writeFile(bytes);
      await handle.sync();
      await handle.close();
      handle = null;
      await link(temp, target);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const existing = new Uint8Array(await readFile(target));
      if (!bytesEqual(existing, bytes)) {
        throw new Error(`content-address collision at ${digest}`);
      }
    } finally {
      await handle?.close();
      await unlink(temp).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
    return digest;
  }

  async get(digest) {
    const bytes = new Uint8Array(await readFile(this.pathFor(digest)));
    if (hashHex(bytes) !== digest) {
      throw new Error(`content-address verification failed for ${digest}`);
    }
    return bytes;
  }
}
