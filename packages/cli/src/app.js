import process from 'node:process';
import { canonicalJsonPretty } from '../../enforcement/src/index.js';
import {
  renderBoundarySnapshot,
} from '../../boundary-doctor/src/index.js';
import {
  executeCommand,
  failureResult,
} from './command.js';

export const HELP = `SCOPA developer CLI

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

Run without arguments for a read-only repository snapshot. Subcommand results
are emitted as canonical JSON. status observes blocked state with exit 0;
check returns exit 4 when completion gates are blocked.
`;

export async function runCli(argv, options = {}) {
  const write = options.write ?? ((value) => process.stdout.write(value));
  if (argv[0] === '--help' || argv[0] === '-h') {
    write(HELP);
    return 0;
  }
  if (argv.length === 0) {
    try {
      const doctorArgs = options.repo
        ? ['doctor', '--repo', options.repo]
        : ['doctor'];
      const outcome = await executeCommand(doctorArgs);
      write(renderBoundarySnapshot(outcome.envelope.result));
      return outcome.exitCode;
    } catch (error) {
      const outcome = failureResult('snapshot', error);
      write(canonicalJsonPretty(outcome.envelope));
      return outcome.exitCode;
    }
  }
  let outcome;
  try {
    outcome = await executeCommand(argv);
  } catch (error) {
    outcome = failureResult(argv[0], error);
  }
  write(canonicalJsonPretty(outcome.envelope));
  return outcome.exitCode;
}

