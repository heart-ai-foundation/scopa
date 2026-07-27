import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from './bytes.js';

export const HASH_ALGORITHM = 'sha256';

export function hashBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('hashBytes requires a Uint8Array');
  }
  return sha256(bytes);
}

export function hashHex(bytes) {
  return bytesToHex(hashBytes(bytes));
}
