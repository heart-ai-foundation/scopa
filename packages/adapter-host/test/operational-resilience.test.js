import assert from 'node:assert/strict';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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
  validateCompactTranscript,
  validateHostJournal,
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
