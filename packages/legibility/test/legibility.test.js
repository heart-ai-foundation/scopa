import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  createChainCommitment,
  decodeRecord,
  sealRecord,
} from '../../journal/src/record.js';
import { MemoryAppendOnlyStore } from '../../journal/src/memory-store.js';
import {
  LegibilityAnalysisError,
  ObserveModeSession,
  analyzeObservationSession,
  classifyCodingAgentEvent,
  createLocalModelSessionReceipt,
  runAgentPlanProbe,
  runLiveObserveProbe,
  verifyAgentPlanEvidence,
  verifyLocalModelSessionReceipt,
} from '../src/index.js';

function event(eventId, operation, target, toolName = `${operation}_tool`) {
  return { eventId, operation, target, toolName };
}

test('observe mode never blocks a tool when capture classification fails', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-observe-only-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const target = path.join(root, 'executed.txt');
  const session = new ObserveModeSession({
    store: new MemoryAppendOnlyStore(),
    runId: 'observe-does-not-enforce',
  });
  const result = await session.invoke(
    event('bad-1', 'unsupported-operation', target),
    async () => {
      await writeFile(target, 'tool ran');
      return 'handler result';
    },
  );
  assert.equal(result, 'handler result');
  assert.equal(await readFile(target, 'utf8'), 'tool ran');
  const snapshot = session.snapshot();
  assert.equal(snapshot.summary.attemptedEvents, 1);
  assert.equal(snapshot.summary.recordedEvents, 0);
  assert.equal(snapshot.summary.captureGapCount, 1);
  assert.equal(snapshot.summary.captureGaps[0].eventId, 'bad-1');
});

test('rejected tool calls are observed and preserve the original failure', async () => {
  const session = new ObserveModeSession({
    store: new MemoryAppendOnlyStore(),
    runId: 'observe-rejected',
  });
  const original = new Error('tool failed');
  await assert.rejects(
    () =>
      session.invoke(
        event('reject-1', 'execute', 'npm:test', 'shell'),
        async () => {
          throw original;
        },
      ),
    (error) => error === original,
  );
  const snapshot = session.snapshot();
  assert.equal(snapshot.summary.recordedEvents, 1);
  const record = decodeRecord(snapshot.records[0]);
  assert.equal(record.effect.payload.resultStatus, 'rejected');
});

test('analysis reports observed boundaries, honest coverage, and declaration gaps', async () => {
  const session = new ObserveModeSession({
    store: new MemoryAppendOnlyStore(),
    runId: 'boundary-map',
    scope: 'repo',
  });
  await session.invoke(
    event('read-1', 'read', 'src/input.js', 'read_file'),
    async () => 'source',
  );
  await session.invoke(
    event('write-1', 'write', 'src/output.js', 'write_file'),
    async () => undefined,
  );
  await session.invoke(
    event('execute-1', 'execute', 'npm:test', 'shell'),
    async () => ({ exitCode: 0 }),
  );
  const snapshot = session.snapshot();
  const map = analyzeObservationSession({
    records: snapshot.records,
    commitment: snapshot.commitment,
    summary: snapshot.summary,
    declaredBoundaries: [
      { operation: 'read', targetPattern: 'src/**' },
      { operation: 'query', targetPattern: 'network/**' },
    ],
  });

  assert.deepEqual(
    map.boundaries.map(({ operation, target }) => [operation, target]),
    [
      ['execute', 'npm:test'],
      ['read', 'src/input.js'],
      ['write', 'src/output.js'],
    ],
  );
  assert.equal(map.reconstructability.scoreBasisPoints, 10_000);
  assert.equal(map.reconstructability.claim, 'boundary-event-completeness-only');
  assert.equal(
    map.coverage.operations.find(({ operation }) => operation === 'query').status,
    'not-observed',
  );
  assert.match(map.coverage.epistemicRule, /never means not-present/);
  assert.deepEqual(map.findings, [
    {
      kind: 'declared-not-observed',
      operation: 'query',
      status: 'not-observed',
      target: 'network/**',
    },
    {
      kind: 'observed-not-declared',
      operation: 'execute',
      status: 'observed',
      target: 'npm:test',
    },
    {
      kind: 'observed-not-declared',
      operation: 'write',
      status: 'observed',
      target: 'src/output.js',
    },
  ]);
  assert.match(map.claimBoundary.statement, /not a forensic reconstruction/);
});

test('reconstructability score exposes capture gaps instead of hiding them', async () => {
  const session = new ObserveModeSession({
    store: new MemoryAppendOnlyStore(),
    runId: 'partial-capture',
  });
  await session.invoke(
    event('read-1', 'read', 'README.md'),
    async () => 'read',
  );
  await session.invoke(
    event('missed-1', 'unknown', 'outside'),
    async () => 'still executed',
  );
  const snapshot = session.snapshot();
  const map = analyzeObservationSession({
    records: snapshot.records,
    commitment: snapshot.commitment,
    summary: snapshot.summary,
  });
  assert.equal(map.reconstructability.scoreBasisPoints, 5_000);
  assert.equal(
    map.reconstructability.status,
    'partial-for-captured-boundary-events',
  );
  assert.equal(map.coverage.captureGapCount, 1);
});

test('analysis rejects a host summary that conceals missing observations', async () => {
  const session = new ObserveModeSession({
    store: new MemoryAppendOnlyStore(),
    runId: 'summary-integrity',
  });
  await session.invoke(
    event('read-1', 'read', 'README.md'),
    async () => 'read',
  );
  const snapshot = session.snapshot();
  const tampered = {
    ...snapshot.summary,
    attemptedEvents: 2,
  };
  assert.throws(
    () =>
      analyzeObservationSession({
        records: snapshot.records,
        commitment: snapshot.commitment,
        summary: tampered,
      }),
    (error) =>
      error instanceof LegibilityAnalysisError &&
      /do not reconcile/.test(error.message),
  );
});

test('analysis rejects a valid chain that is not bound to the selected profile', () => {
  const sealed = sealRecord({
    runId: 'wrong-profile',
    scriptHash: '0'.repeat(64),
    seq: 0,
    scope: 'root',
    effect: classifyCodingAgentEvent(
      event('read-1', 'read', 'README.md'),
      { resultStatus: 'fulfilled', scope: 'root' },
    ),
    outcome: {
      status: 'fulfilled',
      value: { observation: 'captured' },
    },
  });
  assert.throws(
    () =>
      analyzeObservationSession({
        records: [sealed.bytes],
        commitment: createChainCommitment([sealed.bytes]),
        summary: {
          schema: 'scopa.observation-session-summary.v1',
          profileId: 'coding-agent.v1',
          runId: 'wrong-profile',
          scope: 'root',
          attemptedEvents: 1,
          recordedEvents: 1,
          captureGapCount: 0,
          captureGaps: [],
        },
      }),
    /not bound to the analysis profile/,
  );
});

test('journal failure and duplicate ids become visible gaps without blocking tools', async () => {
  let appendAttempts = 0;
  const failingStore = {
    async append() {
      appendAttempts += 1;
      throw Object.assign(new Error('disk unavailable'), {
        code: 'SCOPA_TEST_STORE_DOWN',
      });
    },
  };
  const failedCapture = new ObserveModeSession({
    store: failingStore,
    runId: 'store-failure',
  });
  assert.equal(
    await failedCapture.invoke(
      event('write-1', 'write', 'output.txt'),
      async () => 'tool succeeded',
    ),
    'tool succeeded',
  );
  assert.equal(appendAttempts, 1);
  assert.equal(failedCapture.snapshot().summary.captureGapCount, 1);

  const duplicateSession = new ObserveModeSession({
    store: new MemoryAppendOnlyStore(),
    runId: 'duplicate-event',
  });
  await duplicateSession.invoke(
    event('same-id', 'read', 'one.txt'),
    async () => 'one',
  );
  assert.equal(
    await duplicateSession.invoke(
      event('same-id', 'read', 'two.txt'),
      async () => 'two',
    ),
    'two',
  );
  const duplicateSnapshot = duplicateSession.snapshot();
  assert.equal(duplicateSnapshot.summary.attemptedEvents, 2);
  assert.equal(duplicateSnapshot.summary.recordedEvents, 1);
  assert.equal(
    duplicateSnapshot.summary.captureGaps[0].reasonCode,
    'SCOPA_OBSERVATION_DUPLICATE',
  );
});

test('live observe probe matches manual inspection of actual tool effects', async () => {
  const report = await runLiveObserveProbe();
  assert.equal(report.ok, true);
  assert.equal(report.manualComparison.agrees, true);
  assert.equal(report.boundaryMap.coverage.recordedEventCount, 2);
  assert.equal(report.boundaryMap.findings.length, 2);
});

test('model-plan driver executes real tools and independently matches its host trace', async () => {
  const report = await runAgentPlanProbe({
    schema: 'scopa.coding-agent-plan.v1',
    calls: [
      {
        eventId: 'plan-read',
        operation: 'read',
        target: 'workspace/source.txt',
        toolName: 'read_file',
        content: null,
      },
      {
        eventId: 'plan-write',
        operation: 'write',
        target: 'workspace/agent-output.txt',
        toolName: 'write_file',
        content: 'model-selected content',
      },
    ],
  });
  assert.equal(report.ok, true);
  assert.equal(report.manualComparison.agrees, true);
  assert.equal(report.traceComparison.agrees, true);
  assert.equal(report.hostTrace.length, 2);
  assert.equal(report.journalEvidence.recordHex.length, 2);
  assert.equal(report.boundaryMap.boundaries.length, 2);
  assert.deepEqual(verifyAgentPlanEvidence(report), {
    schema: 'scopa.agent-plan-evidence-verification.v1',
    ok: true,
    mapMatches: true,
    traceMatches: true,
    mapId: report.boundaryMap.mapId,
    journalRootHash: report.boundaryMap.run.journalRootHash,
    recordCount: 2,
  });
});

test('local model-session receipt binds request, transcript, plan, and thread id', () => {
  const outputSchema = '{"type":"object"}\n';
  const plan = '{"schema":"scopa.coding-agent-plan.v1","calls":[]}\n';
  const transcript = [
    JSON.stringify({ type: 'thread.started', thread_id: 'thread-1' }),
    JSON.stringify({
      type: 'item.completed',
      item: { type: 'agent_message', text: plan.trim() },
    }),
    '',
  ].join('\n');
  const receipt = createLocalModelSessionReceipt({
    capturedAt: '2026-07-26T00:00:00.000Z',
    clientVersion: 'codex-cli test',
    outputSchema,
    plan,
    prompt: 'produce a plan',
    requestedModel: 'test-model',
    transcript,
  });
  const verified = verifyLocalModelSessionReceipt({
    receipt,
    outputSchema,
    plan,
    transcript,
  });
  assert.equal(verified.ok, true);
  const altered = verifyLocalModelSessionReceipt({
    receipt,
    outputSchema,
    plan: `${plan} `,
    transcript,
  });
  assert.equal(altered.ok, false);
  assert.equal(altered.checks.planHash, false);
});
