#!/usr/bin/env node

import process from 'node:process';
import { canonicalJsonPretty } from '../../enforcement/src/index.js';
import {
  executeCommand,
  failureResult,
} from './command.js';

const HELP = `SCOPA developer CLI

Usage:
  scopa init --definition <file> [--repo <directory>]
  scopa status [--repo <directory>]
  scopa check [--repo <directory>]
  scopa map [--matrix <file>] [--authority <file>] [--format json|markdown] [--repo <directory>]
  scopa assess --map <file> [--baseline <file>] [--repo <directory>]
  scopa doctor [--format json|markdown] [--repo <directory>]
  scopa doctor --lock --definition <file> --matrix <file> --authority <file> [--format json|markdown] [--repo <directory>]
  scopa run --request-json <json> [--repo <directory>]
  scopa verify (--packet <file> | --case-export <file>) [trust options] [--repo <directory>]

All command results are emitted as canonical JSON. status observes blocked
state with exit 0; check returns exit 4 when completion gates are blocked.
`;

async function main() {
  if (
    process.argv.length === 2 ||
    process.argv[2] === '--help' ||
    process.argv[2] === '-h'
  ) {
    process.stdout.write(HELP);
    return;
  }
  const argv = process.argv.slice(2);
  let outcome;
  try {
    outcome = await executeCommand(argv);
  } catch (error) {
    outcome = failureResult(argv[0], error);
  }
  process.stdout.write(canonicalJsonPretty(outcome.envelope));
  process.exitCode = outcome.exitCode;
}

main().catch((error) => {
  const outcome = failureResult(process.argv[2], error);
  process.stdout.write(canonicalJsonPretty(outcome.envelope));
  process.exitCode = outcome.exitCode;
});
