import {
  lstat,
  open,
  readFile,
  realpath,
} from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import {
  createSliceLock,
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
  initializeProjectFromDefinition,
  loadProject,
} from './project.js';
import {
  createWorkflowBoundaryMap,
  createBoundaryAssessmentPacket,
  renderWorkflowBoundaryMapMarkdown,
  validateAuthorityDeclarationDocument,
} from '../../workflow-boundary-map/src/index.js';
import {
  validateCapabilityMatrix,
} from '../../adapter-host/src/assurance.js';
import {
  createBoundaryDiagnostic,
  renderBoundaryDoctorMarkdown,
} from '../../boundary-doctor/src/index.js';
import {
  beginSlice,
  tryLoadBeginState,
} from '../../adoption-experience/src/index.js';

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
  if (command === 'begin') {
    return {
      ...common,
      '--request-json': { name: 'requestJson', required: true },
    };
  }
  if (command === 'map') {
    return {
      ...common,
      '--matrix': { name: 'matrix' },
      '--authority': { name: 'authority' },
      '--format': { name: 'format' },
    };
  }
  if (command === 'assess') {
    return {
      ...common,
      '--map': { name: 'map', required: true },
      '--baseline': { name: 'baseline' },
    };
  }
  if (command === 'doctor') {
    return {
      ...common,
      '--lock': { name: 'lock', boolean: true },
      '--definition': { name: 'definition' },
      '--matrix': { name: 'matrix' },
      '--authority': { name: 'authority' },
      '--format': { name: 'format' },
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

function parseJsonArgument(value, label) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new CliUsageError(`${label} is not valid JSON: ${error.message}`);
  }
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

async function readJsonInput(repoRoot, requestedPath, label) {
  try {
    return JSON.parse(await readFile(path.resolve(repoRoot, requestedPath), 'utf8'));
  } catch {
    throw new CliUsageError(`${label} must be a readable JSON file`);
  }
}

const DOCTOR_INPUT_MAX_BYTES = 1_048_576;

function validateDoctorInputPath(requestedPath, label) {
  if (
    typeof requestedPath !== 'string' ||
    requestedPath.length === 0 ||
    path.posix.isAbsolute(requestedPath) ||
    requestedPath === '..' ||
    requestedPath.startsWith('../') ||
    requestedPath.includes('/../') ||
    requestedPath.includes('\\') ||
    requestedPath.includes('*') ||
    path.posix.normalize(requestedPath) !== requestedPath ||
    requestedPath === '.scopa' ||
    requestedPath.startsWith('.scopa/')
  ) {
    throw new CliUsageError(
      `${label} must be a normalized repository-contained path outside .scopa`,
    );
  }
}

async function readDoctorJsonInput(root, requestedPath, label) {
  validateDoctorInputPath(requestedPath, label);
  const candidate = path.resolve(root, requestedPath);
  const relative = path.relative(root, candidate);
  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new CliUsageError(`${label} escapes the repository`);
  }
  let metadata;
  let resolved;
  let handle;
  try {
    metadata = await lstat(candidate);
    resolved = await realpath(candidate);
    handle = await open(
      candidate,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    );
  } catch {
    throw new CliUsageError(`${label} must be a readable regular JSON file`);
  }
  let bytes;
  try {
    const opened = await handle.stat();
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.nlink !== 1 ||
      metadata.size > DOCTOR_INPUT_MAX_BYTES ||
      resolved !== candidate ||
      !opened.isFile() ||
      opened.nlink !== 1 ||
      opened.dev !== metadata.dev ||
      opened.ino !== metadata.ino
    ) {
      throw new CliUsageError(
        `${label} must be an unaliased regular file no larger than ${DOCTOR_INPUT_MAX_BYTES} bytes`,
      );
    }
    bytes = await handle.readFile();
    const [after, resolvedAfter] = await Promise.all([
      lstat(candidate),
      realpath(candidate),
    ]);
    if (
      after.dev !== opened.dev ||
      after.ino !== opened.ino ||
      after.nlink !== 1 ||
      resolvedAfter !== candidate
    ) {
      throw new CliUsageError(`${label} changed while it was being read`);
    }
  } catch (error) {
    if (error instanceof CliUsageError) throw error;
    throw new CliUsageError(`${label} must be a readable regular JSON file`);
  } finally {
    await handle.close().catch(() => {});
  }
  if (bytes.byteLength > DOCTOR_INPUT_MAX_BYTES) {
    throw new CliUsageError(
      `${label} must be no larger than ${DOCTOR_INPUT_MAX_BYTES} bytes`,
    );
  }
  try {
    return {
      value: JSON.parse(bytes.toString('utf8')),
      relativePath: relative.split(path.sep).join('/'),
    };
  } catch {
    throw new CliUsageError(`${label} must contain valid JSON`);
  }
}

async function doctorLockCommand(options) {
  const declaredInputs = [
    ['definition', '--definition'],
    ['matrix', '--matrix'],
    ['authority', '--authority'],
  ];
  const missing = declaredInputs
    .filter(([name]) => options[name] === undefined)
    .map(([, flag]) => flag);
  if (missing.length > 0) {
    throw new CliUsageError(
      `doctor --lock requires ${missing.join(', ')}`,
    );
  }

  const root = await realpath(options.repo);
  const [definitionInput, matrixInput, authorityInput] = await Promise.all([
    readDoctorJsonInput(root, options.definition, 'slice definition'),
    readDoctorJsonInput(root, options.matrix, 'capability matrix'),
    readDoctorJsonInput(root, options.authority, 'authority declaration document'),
  ]);

  // Validate the complete declaration set before the diagnostic or any write.
  const definitionLock = createSliceLock(definitionInput.value);
  const capabilityMatrix = validateCapabilityMatrix(matrixInput.value);
  const authorityDocument = validateAuthorityDeclarationDocument(
    authorityInput.value,
  );
  const before = await createBoundaryDiagnostic({ repoRoot: root });
  const initialization = await initializeProjectFromDefinition({
    repoRoot: root,
    definition: definitionLock.definition,
    definitionPath: definitionInput.relativePath,
  });
  const project = await loadProject(root);
  const stopState = await evaluateStopCondition({
    lock: project.lock,
    repoRoot: project.repoRoot,
  });
  const after = createWorkflowBoundaryMap({
    lock: project.lock,
    stopState,
    capabilityMatrix,
    authorityDeclarations: authorityDocument.declarations,
  });
  const result = {
    schema: 'scopa.doctor-lock-result.v1',
    status: after.completion.canStop ? 'satisfied' : 'blocked',
    before,
    initialization,
    after,
  };
  const output = options.format === 'markdown'
    ? renderBoundaryDoctorMarkdown(result)
    : result;
  if (!after.completion.canStop) {
    return {
      exitCode: CLI_EXIT.blocked,
      envelope: {
        schema: CLI_RESULT_SCHEMA,
        ok: false,
        command: 'doctor',
        error: {
          code: 'SCOPA_DOCTOR_LOCK_BLOCKED',
          message: options.format === 'markdown'
            ? 'boundary lock created; completion remains blocked'
            : `boundary lock created; completion blocked by: ${after.completion.failedGates.join(', ')}`,
          details: output,
        },
      },
    };
  }
  return {
    exitCode: CLI_EXIT.success,
    envelope: {
      schema: CLI_RESULT_SCHEMA,
      ok: true,
      command: 'doctor',
      result: output,
    },
  };
}

async function mapCommand(options) {
  const format = options.format ?? 'json';
  if (!['json', 'markdown'].includes(format)) {
    throw new CliUsageError('--format must be json or markdown');
  }
  const project = await loadProject(options.repo);
  const stopState = await evaluateStopCondition({
    lock: project.lock,
    repoRoot: project.repoRoot,
  });
  const beginState = !options.matrix && !options.authority
    ? await tryLoadBeginState(options.repo)
    : null;
  const capabilityMatrix = options.matrix
    ? validateCapabilityMatrix(await readJsonInput(
      options.repo,
      options.matrix,
      'capability matrix',
    ))
    : beginState?.capabilityMatrix ?? null;
  const authorityDocument = options.authority
    ? validateAuthorityDeclarationDocument(await readJsonInput(
      options.repo,
      options.authority,
      'authority declaration document',
    ))
    : beginState?.authorityDeclarations ?? null;
  const map = createWorkflowBoundaryMap({
    lock: project.lock,
    stopState,
    capabilityMatrix,
    authorityDeclarations: authorityDocument?.declarations ?? [],
  });
  return format === 'markdown'
    ? renderWorkflowBoundaryMapMarkdown(map)
    : map;
}

async function assessCommand(options) {
  const currentMap = await readJsonInput(options.repo, options.map, 'workflow boundary map');
  const baselineMap = options.baseline
    ? await readJsonInput(options.repo, options.baseline, 'baseline workflow boundary map')
    : null;
  return createBoundaryAssessmentPacket({ currentMap, baselineMap });
}

export async function executeCommand(argv) {
  const parsed = parseCommand(argv);
  const { command } = parsed;
  let { options } = parsed;
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
  if (command === 'begin') {
    const result = await beginSlice({
      repoRoot: options.repo,
      request: parseJsonArgument(options.requestJson, '--request-json'),
    });
    return {
      exitCode: result.status === 'blocked'
        ? CLI_EXIT.blocked
        : CLI_EXIT.success,
      envelope: {
        schema: CLI_RESULT_SCHEMA,
        ok: true,
        command,
        result,
      },
    };
  }
  if (command === 'status' || command === 'check') {
    return stopStateResult(command, options.repo);
  }
  if (command === 'map') {
    return {
      exitCode: CLI_EXIT.success,
      envelope: {
        schema: CLI_RESULT_SCHEMA,
        ok: true,
        command,
        result: await mapCommand(options),
      },
    };
  }
  if (command === 'assess') {
    return {
      exitCode: CLI_EXIT.success,
      envelope: {
        schema: CLI_RESULT_SCHEMA,
        ok: true,
        command,
        result: await assessCommand(options),
      },
    };
  }
  if (command === 'doctor') {
    const format = options.format ?? 'json';
    if (!['json', 'markdown'].includes(format)) {
      throw new CliUsageError('--format must be json or markdown');
    }
    options = Object.freeze({ ...options, format });
    const declarationFlags = ['definition', 'matrix', 'authority'];
    if (!options.lock && declarationFlags.some((name) => options[name] !== undefined)) {
      throw new CliUsageError(
        '--definition, --matrix, and --authority require doctor --lock',
      );
    }
    if (options.lock) return doctorLockCommand(options);
    return {
      exitCode: CLI_EXIT.success,
      envelope: {
        schema: CLI_RESULT_SCHEMA,
        ok: true,
        command,
        result: format === 'markdown'
          ? renderBoundaryDoctorMarkdown(
            await createBoundaryDiagnostic({ repoRoot: options.repo }),
          )
          : await createBoundaryDiagnostic({ repoRoot: options.repo }),
      },
    };
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
      'SCOPA_WORKFLOW_BOUNDARY_MAP_INVALID',
      'SCOPA_BOUNDARY_DIAGNOSTIC_INVALID',
      'SCOPA_BEGIN_REQUEST_INVALID',
      'SCOPA_ADAPTER_SCHEMA_INVALID',
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
