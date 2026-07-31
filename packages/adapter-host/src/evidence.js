import { createHash } from 'node:crypto';
import {
  canonicalJson,
  deepFreeze,
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  AdapterValidationError,
  exactObject,
} from './schema.js';
import {
  validateTranscript,
} from './transcript.js';

export const HOST_JOURNAL_SCHEMA = 'scopa.adapter-host-journal.v1';
export const COMPACT_TRANSCRIPT_SCHEMA = 'scopa.adapter-transcript-index.v1';
export const COMPACT_CHECK_SCHEMA = 'scopa.adapter-check-compact.v1';
export const AGENT_EVIDENCE_MAX_BYTES = 16 * 1024;
export const FAILED_GATE_PREVIEW_MAX_BYTES = 2 * 1024;

const HEX = /^[0-9a-f]{64}$/;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function boundedPreview(stdout, stderr) {
  const source = `${stdout}${stdout && stderr ? '\n' : ''}${stderr}`;
  let preview = '';
  let bytes = 0;
  for (const character of source) {
    const size = Buffer.byteLength(character, 'utf8');
    if (bytes + size > FAILED_GATE_PREVIEW_MAX_BYTES) break;
    preview += character;
    bytes += size;
  }
  return preview;
}

function assertAgentBound(value, label) {
  if (Buffer.byteLength(canonicalJson(value), 'utf8') > AGENT_EVIDENCE_MAX_BYTES) {
    throw new AdapterValidationError(`${label} exceeds agent evidence bound`);
  }
  return deepFreeze(value);
}

export function compactCheckResult(result) {
  const state = result?.state;
  if (!state || !Array.isArray(state.gates)) {
    throw new AdapterValidationError('full check result is invalid');
  }
  const compact = {
    schema: COMPACT_CHECK_SCHEMA,
    sliceId: state.sliceId,
    lockHash: state.lockHash,
    status: state.status,
    canStop: state.canStop,
    failedGates: [...state.failedGates],
    gates: state.gates.map((gate) => ({
      id: gate.id,
      passed: gate.passed,
      exitCode: gate.exitCode,
      timedOut: gate.timedOut,
      durationMs: gate.durationMs,
      stdoutBytes: gate.stdoutBytes,
      stderrBytes: gate.stderrBytes,
      stdoutSha256: sha256(gate.stdout),
      stderrSha256: sha256(gate.stderr),
      stdoutTruncated: gate.stdoutTruncated,
      stderrTruncated: gate.stderrTruncated,
      preview: gate.passed ? null : boundedPreview(gate.stdout, gate.stderr),
    })),
  };
  return assertAgentBound(compact, 'compact check result');
}

export function compactAssuranceResult(matrix) {
  return assertAgentBound({
    schema: 'scopa.capability-matrix-compact.v1',
    subject: structuredClone(matrix.subject),
    assurance: matrix.assurance,
    capabilityCount: matrix.capabilities.length,
    capabilityMatrixSha256: jsonHash(matrix),
  }, 'compact assurance result');
}

export function agentResultForEvent(event) {
  if (event.kind !== 'tool_result') return event.result;
  if (event.tool === 'scopa_check') return compactCheckResult(event.result);
  if (event.tool === 'scopa_assurance') {
    return compactAssuranceResult(event.result);
  }
  return event.result;
}

export function createHostJournal(transcriptValue) {
  const transcript = validateTranscript(transcriptValue);
  const journal = {
    schema: HOST_JOURNAL_SCHEMA,
    transcript,
    transcriptSha256: jsonHash(transcript),
  };
  return deepFreeze({
    ...journal,
    journalSha256: jsonHash(journal),
  });
}

export function validateHostJournal(value) {
  exactObject(value, new Set([
    'journalSha256', 'schema', 'transcript', 'transcriptSha256',
  ]), 'adapter host journal');
  if (value.schema !== HOST_JOURNAL_SCHEMA) {
    throw new AdapterValidationError('unsupported adapter host journal');
  }
  const transcript = validateTranscript(value.transcript);
  if (value.transcriptSha256 !== jsonHash(transcript)) {
    throw new AdapterValidationError('host journal transcript digest mismatch');
  }
  const { journalSha256, ...descriptor } = value;
  if (!HEX.test(journalSha256) || journalSha256 !== jsonHash(descriptor)) {
    throw new AdapterValidationError('host journal digest mismatch');
  }
  return deepFreeze(structuredClone(value));
}

export function createCompactTranscript(journalValue) {
  const journal = validateHostJournal(journalValue);
  const transcript = journal.transcript;
  const compact = {
    schema: COMPACT_TRANSCRIPT_SCHEMA,
    session: {
      id: transcript.session.id,
      requestSha256: sha256(transcript.session.request),
      agent: structuredClone(transcript.session.agent),
      client: structuredClone(transcript.session.client),
      protocolVersion: transcript.session.protocolVersion,
    },
    terminal: structuredClone(transcript.terminal),
    eventCount: transcript.events.length,
    events: transcript.events.map((event) => ({
      sequence: event.sequence,
      kind: event.kind,
      tool: event.tool,
      effect: event.effect,
      outcome: event.outcome,
      requestIdSha256: jsonHash({
        type: typeof event.requestId,
        value: event.requestId,
      }),
      argumentsSha256: jsonHash(event.arguments),
      resultSha256: jsonHash(agentResultForEvent(event)),
      evidenceRef: `sha256:${journal.journalSha256}/events/${event.sequence}`,
    })),
    journalSha256: journal.journalSha256,
  };
  return assertAgentBound(compact, 'compact transcript');
}

export function validateCompactTranscript(value, journalValue) {
  const expected = createCompactTranscript(journalValue);
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new AdapterValidationError('compact transcript conflicts with host journal');
  }
  return expected;
}
