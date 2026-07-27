import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('live probe blocks scope, refuses false-green, and cold-resumes', (context) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'scopa-probe-output-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const output = path.join(root, 'report.json');
  const result = spawnSync(process.execPath, [
    'packages/enforcement/src/live-probe.js',
    '--output',
    output,
  ], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(report.ok, true);
  assert.equal(report.scope.blockedBeforeTool, true);
  assert.equal(report.scope.blockedFileAbsent, true);
  assert.equal(report.completion.refused, true);
  assert.equal(report.completion.exitCode, 9);
  assert.equal(report.continuity.restored, true);
});
