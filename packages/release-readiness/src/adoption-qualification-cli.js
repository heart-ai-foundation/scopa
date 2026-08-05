#!/usr/bin/env node

import {
  mkdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  qualifyInstalledAdoption,
  renderInstalledAdoptionQualification,
} from './adoption-qualification.js';

function parseArgs(argv) {
  if (argv.length === 0) return { output: null };
  if (argv.length === 2 && argv[0] === '--output' && argv[1]) {
    return { output: path.resolve(argv[1]) };
  }
  throw new TypeError('usage: adoption-qualification-cli.js [--output <receipt.json>]');
}

async function main() {
  const { output } = parseArgs(process.argv.slice(2));
  const receipt = await qualifyInstalledAdoption();
  const bytes = renderInstalledAdoptionQualification(receipt);
  if (output === null) {
    process.stdout.write(bytes);
    return;
  }
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bytes, { flag: 'wx', mode: 0o600 });
  process.stdout.write(`${output}\n`);
}

main().catch((error) => {
  process.stderr.write(`SCOPA installed adoption qualification failed: ${error.message}\n`);
  process.exitCode = 1;
});
