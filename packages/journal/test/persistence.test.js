import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ContentAddressedFileStore } from '../src/content-store.js';
import { FileAppendOnlyStore } from '../src/file-store.js';
import { MemoryAppendOnlyStore } from '../src/memory-store.js';

async function assertPersistencePort(store) {
  assert.equal(await store.head(), null);
  const first = new Uint8Array([1, 2, 3]);
  const second = new Uint8Array([4, 5]);
  const firstOffset = await store.append(first);
  const secondOffset = await store.append(second);

  assert.deepEqual(await store.read(firstOffset), first);
  assert.deepEqual(await store.read(secondOffset), second);
  const entries = [];
  for await (const entry of store.iterate()) entries.push(entry);
  assert.deepEqual(
    entries.map((entry) => entry.bytes),
    [first, second],
  );
  assert.deepEqual(await store.head(), entries[1]);

  first[0] = 255;
  assert.deepEqual(await store.read(firstOffset), new Uint8Array([1, 2, 3]));
}

test('memory adapter satisfies the append-only persistence port', async () => {
  await assertPersistencePort(new MemoryAppendOnlyStore());
});

test('file adapter satisfies the append-only persistence port', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-journal-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await assertPersistencePort(
    new FileAppendOnlyStore(path.join(root, 'journal.scopa')),
  );
});

test('file adapter rejects a truncated frame', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-truncated-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const journalPath = path.join(root, 'journal.scopa');
  const store = new FileAppendOnlyStore(journalPath);
  await store.append(new Uint8Array([1, 2, 3]));
  const bytes = await readFile(journalPath);
  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(journalPath, bytes.subarray(0, bytes.length - 1)),
  );
  await assert.rejects(async () => {
    for await (const _entry of store.iterate()) {
      // Iteration performs frame validation.
    }
  }, /truncated journal frame body/);
});

test('content-addressed blobs live outside the journal and verify on read', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-blobs-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = new ContentAddressedFileStore(root);
  const blob = new TextEncoder().encode('large external evidence');

  const firstDigest = await store.put(blob);
  const secondDigest = await store.put(blob);

  assert.equal(firstDigest, secondDigest);
  assert.match(firstDigest, /^[0-9a-f]{64}$/);
  assert.deepEqual(await store.get(firstDigest), blob);
  assert.equal(path.basename(store.pathFor(firstDigest)), firstDigest.slice(2));
});

test('concurrent content-addressed writes publish only complete blobs', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-blob-race-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const blob = new Uint8Array(1024 * 1024).fill(37);
  const stores = Array.from({ length: 8 }, () => new ContentAddressedFileStore(root));
  const digests = await Promise.all(stores.map((store) => store.put(blob)));
  assert.equal(new Set(digests).size, 1);
  assert.deepEqual(await stores[0].get(digests[0]), blob);
});
