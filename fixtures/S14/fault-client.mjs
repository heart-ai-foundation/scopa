#!/usr/bin/env node

import {
  spawn,
} from 'node:child_process';
import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';

const CLAUDE_TOOLS = [
  'mcp__scopa__scopa_orientation',
  'mcp__scopa__scopa_read_file',
  'mcp__scopa__scopa_write_file',
  'mcp__scopa__scopa_check',
  'mcp__scopa__scopa_assurance',
  'mcp__scopa__scopa_transcript',
];
const CLAUDE_AGENTS = [
  'claude',
  'Explore',
  'general-purpose',
  'Plan',
  'statusline-setup',
];

function canonical(value) {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(canonical);
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [
        key,
        canonical(value[key]),
      ]),
  );
}

function canonicalJson(value) {
  return JSON.stringify(canonical(value));
}

function jsonLines(events) {
  return `${events.map((event) => JSON.stringify(event)).join('\n')}\n`;
}

async function transcript() {
  const root = process.env.SCOPA_S14_FIXTURE_ROOT;
  if (!root) throw new Error('SCOPA_S14_FIXTURE_ROOT is required');
  const proof = JSON.parse(
    await readFile(
      path.join(root, 'evidence/S7/fake-agent-proof.json'),
      'utf8',
    ),
  );
  return structuredClone(proof.transcript);
}

async function claudeFixture() {
  const retained = await transcript();
  const events = [
    {
      type: 'system',
      subtype: 'init',
      session_id: 'claude-session',
      tools: CLAUDE_TOOLS,
      mcp_servers: [
        {
          name: 'scopa',
          status: 'connected',
        },
      ],
      model: 'claude-sonnet-4-6',
      permissionMode: 'dontAsk',
      slash_commands: [],
      claude_code_version: '2.1.170',
      agents: CLAUDE_AGENTS,
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
  const calls = retained.events.filter(
    (event) => event.kind === 'tool_call',
  );
  for (const [index, call] of calls.entries()) {
    const toolResult = retained.events.find(
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
            content: JSON.stringify(toolResult.result),
            is_error: [
              'blocked',
              'denied',
              'error',
            ].includes(toolResult.outcome),
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
          content: JSON.stringify(retained),
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
  return jsonLines(events);
}

function mcpResult(result) {
  return {
    content: [
      {
        type: 'text',
        text: canonicalJson(result),
      },
    ],
    structured_content: structuredClone(result),
  };
}

async function codexFixture() {
  const retained = await transcript();
  const client = {
    name: 'codex-mcp-client',
    version: '0.145.0',
  };
  retained.session.id = 'S14-codex-fixture';
  retained.session.request = 'Normalize a deterministic S14 fixture.';
  retained.session.client = client;
  retained.session.agent = {
    provider: 'openai',
    model: 'gpt-5.4',
    provenance: 'launcher-declared',
  };
  retained.events[0].result.client = structuredClone(client);
  const events = [
    {
      type: 'thread.started',
      thread_id: 'codex-thread',
    },
    {
      type: 'turn.started',
    },
  ];
  const calls = retained.events.filter(
    (event) => event.kind === 'tool_call',
  );
  for (const [index, call] of calls.entries()) {
    const toolResult = retained.events.find(
      (event) =>
        event.kind === 'tool_result' &&
        event.requestId === call.requestId,
    );
    const id = `item-${index}`;
    events.push({
      type: 'item.started',
      item: {
        id,
        type: 'mcp_tool_call',
        server: 'scopa',
        tool: call.tool,
        arguments: call.arguments,
        result: null,
        error: null,
        status: 'in_progress',
      },
    });
    events.push({
      type: 'item.completed',
      item: {
        id,
        type: 'mcp_tool_call',
        server: 'scopa',
        tool: call.tool,
        arguments: call.arguments,
        result: mcpResult(toolResult.result),
        error: null,
        status: 'completed',
      },
    });
  }
  events.push({
    type: 'item.started',
    item: {
      id: 'item-transcript',
      type: 'mcp_tool_call',
      server: 'scopa',
      tool: 'scopa_transcript',
      arguments: {},
      result: null,
      error: null,
      status: 'in_progress',
    },
  });
  events.push({
    type: 'item.completed',
    item: {
      id: 'item-transcript',
      type: 'mcp_tool_call',
      server: 'scopa',
      tool: 'scopa_transcript',
      arguments: {},
      result: mcpResult(retained),
      error: null,
      status: 'completed',
    },
  });
  events.push({
    type: 'item.completed',
    item: {
      id: 'item-final',
      type: 'agent_message',
      text: JSON.stringify({
        scenario: 'fixture',
        status: 'satisfied',
        canStop: true,
        denialObserved: true,
      }),
    },
  });
  events.push({
    type: 'turn.completed',
    usage: {
      input_tokens: 100,
      cached_input_tokens: 50,
      cache_write_input_tokens: 0,
      output_tokens: 20,
      reasoning_output_tokens: 5,
    },
  });
  return jsonLines(events);
}

function durableChild() {
  process.on('SIGTERM', () => {});
  setInterval(() => {}, 1_000);
}

function startDurableChild() {
  const child = spawn(process.execPath, [
    new URL(import.meta.url).pathname,
    '--child',
  ], {
    stdio: 'ignore',
  });
  child.unref();
  return child;
}

function direct(mode) {
  if (mode === 'success') {
    process.stdout.write('ok\n');
    return;
  }
  if (mode === 'exit') {
    process.stderr.write('bounded failure\n');
    process.exitCode = 7;
    return;
  }
  if (mode === 'signal') {
    process.kill(process.pid, 'SIGTERM');
    return;
  }
  if (mode === 'orphan') {
    const child = startDurableChild();
    process.stdout.write(`${child.pid}\n`);
    return;
  }
  if (mode === 'timeout' || mode === 'output') {
    const child = startDurableChild();
    process.stdout.write(`${child.pid}\n`);
    process.on('SIGTERM', () => {});
    if (mode === 'output') {
      process.stdout.write('x'.repeat(256 * 1024));
    }
    setInterval(() => {}, 1_000);
    return;
  }
  throw new Error(`unknown direct fault mode: ${mode}`);
}

async function provider() {
  const mode = process.env.SCOPA_S14_MODE ?? 'success';
  const providerName = process.env.SCOPA_S14_PROVIDER;
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--version') {
    if (providerName === 'claude') {
      process.stdout.write(
        mode === 'version-drift'
          ? '2.1.171 (Claude Code)\n'
          : '2.1.170 (Claude Code)\n',
      );
      return;
    }
    if (providerName === 'codex') {
      process.stdout.write(
        mode === 'version-drift'
          ? 'codex-cli 0.145.1\n'
          : 'codex-cli 0.145.0\n',
      );
      return;
    }
  }
  if (
    providerName === 'codex' &&
    args[0] === 'mcp' &&
    args[1] === 'list' &&
    args[2] === '--json'
  ) {
    process.stdout.write(
      mode === 'inventory-drift'
        ? '[]\n'
        : `${JSON.stringify([
          {
            name: 'scopa',
            enabled: true,
            transport: {
              type: 'stdio',
            },
          },
        ])}\n`,
    );
    return;
  }
  if (mode === 'exit') {
    process.exitCode = 9;
    return;
  }
  if (mode === 'malformed') {
    process.stdout.write('{not-json\n');
    return;
  }
  if (mode === 'truncated') {
    process.stdout.write('{"type":"thread.started"');
    return;
  }
  if (providerName === 'claude') {
    process.stdout.write(await claudeFixture());
    return;
  }
  if (providerName === 'codex') {
    process.stdout.write(await codexFixture());
    return;
  }
  throw new Error('SCOPA_S14_PROVIDER is invalid');
}

const args = process.argv.slice(2);
if (args[0] === '--child') {
  durableChild();
} else if (args[0] === '--direct') {
  direct(args[1]);
} else {
  await provider();
}
