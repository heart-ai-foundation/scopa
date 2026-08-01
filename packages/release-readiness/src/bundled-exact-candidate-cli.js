#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonicalJsonPretty } from '../../enforcement/src/index.js';
import { qualifyBundledExactCandidate } from './exact-candidate-probe.js';

function parseArguments(argv) {
  const selected = { artifactDirectory: null, output: null, matrixPath: undefined };
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value || !['--artifact-dir', '--matrix', '--output'].includes(flag)) {
      throw new TypeError(
        'usage: --artifact-dir <private-directory> --output <receipt.json> ' +
        '[--matrix <matrix.json>]',
      );
    }
    if (flag === '--artifact-dir') selected.artifactDirectory = path.resolve(value);
    if (flag === '--matrix') selected.matrixPath = path.resolve(value);
    if (flag === '--output') selected.output = path.resolve(value);
  }
  if (!selected.artifactDirectory || !selected.output) {
    throw new TypeError('artifact directory and output are required');
  }
  return selected;
}

Promise.resolve(parseArguments(process.argv.slice(2)))
  .then(async (selected) => {
    const result = await qualifyBundledExactCandidate(selected);
    await mkdir(path.dirname(selected.output), { recursive: true });
    await writeFile(selected.output, canonicalJsonPretty(result.receipt), {
      flag: 'wx',
      mode: 0o600,
    });
    process.stdout.write(`${JSON.stringify({
      ok: true,
      schema: result.receipt.schema,
      sourceCommit: result.receipt.source.commit,
      packageSha256: result.receipt.candidate.packageSha256,
      closureSha256: result.receipt.productionIdentity.closureSha256,
      bundledPayloadSha256:
        result.receipt.productionIdentity.bundledPayloadSha256,
      installedPayloadSha256:
        result.receipt.productionIdentity.installedPayloadSha256,
      receiptSha256: result.receipt.receiptSha256,
    })}\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
