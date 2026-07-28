import {
  TextDecoder,
} from 'node:util';
import {
  once,
} from 'node:events';
import {
  canonicalJson,
} from '../../enforcement/src/index.js';
import {
  AdapterRequestError,
} from './bridge.js';
import {
  AdapterValidationError,
  isPlainObject,
} from './schema.js';

export const MCP_PROTOCOL_VERSION = '2025-11-25';
export const MCP_SUPPORTED_VERSIONS = Object.freeze([
  '2025-11-25',
  '2025-06-18',
  '2025-03-26',
  '2024-11-05',
]);
export const MCP_MAX_MESSAGE_BYTES = 1024 * 1024;
export const MCP_MAX_REQUEST_IDS = 2048;
export const MCP_MAX_REQUEST_ID_BYTES = 256;

const JSON_RPC = '2.0';
const SERVER_INFO = Object.freeze({
  name: 'scopa-mcp',
  version: '0.1.0',
});

function response(id, result) {
  return {
    jsonrpc: JSON_RPC,
    id,
    result,
  };
}

function errorResponse(id, code, message, data = null) {
  const error = { code, message };
  if (data !== null) error.data = data;
  return {
    jsonrpc: JSON_RPC,
    id,
    error,
  };
}

async function writeReply(output, reply) {
  if (!output.write(`${canonicalJson(reply)}\n`)) {
    await once(output, 'drain');
  }
}

function transportProtocolError({
  bridge,
  code,
  message,
  details = null,
}) {
  bridge.recordProtocolError({
    requestId: null,
    method: '',
    code,
    message,
    details,
  });
  return errorResponse(null, code, message);
}

function requestId(value) {
  return (
    (
      typeof value === 'string' &&
      Buffer.byteLength(value) <= MCP_MAX_REQUEST_ID_BYTES
    ) ||
    (typeof value === 'number' && Number.isSafeInteger(value))
  );
}

function exactKeys(value, allowed) {
  return (
    isPlainObject(value) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
}

function initializeParams(params) {
  if (
    !exactKeys(
      params,
      new Set([
        '_meta',
        'capabilities',
        'clientInfo',
        'protocolVersion',
      ]),
    ) ||
    typeof params.protocolVersion !== 'string' ||
    !isPlainObject(params.capabilities) ||
    !isPlainObject(params.clientInfo) ||
    typeof params.clientInfo.name !== 'string' ||
    params.clientInfo.name.length === 0 ||
    typeof params.clientInfo.version !== 'string' ||
    params.clientInfo.version.length === 0
  ) {
    throw new AdapterRequestError('invalid initialize parameters');
  }
  return {
    requestedVersion: params.protocolVersion,
    client: {
      name: params.clientInfo.name,
      version: params.clientInfo.version,
    },
  };
}

function listParams(params) {
  if (params === undefined) return;
  if (
    !exactKeys(params, new Set(['_meta', 'cursor'])) ||
    !(
      params.cursor === undefined ||
      params.cursor === null
    )
  ) {
    throw new AdapterRequestError('tools/list cursor is unsupported');
  }
}

function callParams(params) {
  if (
    !exactKeys(params, new Set(['_meta', 'arguments', 'name'])) ||
    typeof params.name !== 'string' ||
    params.name.length === 0 ||
    !(
      params.arguments === undefined ||
      isPlainObject(params.arguments)
    )
  ) {
    throw new AdapterRequestError('invalid tools/call parameters');
  }
  return {
    name: params.name,
    arguments: params.arguments ?? {},
  };
}

export function createMcpMessageHandler({
  bridge,
  maxRequestIds = MCP_MAX_REQUEST_IDS,
}) {
  if (
    !Number.isSafeInteger(maxRequestIds) ||
    maxRequestIds < 1 ||
    maxRequestIds > MCP_MAX_REQUEST_IDS
  ) {
    throw new RangeError(
      `maxRequestIds must be an integer from 1 to ${MCP_MAX_REQUEST_IDS}`,
    );
  }
  let phase = 'new';
  const seenRequestIds = new Set();

  function idKey(id) {
    return `${typeof id}:${id}`;
  }

  function protocolError({ id, method, code, message, data = null }) {
    bridge.recordProtocolError({
      requestId: requestId(id) ? id : null,
      method: typeof method === 'string' ? method : '',
      code,
      message,
      details: data,
    });
    return errorResponse(requestId(id) ? id : null, code, message, data);
  }

  return async function handle(message) {
    if (
      !isPlainObject(message) ||
      message.jsonrpc !== JSON_RPC ||
      typeof message.method !== 'string' ||
      !(
        message.id === undefined ||
        requestId(message.id)
      ) ||
      !Object.keys(message).every((key) =>
        new Set(['id', 'jsonrpc', 'method', 'params']).has(key))
    ) {
      return protocolError({
        id: isPlainObject(message) ? message.id : null,
        method: isPlainObject(message) ? message.method : '',
        code: -32600,
        message: 'Invalid Request',
      });
    }

    const isNotification = message.id === undefined;
    if (!isNotification) {
      const key = idKey(message.id);
      if (seenRequestIds.has(key)) {
        return protocolError({
          id: message.id,
          method: message.method,
          code: -32600,
          message: 'duplicate request id',
        });
      }
      if (seenRequestIds.size >= maxRequestIds) {
        return protocolError({
          id: message.id,
          method: message.method,
          code: -32000,
          message: 'session request limit reached',
          data: {
            maxRequestIds,
          },
        });
      }
      seenRequestIds.add(key);
    }

    if (isNotification) {
      if (
        message.method === 'notifications/initialized' &&
        phase === 'awaiting-initialized' &&
        (
          message.params === undefined ||
          (
            isPlainObject(message.params) &&
            Object.keys(message.params).length === 0
          )
        )
      ) {
        phase = 'ready';
        return null;
      }
      bridge.recordProtocolError({
        requestId: null,
        method: message.method,
        code: -32600,
        message: 'unsupported or out-of-order notification',
      });
      return null;
    }

    if (message.method === 'ping') {
      if (
        message.params !== undefined &&
        (
          !isPlainObject(message.params) ||
          Object.keys(message.params).length > 0
        )
      ) {
        return protocolError({
          id: message.id,
          method: message.method,
          code: -32602,
          message: 'Invalid params',
        });
      }
      return response(message.id, {});
    }

    if (message.method === 'initialize') {
      if (phase !== 'new') {
        return protocolError({
          id: message.id,
          method: message.method,
          code: -32600,
          message: 'initialize must be the first interaction',
        });
      }
      try {
        const { requestedVersion, client } = initializeParams(message.params);
        const protocolVersion = MCP_SUPPORTED_VERSIONS.includes(
          requestedVersion,
        )
          ? requestedVersion
          : MCP_PROTOCOL_VERSION;
        bridge.begin({
          client,
          protocolVersion,
          requestId: message.id,
        });
        phase = 'awaiting-initialized';
        return response(message.id, {
          protocolVersion,
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
          serverInfo: SERVER_INFO,
          instructions:
            'Use only advertised SCOPA tools. A task is complete only when scopa_check returns canStop true.',
        });
      } catch (error) {
        return protocolError({
          id: message.id,
          method: message.method,
          code: -32602,
          message: error.message,
        });
      }
    }

    if (phase !== 'ready') {
      return protocolError({
        id: message.id,
        method: message.method,
        code: -32600,
        message: 'adapter is not initialized',
      });
    }

    try {
      if (message.method === 'tools/list') {
        listParams(message.params);
        return response(message.id, {
          tools: bridge.listTools(),
        });
      }
      if (message.method === 'tools/call') {
        const call = callParams(message.params);
        return response(
          message.id,
          await bridge.invoke({
            requestId: message.id,
            ...call,
          }),
        );
      }
      return protocolError({
        id: message.id,
        method: message.method,
        code: -32601,
        message: 'Method not found',
      });
    } catch (error) {
      if (
        error instanceof AdapterRequestError ||
        error instanceof AdapterValidationError
      ) {
        return protocolError({
          id: message.id,
          method: message.method,
          code: -32602,
          message: error.message,
          data: error.details ?? null,
        });
      }
      return protocolError({
        id: message.id,
        method: message.method,
        code: -32603,
        message: 'Internal error',
      });
    }
  };
}

export async function serveMcpStdio({
  bridge,
  input = process.stdin,
  output = process.stdout,
  maxMessageBytes = MCP_MAX_MESSAGE_BYTES,
  maxRequestIds = MCP_MAX_REQUEST_IDS,
}) {
  if (
    !Number.isSafeInteger(maxMessageBytes) ||
    maxMessageBytes < 1 ||
    maxMessageBytes > MCP_MAX_MESSAGE_BYTES
  ) {
    throw new RangeError(
      `maxMessageBytes must be an integer from 1 to ${MCP_MAX_MESSAGE_BYTES}`,
    );
  }
  const handle = createMcpMessageHandler({
    bridge,
    maxRequestIds,
  });
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for await (const frame of readMcpFrames(input, maxMessageBytes)) {
    let reply;
    if (frame.oversized) {
      reply = transportProtocolError({
        bridge,
        code: -32600,
        message: 'message exceeds size limit',
        details: {
          maxMessageBytes,
        },
      });
    } else {
      let message;
      try {
        message = JSON.parse(decoder.decode(frame.bytes));
      } catch {
        reply = transportProtocolError({
          bridge,
          code: -32700,
          message: 'Parse error',
        });
      }
      if (message !== undefined) reply = await handle(message);
    }
    if (reply !== null) {
      await writeReply(output, reply);
    }
  }
}

async function* readMcpFrames(input, maxMessageBytes) {
  const lineBuffer = Buffer.allocUnsafe(maxMessageBytes);
  let lineLength = 0;
  let oversized = false;

  function frame() {
    if (oversized) {
      return {
        bytes: null,
        oversized: true,
      };
    }
    const contentLength =
      lineLength > 0 && lineBuffer[lineLength - 1] === 0x0d
        ? lineLength - 1
        : lineLength;
    return {
      bytes: Buffer.from(lineBuffer.subarray(0, contentLength)),
      oversized: false,
    };
  }

  function reset() {
    lineLength = 0;
    oversized = false;
  }

  for await (const value of input) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
    let offset = 0;
    while (offset < chunk.length) {
      const newline = chunk.indexOf(0x0a, offset);
      const end = newline === -1 ? chunk.length : newline;
      const segmentLength = end - offset;
      if (!oversized) {
        if (segmentLength > maxMessageBytes - lineLength) {
          oversized = true;
          lineLength = 0;
        } else if (segmentLength > 0) {
          chunk.copy(
            lineBuffer,
            lineLength,
            offset,
            end,
          );
          lineLength += segmentLength;
        }
      }
      if (newline === -1) break;
      yield frame();
      reset();
      offset = newline + 1;
    }
  }

  if (oversized || lineLength > 0) {
    yield frame();
  }
}
