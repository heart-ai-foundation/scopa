#!/usr/bin/env node

import '@endo/lockdown';

const { compileLockedWorkflow } = await import('./locked-workflow.js');
const { runCrossRuntimeVector } = await import('./vector.js');

function denied(name, statement) {
  const iterator = compileLockedWorkflow(`function* () {
    ${statement}
    return null;
  }`);
  try {
    iterator.next();
    return { name, denied: false };
  } catch (error) {
    return {
      name,
      denied: true,
      errorName: error.name,
      errorCode: error.code ?? null,
    };
  }
}

const authorities = [
  denied('Date.now', 'Date.now();'),
  denied('Math.random', 'Math.random();'),
  denied('Math.sin', 'Math.sin(1);'),
  denied('process', 'process.cwd();'),
  denied('fetch', 'fetch("https://example.invalid");'),
  denied('Deno', 'Deno.cwd();'),
  denied('crypto', 'crypto.getRandomValues(new Uint8Array(1));'),
  denied('performance', 'performance.now();'),
  denied('setTimeout', 'setTimeout(() => {}, 0);'),
  denied('console', 'console.log("escaped");'),
  denied('WebSocket', 'new WebSocket("wss://example.invalid");'),
];
const vector = await runCrossRuntimeVector();
const report = {
  schema: 'scopa.lockdown-probe.v1',
  ok: authorities.every((finding) => finding.denied),
  authorities,
  vectorRootHash: vector.commitment.rootHash,
};
const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output');
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;
if (outputIndex >= 0 && !outputPath) throw new Error('--output requires a file path');
const serialized = `${JSON.stringify(report)}\n`;
if (outputPath) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(outputPath, serialized, { encoding: 'utf8' });
} else {
  process.stdout.write(serialized);
}
if (!report.ok) globalThis.process?.exit(1);
