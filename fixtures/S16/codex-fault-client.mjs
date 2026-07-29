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

const VERSION = '0.145.0';
const MODEL = 'gpt-5.4';
const DEFAULT_ROOT = path.resolve(
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

async function transcript(baseScenario) {
  const root = process.env.SCOPA_S16_FIXTURE_ROOT ?? DEFAULT_ROOT;
  const proof = JSON.parse(
    await readFile(
      path.join(root, 'evidence/S9/codex-live-proof.public.json'),
      'utf8',
    ),
  );
  const retained = structuredClone(
    proof.scenarios[baseScenario].normalized.scopaTranscript,
  );
  retained.session.id = `S16-${baseScenario}-fixture`;
  retained.session.request = 'Execute a deterministic S16 fault scenario.';
  retained.session.client = {
    name: 'codex-mcp-client',
    version: VERSION,
  };
  retained.session.agent = {
    provider: 'openai',
    model: MODEL,
    provenance: 'launcher-declared',
  };
  retained.events[0].result.client = structuredClone(retained.session.client);
  return retained;
}

async function successEvents(baseScenario, mode) {
  const retained = await transcript(baseScenario);
  if (mode === 'model-drift') {
    retained.session.agent.model = 'unreviewed-model';
  } else if (mode === 'client-schema-drift') {
    retained.session.client.version = '0.145.1';
    retained.events[0].result.client.version = '0.145.1';
  }
  const events = [
    {
      type: 'thread.started',
      thread_id: `s16-${baseScenario}-thread`,
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
        scenario: baseScenario === 'falseGreen'
          ? 'false-green'
          : baseScenario.replace(/[A-Z]/g, (letter) =>
            `-${letter.toLowerCase()}`),
        status: retained.terminal.status,
        canStop: retained.terminal.canStop,
        denialObserved: baseScenario === 'denied',
      }),
    },
  });
  events.push({
    type: 'turn.completed',
    usage: {
      input_tokens: mode === 'usage-limit' ? 120_001 : 100,
      cached_input_tokens: 50,
      cache_write_input_tokens: 0,
      output_tokens: 20,
      reasoning_output_tokens: 5,
    },
  });

  if (mode === 'native-drift') {
    events.splice(-2, 0, {
      type: 'item.completed',
      item: {
        id: 'native',
        type: 'command_execution',
        command: 'forbidden-native-command',
        status: 'completed',
      },
    });
  } else if (mode === 'tool-drift') {
    events.splice(-2, 0, {
      type: 'item.completed',
      item: {
        id: 'foreign-tool',
        type: 'mcp_tool_call',
        server: 'foreign',
        tool: 'unreviewed',
        arguments: {},
        result: mcpResult({ ok: true }),
        error: null,
        status: 'completed',
      },
    });
  } else if (mode === 'schema-drift') {
    const final = events.at(-2);
    final.item.text = JSON.stringify({
      scenario: baseScenario,
      status: retained.terminal.status,
      canStop: retained.terminal.canStop,
      denialObserved: false,
      unreviewed: true,
    });
  }
  return events;
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
  const mode = process.env.SCOPA_S16_MODE ?? 'success';
  const baseScenario =
    process.env.SCOPA_S16_BASE_SCENARIO ?? 'clean';
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--version') {
    process.stdout.write(
      mode === 'version-drift'
        ? 'codex-cli 0.145.1\n'
        : `codex-cli ${VERSION}\n`,
    );
    return;
  }
  if (
    args[0] === 'mcp' &&
    args[1] === 'list' &&
    args[2] === '--json'
  ) {
    if (mode === 'inventory-malformed') {
      process.stdout.write('{not-json\n');
      return;
    }
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
  if (mode === 'provider-refusal') {
    process.stderr.write('bounded deterministic provider refusal\n');
    process.exitCode = 9;
    return;
  }
  if (mode === 'provider-rate-pressure') {
    process.stderr.write('bounded deterministic provider rate pressure\n');
    process.exitCode = 9;
    return;
  }
  if (mode === 'timeout' || mode === 'capture-limit') {
    startDurableChild();
    process.on('SIGTERM', () => {});
    if (mode === 'capture-limit') {
      process.stdout.write('x'.repeat(256 * 1024));
    }
    setInterval(() => {}, 1_000);
    return;
  }
  if (mode === 'cleanup-orphan') {
    startDurableChild();
    return;
  }
  if (mode === 'malformed') {
    process.stdout.write('{not-json\n');
    return;
  }
  if (mode === 'early-eof') {
    process.stdout.write(
      `${JSON.stringify({
        type: 'thread.started',
        thread_id: 's16-early-eof',
      })}\n`,
    );
    return;
  }
  process.stdout.write(jsonLines(await successEvents(baseScenario, mode)));
}

if (process.argv[2] === '--child') {
  durableChild();
} else {
  await main();
}
