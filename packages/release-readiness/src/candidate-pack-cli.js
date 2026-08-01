#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJsonPretty } from '../../enforcement/src/index.js';
import { packCandidate } from './artifact.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);

function outputDirectory(argv) {
  if (argv.length === 0) return process.cwd();
  if (argv.length === 2 && argv[0] === '--output-directory') {
    return path.resolve(argv[1]);
  }
  throw new TypeError('usage: [--output-directory /trusted/candidate]');
}

try {
  const result = await packCandidate({
    sourceRoot: ROOT,
    outputDirectory: outputDirectory(process.argv.slice(2)),
    requireClean: true,
  });
  process.stdout.write(canonicalJsonPretty({
    schema: 'scopa.candidate-pack-result.v1',
    candidate: result.manifest,
    productionBundle: result.bundle.verification,
  }));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
