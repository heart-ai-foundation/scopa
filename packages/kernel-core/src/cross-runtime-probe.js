#!/usr/bin/env -S node

import '@endo/lockdown';

const { runCrossRuntimeVector } = await import('./vector.js');

const runtime =
  typeof globalThis.Deno === 'object'
    ? {
        engine: 'deno',
        version: Deno.version.deno,
        v8: Deno.version.v8,
      }
    : {
        engine: 'node',
        version: process.version,
        v8: process.versions.v8,
      };

const vector = await runCrossRuntimeVector();
const serialized = `${JSON.stringify({ runtime, vector })}\n`;
const args = runtime.engine === 'deno' ? Deno.args : process.argv.slice(2);
const outputIndex = args.indexOf('--output');
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;
if (outputIndex >= 0 && !outputPath) {
  throw new Error('--output requires a file path');
}
if (outputPath && runtime.engine === 'deno') {
  Deno.writeTextFileSync(outputPath, serialized, { create: true });
} else if (outputPath) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(outputPath, serialized, { encoding: 'utf8' });
} else if (runtime.engine === 'deno') {
  Deno.stdout.writeSync(new TextEncoder().encode(serialized));
} else {
  process.stdout.write(serialized);
}
