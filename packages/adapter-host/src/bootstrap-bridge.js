import {
  BEGIN_REQUEST_INPUT_SCHEMA,
  BeginRequestError,
  beginSlice,
} from '../../adoption-experience/src/index.js';
import {
  canonicalJson,
} from '../../enforcement/src/index.js';
import {
  AdapterRequestError,
} from './bridge.js';

const BEGIN_TOOL = Object.freeze({
  name: 'scopa_begin',
  title: 'Begin a SCOPA-governed task',
  description:
    'Validate one explicit task boundary, initialize closed-by-default SCOPA state, run its gates, and return the actual boundary map.',
  inputSchema: BEGIN_REQUEST_INPUT_SCHEMA,
  outputSchema: Object.freeze({
    type: 'object',
    additionalProperties: true,
  }),
  annotations: Object.freeze({
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  }),
});

function toolResult(result) {
  return {
    content: [{ type: 'text', text: canonicalJson(result) }],
    structuredContent: result,
    isError: result.status === 'blocked',
  };
}

export function createBootstrapBridge({ repoRoot }) {
  let initialized = false;
  return Object.freeze({
    begin() {
      if (initialized) {
        throw new AdapterRequestError('bootstrap adapter is already initialized');
      }
      initialized = true;
    },
    listTools() {
      return [BEGIN_TOOL];
    },
    async invoke({ name, arguments: request }) {
      if (!initialized) {
        throw new AdapterRequestError('bootstrap adapter is not initialized');
      }
      if (name !== 'scopa_begin') {
        throw new AdapterRequestError(`unknown tool: ${name}`);
      }
      try {
        return toolResult(await beginSlice({ repoRoot, request }));
      } catch (error) {
        if (error instanceof BeginRequestError) {
          throw new AdapterRequestError(error.message, error.details);
        }
        throw error;
      }
    },
    recordProtocolError() {},
    instructions() {
      return 'Call scopa_begin once with an explicit structured task boundary. Do not infer paths, gates, authority, or client capabilities from prose.';
    },
  });
}
