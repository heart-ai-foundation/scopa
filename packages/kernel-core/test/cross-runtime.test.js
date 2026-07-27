import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PROBE = 'packages/kernel-core/src/cross-runtime-probe.js';

function run(runtime, args, outputPath) {
  const result = spawnSync('/usr/bin/env', [runtime, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(readFileSync(outputPath, 'utf8'));
}

test('Node and Deno seal the same workflow to byte-identical records', (context) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'scopa-cross-runtime-'));
  context.after(() => rmSync(tempRoot, { recursive: true, force: true }));
  const nodeOutput = path.join(tempRoot, 'node.json');
  const denoOutput = path.join(tempRoot, 'deno.json');
  const node = run(process.execPath, [PROBE, '--output', nodeOutput], nodeOutput);
  const deno = run(path.join(ROOT, 'node_modules', '.bin', 'deno'), [
    'run',
    `--allow-write=${denoOutput}`,
    PROBE,
    '--output',
    denoOutput,
  ], denoOutput);

  assert.equal(node.runtime.engine, 'node');
  assert.equal(deno.runtime.engine, 'deno');
  assert.notEqual(node.runtime.v8, deno.runtime.v8);
  assert.deepEqual(node.vector, deno.vector);
  assert.equal(node.vector.recordHex.length, 3);
  assert.equal(
    node.vector.commitment.rootHash,
    'f986dad18ee8f29c6219a73d47a67c116ca4c8ba09f7667624a58cadb3218066',
  );
});
