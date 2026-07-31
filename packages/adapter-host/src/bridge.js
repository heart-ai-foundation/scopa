import {
  lstat,
  realpath,
} from 'node:fs/promises';
import path from 'node:path';
import {
  createReferenceAgentHost,
  orientation,
} from '../../agent-surface/src/index.js';
import {
  canonicalJson,
  canonicalJsonPretty,
  evaluateStopCondition,
} from '../../enforcement/src/index.js';
import {
  writeEvidenceNoReplace,
} from '../../journal/src/index.js';
import {
  loadProject,
} from '../../cli/src/project.js';
import {
  validateCapabilityMatrix,
} from './assurance.js';
import {
  AdapterValidationError,
  exactObject,
  isPlainObject,
  nonEmptyString,
  validateSessionDescriptor,
} from './schema.js';
import {
  createTranscriptRecorder,
} from './transcript.js';
import {
  compactAssuranceResult,
  compactCheckResult,
  createCompactTranscript,
  createHostJournal,
} from './evidence.js';

export class AdapterRequestError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'AdapterRequestError';
    this.code = 'SCOPA_ADAPTER_REQUEST_INVALID';
    this.rpcCode = -32602;
    this.details = details;
  }
}

export const ADAPTER_MAX_PATH_BYTES = 4096;

function boundedPath(pathValue) {
  return Buffer.byteLength(pathValue) <= ADAPTER_MAX_PATH_BYTES
    ? pathValue
    : '[PATH_EXCEEDS_ADAPTER_LIMIT]';
}

class AdapterReadDeniedError extends Error {
  constructor(requestedPath, reason) {
    const bounded = boundedPath(requestedPath);
    super(`read denied: ${bounded}`);
    this.name = 'AdapterReadDeniedError';
    this.code = 'SCOPA_READ_DENIED';
    this.details = {
      schema: 'scopa.read-denial.v1',
      boundary: 'repository',
      requestedPath: bounded,
      allowedPath: '.',
      reason,
    };
  }
}

const EMPTY_INPUT_SCHEMA = Object.freeze({
  type: 'object',
  properties: Object.freeze({}),
  additionalProperties: false,
});
const STRUCTURED_OUTPUT_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: true,
});

function tool({
  name,
  capabilityId,
  effect,
  title,
  description,
  inputSchema,
  readOnly,
  destructive = false,
  idempotent = true,
}) {
  return Object.freeze({
    name,
    capabilityId,
    effect,
    protocol: Object.freeze({
      name,
      title,
      description,
      inputSchema,
      outputSchema: STRUCTURED_OUTPUT_SCHEMA,
      annotations: Object.freeze({
        readOnlyHint: readOnly,
        destructiveHint: destructive,
        idempotentHint: idempotent,
        openWorldHint: false,
      }),
    }),
  });
}

const TOOL_DEFINITIONS = Object.freeze([
  tool({
    name: 'scopa_orientation',
    capabilityId: 'scopa.orientation',
    effect: 'OBSERVE',
    title: 'SCOPA orientation',
    description: 'Read the active slice, allowed paths, gates, and stop state.',
    inputSchema: EMPTY_INPUT_SCHEMA,
    readOnly: true,
  }),
  tool({
    name: 'scopa_read_file',
    capabilityId: 'scopa.read_file',
    effect: 'OBSERVE',
    title: 'SCOPA repository read',
    description: 'Read one UTF-8 regular file contained by the repository.',
    inputSchema: Object.freeze({
      type: 'object',
      properties: Object.freeze({
        path: Object.freeze({
          type: 'string',
          minLength: 1,
          maxLength: ADAPTER_MAX_PATH_BYTES,
        }),
      }),
      required: Object.freeze(['path']),
      additionalProperties: false,
    }),
    readOnly: true,
  }),
  tool({
    name: 'scopa_write_file',
    capabilityId: 'scopa.write_file',
    effect: 'MUTATE',
    title: 'SCOPA governed write',
    description:
      'Write one UTF-8 file through the trusted SCOPA mutation dispatcher.',
    inputSchema: Object.freeze({
      type: 'object',
      properties: Object.freeze({
        path: Object.freeze({
          type: 'string',
          minLength: 1,
          maxLength: ADAPTER_MAX_PATH_BYTES,
        }),
        content: Object.freeze({
          type: 'string',
        }),
      }),
      required: Object.freeze([
        'content',
        'path',
      ]),
      additionalProperties: false,
    }),
    readOnly: false,
    destructive: true,
  }),
  tool({
    name: 'scopa_check',
    capabilityId: 'scopa.check',
    effect: 'OBSERVE',
    title: 'SCOPA completion check',
    description:
      'Run the immutable verification gates and return the real stop state.',
    inputSchema: EMPTY_INPUT_SCHEMA,
    readOnly: true,
  }),
  tool({
    name: 'scopa_assurance',
    capabilityId: 'scopa.assurance',
    effect: 'OBSERVE',
    title: 'SCOPA capability assurance',
    description:
      'Return the validated capability and bypass matrix for this launcher.',
    inputSchema: EMPTY_INPUT_SCHEMA,
    readOnly: true,
  }),
  tool({
    name: 'scopa_transcript',
    capabilityId: 'scopa.transcript',
    effect: 'OBSERVE',
    title: 'SCOPA adapter transcript',
    description:
      'Return the validated operational transcript; this inspection call is excluded from its own snapshot.',
    inputSchema: EMPTY_INPUT_SCHEMA,
    readOnly: true,
  }),
]);
const TOOL_BY_NAME = new Map(
  TOOL_DEFINITIONS.map((definition) => [definition.name, definition]),
);
const MAX_READ_BYTES = 512 * 1024;

function exactArguments(value, keys, label) {
  const args = value ?? {};
  try {
    exactObject(args, keys, label);
  } catch (error) {
    throw new AdapterRequestError(error.message);
  }
  return args;
}

function validateArguments(name, value) {
  function adapterPath(pathValue) {
    const value = nonEmptyString(pathValue, `${name}.path`);
    if (Buffer.byteLength(value) > ADAPTER_MAX_PATH_BYTES) {
      throw new AdapterRequestError(
        `${name}.path exceeds ${ADAPTER_MAX_PATH_BYTES}-byte limit`,
      );
    }
    return value;
  }
  if (name === 'scopa_read_file') {
    const args = exactArguments(value, new Set(['path']), `${name} arguments`);
    return {
      path: adapterPath(args.path),
    };
  }
  if (name === 'scopa_write_file') {
    const args = exactArguments(
      value,
      new Set(['content', 'path']),
      `${name} arguments`,
    );
    if (typeof args.content !== 'string') {
      throw new AdapterRequestError(`${name}.content must be a string`);
    }
    return {
      path: adapterPath(args.path),
      content: args.content,
    };
  }
  return exactArguments(value, new Set(), `${name} arguments`);
}

async function containedReadPath(repoRoot, requestedPath) {
  const root = await realpath(repoRoot);
  const candidate = path.resolve(root, requestedPath);
  const lexical = path.relative(root, candidate);
  if (
    lexical === '..' ||
    lexical.startsWith(`..${path.sep}`) ||
    path.isAbsolute(lexical)
  ) {
    throw new AdapterReadDeniedError(
      requestedPath,
      'requested path escapes repository',
    );
  }
  let resolved;
  try {
    resolved = await realpath(candidate);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AdapterReadDeniedError(requestedPath, 'file does not exist');
    }
    throw error;
  }
  const relative = path.relative(root, resolved);
  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new AdapterReadDeniedError(
      requestedPath,
      'requested path resolves outside repository',
    );
  }
  const metadata = await lstat(resolved);
  if (!metadata.isFile()) {
    throw new AdapterReadDeniedError(
      requestedPath,
      'requested path is not a regular file',
    );
  }
  if (metadata.nlink !== 1) {
    throw new AdapterReadDeniedError(
      requestedPath,
      'hard-linked read targets are not allowed',
    );
  }
  if (metadata.size > MAX_READ_BYTES) {
    throw new AdapterReadDeniedError(
      requestedPath,
      `file exceeds ${MAX_READ_BYTES}-byte bridge read limit`,
    );
  }
  return resolved;
}

function adapterError(error) {
  return {
    schema: 'scopa.adapter-error.v1',
    code: error?.code ?? 'SCOPA_ADAPTER_TOOL_ERROR',
    message: error?.message ?? String(error),
    details: isPlainObject(error?.details)
      ? structuredClone(error.details)
      : null,
  };
}

function mcpToolResult(result, isError = false) {
  return {
    content: [
      {
        type: 'text',
        text: canonicalJson(result),
      },
    ],
    structuredContent: result,
    isError,
  };
}

export async function createAdapterBridge({
  repoRoot,
  session,
  capabilityMatrix,
  evidenceJournalPath = null,
}) {
  const project = await loadProject(repoRoot);
  const resolvedEvidenceJournal = evidenceJournalPath === null
    ? null
    : path.resolve(evidenceJournalPath);
  if (resolvedEvidenceJournal !== null) {
    const relativeJournal = path.relative(
      project.repoRoot,
      resolvedEvidenceJournal,
    );
    if (
      relativeJournal === '' ||
      (!relativeJournal.startsWith(`..${path.sep}`) && relativeJournal !== '..')
    ) {
      throw new AdapterValidationError(
        'host evidence journal must be outside the repository',
      );
    }
  }
  const descriptor = validateSessionDescriptor(session);
  const matrix = validateCapabilityMatrix(capabilityMatrix);
  const advertisedCapabilityIds = new Set(
    matrix.capabilities
      .filter((capability) => capability.exposure === 'advertised')
      .map((capability) => capability.id),
  );
  const missingCapabilities = TOOL_DEFINITIONS
    .map((definition) => definition.capabilityId)
    .filter((id) => !advertisedCapabilityIds.has(id));
  if (missingCapabilities.length > 0) {
    throw new AdapterValidationError(
      `matrix omits advertised bridge tools: ${missingCapabilities.join(', ')}`,
    );
  }

  const host = createReferenceAgentHost({
    repoRoot: project.repoRoot,
    lock: project.lock,
  });
  const transcript = createTranscriptRecorder({ descriptor });
  let initialized = false;

  async function stopState() {
    return evaluateStopCondition({
      lock: project.lock,
      repoRoot: project.repoRoot,
    });
  }

  async function execute(name, args) {
    if (name === 'scopa_orientation') {
      return orientation({
        lock: project.lock,
        stopState: await stopState(),
      });
    }
    if (name === 'scopa_read_file') {
      return host.invoke({
        name: 'read_file',
        arguments: {
          path: await containedReadPath(project.repoRoot, args.path),
        },
      });
    }
    if (name === 'scopa_write_file') {
      return host.invoke({
        name: 'write_file',
        arguments: args,
      });
    }
    if (name === 'scopa_check') {
      return {
        schema: 'scopa.adapter-check-result.v1',
        state: await stopState(),
      };
    }
    if (name === 'scopa_assurance') return matrix;
    throw new AdapterRequestError(`unknown tool: ${name}`);
  }

  return Object.freeze({
    begin({ client, protocolVersion, requestId }) {
      if (initialized) {
        throw new AdapterRequestError('adapter is already initialized');
      }
      const clientIdentity = `${client?.name}@${client?.version}`;
      if (matrix.subject.client !== clientIdentity) {
        throw new AdapterRequestError(
          `client identity ${clientIdentity} does not match assurance subject ${matrix.subject.client}`,
        );
      }
      transcript.begin({ client, protocolVersion, requestId });
      initialized = true;
    },
    listTools() {
      return TOOL_DEFINITIONS.map((definition) => definition.protocol);
    },
    async invoke({ requestId, name, arguments: value }) {
      if (!initialized) {
        throw new AdapterRequestError('adapter is not initialized');
      }
      const definition = TOOL_BY_NAME.get(name);
      if (!definition) {
        throw new AdapterRequestError(`unknown tool: ${name}`);
      }
      const args = validateArguments(name, value);
      if (name === 'scopa_transcript') {
        const snapshot = transcript.snapshot();
        if (resolvedEvidenceJournal === null) return mcpToolResult(snapshot);
        const journal = createHostJournal(snapshot);
        await writeEvidenceNoReplace(
          resolvedEvidenceJournal,
          canonicalJsonPretty(journal),
        );
        return mcpToolResult(createCompactTranscript(journal));
      }
      const callRecorded = transcript.recordCall({
        requestId,
        tool: name,
        effect: definition.effect,
        arguments: args,
      });
      if (!callRecorded) {
        throw new AdapterRequestError(
          'adapter transcript capacity exhausted',
          transcript.limits(),
        );
      }
      try {
        const result = await execute(name, args);
        const blocked = name === 'scopa_check' && !result.state.canStop;
        const resultRecorded = transcript.recordResult({
          requestId,
          tool: name,
          effect: definition.effect,
          outcome: blocked ? 'blocked' : name === 'scopa_check'
            ? 'satisfied'
            : 'allowed',
          result,
        });
        if (!resultRecorded) {
          throw new AdapterValidationError(
            'adapter result exceeds transcript capacity',
          );
        }
        if (name === 'scopa_check') transcript.setTerminal(result.state);
        const agentResult = resolvedEvidenceJournal === null
          ? result
          : name === 'scopa_check'
            ? compactCheckResult(result)
            : name === 'scopa_assurance'
              ? compactAssuranceResult(result)
              : result;
        return mcpToolResult(agentResult, blocked);
      } catch (error) {
        const result = adapterError(error);
        const denied = [
          'SCOPA_READ_DENIED',
          'SCOPA_SCOPE_DENIED',
        ].includes(error?.code);
        const errorRecorded = transcript.recordResult({
          requestId,
          tool: name,
          effect: definition.effect,
          outcome: denied ? 'denied' : 'error',
          result,
        });
        if (!errorRecorded) {
          throw new AdapterValidationError(
            'adapter error exceeds transcript capacity',
          );
        }
        return mcpToolResult(result, true);
      }
    },
    recordProtocolError({ requestId, method, code, message, details = null }) {
      transcript.recordProtocolError({
        requestId,
        method,
        result: {
          code,
          message,
          details,
        },
      });
    },
    transcript() {
      return transcript.snapshot();
    },
    assurance() {
      return matrix;
    },
  });
}
