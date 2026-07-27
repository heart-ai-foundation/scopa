#!/usr/bin/env node

import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJsonPretty } from './canonical-json.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function testFiles() {
  const packagesRoot = path.join(ROOT, 'packages');
  const packageNames = await readdir(packagesRoot);
  const files = [];
  for (const packageName of packageNames.sort()) {
    const testRoot = path.join(packagesRoot, packageName, 'test');
    let entries;
    try {
      entries = await readdir(testRoot);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const entry of entries.sort()) {
      if (entry.endsWith('.test.js')) {
        files.push(path.relative(ROOT, path.join(testRoot, entry)));
      }
    }
  }
  if (files.length === 0) {
    throw new Error('release gate found no test files');
  }
  return files;
}

function runNode(args) {
  const env = { ...process.env };
  delete env.NODE;
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env,
  });
}

function probe(kind, mode, expectedExitCode, expectedOk) {
  const result = runNode([
    'packages/conformance/src/probe.js',
    kind,
    mode,
  ]);
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `${kind}:${mode} did not emit a JSON report: ${result.stderr || result.stdout}`,
    );
  }
  if (result.status !== expectedExitCode || report.ok !== expectedOk) {
    throw new Error(
      `${kind}:${mode} expected exit ${expectedExitCode} and ok=${expectedOk}; ` +
        `received exit ${result.status} and ok=${report.ok}`,
    );
  }
  return {
    probe: `${kind}:${mode}`,
    exitCode: result.status,
    ok: report.ok,
    schema: report.schema,
  };
}

async function main() {
  const files = await testFiles();
  const tests = runNode(['--test', '--test-concurrency=1', ...files]);
  process.stdout.write(tests.stdout);
  process.stderr.write(tests.stderr);
  if (tests.status !== 0) {
    process.exitCode = tests.status ?? 1;
    return;
  }

  const probes = [
    probe('replay', 'clean', 0, true),
    probe('replay', 'fault', 1, false),
    probe('containment', 'clean', 0, true),
    probe('containment', 'fault', 1, false),
  ];
  process.stdout.write(
    canonicalJsonPretty({
      schema: 'scopa.conformance.release-gate.v1',
      ok: true,
      testFiles: files,
      probes,
    }),
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
