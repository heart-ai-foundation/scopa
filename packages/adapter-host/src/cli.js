#!/usr/bin/env node

import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  createAdapterBridge,
} from './bridge.js';
import {
  serveMcpStdio,
} from './mcp-stdio.js';

function parseArguments(argv) {
  const options = {};
  const allowed = new Map([
    ['--matrix-file', 'matrixFile'],
    ['--repo', 'repo'],
    ['--session-file', 'sessionFile'],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const name = allowed.get(flag);
    if (!name) throw new Error(`unknown argument: ${flag}`);
    if (Object.hasOwn(options, name)) {
      throw new Error(`duplicate argument: ${flag}`);
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`${flag} requires a value`);
    }
    options[name] = value;
    index += 1;
  }
  for (const [flag, name] of allowed) {
    if (name !== 'repo' && options[name] === undefined) {
      throw new Error(`missing required argument: ${flag}`);
    }
  }
  return {
    repo: path.resolve(options.repo ?? process.cwd()),
    sessionFile: path.resolve(options.sessionFile),
    matrixFile: path.resolve(options.matrixFile),
  };
}

async function readJson(file, label) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new Error(`cannot load ${label}: ${error.message}`);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const bridge = await createAdapterBridge({
    repoRoot: options.repo,
    session: await readJson(options.sessionFile, 'session descriptor'),
    capabilityMatrix: await readJson(
      options.matrixFile,
      'capability matrix',
    ),
  });
  await serveMcpStdio({ bridge });
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
