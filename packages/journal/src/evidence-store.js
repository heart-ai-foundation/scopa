import { chmod, open, readFile } from 'node:fs/promises';

export async function writeEvidenceNoReplace(filePath, text) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new TypeError('evidence text must be non-empty');
  }
  const handle = await open(filePath, 'wx', 0o600);
  try {
    await handle.writeFile(text, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(filePath, 0o600);
}

export async function readEvidence(filePath, maxBytes = 64 * 1024 * 1024) {
  const bytes = await readFile(filePath);
  if (bytes.length === 0 || bytes.length > maxBytes) {
    throw new RangeError('evidence file is outside its size bound');
  }
  return bytes.toString('utf8');
}
