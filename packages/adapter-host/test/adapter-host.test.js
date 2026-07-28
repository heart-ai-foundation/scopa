import assert from 'node:assert/strict';
import {
  execFile,
  spawn,
} from 'node:child_process';
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import {
  once,
} from 'node:events';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  promisify,
} from 'node:util';
import {
  fileURLToPath,
} from 'node:url';
import {
  initializeProject,
} from '../../cli/src/project.js';
import {
  createAdapterBridge,
} from '../src/bridge.js';
import {
  LauncherError,
  launcherErrorEnvelope,
  main as launcherMain,
  parseArguments as parseLauncherArguments,
  readJson as readLauncherJson,
} from '../src/cli.js';
import {
  FakeAgentClient,
} from '../src/fake-agent-client.js';
import {
  createMcpMessageHandler,
} from '../src/mcp-stdio.js';
import {
  validateCapabilityMatrix,
} from '../src/assurance.js';
import {
  validateTranscript,
} from '../src/transcript.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);
const FIXTURE = path.join(ROOT, 'fixtures/S7');
const execFileAsync = promisify(execFile);
const DEFINITION = JSON.parse(
  await readFile(path.join(FIXTURE, 'scopa.slice-definition.json'), 'utf8'),
);
const SESSION = JSON.parse(
  await readFile(path.join(FIXTURE, 'session.json'), 'utf8'),
);
const MATRIX = JSON.parse(
  await readFile(path.join(FIXTURE, 'capability-matrix.json'), 'utf8'),
);

async function repository(context, {
  definition = DEFINITION,
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-adapter-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'workspace'));
  await writeFile(
    path.join(root, 'scopa.slice-definition.json'),
    `${JSON.stringify(definition, null, 2)}\n`,
  );
  await initializeProject({
    repoRoot: root,
    definitionPath: 'scopa.slice-definition.json',
  });
  return root;
}

async function directBridge(context, options = {}) {
  const root = await repository(context, options);
  const bridge = await createAdapterBridge({
    repoRoot: root,
    session: SESSION,
    capabilityMatrix: MATRIX,
  });
  const handle = createMcpMessageHandler({ bridge });
  const initialize = await handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: {
        name: 'scopa-fake-agent',
        version: '0.1.0',
      },
    },
  });
  assert.equal(initialize.result.protocolVersion, '2025-11-25');
  assert.equal(
    await handle({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
    null,
  );
  return { root, bridge, handle };
}

function request(id, method, params) {
  const message = {
    jsonrpc: '2.0',
    id,
    method,
  };
  if (params !== undefined) message.params = params;
  return message;
}

function call(id, name, args = {}) {
  return request(id, 'tools/call', {
    name,
    arguments: args,
  });
}

function structured(reply) {
  assert.equal(reply.error, undefined, JSON.stringify(reply.error));
  return reply.result.structuredContent;
}

async function invoke(command, cwd, args, {
  env = process.env,
} = {}) {
  const childEnv = { ...env };
  delete childEnv.NODE_TEST_CONTEXT;
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      encoding: 'utf8',
      env: childEnv,
      maxBuffer: 10 * 1024 * 1024,
    });
    return {
      status: 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      status: Number.isSafeInteger(error.code) ? error.code : null,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
    };
  }
}

test('launcher failures are closed JSON without topology or input echo', async (context) => {
  const hostileValue = path.join(ROOT, 'hostile-private-value');
  for (const args of [
    [],
    ['--uncontrolled-option', hostileValue],
    ['--session-file', hostileValue],
  ]) {
    assert.throws(
      () => parseLauncherArguments(args),
      (error) => {
        const serialized = JSON.stringify(launcherErrorEnvelope(error));
        assert.equal(error.code, 'SCOPA_LAUNCHER_ARGUMENT_INVALID');
        assert.equal(serialized.includes(ROOT), false);
        assert.equal(serialized.includes(hostileValue), false);
        assert.equal(serialized.includes('file:'), false);
        assert.doesNotMatch(serialized, /\s+at\s/);
        return true;
      },
    );
  }

  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-launcher-'));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const absent = path.join(temporary, 'absent.json');
  await assert.rejects(
    () => readLauncherJson(absent),
    (error) =>
      error instanceof LauncherError &&
      error.code === 'SCOPA_LAUNCHER_INPUT_UNAVAILABLE',
  );
  const malformed = path.join(temporary, 'malformed.json');
  await writeFile(malformed, '{not-json\n');
  await assert.rejects(
    () => readLauncherJson(malformed),
    (error) =>
      error instanceof LauncherError &&
      error.code === 'SCOPA_LAUNCHER_INPUT_INVALID',
  );

  const root = await repository(context);
  const sessionFile = path.join(temporary, 'session.json');
  const matrixFile = path.join(temporary, 'matrix.json');
  await writeFile(sessionFile, '{}\n');
  await writeFile(matrixFile, `${JSON.stringify(MATRIX)}\n`);
  await assert.rejects(
    () => launcherMain([
      '--repo',
      root,
      '--session-file',
      sessionFile,
      '--matrix-file',
      matrixFile,
    ]),
    (error) => {
      const envelope = launcherErrorEnvelope(error);
      assert.equal(
        envelope.error.code,
        'SCOPA_LAUNCHER_CONFIGURATION_INVALID',
      );
      assert.equal(JSON.stringify(envelope).includes(root), false);
      return true;
    },
  );

  await writeFile(sessionFile, `${JSON.stringify(SESSION)}\n`);
  await writeFile(matrixFile, '{}\n');
  await assert.rejects(
    () => launcherMain([
      '--repo',
      root,
      '--session-file',
      sessionFile,
      '--matrix-file',
      matrixFile,
    ]),
    (error) =>
      error instanceof LauncherError &&
      error.code === 'SCOPA_LAUNCHER_CONFIGURATION_INVALID',
  );
});

test('launcher stack diagnostics require explicit opt-in', async () => {
  const source = await readFile(
    path.join(ROOT, 'packages/adapter-host/src/cli.js'),
    'utf8',
  );
  const documentation = await readFile(
    path.join(ROOT, 'packages/adapter-host/README.md'),
    'utf8',
  );
  assert.match(source, /SCOPA_DEBUG_ERRORS === '1'/);
  assert.match(documentation, /SCOPA_DEBUG_ERRORS=1/);
  assert.equal(
    JSON.stringify(
      launcherErrorEnvelope(
        new LauncherError('SCOPA_LAUNCHER_ARGUMENT_INVALID'),
      ),
    ).includes('stack'),
    false,
  );
});

test('capability matrix computes assurance and rejects overclaim or omission', () => {
  const full = validateCapabilityMatrix(MATRIX);
  assert.equal(full.assurance, 'full');

  const partialInput = structuredClone(MATRIX);
  const network = partialInput.capabilities.find(
    (capability) => capability.id === 'native.network',
  );
  network.exposure = 'native';
  network.mediation = 'uncontrolled';
  network.evidence = 'negative-control native network remains exposed';
  partialInput.assurance = 'partial';
  assert.equal(validateCapabilityMatrix(partialInput).assurance, 'partial');

  const overclaim = structuredClone(partialInput);
  overclaim.assurance = 'full';
  assert.throws(
    () => validateCapabilityMatrix(overclaim),
    /does not match computed partial/,
  );

  const omitted = structuredClone(MATRIX);
  omitted.capabilities = omitted.capabilities.filter(
    (capability) => capability.id !== 'native.process-execution',
  );
  assert.throws(
    () => validateCapabilityMatrix(omitted),
    /omits required capabilities/,
  );

  const injected = structuredClone(MATRIX);
  injected.capabilities[0].unreviewed = true;
  assert.throws(
    () => validateCapabilityMatrix(injected),
    /schema mismatch/,
  );
});

test('fake agent reaches allowed, denied, hostile, and stop states only through bridge', async (context) => {
  const { root, bridge, handle } = await directBridge(context);
  const tools = await handle(request(2, 'tools/list', {}));
  assert.deepEqual(
    tools.result.tools.map((entry) => entry.name),
    [
      'scopa_orientation',
      'scopa_read_file',
      'scopa_write_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ],
  );
  assert.equal(
    tools.result.tools.every(
      (entry) =>
        entry.inputSchema.additionalProperties === false &&
        entry.outputSchema.type === 'object',
    ),
    true,
  );

  const read = structured(
    await handle(call(3, 'scopa_read_file', {
      path: 'scopa.slice-definition.json',
    })),
  );
  assert.match(read.content, /S7-model-neutral-bridge/);

  const allowed = await handle(call(4, 'scopa_write_file', {
    path: 'workspace/bridge.txt',
    content: 'mediated-once',
  }));
  assert.equal(allowed.result.isError, false);
  assert.equal(
    await readFile(path.join(root, 'workspace/bridge.txt'), 'utf8'),
    'mediated-once',
  );

  const duplicate = await handle(call(4, 'scopa_write_file', {
    path: 'workspace/bridge.txt',
    content: 'must-not-run',
  }));
  assert.equal(duplicate.error.code, -32600);
  assert.equal(
    await readFile(path.join(root, 'workspace/bridge.txt'), 'utf8'),
    'mediated-once',
  );

  const escapeName = `${path.basename(root)}-escaped.txt`;
  const denied = await handle(call(5, 'scopa_write_file', {
    path: `../${escapeName}`,
    content: 'blocked',
  }));
  assert.equal(denied.result.isError, true);
  assert.equal(
    denied.result.structuredContent.code,
    'SCOPA_SCOPE_DENIED',
  );
  await assert.rejects(
    () => access(path.join(path.dirname(root), escapeName)),
    { code: 'ENOENT' },
  );

  const deniedRead = await handle(call(6, 'scopa_read_file', {
    path: '/etc/passwd',
  }));
  assert.equal(deniedRead.result.isError, true);
  assert.equal(
    deniedRead.result.structuredContent.code,
    'SCOPA_READ_DENIED',
  );
  await writeFile(
    path.join(root, 'oversized.txt'),
    Buffer.alloc((512 * 1024) + 1, 0x61),
  );
  const oversizedRead = await handle(call(7, 'scopa_read_file', {
    path: 'oversized.txt',
  }));
  assert.equal(oversizedRead.result.isError, true);
  assert.match(
    oversizedRead.result.structuredContent.details.reason,
    /read limit/,
  );

  for (const [id, name] of [
    [8, 'shell'],
    [9, 'apply_patch'],
  ]) {
    const bypass = await handle(call(id, name, {
      command: 'touch escaped',
    }));
    assert.equal(bypass.error.code, -32602);
    assert.match(bypass.error.message, /unknown tool/);
  }

  const unknownMethod = await handle(request(10, 'filesystem/write', {}));
  assert.equal(unknownMethod.error.code, -32601);

  const malformed = await handle(call(11, 'scopa_write_file', {
    path: 'workspace/malformed.txt',
    content: 'must-not-run',
    hiddenBypass: true,
  }));
  assert.equal(malformed.error.code, -32602);
  await assert.rejects(
    () => access(path.join(root, 'workspace/malformed.txt')),
    { code: 'ENOENT' },
  );

  const check = await handle(call(12, 'scopa_check'));
  assert.equal(check.result.isError, false);
  assert.equal(check.result.structuredContent.state.canStop, true);

  const assurance = structured(await handle(call(13, 'scopa_assurance')));
  assert.equal(assurance.assurance, 'full');

  const transcript = structured(await handle(call(14, 'scopa_transcript')));
  assert.deepEqual(validateTranscript(transcript), bridge.transcript());
  assert.equal(transcript.session.request, SESSION.request);
  assert.deepEqual(transcript.session.agent, SESSION.agent);
  assert.deepEqual(transcript.session.client, {
    name: 'scopa-fake-agent',
    version: '0.1.0',
  });
  assert.equal(transcript.terminal.canStop, true);
  assert.equal(
    transcript.events.some(
      (event) =>
        event.tool === 'scopa_write_file' &&
        event.outcome === 'denied',
    ),
    true,
  );
  assert.equal(
    transcript.events.filter(
      (event) => event.tool === 'scopa_write_file',
    ).length,
    4,
    'one allowed and one denied call each produce call/result events',
  );
  assert.equal(
    transcript.events.some((event) => event.tool === 'scopa_transcript'),
    false,
  );
});

test('blocked gate is a terminal tool error and cannot be asserted green', async (context) => {
  const failing = structuredClone(DEFINITION);
  failing.sliceId = 'S7-failing-gate';
  failing.gates[0].command = ['node', '-e', 'process.exit(7)'];
  const { handle } = await directBridge(context, { definition: failing });
  const check = await handle(call(2, 'scopa_check'));
  assert.equal(check.result.isError, true);
  assert.equal(check.result.structuredContent.state.canStop, false);
  assert.equal(check.result.structuredContent.state.gates[0].exitCode, 7);
  const transcript = structured(await handle(call(3, 'scopa_transcript')));
  assert.equal(transcript.terminal.status, 'blocked');
  assert.deepEqual(transcript.terminal.failedGates, ['fixture-gate']);
});

test('transcript validator rejects missing, reordered, duplicate, and unknown fields', async (context) => {
  const { bridge, handle } = await directBridge(context);
  await handle(call(2, 'scopa_orientation'));
  await handle(call(3, 'scopa_check'));
  const transcript = bridge.transcript();

  const missing = structuredClone(transcript);
  delete missing.events[1].outcome;
  assert.throws(() => validateTranscript(missing), /schema mismatch/);

  const reordered = structuredClone(transcript);
  [
    reordered.events[1],
    reordered.events[2],
  ] = [
    reordered.events[2],
    reordered.events[1],
  ];
  assert.throws(() => validateTranscript(reordered), /invalid transcript event/);

  const duplicate = structuredClone(transcript);
  const calls = duplicate.events.filter((event) => event.kind === 'tool_call');
  const secondResult = duplicate.events.find(
    (event) =>
      event.kind === 'tool_result' &&
      event.requestId === calls[1].requestId,
  );
  calls[1].requestId = calls[0].requestId;
  secondResult.requestId = calls[0].requestId;
  assert.throws(() => validateTranscript(duplicate), /invalid tool call/);

  const injected = structuredClone(transcript);
  injected.events[0].hiddenAuthority = true;
  assert.throws(() => validateTranscript(injected), /schema mismatch/);

  const falseGreen = structuredClone(transcript);
  const finalCheck = falseGreen.events.findLast(
    (event) => event.tool === 'scopa_check' && event.kind === 'tool_result',
  );
  finalCheck.outcome = 'blocked';
  assert.throws(() => validateTranscript(falseGreen), /outcome mismatch/);

  const nonCanonical = structuredClone(transcript);
  nonCanonical.events[1].result = { fractional: 1.5 };
  assert.throws(() => validateTranscript(nonCanonical), /canonical JSON/);
});

test('bridge runtime contains no independent mutation, process, or network primitive', async () => {
  const sourceRoot = path.join(ROOT, 'packages/adapter-host/src');
  const entries = await readdir(sourceRoot);
  const source = (
    await Promise.all(
      entries
        .filter((entry) => entry.endsWith('.js'))
        .map((entry) => readFile(path.join(sourceRoot, entry), 'utf8')),
    )
  ).join('\n');
  for (const forbidden of [
    'writeFile',
    'appendFile',
    'node:child_process',
    'node:http',
    'node:https',
    'node:net',
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `adapter runtime contains forbidden primitive ${forbidden}`,
    );
  }
  assert.match(source, /createReferenceAgentHost/);
  assert.match(source, /host\.invoke/);
});

test('committed fake-agent proof retains its schemas and hostile outcomes', async () => {
  const proof = JSON.parse(
    await readFile(path.join(ROOT, 'evidence/S7/fake-agent-proof.json'), 'utf8'),
  );
  assert.equal(proof.schema, 'scopa.adapter-proof.v1');
  assert.equal(validateCapabilityMatrix(proof.capabilityMatrix).assurance, 'full');
  assert.equal(validateTranscript(proof.transcript).terminal.canStop, true);
  assert.deepEqual(
    proof.toolInventory.map((entry) => entry.name),
    [
      'scopa_orientation',
      'scopa_read_file',
      'scopa_write_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ],
  );
  assert.equal(proof.outcomes.allowedWrite.written, true);
  assert.equal(proof.outcomes.deniedWrite.code, 'SCOPA_SCOPE_DENIED');
  assert.equal(proof.outcomes.hostileUnknownTool.code, -32602);
});

test('packed scopa-mcp binary interoperates over real newline JSON-RPC stdio', async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-adapter-pack-'));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const pack = await invoke('npm', ROOT, [
    'pack',
    '--json',
    '--pack-destination',
    temporary,
  ]);
  assert.equal(pack.status, 0, pack.stderr || pack.stdout);
  const [manifest] = JSON.parse(pack.stdout);
  const archive = path.join(temporary, manifest.filename);

  const consumer = path.join(temporary, 'consumer');
  await mkdir(consumer);
  await writeFile(
    path.join(consumer, 'package.json'),
    '{"name":"scopa-adapter-consumer","version":"1.0.0","private":true}\n',
  );
  const install = await invoke('npm', consumer, [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
    archive,
  ]);
  assert.equal(install.status, 0, install.stderr || install.stdout);
  await mkdir(path.join(consumer, '.git'));
  await mkdir(path.join(consumer, 'workspace'));
  await cp(
    path.join(FIXTURE, 'scopa.slice-definition.json'),
    path.join(consumer, 'scopa.slice-definition.json'),
  );
  await cp(
    path.join(FIXTURE, 'session.json'),
    path.join(consumer, 'session.json'),
  );
  await cp(
    path.join(FIXTURE, 'capability-matrix.json'),
    path.join(consumer, 'capability-matrix.json'),
  );

  const scopa = path.join(consumer, 'node_modules/.bin/scopa');
  const init = await invoke(scopa, consumer, [
    'init',
    '--definition',
    'scopa.slice-definition.json',
  ]);
  assert.equal(init.status, 0, init.stderr || init.stdout);
  const binary = path.join(consumer, 'node_modules/.bin/scopa-mcp');
  assert.equal(
    (await realpath(binary)).startsWith(
      await realpath(path.join(consumer, 'node_modules')),
    ),
    true,
  );

  const childEnv = { ...process.env };
  delete childEnv.NODE_TEST_CONTEXT;
  const child = spawn(binary, [
    '--repo',
    consumer,
    '--session-file',
    path.join(consumer, 'session.json'),
    '--matrix-file',
    path.join(consumer, 'capability-matrix.json'),
  ], {
    cwd: consumer,
    env: childEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  context.after(() => {
    if (child.exitCode === null) child.kill('SIGKILL');
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const client = new FakeAgentClient({
    input: child.stdin,
    output: child.stdout,
  });
  const initialized = await client.initialize();
  assert.equal(initialized.result.serverInfo.name, 'scopa-mcp');
  const listed = await client.listTools();
  assert.equal(listed.result.tools.length, 6);

  const write = await client.callTool('scopa_write_file', {
    path: 'workspace/installed.txt',
    content: 'installed-bridge',
  });
  assert.equal(write.result.isError, false);
  const denied = await client.callTool('scopa_write_file', {
    path: '../installed-escape.txt',
    content: 'blocked',
  });
  assert.equal(denied.result.isError, true);
  const check = await client.callTool('scopa_check');
  assert.equal(check.result.structuredContent.state.canStop, true);
  const transcript = await client.callTool('scopa_transcript');
  assert.equal(
    validateTranscript(transcript.result.structuredContent).terminal.canStop,
    true,
  );
  assert.equal(
    await readFile(path.join(consumer, 'workspace/installed.txt'), 'utf8'),
    'installed-bridge',
  );
  await assert.rejects(
    () => access(path.join(temporary, 'installed-escape.txt')),
    { code: 'ENOENT' },
  );
  client.close();
  await once(child, 'exit');
  assert.equal(child.exitCode, 0, stderr);
  assert.equal(stderr, '');
});
