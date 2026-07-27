import {
  createInterface,
} from 'node:readline';
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

function requestId(value) {
  return (
    typeof value === 'string' ||
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

export function createMcpMessageHandler({ bridge }) {
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
}) {
  const handle = createMcpMessageHandler({ bridge });
  const lines = createInterface({
    input,
    crlfDelay: Infinity,
    terminal: false,
  });
  for await (const line of lines) {
    let reply;
    if (Buffer.byteLength(line, 'utf8') > maxMessageBytes) {
      reply = errorResponse(null, -32600, 'message exceeds size limit');
    } else {
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        reply = errorResponse(null, -32700, 'Parse error');
      }
      if (message !== undefined) reply = await handle(message);
    }
    if (reply !== null) {
      output.write(`${canonicalJson(reply)}\n`);
    }
  }
}
