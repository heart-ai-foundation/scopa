#!/usr/bin/env node

import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  initializeProject,
} from '../../cli/src/project.js';
import {
  createAdapterBridge,
} from '../src/bridge.js';
import {
  createMcpMessageHandler,
} from '../src/mcp-stdio.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);
const FIXTURE = path.join(ROOT, 'fixtures/S7');

function request(id, method, params) {
  const value = {
    jsonrpc: '2.0',
    id,
    method,
  };
  if (params !== undefined) value.params = params;
  return value;
}

function call(id, name, args = {}) {
  return request(id, 'tools/call', {
    name,
    arguments: args,
  });
}

async function main() {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s7-proof-'));
  try {
    await mkdir(path.join(temporary, '.git'));
    await mkdir(path.join(temporary, 'workspace'));
    const definition = JSON.parse(
      await readFile(
        path.join(FIXTURE, 'scopa.slice-definition.json'),
        'utf8',
      ),
    );
    await writeFile(
      path.join(temporary, 'scopa.slice-definition.json'),
      canonicalJsonPretty(definition),
    );
    await initializeProject({
      repoRoot: temporary,
      definitionPath: 'scopa.slice-definition.json',
    });
    const bridge = await createAdapterBridge({
      repoRoot: temporary,
      session: JSON.parse(
        await readFile(path.join(FIXTURE, 'session.json'), 'utf8'),
      ),
      capabilityMatrix: JSON.parse(
        await readFile(
          path.join(FIXTURE, 'capability-matrix.json'),
          'utf8',
        ),
      ),
    });
    const handle = createMcpMessageHandler({ bridge });
    const initialize = await handle(request(1, 'initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: {
        name: 'scopa-fake-agent',
        version: '0.1.0',
      },
    }));
    await handle({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });
    const inventory = await handle(request(2, 'tools/list', {}));
    const read = await handle(call(3, 'scopa_read_file', {
      path: 'scopa.slice-definition.json',
    }));
    const allowedWrite = await handle(call(4, 'scopa_write_file', {
      path: 'workspace/bridge.txt',
      content: 'mediated',
    }));
    const deniedWrite = await handle(call(5, 'scopa_write_file', {
      path: '../outside.txt',
      content: 'blocked',
    }));
    const hostileUnknownTool = await handle(call(6, 'shell', {
      command: 'touch outside.txt',
    }));
    const stop = await handle(call(7, 'scopa_check'));
    const assurance = await handle(call(8, 'scopa_assurance'));
    const transcript = await handle(call(9, 'scopa_transcript'));
    process.stdout.write(canonicalJsonPretty({
      schema: 'scopa.adapter-proof.v1',
      protocol: {
        initialized: initialize.result.serverInfo,
        version: initialize.result.protocolVersion,
      },
      toolInventory: inventory.result.tools,
      outcomes: {
        read: {
          isError: read.result.isError,
          observedSlice: JSON.parse(
            read.result.structuredContent.content,
          ).sliceId,
        },
        allowedWrite: allowedWrite.result.structuredContent,
        deniedWrite: deniedWrite.result.structuredContent,
        hostileUnknownTool: hostileUnknownTool.error,
        stop: stop.result.structuredContent,
      },
      capabilityMatrix: assurance.result.structuredContent,
      transcript: transcript.result.structuredContent,
    }));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
