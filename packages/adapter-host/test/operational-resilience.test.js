import assert from 'node:assert/strict';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable, Writable } from 'node:stream';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { initializeProject } from '../../cli/src/project.js';
import { readEvidence } from '../../journal/src/index.js';
import {
  AGENT_EVIDENCE_MAX_BYTES,
  COMPACT_CHECK_SCHEMA,
  COMPACT_TRANSCRIPT_SCHEMA,
  compactCheckResult,
  createAdapterBridge,
  createMcpMessageHandler,
  MCP_MAX_IN_FLIGHT,
  serveMcpStdio,
  validateCompactTranscript,
  validateHostJournal,
  validateTranscript,
} from '../src/index.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const FIXTURE = path.join(ROOT, 'fixtures/S7');
const SESSION = JSON.parse(await readFile(path.join(FIXTURE, 'session.json')));
const MATRIX = JSON.parse(await readFile(path.join(FIXTURE, 'capability-matrix.json')));
const DEFINITION = JSON.parse(await readFile(
  path.join(FIXTURE, 'scopa.slice-definition.json'),
));

async function setup(context, definition = DEFINITION) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s17-evidence-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'workspace'));
  const definitionPath = path.join(root, 'scopa.slice-definition.json');
  await writeFile(
    definitionPath,
    `${JSON.stringify(definition, null, 2)}\n`,
  );
  await initializeProject({
    repoRoot: root,
    definitionPath: 'scopa.slice-definition.json',
  });
  const journalPath = path.join(root, '..', `${path.basename(root)}.private.json`);
  context.after(() => rm(journalPath, { force: true }));
  const bridge = await createAdapterBridge({
    repoRoot: root,
    session: SESSION,
    capabilityMatrix: MATRIX,
    evidenceJournalPath: journalPath,
  });
  bridge.begin({
    client: { name: 'scopa-fake-agent', version: '0.1.0' },
    protocolVersion: '2025-11-25',
    requestId: 1,
  });
  return { bridge, journalPath, root };
}

function bytes(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

test('full host journal reconstructs bounded compact evidence', async (context) => {
  const { bridge, journalPath } = await setup(context);
  await bridge.invoke({ requestId: 2, name: 'scopa_orientation', arguments: {} });
  const check = await bridge.invoke({ requestId: 3, name: 'scopa_check', arguments: {} });
  const assurance = await bridge.invoke({ requestId: 4, name: 'scopa_assurance', arguments: {} });
  const transcriptReply = await bridge.invoke({
    requestId: 5,
    name: 'scopa_transcript',
    arguments: {},
  });

  assert.equal(check.structuredContent.schema, COMPACT_CHECK_SCHEMA);
  assert.equal(check.structuredContent.canStop, true);
  assert.equal('stdout' in check.structuredContent.gates[0], false);
  assert.equal(assurance.structuredContent.capabilityCount, MATRIX.capabilities.length);
  assert.equal(bytes(check.structuredContent) <= AGENT_EVIDENCE_MAX_BYTES, true);
  assert.equal(bytes(assurance.structuredContent) <= AGENT_EVIDENCE_MAX_BYTES, true);

  const compact = transcriptReply.structuredContent;
  assert.equal(compact.schema, COMPACT_TRANSCRIPT_SCHEMA);
  assert.equal('request' in compact.session, false);
  assert.equal(bytes(compact) <= AGENT_EVIDENCE_MAX_BYTES, true);
  assert.equal(compact.events.every((event) => !('arguments' in event)), true);
  assert.equal(compact.events.every((event) => !('result' in event)), true);

  const journal = validateHostJournal(JSON.parse(await readEvidence(journalPath)));
  assert.deepEqual(validateCompactTranscript(compact, journal), compact);
  assert.equal(journal.transcript.session.request, SESSION.request);
  assert.equal(journal.transcript.events.some(
    (event) =>
      event.kind === 'tool_result' &&
      event.tool === 'scopa_check' &&
      event.result.state.gates.length > 0,
  ), true);
  assert.equal((await stat(journalPath)).mode & 0o777, 0o600);
  assert.equal(bridge.listTools().length, 6);

  const tampered = structuredClone(compact);
  tampered.events[1].argumentsSha256 = '0'.repeat(64);
  assert.throws(
    () => validateCompactTranscript(tampered, journal),
    /conflicts with host journal/,
  );
  await assert.rejects(
    () => bridge.invoke({ requestId: 6, name: 'scopa_transcript', arguments: {} }),
    { code: 'EEXIST' },
  );
});

test('failed gate preview is bounded and incomplete journal is not evidence', async (context) => {
  const synthetic = compactCheckResult({
    state: {
      sliceId: 'S17-preview',
      lockHash: 'a'.repeat(64),
      status: 'blocked',
      canStop: false,
      failedGates: ['bounded-failure'],
      gates: [{
        id: 'bounded-failure', passed: false, exitCode: 9, timedOut: false,
        durationMs: 1, stdout: 'x'.repeat(5000), stderr: 'y'.repeat(5000),
        stdoutBytes: 5000, stderrBytes: 5000,
        stdoutTruncated: false, stderrTruncated: false,
      }],
    },
  });
  assert.equal(Buffer.byteLength(synthetic.gates[0].preview), 2048);
  assert.equal(synthetic.gates[0].stdoutBytes, 5000);
  assert.equal(synthetic.gates[0].stderrBytes, 5000);

  const failing = structuredClone(DEFINITION);
  failing.gates[0].command = [
    process.execPath,
    '-e',
    "process.stdout.write('x'.repeat(5000)); process.stderr.write('y'.repeat(5000)); process.exit(9)",
  ];
  const { bridge, journalPath } = await setup(context, failing);
  const check = await bridge.invoke({ requestId: 2, name: 'scopa_check', arguments: {} });
  assert.equal(check.isError, true);
  assert.equal(check.structuredContent.canStop, false);
  assert.equal(
    Buffer.byteLength(check.structuredContent.gates[0].preview) <= 2048,
    true,
  );
  await assert.rejects(() => access(journalPath), { code: 'ENOENT' });
  await assert.rejects(() => readEvidence(journalPath), { code: 'ENOENT' });
});

test('concurrent tool calls are bounded and capacity is reclaimed', async () => {
  const releases = [];
  const protocolErrors = [];
  let active = 0;
  let maximumActive = 0;
  const bridge = {
    begin() {},
    listTools() { return []; },
    recordProtocolError(error) { protocolErrors.push(error); },
    invoke({ requestId }) {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      return new Promise((resolve) => {
        releases.push(() => {
          active -= 1;
          resolve({ requestId });
        });
      });
    },
  };
  const handle = createMcpMessageHandler({ bridge });
  await handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'bounded-client', version: '1.0.0' },
    },
  });
  await handle({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  });

  const pending = Array.from({ length: MCP_MAX_IN_FLIGHT }, (_, index) =>
    handle({
      jsonrpc: '2.0',
      id: index + 2,
      method: 'tools/call',
      params: { name: 'bounded', arguments: {} },
    }));
  assert.equal(releases.length, MCP_MAX_IN_FLIGHT);
  const overloaded = await handle({
    jsonrpc: '2.0',
    id: MCP_MAX_IN_FLIGHT + 2,
    method: 'tools/call',
    params: { name: 'bounded', arguments: {} },
  });
  assert.equal(overloaded.error.code, -32000);
  assert.deepEqual(overloaded.error.data, { maxInFlight: MCP_MAX_IN_FLIGHT });
  assert.equal(active, MCP_MAX_IN_FLIGHT);
  releases.splice(0).forEach((release) => release());
  const replies = await Promise.all(pending);
  assert.deepEqual(
    replies.map(({ id, result }) => [id, result.requestId]),
    Array.from({ length: MCP_MAX_IN_FLIGHT }, (_, index) => [
      index + 2,
      index + 2,
    ]),
  );
  assert.equal(active, 0);
  assert.equal(maximumActive, MCP_MAX_IN_FLIGHT);

  const reclaimed = handle({
    jsonrpc: '2.0',
    id: MCP_MAX_IN_FLIGHT + 3,
    method: 'tools/call',
    params: { name: 'bounded', arguments: {} },
  });
  assert.equal(releases.length, 1);
  releases.pop()();
  assert.equal((await reclaimed).error, undefined);
  assert.equal(active, 0);
  assert.equal(
    protocolErrors.some(({ message }) =>
      message === 'concurrent tool call limit reached'),
    true,
  );
  assert.throws(
    () => createMcpMessageHandler({ bridge, maxInFlight: MCP_MAX_IN_FLIGHT + 1 }),
    /maxInFlight/,
  );
});

test('concurrent bridge results preserve exact request pairing', async (context) => {
  const { bridge } = await setup(context);
  await Promise.all([
    bridge.invoke({
      requestId: 2,
      name: 'scopa_orientation',
      arguments: {},
    }),
    bridge.invoke({
      requestId: 3,
      name: 'scopa_assurance',
      arguments: {},
    }),
    bridge.invoke({
      requestId: 4,
      name: 'scopa_read_file',
      arguments: { path: 'scopa.slice-definition.json' },
    }),
  ]);
  const transcript = validateTranscript(bridge.transcript());
  for (const requestId of [2, 3, 4]) {
    const events = transcript.events.filter((event) =>
      event.requestId === requestId);
    assert.equal(events.length, 2);
    assert.equal(events[0].kind, 'tool_call');
    assert.equal(events[1].kind, 'tool_result');
    assert.equal(events[0].tool, events[1].tool);
    assert.equal(events[0].effect, events[1].effect);
  }
});

test('slow-reader soak leaves finite buffers, no stale session, and no residue', async (context) => {
  const { root } = await setup(context);
  const beforeFiles = (await readdir(root, { recursive: true })).sort();
  const fdRoot = '/proc/self/fd';
  const beforeDescriptors = await readdir(fdRoot).catch(() => null);
  let maximumBufferedBytes = 0;

  for (let cycle = 0; cycle < 12; cycle += 1) {
    const bridge = await createAdapterBridge({
      repoRoot: root,
      session: SESSION,
      capabilityMatrix: MATRIX,
    });
    const frames = [{
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'scopa-fake-agent', version: '0.1.0' },
      },
    }, {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }, ...Array.from({ length: 24 }, (_, index) => ({
      jsonrpc: '2.0',
      id: index + 2,
      method: 'ping',
    }))];
    const input = Readable.from([
      Buffer.from(`${frames.map((frame) => JSON.stringify(frame)).join('\n')}\n`),
    ]);
    const replyIds = [];
    let buffered = '';
    let output;
    output = new Writable({
      highWaterMark: 1,
      write(chunk, _encoding, callback) {
        maximumBufferedBytes = Math.max(
          maximumBufferedBytes,
          output.writableLength,
        );
        buffered += chunk.toString('utf8');
        setImmediate(callback);
      },
    });
    await serveMcpStdio({ bridge, input, output });
    for (const line of buffered.trim().split('\n')) {
      replyIds.push(JSON.parse(line).id);
    }
    assert.deepEqual(
      replyIds,
      Array.from({ length: 25 }, (_, index) => index + 1),
    );
    const transcript = bridge.transcript();
    assert.equal(transcript.events.length, 1);
    assert.equal(transcript.events[0].requestId, 1);
  }

  assert.equal(maximumBufferedBytes < 512, true);
  assert.deepEqual((await readdir(root, { recursive: true })).sort(), beforeFiles);
  if (beforeDescriptors !== null) {
    const afterDescriptors = await readdir(fdRoot);
    assert.equal(afterDescriptors.length <= beforeDescriptors.length + 2, true);
  }
});
