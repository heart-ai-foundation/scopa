import {
  validateTranscript,
} from '../../../adapter-host/src/index.js';
import {
  canonicalJson,
} from '../../../enforcement/src/index.js';
import {
  CODEX_MCP_SERVER_NAME,
  CODEX_MCP_TOOLS,
  CODEX_MODEL_REQUEST,
  EXPECTED_CODEX_CLI_VERSION,
} from './profile.js';

export class CodexStreamError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'CodexStreamError';
    this.code = 'SCOPA_CODEX_STREAM_INVALID';
    this.details = details;
  }
}

function plainObject(value) {
  return Boolean(
    value &&
    !Array.isArray(value) &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype,
  );
}

function parseLines(stdout) {
  const events = [];
  for (const [index, line] of String(stdout).split(/\r?\n/).entries()) {
    if (line.length === 0) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch (error) {
      throw new CodexStreamError(
        `stream line ${index + 1} is not JSON: ${error.message}`,
      );
    }
    if (!plainObject(event) || typeof event.type !== 'string') {
      throw new CodexStreamError(`invalid event at stream line ${index + 1}`);
    }
    events.push(event);
  }
  if (events.length === 0) {
    throw new CodexStreamError('Codex stream is empty');
  }
  return events;
}

function finalObject(text) {
  if (typeof text !== 'string') {
    throw new CodexStreamError('Codex final message is not text');
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new CodexStreamError(
      `Codex final message is not JSON: ${error.message}`,
    );
  }
}

function validateFinal(value) {
  if (
    !plainObject(value) ||
    Object.keys(value).sort().join('\0') !==
      ['canStop', 'denialObserved', 'scenario', 'status'].join('\0') ||
    typeof value.scenario !== 'string' ||
    !['blocked', 'satisfied'].includes(value.status) ||
    typeof value.canStop !== 'boolean' ||
    typeof value.denialObserved !== 'boolean' ||
    value.canStop !== (value.status === 'satisfied')
  ) {
    throw new CodexStreamError('invalid Codex final result schema');
  }
  return value;
}

function parseToolResult(item) {
  if (
    !plainObject(item.result) ||
    !Array.isArray(item.result.content) ||
    item.result.content.length !== 1 ||
    item.result.content[0]?.type !== 'text' ||
    typeof item.result.content[0]?.text !== 'string' ||
    !plainObject(item.result.structured_content)
  ) {
    throw new CodexStreamError('Codex MCP result is malformed', item);
  }
  let textResult;
  try {
    textResult = JSON.parse(item.result.content[0].text);
  } catch (error) {
    throw new CodexStreamError(
      `Codex MCP text result is not JSON: ${error.message}`,
    );
  }
  if (canonicalJson(textResult) !== canonicalJson(item.result.structured_content)) {
    throw new CodexStreamError(
      'Codex MCP text and structured results differ',
      item,
    );
  }
  return structuredClone(item.result.structured_content);
}

function isExpectedSkillBudgetWarning(item) {
  return (
    item.type === 'error' &&
    item.message ===
      'Skill descriptions were shortened to fit the 2% skills context budget. Codex can still see every skill, but some descriptions are shorter. Disable unused skills or plugins to leave more room for the rest.'
  );
}

function isErrorResult(call) {
  if (call.status === 'failed' || call.error !== null) return true;
  if (call.tool === 'scopa_check') {
    return call.result?.state?.canStop === false;
  }
  return call.result?.schema === 'scopa.adapter-error.v1';
}

function validateWireAgainstTranscript(calls, transcript) {
  const wireCalls = calls.filter(
    (call) => call.tool !== 'scopa_transcript',
  );
  const transcriptCalls = transcript.events.filter(
    (event) => event.kind === 'tool_call',
  );
  if (wireCalls.length !== transcriptCalls.length) {
    throw new CodexStreamError(
      'Codex wire calls do not match SCOPA transcript length',
    );
  }
  for (const [index, wire] of wireCalls.entries()) {
    const recordedCall = transcriptCalls[index];
    const recordedResult = transcript.events.find(
      (event) =>
        event.kind === 'tool_result' &&
        event.requestId === recordedCall.requestId,
    );
    const expectedError = ['blocked', 'denied', 'error'].includes(
      recordedResult?.outcome,
    );
    if (
      wire.tool !== recordedCall.tool ||
      canonicalJson(wire.input) !== canonicalJson(recordedCall.arguments) ||
      !recordedResult ||
      canonicalJson(wire.result) !== canonicalJson(recordedResult.result) ||
      wire.isError !== expectedError
    ) {
      throw new CodexStreamError(
        `Codex wire call ${index} conflicts with SCOPA transcript`,
      );
    }
  }
}

function validUsage(value) {
  return (
    plainObject(value) &&
    [
      'cached_input_tokens',
      'cache_write_input_tokens',
      'input_tokens',
      'output_tokens',
      'reasoning_output_tokens',
    ].every(
      (key) => Number.isSafeInteger(value[key]) && value[key] >= 0,
    )
  );
}

export function normalizeCodexStream(stdout, {
  expectedModel = CODEX_MODEL_REQUEST,
  expectedTools = CODEX_MCP_TOOLS,
  expectedVersion = EXPECTED_CODEX_CLI_VERSION,
} = {}) {
  const rawEvents = parseLines(stdout);
  let threadId = null;
  let turnStarted = false;
  let turnCompleted = null;
  let finalText = null;
  let finalMessageId = null;
  const calls = [];
  const callsById = new Map();
  let reasoningItems = 0;
  let skillBudgetWarnings = 0;

  for (const event of rawEvents) {
    if (event.type === 'thread.started') {
      if (
        threadId !== null ||
        typeof event.thread_id !== 'string' ||
        event.thread_id.length === 0
      ) {
        throw new CodexStreamError('invalid or duplicate Codex thread start');
      }
      threadId = event.thread_id;
      continue;
    }
    if (event.type === 'turn.started') {
      if (threadId === null || turnStarted || turnCompleted !== null) {
        throw new CodexStreamError('invalid or duplicate Codex turn start');
      }
      turnStarted = true;
      continue;
    }
    if (event.type === 'turn.completed') {
      if (
        !turnStarted ||
        turnCompleted !== null ||
        !validUsage(event.usage)
      ) {
        throw new CodexStreamError('invalid or duplicate Codex turn completion');
      }
      turnCompleted = structuredClone(event.usage);
      continue;
    }
    if (event.type !== 'item.started' && event.type !== 'item.completed') {
      throw new CodexStreamError(`unknown Codex stream event: ${event.type}`);
    }
    if (!plainObject(event.item) || typeof event.item.type !== 'string') {
      throw new CodexStreamError('Codex item event is malformed');
    }
    const item = event.item;
    if (item.type === 'error') {
      if (
        event.type !== 'item.completed' ||
        !isExpectedSkillBudgetWarning(item) ||
        skillBudgetWarnings !== 0
      ) {
        throw new CodexStreamError('unknown Codex error item', item);
      }
      skillBudgetWarnings += 1;
      continue;
    }
    if (item.type === 'reasoning') {
      if (
        event.type !== 'item.completed' ||
        Object.keys(item).sort().join('\0') !==
          ['id', 'text', 'type'].join('\0') ||
        typeof item.id !== 'string' ||
        typeof item.text !== 'string'
      ) {
        throw new CodexStreamError('malformed Codex reasoning item', item);
      }
      reasoningItems += 1;
      continue;
    }
    if (item.type === 'agent_message') {
      if (
        event.type !== 'item.completed' ||
        finalText !== null ||
        typeof item.id !== 'string' ||
        typeof item.text !== 'string'
      ) {
        throw new CodexStreamError('invalid or duplicate Codex final message');
      }
      finalText = item.text;
      finalMessageId = item.id;
      continue;
    }
    if (item.type !== 'mcp_tool_call') {
      throw new CodexStreamError(
        `unapproved Codex item type: ${item.type}`,
        item,
      );
    }
    if (
      typeof item.id !== 'string' ||
      item.server !== CODEX_MCP_SERVER_NAME ||
      !expectedTools.includes(item.tool) ||
      !plainObject(item.arguments)
    ) {
      throw new CodexStreamError('unknown or malformed Codex MCP call', item);
    }
    if (event.type === 'item.started') {
      if (
        callsById.has(item.id) ||
        item.result !== null ||
        item.error !== null ||
        item.status !== 'in_progress'
      ) {
        throw new CodexStreamError('invalid Codex MCP call start', item);
      }
      const call = {
        sequence: calls.length,
        id: item.id,
        server: item.server,
        tool: item.tool,
        name: `mcp__${item.server}__${item.tool}`,
        input: structuredClone(item.arguments),
        result: null,
        error: null,
        status: null,
        isError: null,
      };
      calls.push(call);
      callsById.set(item.id, call);
      continue;
    }
    const call = callsById.get(item.id);
    if (
      !call ||
      call.status !== null ||
      canonicalJson(call.input) !== canonicalJson(item.arguments) ||
      !['completed', 'failed'].includes(item.status)
    ) {
      throw new CodexStreamError('orphan or invalid Codex MCP completion', item);
    }
    call.result = parseToolResult(item);
    call.error = item.error === null ? null : structuredClone(item.error);
    call.status = item.status;
    call.isError = isErrorResult(call);
  }

  if (
    threadId === null ||
    !turnStarted ||
    turnCompleted === null ||
    finalText === null ||
    calls.length === 0 ||
    calls.some((call) => call.status === null)
  ) {
    throw new CodexStreamError('Codex run is incomplete');
  }
  const transcriptCall = calls.findLast(
    (call) => call.tool === 'scopa_transcript',
  );
  if (!transcriptCall || transcriptCall.isError) {
    throw new CodexStreamError('Codex run lacks a successful SCOPA transcript');
  }
  const transcript = validateTranscript(transcriptCall.result);
  if (
    transcript.session.client.name !== 'codex-mcp-client' ||
    transcript.session.client.version !== expectedVersion ||
    transcript.session.agent.provider !== 'openai' ||
    transcript.session.agent.model !== expectedModel
  ) {
    throw new CodexStreamError(
      'Codex transcript identity differs from the pinned profile',
    );
  }
  validateWireAgainstTranscript(calls, transcript);
  const final = validateFinal(finalObject(finalText));
  if (
    transcript.terminal === null ||
    final.canStop !== transcript.terminal.canStop ||
    final.status !== transcript.terminal.status
  ) {
    throw new CodexStreamError(
      'Codex final result conflicts with SCOPA terminal state',
    );
  }
  return {
    schema: 'scopa.codex-run.v1',
    initialization: {
      threadId,
      model: expectedModel,
      codexCliVersion: expectedVersion,
      mcpClient: structuredClone(transcript.session.client),
      protocolVersion: transcript.session.protocolVersion,
      server: CODEX_MCP_SERVER_NAME,
      enabledTools: [...expectedTools],
    },
    toolCalls: calls,
    scopaTranscript: transcript,
    final,
    result: {
      finalMessageId,
      usage: turnCompleted,
    },
    reasoningItems,
    skillBudgetWarnings,
    rawEventCount: rawEvents.length,
  };
}
