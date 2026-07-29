#!/usr/bin/env node

import {
  spawn,
} from 'node:child_process';
import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';

const VERSION = '2.1.220';
const MODEL = 'claude-sonnet-5';
const TOOLS = [
  'mcp__scopa__scopa_orientation',
  'mcp__scopa__scopa_read_file',
  'mcp__scopa__scopa_write_file',
  'mcp__scopa__scopa_check',
  'mcp__scopa__scopa_assurance',
  'mcp__scopa__scopa_transcript',
];
const AGENTS = [
  'claude',
  'Explore',
  'general-purpose',
  'Plan',
  'statusline-setup',
];
const DEFAULT_FIXTURE_ROOT = path.resolve(
  fileURLToPath(new URL('../..', import.meta.url)),
);

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

function initialization() {
  return {
    type: 'system',
    subtype: 'init',
    session_id: 's15-claude-session',
    tools: [...TOOLS],
    mcp_servers: [
      {
        name: 'scopa',
        status: 'connected',
      },
    ],
    mcp_server_errors: [],
    model: MODEL,
    permissionMode: 'dontAsk',
    slash_commands: [],
    claude_code_version: VERSION,
    agents: [...AGENTS],
    skills: [],
    plugins: [],
    memory_paths: {
      auto: '/controlled/known-uncontrolled-memory-path',
    },
  };
}

async function transcript() {
  const root =
    process.env.SCOPA_S15_FIXTURE_ROOT ?? DEFAULT_FIXTURE_ROOT;
  const proof = JSON.parse(
    await readFile(
      path.join(root, 'evidence/S7/fake-agent-proof.json'),
      'utf8',
    ),
  );
  return structuredClone(proof.transcript);
}

async function successEvents() {
  const retained = await transcript();
  const events = [
    initialization(),
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
            content: canonicalJson(toolResult.result),
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
          content: canonicalJson(retained),
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
    session_id: 's15-claude-session',
    total_cost_usd: 0.01,
    num_turns: 7,
    terminal_reason: 'completed',
  });
  return events;
}

function errorEvents({
  subtype,
  apiErrorStatus,
  rateLimited = false,
}) {
  const events = [
    initialization(),
  ];
  if (rateLimited) {
    events.push({
      type: 'rate_limit_event',
      rate_limit_info: {
        status: 'rejected',
      },
    });
  }
  events.push({
    type: 'result',
    subtype,
    is_error: true,
    session_id: 's15-claude-session',
    total_cost_usd: 0,
    num_turns: 1,
    terminal_reason: 'blocking_limit',
    api_error_status: apiErrorStatus,
    errors: [
      'bounded deterministic provider failure',
    ],
  });
  return events;
}

function authStatus(mode) {
  const status = {
    loggedIn: mode !== 'auth-missing',
    authMethod: 'claude.ai',
    apiProvider: 'firstParty',
    email: mode === 'identity-drift'
      ? 'other@example.invalid'
      : 'fixture@example.invalid',
    orgId: mode === 'identity-drift'
      ? 'fixture-org-other'
      : 'fixture-org',
    orgName: 'fixture organization',
    subscriptionType: mode === 'auth-drift' ? 'pro' : 'max',
  };
  return `${JSON.stringify(status)}\n`;
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

async function main() {
  const mode = process.env.SCOPA_S15_MODE ?? 'success';
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--version') {
    process.stdout.write(
      mode === 'version-drift'
        ? '2.1.221 (Claude Code)\n'
        : `${VERSION} (Claude Code)\n`,
    );
    return;
  }
  if (args[0] === 'auth' && args[1] === 'status') {
    process.stdout.write(authStatus(mode));
    return;
  }
  if (mode === 'timeout' || mode === 'output-limit') {
    const child = startDurableChild();
    process.stdout.write(`${child.pid}\n`);
    process.on('SIGTERM', () => {});
    if (mode === 'output-limit') {
      process.stdout.write('x'.repeat(256 * 1024));
    }
    setInterval(() => {}, 1_000);
    return;
  }
  if (mode === 'malformed') {
    process.stdout.write('{not-json\n');
    return;
  }
  if (mode === 'early-eof') {
    process.stdout.write(`${JSON.stringify(initialization())}\n`);
    return;
  }

  let events;
  if (mode === 'provider-refusal' || mode === 'exited-refusal') {
    events = errorEvents({
      subtype: 'error_during_execution',
      apiErrorStatus: 403,
    });
  } else if (mode === 'rate-limit') {
    events = errorEvents({
      subtype: 'error_during_execution',
      apiErrorStatus: 429,
      rateLimited: true,
    });
  } else if (mode === 'provider-failed') {
    events = errorEvents({
      subtype: 'error_during_execution',
      apiErrorStatus: 500,
    });
  } else if (mode === 'budget-stop') {
    events = errorEvents({
      subtype: 'error_max_budget_usd',
      apiErrorStatus: undefined,
    });
  } else if (mode === 'turn-limit') {
    events = errorEvents({
      subtype: 'error_max_turns',
      apiErrorStatus: undefined,
    });
  } else {
    events = await successEvents();
    if (mode === 'model-drift') {
      events[0].model = 'claude-unreviewed-model';
    } else if (mode === 'tool-drift') {
      events[0].tools.push('Bash');
    } else if (mode === 'structured-output-drift') {
      events[0].tools.unshift('StructuredOutput');
    } else if (mode === 'agent-drift') {
      events[0].agents.push('unreviewed-agent');
    } else if (mode === 'mcp-config-error') {
      events[0].mcp_server_errors.push({
        name: 'unexpected',
        error: 'bounded fixture',
      });
    } else if (mode === 'cost-overrun') {
      events.at(-1).total_cost_usd = 0.21;
    } else if (mode === 'turn-overrun') {
      events.at(-1).num_turns = 13;
    }
  }
  process.stdout.write(jsonLines(events));
  if (mode === 'exited-refusal') process.exitCode = 9;
}

if (process.argv[2] === '--child') {
  durableChild();
} else {
  await main();
}
