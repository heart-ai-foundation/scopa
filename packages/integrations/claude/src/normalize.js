import {
  validateTranscript,
} from '../../../adapter-host/src/index.js';
import {
  canonicalJson,
} from '../../../enforcement/src/index.js';
import {
  CLAUDE_AGENT_INVENTORY,
  CLAUDE_MCP_TOOL_PREFIX,
  CLAUDE_MCP_TOOLS,
  CLAUDE_MODEL_OBSERVED,
  EXPECTED_CLAUDE_CODE_VERSION,
} from './profile.js';

export class ClaudeStreamError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ClaudeStreamError';
    this.code = 'SCOPA_CLAUDE_STREAM_INVALID';
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

function sameSet(actual, expected) {
  return (
    actual.length === expected.length &&
    [...actual].sort().join('\0') === [...expected].sort().join('\0')
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
      throw new ClaudeStreamError(
        `stream line ${index + 1} is not JSON: ${error.message}`,
      );
    }
    if (!plainObject(event) || typeof event.type !== 'string') {
      throw new ClaudeStreamError(`invalid event at stream line ${index + 1}`);
    }
    events.push(event);
  }
  if (events.length === 0) {
    throw new ClaudeStreamError('Claude stream is empty');
  }
  return events;
}

function resultText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const parts = [];
    for (const block of content) {
      if (!plainObject(block) || block.type !== 'text' || typeof block.text !== 'string') {
        throw new ClaudeStreamError('unsupported Claude tool-result content');
      }
      parts.push(block.text);
    }
    return parts.join('');
  }
  throw new ClaudeStreamError('Claude tool result has no text payload');
}

function parseToolResult(block) {
  const text = resultText(block.content);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ClaudeStreamError(
      `SCOPA tool result is not JSON: ${error.message}`,
      { text },
    );
  }
}

function finalObject(result) {
  if (plainObject(result.structured_output)) {
    return result.structured_output;
  }
  if (typeof result.result !== 'string') {
    throw new ClaudeStreamError('Claude result does not contain final output');
  }
  try {
    return JSON.parse(result.result);
  } catch {
    const match = result.result.trim().match(
      /^([^{}]*?)```json\s*([\s\S]*?)\s*```([^{}]*)$/i,
    );
    if (!match) {
      throw new ClaudeStreamError(
        'Claude final output is neither JSON nor one isolated JSON fence',
      );
    }
    try {
      return JSON.parse(match[2]);
    } catch (error) {
      throw new ClaudeStreamError(
        `Claude fenced final output is not JSON: ${error.message}`,
      );
    }
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
    throw new ClaudeStreamError('invalid Claude final result schema');
  }
  return value;
}

function validateWireAgainstTranscript(calls, transcript) {
  const wireCalls = calls.filter(
    (call) => call.name !== `${CLAUDE_MCP_TOOL_PREFIX}scopa_transcript`,
  );
  const transcriptCalls = transcript.events.filter(
    (event) => event.kind === 'tool_call',
  );
  if (wireCalls.length !== transcriptCalls.length) {
    throw new ClaudeStreamError(
      'Claude wire calls do not match SCOPA transcript length',
    );
  }
  for (const [index, wire] of wireCalls.entries()) {
    const recordedCall = transcriptCalls[index];
    const recordedResult = transcript.events.find(
      (event) =>
        event.kind === 'tool_result' &&
        event.requestId === recordedCall.requestId,
    );
    if (
      wire.name !== `${CLAUDE_MCP_TOOL_PREFIX}${recordedCall.tool}` ||
      canonicalJson(wire.input) !== canonicalJson(recordedCall.arguments) ||
      !recordedResult ||
      canonicalJson(wire.result) !== canonicalJson(recordedResult.result) ||
      wire.isError !== ['blocked', 'denied', 'error'].includes(
        recordedResult.outcome,
      )
    ) {
      throw new ClaudeStreamError(
        `Claude wire call ${index} conflicts with SCOPA transcript`,
      );
    }
  }
}

export function normalizeClaudeStream(stdout, {
  expectedAgents = CLAUDE_AGENT_INVENTORY,
  expectedVersion = EXPECTED_CLAUDE_CODE_VERSION,
  expectedTools = CLAUDE_MCP_TOOLS,
  expectedModel = CLAUDE_MODEL_OBSERVED,
} = {}) {
  const rawEvents = parseLines(stdout);
  let initialization = null;
  let terminalResult = null;
  const calls = [];
  const callsById = new Map();
  let rateLimitEvents = 0;
  let thinkingTokenEvents = 0;

  for (const event of rawEvents) {
    if (event.type === 'system') {
      if (event.subtype === 'thinking_tokens') {
        if (
          initialization === null ||
          !Number.isFinite(event.estimated_tokens) ||
          !Number.isFinite(event.estimated_tokens_delta) ||
          event.estimated_tokens < 0
        ) {
          throw new ClaudeStreamError(
            'malformed Claude thinking-token telemetry',
          );
        }
        thinkingTokenEvents += 1;
        continue;
      }
      if (event.subtype !== 'init' || initialization !== null) {
        throw new ClaudeStreamError(
          `unsupported Claude system event: ${event.subtype}`,
        );
      }
      if (
        event.claude_code_version !== expectedVersion ||
        event.model !== expectedModel ||
        event.permissionMode !== 'dontAsk' ||
        !Array.isArray(event.tools) ||
        !sameSet(event.tools, expectedTools) ||
        !Array.isArray(event.mcp_servers) ||
        event.mcp_servers.length !== 1 ||
        event.mcp_servers[0]?.name !== 'scopa' ||
        event.mcp_servers[0]?.status !== 'connected' ||
        !Array.isArray(event.skills) ||
        event.skills.length !== 0 ||
        !Array.isArray(event.plugins) ||
        event.plugins.length !== 0 ||
        !Array.isArray(event.slash_commands) ||
        event.slash_commands.length !== 0 ||
        !Array.isArray(event.agents) ||
        !sameSet(event.agents, expectedAgents)
      ) {
        throw new ClaudeStreamError(
          'Claude initialization surface differs from the pinned profile',
          {
            version: event.claude_code_version,
            model: event.model,
            permissionMode: event.permissionMode,
            tools: event.tools,
            mcpServers: event.mcp_servers,
            skills: event.skills,
            plugins: event.plugins,
            slashCommands: event.slash_commands,
            agents: event.agents,
          },
        );
      }
      initialization = {
        claudeCodeVersion: event.claude_code_version,
        model: event.model,
        permissionMode: event.permissionMode,
        tools: [...event.tools],
        mcpServers: structuredClone(event.mcp_servers),
        skills: [...event.skills],
        plugins: [...event.plugins],
        slashCommands: [...event.slash_commands],
        agents: [...event.agents],
        memoryPaths: plainObject(event.memory_paths)
          ? structuredClone(event.memory_paths)
          : {},
        sessionId: event.session_id,
      };
      continue;
    }

    if (event.type === 'assistant') {
      if (!plainObject(event.message) || !Array.isArray(event.message.content)) {
        throw new ClaudeStreamError('invalid Claude assistant event');
      }
      for (const block of event.message.content) {
        if (!plainObject(block) || typeof block.type !== 'string') {
          throw new ClaudeStreamError('invalid Claude assistant content');
        }
        if (block.type === 'text' || block.type === 'thinking') continue;
        if (
          block.type !== 'tool_use' ||
          typeof block.id !== 'string' ||
          typeof block.name !== 'string' ||
          !plainObject(block.input) ||
          !expectedTools.includes(block.name) ||
          callsById.has(block.id)
        ) {
          throw new ClaudeStreamError('unknown or malformed Claude tool use', block);
        }
        const call = {
          sequence: calls.length,
          id: block.id,
          name: block.name,
          input: structuredClone(block.input),
          result: null,
          isError: null,
        };
        calls.push(call);
        callsById.set(block.id, call);
      }
      continue;
    }

    if (event.type === 'user') {
      if (!plainObject(event.message) || !Array.isArray(event.message.content)) {
        throw new ClaudeStreamError('invalid Claude user tool-result event');
      }
      for (const block of event.message.content) {
        if (
          !plainObject(block) ||
          block.type !== 'tool_result' ||
          typeof block.tool_use_id !== 'string'
        ) {
          throw new ClaudeStreamError('unsupported Claude user content', block);
        }
        const call = callsById.get(block.tool_use_id);
        if (!call || call.result !== null) {
          throw new ClaudeStreamError('orphan or duplicate Claude tool result');
        }
        call.result = parseToolResult(block);
        call.isError = Boolean(block.is_error);
      }
      continue;
    }

    if (event.type === 'rate_limit_event') {
      rateLimitEvents += 1;
      continue;
    }

    if (event.type === 'result') {
      if (terminalResult !== null) {
        throw new ClaudeStreamError('duplicate Claude terminal result');
      }
      terminalResult = event;
      continue;
    }

    throw new ClaudeStreamError(`unknown Claude stream event type: ${event.type}`);
  }

  if (initialization === null || terminalResult === null) {
    throw new ClaudeStreamError('Claude stream lacks init or terminal result');
  }
  if (
    terminalResult.subtype !== 'success' ||
    terminalResult.is_error !== false ||
    calls.some((call) => call.result === null)
  ) {
    throw new ClaudeStreamError('Claude run or one of its tool calls is incomplete');
  }

  const transcriptCall = calls.findLast(
    (call) => call.name === `${CLAUDE_MCP_TOOL_PREFIX}scopa_transcript`,
  );
  if (!transcriptCall || transcriptCall.isError) {
    throw new ClaudeStreamError('Claude run lacks a successful SCOPA transcript');
  }
  const transcript = validateTranscript(transcriptCall.result);
  validateWireAgainstTranscript(calls, transcript);
  const final = validateFinal(finalObject(terminalResult));
  if (
    transcript.terminal === null ||
    final.canStop !== transcript.terminal.canStop ||
    final.status !== transcript.terminal.status
  ) {
    throw new ClaudeStreamError(
      'Claude final result conflicts with SCOPA terminal state',
    );
  }

  return {
    schema: 'scopa.claude-run.v1',
    initialization,
    toolCalls: calls,
    scopaTranscript: transcript,
    final,
    result: {
      subtype: terminalResult.subtype,
      isError: terminalResult.is_error,
      sessionId: terminalResult.session_id,
      costUsd: terminalResult.total_cost_usd,
      turns: terminalResult.num_turns,
      terminalReason: terminalResult.terminal_reason,
    },
    rateLimitEvents,
    thinkingTokenEvents,
    rawEventCount: rawEvents.length,
  };
}
