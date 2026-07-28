import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  evaluateStopCondition,
} from '../../enforcement/src/index.js';
import {
  createReferenceAgentHost,
  orientation,
} from '../../agent-surface/src/index.js';
import { verifyEvidencePacket } from '../../depth/src/index.js';
import { verifyCaseExportBytes } from '../../interop/src/index.js';
import {
  initializeProject,
  loadProject,
} from './project.js';

export const CLI_RESULT_SCHEMA = 'scopa.cli-result.v1';
export const CLI_EXIT = Object.freeze({
  success: 0,
  unexpected: 1,
  usage: 2,
  denied: 3,
  blocked: 4,
  verification: 5,
});

export class CliUsageError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'CliUsageError';
    this.code = 'SCOPA_CLI_USAGE';
    this.details = details;
  }
}

export class CliVerificationError extends Error {
  constructor(cause) {
    super('evidence verification failed', { cause });
    this.name = 'CliVerificationError';
    this.code = 'SCOPA_EVIDENCE_VERIFICATION_FAILED';
    this.details = Object.freeze({
      category: 'invalid-evidence-or-trust-policy',
    });
  }
}

async function verificationBoundary(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof CliVerificationError) throw error;
    throw new CliVerificationError(error);
  }
}

function optionSpec(command) {
  const common = {
    '--repo': { name: 'repo' },
  };
  if (command === 'init') {
    return {
      ...common,
      '--definition': { name: 'definition', required: true },
    };
  }
  if (command === 'run') {
    return {
      ...common,
      '--request-json': { name: 'requestJson', required: true },
    };
  }
  if (command === 'verify') {
    return {
      ...common,
      '--packet': { name: 'packet' },
      '--case-export': { name: 'caseExport' },
      '--timestamp-roots': { name: 'timestampRoots' },
      '--timestamp-authority-id': { name: 'timestampAuthorityId' },
      '--timestamp-signer-sha256': { name: 'timestampSignerSha256' },
      '--require-timestamp': { name: 'requireTimestamp', boolean: true },
    };
  }
  if (command === 'status' || command === 'check') return common;
  throw new CliUsageError(`unknown command: ${command ?? '<missing>'}`);
}

export function parseCommand(argv) {
  const command = argv[0];
  const specification = optionSpec(command);
  const options = {};
  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    const config = specification[flag];
    if (!config) throw new CliUsageError(`unknown argument: ${flag}`);
    if (Object.hasOwn(options, config.name)) {
      throw new CliUsageError(`duplicate argument: ${flag}`);
    }
    if (config.boolean) {
      options[config.name] = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new CliUsageError(`${flag} requires a value`);
    }
    options[config.name] = value;
    index += 1;
  }
  for (const [flag, config] of Object.entries(specification)) {
    if (config.required && options[config.name] === undefined) {
      throw new CliUsageError(`missing required argument: ${flag}`);
    }
  }
  return {
    command,
    options: Object.freeze({
      ...options,
      repo: path.resolve(options.repo ?? process.cwd()),
    }),
  };
}

async function stopStateResult(command, repoRoot) {
  const project = await loadProject(repoRoot);
  const stopState = await evaluateStopCondition({
    lock: project.lock,
    repoRoot: project.repoRoot,
  });
  if (command === 'check' && !stopState.canStop) {
    return {
      exitCode: CLI_EXIT.blocked,
      envelope: {
        schema: CLI_RESULT_SCHEMA,
        ok: false,
        command,
        error: {
          code: 'SCOPA_COMPLETION_BLOCKED',
          message: `completion blocked; failed gates: ${stopState.failedGates.join(', ')}`,
          details: stopState,
        },
      },
    };
  }
  return {
    exitCode: CLI_EXIT.success,
    envelope: {
      schema: CLI_RESULT_SCHEMA,
      ok: true,
      command,
      result: command === 'status'
        ? orientation({ lock: project.lock, stopState })
        : stopState,
    },
  };
}

function parseRequest(value) {
  let request;
  try {
    request = JSON.parse(value);
  } catch (error) {
    throw new CliUsageError(`--request-json is not valid JSON: ${error.message}`);
  }
  if (
    !request ||
    Array.isArray(request) ||
    typeof request !== 'object' ||
    typeof request.name !== 'string' ||
    !request.arguments ||
    Array.isArray(request.arguments) ||
    typeof request.arguments !== 'object'
  ) {
    throw new CliUsageError(
      '--request-json must contain a tool name and arguments object',
    );
  }
  return request;
}

function trustOptions(options, trustedTimestampRootsPem) {
  return {
    trustedTimestampRootsPem,
    requireTimestamp: Boolean(options.requireTimestamp),
    expectedTimestampAuthorityId: options.timestampAuthorityId,
    expectedTimestampSignerSha256: options.timestampSignerSha256,
  };
}

async function verifyCommand(options) {
  if (Boolean(options.packet) === Boolean(options.caseExport)) {
    throw new CliUsageError(
      'verify requires exactly one of --packet or --case-export',
    );
  }
  const trustedTimestampRootsPem = options.timestampRoots
    ? await readFile(path.resolve(options.repo, options.timestampRoots), 'utf8')
    : undefined;
  const verificationOptions = trustOptions(
    options,
    trustedTimestampRootsPem,
  );
  if (options.packet) {
    const packetBytes = await readFile(
      path.resolve(options.repo, options.packet),
      'utf8',
    );
    const report = await verificationBoundary(async () => {
      const packet = JSON.parse(packetBytes);
      return verifyEvidencePacket(packet, verificationOptions);
    });
    return {
      type: 'native-packet',
      report,
    };
  }
  const caseExportBytes = await readFile(
    path.resolve(options.repo, options.caseExport),
  );
  const report = await verificationBoundary(() => verifyCaseExportBytes(
    caseExportBytes,
    { verificationOptions },
  ));
  return {
    type: 'case-export',
    report: {
      schema: report.schema,
      ok: report.ok,
      caseOntologyVersion: report.caseOntologyVersion,
      caseUtilsVersion: report.caseUtilsVersion,
      nativePacketSha256: report.nativePacketSha256,
      graph: report.graph,
      exactNativePacketRecovered: true,
      claim: report.claim,
    },
  };
}

export async function executeCommand(argv) {
  const { command, options } = parseCommand(argv);
  if (command === 'init') {
    return {
      exitCode: CLI_EXIT.success,
      envelope: {
        schema: CLI_RESULT_SCHEMA,
        ok: true,
        command,
        result: await initializeProject({
          repoRoot: options.repo,
          definitionPath: options.definition,
        }),
      },
    };
  }
  if (command === 'status' || command === 'check') {
    return stopStateResult(command, options.repo);
  }
  if (command === 'run') {
    const project = await loadProject(options.repo);
    const result = await createReferenceAgentHost({
      repoRoot: project.repoRoot,
      lock: project.lock,
    }).invoke(parseRequest(options.requestJson));
    return {
      exitCode: CLI_EXIT.success,
      envelope: {
        schema: CLI_RESULT_SCHEMA,
        ok: true,
        command,
        result,
      },
    };
  }
  if (command === 'verify') {
    return {
      exitCode: CLI_EXIT.success,
      envelope: {
        schema: CLI_RESULT_SCHEMA,
        ok: true,
        command,
        result: await verifyCommand(options),
      },
    };
  }
  throw new CliUsageError(`unknown command: ${command}`);
}

export function failureResult(command, error) {
  const usage =
    error instanceof CliUsageError ||
    [
      'SCOPA_INIT_CONFLICT',
      'SCOPA_PROJECT_CONFIG_INVALID',
      'SCOPA_SLICE_LOCK_INVALID',
    ].includes(error?.code);
  const denied = error?.code === 'SCOPA_SCOPE_DENIED';
  const verification =
    error instanceof CliVerificationError ||
    error?.code?.startsWith('SCOPA_DEPTH_') ||
    error?.code?.startsWith('SCOPA_INTEROP_') ||
    error?.name === 'DepthVerificationError' ||
    error?.name === 'InteropVerificationError';
  return {
    exitCode: usage
      ? CLI_EXIT.usage
      : denied
        ? CLI_EXIT.denied
        : verification
          ? CLI_EXIT.verification
          : CLI_EXIT.unexpected,
    envelope: {
      schema: CLI_RESULT_SCHEMA,
      ok: false,
      command: command ?? null,
      error: {
        code: error?.code ?? 'SCOPA_CLI_ERROR',
        message: error?.message ?? String(error),
        details: error?.details ?? null,
      },
    },
  };
}
