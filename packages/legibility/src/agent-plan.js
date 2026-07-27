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
  bytesEqual,
  bytesToHex,
  hexToBytes,
} from '../../journal/src/bytes.js';
import { encodeDcbor } from '../../journal/src/dcbor.js';
import { MemoryAppendOnlyStore } from '../../journal/src/memory-store.js';
import { decodeRecord } from '../../journal/src/record.js';
import { analyzeObservationSession } from './analyze.js';
import { ObserveModeSession } from './observe-session.js';

const PLAN_KEYS = new Set(['calls', 'schema']);
const CALL_KEYS = new Set([
  'content',
  'eventId',
  'operation',
  'target',
  'toolName',
]);
const TARGETS = new Set([
  'workspace/agent-output.txt',
  'workspace/source.txt',
]);

export class AgentPlanError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AgentPlanError';
    this.code = 'SCOPA_AGENT_PLAN_INVALID';
  }
}

function exactKeys(value, expected, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new AgentPlanError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value);
  const missing = [...expected].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !expected.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new AgentPlanError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

export function validateAgentPlan(plan) {
  exactKeys(plan, PLAN_KEYS, 'agent plan');
  if (plan.schema !== 'scopa.coding-agent-plan.v1') {
    throw new AgentPlanError('unsupported agent plan schema');
  }
  if (
    !Array.isArray(plan.calls) ||
    plan.calls.length < 2 ||
    plan.calls.length > 5
  ) {
    throw new AgentPlanError('agent plan requires two to five calls');
  }
  const ids = new Set();
  const calls = plan.calls.map((call, index) => {
    exactKeys(call, CALL_KEYS, `agent call ${index}`);
    for (const field of ['eventId', 'operation', 'target', 'toolName']) {
      if (typeof call[field] !== 'string' || call[field].length === 0) {
        throw new AgentPlanError(`agent call ${index} ${field} must be non-empty`);
      }
    }
    if (ids.has(call.eventId)) {
      throw new AgentPlanError(`duplicate agent eventId: ${call.eventId}`);
    }
    ids.add(call.eventId);
    if (!['read', 'write'].includes(call.operation)) {
      throw new AgentPlanError('agent plan supports only read and write');
    }
    if (!TARGETS.has(call.target)) {
      throw new AgentPlanError(`agent plan target is outside the probe: ${call.target}`);
    }
    if (
      (call.operation === 'read' && call.content !== null) ||
      (call.operation === 'write' &&
        (typeof call.content !== 'string' ||
          call.content.length === 0 ||
          call.content.length > 4_096))
    ) {
      throw new AgentPlanError(`agent call ${index} content does not match operation`);
    }
    return Object.freeze({ ...call });
  });
  if (!calls.some(({ operation }) => operation === 'write')) {
    throw new AgentPlanError('agent plan must exercise one write');
  }
  if (!calls.some(({ operation }) => operation === 'read')) {
    throw new AgentPlanError('agent plan must exercise one read');
  }
  return Object.freeze({
    schema: plan.schema,
    calls: Object.freeze(calls),
  });
}

export async function runAgentPlanProbe(plan) {
  const validated = validateAgentPlan(plan);
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-agent-plan-'));
  try {
    const workspace = path.join(root, 'workspace');
    await mkdir(workspace);
    await writeFile(
      path.join(workspace, 'source.txt'),
      'SCOPA observes tool boundaries without claiming unobserved activity.',
    );
    const session = new ObserveModeSession({
      store: new MemoryAppendOnlyStore(),
      runId: 'S3-model-generated-session',
      scope: 'workspace',
    });
    const executed = [];
    for (const [sequence, call] of validated.calls.entries()) {
      const absoluteTarget = path.join(root, call.target);
      await session.invoke(
        {
          eventId: call.eventId,
          operation: call.operation,
          target: call.target,
          toolName: call.toolName,
        },
        async () => {
          if (call.operation === 'read') {
            const content = await readFile(absoluteTarget, 'utf8');
            executed.push({
              eventId: call.eventId,
              operation: call.operation,
              resultStatus: 'fulfilled',
              sequence,
              target: call.target,
              toolName: call.toolName,
            });
            return content;
          }
          await writeFile(absoluteTarget, call.content);
          executed.push({
            eventId: call.eventId,
            operation: call.operation,
            resultStatus: 'fulfilled',
            sequence,
            target: call.target,
            toolName: call.toolName,
          });
          return { written: true };
        },
      );
    }
    const snapshot = session.snapshot();
    const boundaryMap = analyzeObservationSession({
      records: snapshot.records,
      commitment: snapshot.commitment,
      summary: snapshot.summary,
    });
    const journalTrace = snapshot.records.map((bytes, sequence) => {
      const payload = decodeRecord(bytes).effect.payload;
      return {
        eventId: payload.eventId,
        operation: payload.operation,
        resultStatus: payload.resultStatus,
        sequence,
        target: payload.target,
        toolName: payload.toolName,
      };
    });
    const manual = [...new Set(
      executed.map(({ operation, target }) => `${operation}\u0000${target}`),
    )].sort();
    const observed = boundaryMap.boundaries
      .map(({ operation, target }) => `${operation}\u0000${target}`)
      .sort();
    return {
      schema: 'scopa.agent-plan-probe.v1',
      ok:
        JSON.stringify(manual) === JSON.stringify(observed) &&
        bytesEqual(encodeDcbor(executed), encodeDcbor(journalTrace)) &&
        boundaryMap.coverage.captureGapCount === 0 &&
        boundaryMap.reconstructability.scoreBasisPoints === 10_000,
      plan: validated,
      hostTrace: executed,
      journalTrace,
      traceComparison: {
        agrees: bytesEqual(encodeDcbor(executed), encodeDcbor(journalTrace)),
        comparedFields: [
          'sequence',
          'eventId',
          'operation',
          'target',
          'toolName',
          'resultStatus',
        ],
      },
      manualComparison: {
        agrees: JSON.stringify(manual) === JSON.stringify(observed),
        expected: manual,
        observed,
      },
      journalEvidence: {
        commitment: snapshot.commitment,
        recordHex: snapshot.records.map(bytesToHex),
        summary: snapshot.summary,
      },
      boundaryMap,
    };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

export function verifyAgentPlanEvidence(report) {
  if (
    report?.schema !== 'scopa.agent-plan-probe.v1' ||
    !report.journalEvidence ||
    !Array.isArray(report.journalEvidence.recordHex)
  ) {
    throw new AgentPlanError('invalid agent-plan evidence report');
  }
  const records = report.journalEvidence.recordHex.map(hexToBytes);
  const recomputedMap = analyzeObservationSession({
    records,
    commitment: report.journalEvidence.commitment,
    summary: report.journalEvidence.summary,
  });
  const journalTrace = records.map((bytes, sequence) => {
    const payload = decodeRecord(bytes).effect.payload;
    return {
      eventId: payload.eventId,
      operation: payload.operation,
      resultStatus: payload.resultStatus,
      sequence,
      target: payload.target,
      toolName: payload.toolName,
    };
  });
  const mapMatches = bytesEqual(
    encodeDcbor(recomputedMap),
    encodeDcbor(report.boundaryMap),
  );
  const traceMatches = bytesEqual(
    encodeDcbor(journalTrace),
    encodeDcbor(report.hostTrace),
  );
  return Object.freeze({
    schema: 'scopa.agent-plan-evidence-verification.v1',
    ok: mapMatches && traceMatches,
    mapMatches,
    traceMatches,
    mapId: recomputedMap.mapId,
    journalRootHash: recomputedMap.run.journalRootHash,
    recordCount: records.length,
  });
}
