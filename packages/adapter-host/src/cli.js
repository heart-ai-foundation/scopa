#!/usr/bin/env node

import {
  readFile,
} from 'node:fs/promises';
import {
  realpathSync,
} from 'node:fs';
import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';
import {
  createAdapterBridge,
} from './bridge.js';
import {
  serveMcpStdio,
} from './mcp-stdio.js';

export const LAUNCHER_ERROR_SCHEMA = 'scopa.launcher-error.v1';

const LAUNCHER_ERRORS = Object.freeze({
  SCOPA_LAUNCHER_ARGUMENT_INVALID: 'launcher arguments are invalid',
  SCOPA_LAUNCHER_CONFIGURATION_INVALID:
    'launcher configuration is invalid',
  SCOPA_LAUNCHER_INPUT_INVALID: 'launcher input is invalid',
  SCOPA_LAUNCHER_INPUT_UNAVAILABLE: 'launcher input is unavailable',
  SCOPA_LAUNCHER_INTERNAL: 'launcher failed',
});

export class LauncherError extends Error {
  constructor(code, options = {}) {
    super(LAUNCHER_ERRORS[code], options);
    if (!Object.hasOwn(LAUNCHER_ERRORS, code)) {
      throw new TypeError('launcher error code is not closed');
    }
    this.name = 'LauncherError';
    this.code = code;
  }
}

export function parseArguments(argv) {
  const options = {};
  const allowed = new Map([
    ['--matrix-file', 'matrixFile'],
    ['--repo', 'repo'],
    ['--session-file', 'sessionFile'],
    ['--evidence-journal', 'evidenceJournal'],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const name = allowed.get(flag);
    if (!name) {
      throw new LauncherError('SCOPA_LAUNCHER_ARGUMENT_INVALID');
    }
    if (Object.hasOwn(options, name)) {
      throw new LauncherError('SCOPA_LAUNCHER_ARGUMENT_INVALID');
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new LauncherError('SCOPA_LAUNCHER_ARGUMENT_INVALID');
    }
    options[name] = value;
    index += 1;
  }
  for (const name of ['matrixFile', 'sessionFile']) {
    if (options[name] === undefined) {
      throw new LauncherError('SCOPA_LAUNCHER_ARGUMENT_INVALID');
    }
  }
  return {
    repo: path.resolve(options.repo ?? process.cwd()),
    sessionFile: path.resolve(options.sessionFile),
    matrixFile: path.resolve(options.matrixFile),
    evidenceJournal: options.evidenceJournal === undefined
      ? null
      : path.resolve(options.evidenceJournal),
  };
}

export async function readJson(file) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (cause) {
    throw new LauncherError('SCOPA_LAUNCHER_INPUT_UNAVAILABLE', { cause });
  }
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new LauncherError('SCOPA_LAUNCHER_INPUT_INVALID', { cause });
  }
}

export function launcherErrorEnvelope(error) {
  const launcherError = error instanceof LauncherError
    ? error
    : new LauncherError('SCOPA_LAUNCHER_INTERNAL', { cause: error });
  return {
    schema: LAUNCHER_ERROR_SCHEMA,
    ok: false,
    error: {
      code: launcherError.code,
      boundary: 'launcher',
      message: launcherError.message,
    },
  };
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  let bridge;
  try {
    bridge = await createAdapterBridge({
      repoRoot: options.repo,
      session: await readJson(options.sessionFile),
      capabilityMatrix: await readJson(options.matrixFile),
      evidenceJournalPath: options.evidenceJournal,
    });
  } catch (error) {
    if (error instanceof LauncherError) throw error;
    throw new LauncherError(
      'SCOPA_LAUNCHER_CONFIGURATION_INVALID',
      { cause: error },
    );
  }
  await serveMcpStdio({ bridge });
}

const modulePath = fileURLToPath(import.meta.url);
let invokedAsExecutable = false;
try {
  invokedAsExecutable = Boolean(
    process.argv[1] &&
    realpathSync(process.argv[1]) === realpathSync(modulePath),
  );
} catch {
  invokedAsExecutable = false;
}
if (invokedAsExecutable) {
  main().catch((error) => {
    const envelope = launcherErrorEnvelope(error);
    process.stderr.write(`${JSON.stringify(envelope)}\n`);
    if (process.env.SCOPA_DEBUG_ERRORS === '1') {
      process.stderr.write(`${error.stack ?? error.message}\n`);
    }
    process.exitCode = error instanceof LauncherError ? 2 : 1;
  });
}
