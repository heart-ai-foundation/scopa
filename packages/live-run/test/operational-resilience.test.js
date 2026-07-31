import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { superviseProcess } from '../src/index.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const FAULT_CLIENT = path.join(ROOT, 'fixtures/S14/fault-client.mjs');

function run(mode) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return superviseProcess({
    command: process.execPath,
    args: [FAULT_CLIENT, '--direct', mode],
    cwd: ROOT,
    env,
    timeoutMs: 1_000,
    maxCaptureBytes: 64 * 1024,
    terminateGraceMs: 30,
    cleanupWaitMs: 1_000,
    cleanupPollMs: 5,
  });
}

test('repeated process custody leaves no descriptor or process survivor', async () => {
  const fdRoot = '/proc/self/fd';
  const beforeDescriptors = await readdir(fdRoot).catch(() => null);
  for (let cycle = 0; cycle < 8; cycle += 1) {
    const clean = await run('success');
    assert.equal(clean.terminal.state, 'succeeded');
    assert.equal(clean.terminal.cleanup.groupGone, true);
  }
  for (let cycle = 0; cycle < 2; cycle += 1) {
    const orphan = await run('orphan');
    assert.equal(orphan.terminal.state, 'cleanup-failed');
    assert.equal(orphan.terminal.reason, 'orphan-process-detected');
    assert.equal(orphan.terminal.cleanup.groupGone, true);
  }
  if (beforeDescriptors !== null) {
    const afterDescriptors = await readdir(fdRoot);
    assert.equal(afterDescriptors.length <= beforeDescriptors.length + 2, true);
  }
});
