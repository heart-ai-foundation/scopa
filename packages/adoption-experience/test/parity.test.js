import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  createBootstrapBridge,
} from '../../adapter-host/src/index.js';
import {
  createMcpMessageHandler,
} from '../../adapter-host/src/mcp-stdio.js';
import {
  executeCommand,
} from '../../cli/src/index.js';

function request() {
  return {
    schema: 'scopa.begin-request.v1',
    sliceId: 'S38-parity',
    outcome: 'Prove CLI and MCP bootstrap parity',
    allowedPaths: ['workspace/**'],
    gates: [{
      id: 'acceptance',
      command: ['/usr/bin/true'],
      cwd: '.',
      timeoutMs: 5_000,
    }],
    nonGoals: ['No provider use'],
    clientProfile: 'codex',
  };
}

async function root(prefix) {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

test('CLI and MCP expose the same begin request and result semantics', async () => {
  const cliRoot = await root('scopa-s38-cli-');
  const mcpRoot = await root('scopa-s38-mcp-');
  const cli = await executeCommand([
    'begin',
    '--repo', cliRoot,
    '--request-json', JSON.stringify(request()),
  ]);
  assert.equal(cli.exitCode, 0);

  const handle = createMcpMessageHandler({
    bridge: createBootstrapBridge({ repoRoot: mcpRoot }),
  });
  const initialize = await handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
  });
  assert.match(initialize.result.instructions, /scopa_begin/u);
  await handle({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {},
  });
  const listed = await handle({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  assert.deepEqual(listed.result.tools.map((tool) => tool.name), ['scopa_begin']);
  const called = await handle({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'scopa_begin', arguments: request() },
  });
  assert.equal(called.result.isError, false);
  assert.deepEqual(called.result.structuredContent, cli.envelope.result);

  const mapped = await executeCommand(['map', '--repo', cliRoot]);
  assert.deepEqual(mapped.envelope.result, cli.envelope.result.boundaryMap);
});
