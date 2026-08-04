#!/usr/bin/env node

import {
  spawn,
} from 'node:child_process';
import {
  readFile,
} from 'node:fs/promises';
import {
  createInterface,
} from 'node:readline';
import {
  fileURLToPath,
} from 'node:url';
import {
  createAdapterBridge,
  createMcpMessageHandler,
} from '../../packages/adapter-host/src/index.js';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (
      !['--server', '--repo', '--session', '--matrix'].includes(flag) ||
      value === undefined
    ) {
      throw new TypeError(
        'usage: --server scopa-mcp --repo REPO --session FILE --matrix FILE',
      );
    }
    options[flag.slice(2)] = value;
  }
  for (const name of ['server', 'repo', 'session', 'matrix']) {
    if (!options[name]) throw new TypeError(`missing --${name}`);
  }
  return options;
}

function toolRequest(id, name, args = {}) {
  return {
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: {
      name,
      arguments: args,
    },
  };
}

async function exerciseClient({ send, notify }) {
  const initialize = await send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: {
        name: 'scopa-consumer-fixture',
        version: '0.2.0',
      },
    },
  });
  await notify({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  });
  const inventory = await send({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  const orientation = await send(toolRequest(3, 'scopa_orientation'));
  const allowed = await send(toolRequest(4, 'scopa_write_file', {
    path: 'workspace/consumer.txt',
    content: 'SCOPA_CONSUMER_ALLOWED\n',
  }));
  const denied = await send(toolRequest(5, 'scopa_write_file', {
    path: '../consumer-escape.txt',
    content: 'must not exist\n',
  }));
  const check = await send(toolRequest(6, 'scopa_check'));
  const assurance = await send(toolRequest(7, 'scopa_assurance'));
  const transcript = await send(toolRequest(8, 'scopa_transcript'));
  for (const response of [
    initialize,
    inventory,
    orientation,
    allowed,
    denied,
    check,
    assurance,
    transcript,
  ]) {
    if (response.error) {
      throw new Error(`MCP response error: ${JSON.stringify(response.error)}`);
    }
  }

  const deniedResult = denied.result.structuredContent;
  const stop = check.result.structuredContent.state;
  const matrix = assurance.result.structuredContent;
  return {
    schema: 'scopa.consumer-adapter-result.v1',
    protocolVersion: initialize.result.protocolVersion,
    server: initialize.result.serverInfo,
    toolNames: inventory.result.tools
      .map((tool) => tool.name)
      .sort(),
    orientation: orientation.result.structuredContent,
    allowedWrite:
      allowed.result.isError === false &&
      allowed.result.structuredContent.written === true,
    scopeDenied:
      denied.result.isError === true &&
      deniedResult.code === 'SCOPA_SCOPE_DENIED',
    denial: deniedResult,
    terminal: {
      status: stop.status,
      canStop: stop.canStop,
    },
    assurance: matrix.assurance,
    transcript: transcript.result.structuredContent,
  };
}

export async function runConsumerClient(options) {
  const serverArgs = [
    '--repo',
    options.repo,
    '--session-file',
    options.session,
    '--matrix-file',
    options.matrix,
  ];
  // Invoke the JavaScript entry point through the current Node runtime. Direct
  // shebang execution can lose the executable-entry identity when a package
  // manager's .bin symlink is launched by child_process.spawn(), causing the
  // module to return without starting stdio. This path behaves consistently
  // across npm's supported symlink layouts and still exercises the real MCP
  // process boundary.
  const child = spawn(process.execPath, [options.server, ...serverArgs], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const pending = new Map();
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const lines = createInterface({
    input: child.stdout,
    crlfDelay: Infinity,
  });
  lines.on('line', (line) => {
    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      for (const { reject } of pending.values()) reject(error);
      pending.clear();
      return;
    }
    if (message.id !== undefined && pending.has(message.id)) {
      const { resolve } = pending.get(message.id);
      pending.delete(message.id);
      resolve(message);
    }
  });
  child.on('error', (error) => {
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
  });
  child.on('close', (code) => {
    if (pending.size === 0) return;
    const error = new Error(
      `scopa-mcp closed ${code} before replying: ${stderr}`,
    );
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
  });

  const send = (message) => new Promise((resolve, reject) => {
    pending.set(message.id, { resolve, reject });
    child.stdin.write(`${JSON.stringify(message)}\n`);
  });
  const report = await exerciseClient({
    send,
    notify: async (message) => {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    },
  });
  child.stdin.end();
  const exitCode = await new Promise((resolve) => {
    child.once('close', resolve);
  });
  if (exitCode !== 0) {
    throw new Error(`scopa-mcp exited ${exitCode}: ${stderr}`);
  }
  return report;
}

export async function runConsumerClientInProcess(options) {
  const [session, capabilityMatrix] = await Promise.all([
    readFile(options.session, 'utf8').then(JSON.parse),
    readFile(options.matrix, 'utf8').then(JSON.parse),
  ]);
  const bridge = await createAdapterBridge({
    repoRoot: options.repo,
    session,
    capabilityMatrix,
  });
  const handle = createMcpMessageHandler({ bridge });
  return exerciseClient({
    send: handle,
    notify: handle,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const report = await runConsumerClient(
      parseArgs(process.argv.slice(2)),
    );
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  }
}
