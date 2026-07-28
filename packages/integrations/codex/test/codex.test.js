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
  canonicalJson,
} from '../../../enforcement/src/index.js';
import {
  normalizeCodexStream,
} from '../src/normalize.js';
import {
  assertAgentParity,
  compareAgentProofs,
} from '../src/parity.js';
import {
  CODEX_DISABLED_FEATURES,
  CODEX_MCP_TOOLS,
  CODEX_MODEL_REQUEST,
  EXPECTED_CODEX_CLI_VERSION,
  buildCodexInvocation,
  buildCodexMcpInventoryInvocation,
  createCodexCapabilityMatrix,
  createCodexMcpProfile,
  createCodexSession,
  parseCodexVersion,
  validateCodexInvocation,
} from '../src/profile.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const S7_PROOF = JSON.parse(
  await readFile(
    path.join(ROOT, 'evidence/S7/fake-agent-proof.json'),
    'utf8',
  ),
);
const CLAUDE_PROOF = JSON.parse(
  await readFile(
    path.join(ROOT, 'evidence/S8/claude-live-proof.public.json'),
    'utf8',
  ),
);
const CODEX_PROOF = JSON.parse(
  await readFile(
    path.join(ROOT, 'evidence/S9/codex-live-proof.public.json'),
    'utf8',
  ),
);
const ROOT_PACKAGE = JSON.parse(
  await readFile(path.join(ROOT, 'package.json'), 'utf8'),
);

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

function codexTranscript() {
  const transcript = structuredClone(S7_PROOF.transcript);
  const client = {
    name: 'codex-mcp-client',
    version: EXPECTED_CODEX_CLI_VERSION,
  };
  transcript.session.id = 'S9-normalizer-fixture';
  transcript.session.request = 'Normalize a deterministic Codex fixture.';
  transcript.session.client = client;
  transcript.session.agent = {
    provider: 'openai',
    model: CODEX_MODEL_REQUEST,
    provenance: 'launcher-declared',
  };
  transcript.events[0].result.client = structuredClone(client);
  return transcript;
}

function rawFixture() {
  const transcript = codexTranscript();
  const events = [
    {
      type: 'thread.started',
      thread_id: 'codex-thread',
    },
    {
      type: 'turn.started',
    },
  ];
  const transcriptCalls = transcript.events.filter(
    (event) => event.kind === 'tool_call',
  );
  for (const [index, call] of transcriptCalls.entries()) {
    const result = transcript.events.find(
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
        result: mcpResult(result.result),
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
      result: mcpResult(transcript),
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
  return events;
}

function jsonLines(events) {
  return `${events.map((event) => JSON.stringify(event)).join('\n')}\n`;
}

test('Codex profile pins version, read-only execution, features, and one MCP server', () => {
  assert.equal(
    parseCodexVersion('codex-cli 0.145.0\n'),
    EXPECTED_CODEX_CLI_VERSION,
  );
  assert.throws(() => parseCodexVersion('codex 0.145.1'));

  const profile = createCodexMcpProfile({
    repoRoot: '/tmp/scopa-codex/repo',
    sessionFile: '/tmp/scopa-codex/session.json',
    matrixFile: '/tmp/scopa-codex/matrix.json',
    adapterCli: '/tmp/scopa-codex/scopa-mcp.js',
  });
  assert.deepEqual(Object.keys(profile.mcp_servers), ['scopa']);
  assert.deepEqual(
    profile.mcp_servers.scopa.enabled_tools,
    CODEX_MCP_TOOLS,
  );
  assert.equal(profile.mcp_servers.scopa.required, true);
  assert.equal(
    profile.mcp_servers.scopa.tools.scopa_write_file.approval_mode,
    'approve',
  );
  assert.equal(profile.overrides[0], 'mcp_servers={}');

  const invocation = validateCodexInvocation(buildCodexInvocation({
    repoRoot: '/tmp/scopa-codex/repo',
    outputSchemaFile: '/tmp/scopa-codex/final.schema.json',
    profile,
    prompt: 'fixture prompt',
  }));
  assert.equal(invocation.command, 'codex');
  assert.equal(
    invocation.args.includes('--dangerously-bypass-approvals-and-sandbox'),
    false,
  );
  assert.equal(
    invocation.args[invocation.args.indexOf('--sandbox') + 1],
    'read-only',
  );
  assert.equal(invocation.args.includes('--ephemeral'), true);
  assert.equal(invocation.args.includes('--ignore-user-config'), true);
  assert.equal(invocation.args.includes('--ignore-rules'), true);
  assert.equal(invocation.args.includes('fixture prompt'), false);
  assert.match(invocation.stdin, /fixture prompt/);
  assert.equal(invocation.args.at(-1), '-');
  for (const feature of CODEX_DISABLED_FEATURES) {
    assert.equal(
      invocation.args.some(
        (value, index) =>
          value === '--disable' &&
          invocation.args[index + 1] === feature,
      ),
      true,
    );
  }
  const inventory = buildCodexMcpInventoryInvocation({ profile });
  assert.equal(inventory.args.slice(0, 3).join(' '), 'mcp list --json');
  assert.equal(inventory.args.includes('plugins'), true);
});

test('root package publishes the reviewed Codex integration entry', () => {
  assert.equal(
    ROOT_PACKAGE.exports['./codex'],
    './packages/integrations/codex/src/index.js',
  );
  assert.equal(
    ROOT_PACKAGE.files.includes('packages/integrations/*/src/**'),
    true,
  );
});

test('committed live proof binds narrow write approval to a successful SCOPA call', () => {
  const clean = CODEX_PROOF.scenarios.clean;
  assert.equal(
    clean.receipt.invocation.args.includes(
      'mcp_servers.scopa.tools.scopa_write_file.approval_mode="approve"',
    ),
    true,
  );
  assert.equal(
    clean.normalized.toolCalls.find(
      (call) => call.tool === 'scopa_write_file',
    ).isError,
    false,
  );
  assert.deepEqual(
    clean.receipt.mcpInventory.servers.map((server) => server.name),
    ['scopa'],
  );
});

test('Codex matrix is deliberately partial and false full assurance is rejected', () => {
  const matrix = createCodexCapabilityMatrix({});
  assert.equal(matrix.assurance, 'partial');
  assert.equal(matrix.subject.client, 'codex-mcp-client@0.145.0');
  assert.equal(
    matrix.capabilities.find(
      (capability) => capability.id === 'native.filesystem-write',
    ).mediation,
    'uncontrolled',
  );
  assert.equal(
    matrix.capabilities.find(
      (capability) => capability.id === 'native.process-execution',
    ).exposure,
    'disabled',
  );
  const overclaim = structuredClone(matrix);
  overclaim.assurance = 'full';
  assert.throws(
    () => validateCapabilityMatrix(overclaim),
    /does not match computed partial/,
  );
});

test('Codex session identity remains launcher-declared', () => {
  assert.deepEqual(
    createCodexSession({
      sessionId: 'S9-test',
      request: 'test request',
    }),
    {
      schema: 'scopa.adapter-session.v1',
      sessionId: 'S9-test',
      request: 'test request',
      agent: {
        provider: 'openai',
        model: 'gpt-5.4',
        provenance: 'launcher-declared',
      },
    },
  );
});

test('normalizer binds Codex MCP events to the SCOPA transcript and terminal state', () => {
  const normalized = normalizeCodexStream(jsonLines(rawFixture()));
  assert.equal(normalized.schema, 'scopa.codex-run.v1');
  assert.equal(normalized.initialization.enabledTools.length, 6);
  assert.equal(normalized.initialization.mcpClient.name, 'codex-mcp-client');
  assert.equal(normalized.toolCalls.length, 6);
  assert.equal(normalized.scopaTranscript.terminal.canStop, true);
  assert.equal(normalized.final.canStop, true);
});

test('normalizer rejects native tools, hidden MCP, changed results, false-green, and unknown errors', () => {
  const native = rawFixture();
  native.splice(-2, 0, {
    type: 'item.completed',
    item: {
      id: 'native',
      type: 'command_execution',
      command: 'touch bypass',
      status: 'completed',
    },
  });
  assert.throws(
    () => normalizeCodexStream(jsonLines(native)),
    /unapproved Codex item type/,
  );

  const hiddenMcp = rawFixture();
  hiddenMcp[2].item.server = 'github';
  assert.throws(
    () => normalizeCodexStream(jsonLines(hiddenMcp)),
    /unknown or malformed Codex MCP call/,
  );

  const changed = rawFixture();
  changed[3].item.result.structured_content.content = 'changed';
  assert.throws(
    () => normalizeCodexStream(jsonLines(changed)),
    /text and structured results differ/,
  );

  const falseGreen = rawFixture();
  falseGreen.at(-2).item.text = JSON.stringify({
    scenario: 'fixture',
    status: 'blocked',
    canStop: false,
    denialObserved: true,
  });
  assert.throws(
    () => normalizeCodexStream(jsonLines(falseGreen)),
    /conflicts with SCOPA terminal state/,
  );

  const unknownError = rawFixture();
  unknownError.splice(1, 0, {
    type: 'item.completed',
    item: {
      id: 'warning',
      type: 'error',
      message: 'unreviewed warning',
    },
  });
  assert.throws(
    () => normalizeCodexStream(jsonLines(unknownError)),
    /unknown Codex error item/,
  );

  const malformedReasoning = rawFixture();
  malformedReasoning.splice(1, 0, {
    type: 'item.completed',
    item: {
      id: 'reasoning',
      type: 'reasoning',
      text: 'telemetry only',
      command: 'unreviewed structured field',
    },
  });
  assert.throws(
    () => normalizeCodexStream(jsonLines(malformedReasoning)),
    /malformed Codex reasoning item/,
  );
});

test('parity report passes the four shared outcomes and exposes an injected gap', () => {
  const codexProof = {
    schema: 'scopa.codex-live-proof.v1',
    capabilityMatrix: createCodexCapabilityMatrix({}),
    scenarios: structuredClone(CLAUDE_PROOF.scenarios),
    summary: {
      requestedModel: CODEX_MODEL_REQUEST,
    },
  };
  for (const scenario of Object.values(codexProof.scenarios)) {
    scenario.normalized.initialization = {
      enabledTools: [...CODEX_MCP_TOOLS],
      mcpClient: {
        name: 'codex-mcp-client',
        version: EXPECTED_CODEX_CLI_VERSION,
      },
    };
  }
  const report = assertAgentParity(compareAgentProofs({
    claudeProof: CLAUDE_PROOF,
    codexProof,
  }));
  assert.equal(report.parity, 'pass');
  assert.equal(
    report.providerDifferences.toolNames.sameScopaTools,
    true,
  );

  const gap = structuredClone(codexProof);
  gap.scenarios.falseGreen.normalized.final.canStop = true;
  const gapReport = compareAgentProofs({
    claudeProof: CLAUDE_PROOF,
    codexProof: gap,
  });
  assert.equal(gapReport.parity, 'gap');
  assert.deepEqual(
    gapReport.gaps.map((entry) => entry.behavior),
    ['falseGreenRefused'],
  );
  assert.throws(() => assertAgentParity(gapReport));
});
