import process from 'node:process';
import { canonicalJsonPretty } from '../../enforcement/src/index.js';
import {
  renderBoundaryDoctorLocal,
  renderBoundarySnapshot,
} from '../../boundary-doctor/src/index.js';
import {
  renderAssistantHuman,
  renderBeginHuman,
  renderCheckHuman,
  renderCliFailureHuman,
  renderStatusHuman,
} from '../../adoption-experience/src/index.js';
import {
  executeCommand,
  failureResult,
} from './command.js';

export const HELP = `SCOPA developer CLI

Usage:
  scopa demo [--format terminal|json]
  scopa assistant detect [--format human|json] [--repo <directory>]
  scopa assistant install [--client auto|claude-code|codex|generic] [--dry-run] [--format human|json] [--repo <directory>]
  scopa assistant uninstall [--dry-run] [--format human|json] [--repo <directory>]
  scopa begin --request-json <json> [--format human|json] [--repo <directory>]
  scopa view [--format terminal|html|json|badge] [--output <file>] [--repo <directory>]
  scopa init --definition <file> [--repo <directory>]
  scopa status [--format human|json] [--repo <directory>]
  scopa check [--format human|json] [--repo <directory>]
  scopa map [--matrix <file>] [--authority <file>] [--format json|markdown] [--repo <directory>]
  scopa assess --map <file> [--baseline <file>] [--repo <directory>]
  scopa doctor [--format human|json|markdown] [--repo <directory>]
  scopa doctor --lock --definition <file> --matrix <file> --authority <file> [--format json|markdown] [--repo <directory>]
  scopa run --request-json <json> [--repo <directory>]
  scopa verify (--packet <file> | --case-export <file>) [trust options] [--repo <directory>]

Run without arguments for a read-only repository snapshot. begin, check,
status, doctor, and assistant actions print human text at a terminal and the canonical JSON
envelope when redirected or piped; --format selects either explicitly. Every
other subcommand result is canonical JSON. status observes blocked state with
exit 0; check returns exit 4 when completion gates are blocked.
`;

const HUMAN_RENDERERS = Object.freeze({
  assistant: (result) => renderAssistantHuman(result),
  begin: (result) => renderBeginHuman(result),
  check: (result, context) => renderCheckHuman(result, context),
  status: (result) => renderStatusHuman(result),
  doctor: (result) => renderBoundaryDoctorLocal(result),
});

// Human text is the default for a person at a terminal; a pipe, redirect, or
// CI job receives the canonical envelope unchanged. Explicit --format wins.
function requestedFormat(argv) {
  const index = argv.indexOf('--format');
  return index === -1 ? undefined : argv[index + 1];
}

// A blocked gate is a reportable result, not a command failure, so check's
// canonical stop state is rendered from the error details it is carried in.
function humanPayload(command, envelope) {
  if (envelope.ok) return envelope.result;
  if (command === 'check' && envelope.error?.code === 'SCOPA_COMPLETION_BLOCKED') {
    return envelope.error.details;
  }
  return null;
}

async function checkObservation(argv, outcome) {
  if (argv[0] !== 'check' || outcome.envelope.result?.canStop !== true) {
    return undefined;
  }
  const repoIndex = argv.indexOf('--repo');
  const viewArgs = ['view', '--format', 'json'];
  if (repoIndex !== -1) viewArgs.push('--repo', argv[repoIndex + 1]);
  try {
    const viewed = await executeCommand(viewArgs);
    return viewed.envelope.result.card.observed ?? null;
  } catch {
    return null;
  }
}

async function humanRender(argv, outcome, options) {
  const renderer = HUMAN_RENDERERS[argv[0]];
  if (!renderer) return null;
  const format = requestedFormat(argv);
  if (format === 'json' || format === 'markdown') return null;
  const interactive = options.isTty ?? process.stdout.isTTY === true;
  if (format !== 'human' && !interactive) return null;
  if (
    !outcome.envelope.ok &&
    ['assistant', 'begin'].includes(argv[0])
  ) {
    return renderCliFailureHuman(argv[0], outcome.envelope.error);
  }
  const payload = humanPayload(argv[0], outcome.envelope);
  if (payload === null) return null;
  // doctor --lock returns a terminal map rather than a diagnostic.
  if (argv[0] === 'doctor' && argv.includes('--lock')) return null;
  return renderer(payload, { observation: await checkObservation(argv, outcome) });
}

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
  if (argv[0] === 'demo' && outcome.envelope.ok) {
    write(outcome.envelope.result.content);
  } else if (argv[0] === 'view' && outcome.envelope.ok) {
    const result = outcome.envelope.result;
    write(result.export === null
      ? result.content
      : `SCOPA Boundary Card exported (${result.export.bytes} bytes, SHA-256 ${result.export.sha256}).\nThis explicit local evidence export is outside the locked task mutation boundary and is not a governed task write.\n`);
  } else if (argv[0] === 'doctor' && requestedFormat(argv) === 'markdown' && outcome.envelope.ok) {
    write(outcome.envelope.result.content);
  } else {
    const human = await humanRender(argv, outcome, options);
    write(human ?? canonicalJsonPretty(outcome.envelope));
  }
  return outcome.exitCode;
}
