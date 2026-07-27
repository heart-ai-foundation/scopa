import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  fileURLToPath,
} from 'node:url';
import {
  validateCapabilityMatrix,
} from '../../../adapter-host/src/index.js';
import {
  normalizeClaudeStream,
} from '../src/normalize.js';
import {
  CLAUDE_AGENT_INVENTORY,
  CLAUDE_MCP_TOOLS,
  CLAUDE_MODEL_OBSERVED,
  EXPECTED_CLAUDE_CODE_VERSION,
  buildClaudeInvocation,
  createClaudeCapabilityMatrix,
  createClaudeMcpConfig,
  createClaudeSession,
  parseClaudeVersion,
  validateClaudeInvocation,
} from '../src/profile.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const PROOF = JSON.parse(
  await readFile(
    path.join(ROOT, 'evidence/S7/fake-agent-proof.json'),
    'utf8',
  ),
);
const ROOT_PACKAGE = JSON.parse(
  await readFile(path.join(ROOT, 'package.json'), 'utf8'),
);

function rawFixture() {
  const events = [
    {
      type: 'system',
      subtype: 'init',
      session_id: 'claude-session',
      tools: [...CLAUDE_MCP_TOOLS],
      mcp_servers: [
        {
          name: 'scopa',
          status: 'connected',
        },
      ],
      model: CLAUDE_MODEL_OBSERVED,
      permissionMode: 'dontAsk',
      slash_commands: [],
      claude_code_version: EXPECTED_CLAUDE_CODE_VERSION,
      agents: [...CLAUDE_AGENT_INVENTORY],
      skills: [],
      plugins: [],
      memory_paths: {
        auto: '/controlled/known-uncontrolled-memory-path',
      },
    },
    {
      type: 'system',
      subtype: 'thinking_tokens',
      estimated_tokens: 9,
      estimated_tokens_delta: 9,
    },
  ];
  const transcript = PROOF.transcript;
  const transcriptCalls = transcript.events.filter(
    (event) => event.kind === 'tool_call',
  );
  for (const [index, call] of transcriptCalls.entries()) {
    const result = transcript.events.find(
      (event) =>
        event.kind === 'tool_result' &&
        event.requestId === call.requestId,
    );
    const id = `tool-${index}`;
    events.push({
      type: 'assistant',
      message: {
        content: [
          {
            type: 'tool_use',
            id,
            name: `mcp__scopa__${call.tool}`,
            input: call.arguments,
          },
        ],
      },
    });
    events.push({
      type: 'user',
      message: {
        content: [
          {
            type: 'tool_result',
            tool_use_id: id,
            content: JSON.stringify(result.result),
            is_error: ['blocked', 'denied', 'error'].includes(result.outcome),
          },
        ],
      },
    });
  }
  events.push({
    type: 'assistant',
    message: {
      content: [
        {
          type: 'tool_use',
          id: 'tool-transcript',
          name: 'mcp__scopa__scopa_transcript',
          input: {},
        },
      ],
    },
  });
  events.push({
    type: 'user',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tool-transcript',
          content: JSON.stringify(transcript),
          is_error: false,
        },
      ],
    },
  });
  events.push({
    type: 'rate_limit_event',
    rate_limit_info: {
      status: 'allowed',
    },
  });
  events.push({
    type: 'result',
    subtype: 'success',
    is_error: false,
    structured_output: {
      scenario: 'fixture',
      status: 'satisfied',
      canStop: true,
      denialObserved: true,
    },
    session_id: 'claude-session',
    total_cost_usd: 0.01,
    num_turns: 7,
    terminal_reason: 'completed',
  });
  return events;
}

function jsonLines(events) {
  return `${events.map((event) => JSON.stringify(event)).join('\n')}\n`;
}

test('Claude profile pins version, closes built-ins, and binds one MCP server', () => {
  assert.equal(
    parseClaudeVersion('2.1.170 (Claude Code)\n'),
    EXPECTED_CLAUDE_CODE_VERSION,
  );
  assert.throws(() => parseClaudeVersion('2.1.171'));

  const invocation = validateClaudeInvocation(
    buildClaudeInvocation({
      mcpConfigFile: '/tmp/scopa-claude/mcp.json',
      prompt: 'fixture prompt',
    }),
  );
  assert.equal(invocation.command, 'claude');
  assert.equal(invocation.args.includes('--dangerously-skip-permissions'), false);
  assert.equal(invocation.args.includes('--strict-mcp-config'), true);
  assert.equal(invocation.args.includes('--no-session-persistence'), true);
  assert.equal(invocation.args.includes('--no-chrome'), true);
  assert.equal(
    invocation.args[invocation.args.indexOf('--max-turns') + 1],
    '12',
  );
  assert.equal(
    invocation.args[invocation.args.indexOf('--input-format') + 1],
    'stream-json',
  );
  assert.equal(invocation.args.includes('fixture prompt'), false);
  assert.equal(
    JSON.parse(invocation.stdin).message.content[0].text,
    'fixture prompt',
  );
  assert.equal(
    invocation.args[invocation.args.indexOf('--tools') + 1],
    'mcp__scopa',
  );
  assert.equal(
    invocation.args[invocation.args.indexOf('--setting-sources') + 1],
    '',
  );

  const config = createClaudeMcpConfig({
    repoRoot: '/tmp/scopa-claude/repo',
    sessionFile: '/tmp/scopa-claude/session.json',
    matrixFile: '/tmp/scopa-claude/matrix.json',
    adapterCli: '/tmp/scopa-claude/scopa-mcp.js',
  });
  assert.deepEqual(Object.keys(config.mcpServers), ['scopa']);
  assert.equal(config.mcpServers.scopa.command, process.execPath);
  assert.equal(
    config.mcpServers.scopa.args.includes('/tmp/scopa-claude/repo'),
    true,
  );
});

test('root package publishes the reviewed Claude integration entry', () => {
  assert.equal(
    ROOT_PACKAGE.exports['./claude'],
    './packages/integrations/claude/src/index.js',
  );
  assert.equal(
    ROOT_PACKAGE.files.includes('packages/integrations/*/src/**'),
    true,
  );
});

test('Claude matrix is deliberately partial and false full assurance is rejected', () => {
  const matrix = createClaudeCapabilityMatrix({});
  assert.equal(matrix.assurance, 'partial');
  assert.equal(
    matrix.capabilities.find(
      (capability) => capability.id === 'native.filesystem-write',
    ).exposure,
    'disabled',
  );
  assert.equal(
    matrix.capabilities.find(
      (capability) => capability.id === 'native.network',
    ).mediation,
    'uncontrolled',
  );
  const overclaim = structuredClone(matrix);
  overclaim.assurance = 'full';
  assert.throws(
    () => validateCapabilityMatrix(overclaim),
    /does not match computed partial/,
  );
});

test('Claude session identity remains launcher-declared', () => {
  assert.deepEqual(
    createClaudeSession({
      sessionId: 'S8-test',
      request: 'test request',
    }),
    {
      schema: 'scopa.adapter-session.v1',
      sessionId: 'S8-test',
      request: 'test request',
      agent: {
        provider: 'anthropic',
        model: 'sonnet',
        provenance: 'launcher-declared',
      },
    },
  );
});

test('normalizer binds the raw Claude wire to SCOPA transcript and terminal state', () => {
  const normalized = normalizeClaudeStream(jsonLines(rawFixture()));
  assert.equal(normalized.schema, 'scopa.claude-run.v1');
  assert.equal(normalized.initialization.tools.length, 6);
  assert.equal(normalized.toolCalls.length, 6);
  assert.equal(normalized.scopaTranscript.terminal.canStop, true);
  assert.equal(normalized.final.canStop, true);
  assert.equal(normalized.rateLimitEvents, 1);
  assert.equal(normalized.thinkingTokenEvents, 1);
});

test('normalizer rejects hidden tools, reordering, changed results, false-green, and unknown events', () => {
  const hiddenTool = rawFixture();
  hiddenTool[0].tools.push('Bash');
  assert.throws(
    () => normalizeClaudeStream(jsonLines(hiddenTool)),
    /initialization surface differs/,
  );

  const changedAgents = rawFixture();
  changedAgents[0].agents.push('unreviewed-agent');
  assert.throws(
    () => normalizeClaudeStream(jsonLines(changedAgents)),
    /initialization surface differs/,
  );

  const reordered = rawFixture();
  [
    reordered[2],
    reordered[4],
  ] = [
    reordered[4],
    reordered[2],
  ];
  [
    reordered[3],
    reordered[5],
  ] = [
    reordered[5],
    reordered[3],
  ];
  assert.throws(
    () => normalizeClaudeStream(jsonLines(reordered)),
    /conflicts with SCOPA transcript/,
  );

  const changedResult = rawFixture();
  changedResult[5].message.content[0].content = '{"written":false}';
  assert.throws(
    () => normalizeClaudeStream(jsonLines(changedResult)),
    /conflicts with SCOPA transcript/,
  );

  const falseGreen = rawFixture();
  falseGreen.at(-1).structured_output.canStop = false;
  falseGreen.at(-1).structured_output.status = 'blocked';
  assert.throws(
    () => normalizeClaudeStream(jsonLines(falseGreen)),
    /conflicts with SCOPA terminal state/,
  );

  const unknown = rawFixture();
  unknown.splice(-1, 0, { type: 'hook_event' });
  assert.throws(
    () => normalizeClaudeStream(jsonLines(unknown)),
    /unknown Claude stream event/,
  );

  const malformedTelemetry = rawFixture();
  malformedTelemetry[1].estimated_tokens = 'nine';
  assert.throws(
    () => normalizeClaudeStream(jsonLines(malformedTelemetry)),
    /malformed Claude thinking-token telemetry/,
  );
});
