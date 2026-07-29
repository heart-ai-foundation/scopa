import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';
import {
  validateCapabilityMatrix,
} from '../../../adapter-host/src/index.js';

export const EXPECTED_CLAUDE_CODE_VERSION = '2.1.220';
export const CLAUDE_MCP_SERVER_NAME = 'scopa';
export const CLAUDE_MODEL_REQUEST = 'sonnet';
export const CLAUDE_MODEL_OBSERVED = 'claude-sonnet-5';
export const CLAUDE_INPUT_SETTLE_MS = 1_000;
export const CLAUDE_MAX_TURNS = 12;
export const CLAUDE_MAX_CAPTURE_BYTES = 20 * 1024 * 1024;
export const CLAUDE_MAX_INPUT_BYTES = 1024 * 1024;
export const CLAUDE_MCP_TOOL_PREFIX = 'mcp__scopa__';
export const CLAUDE_MCP_TOOLS = Object.freeze([
  'mcp__scopa__scopa_orientation',
  'mcp__scopa__scopa_read_file',
  'mcp__scopa__scopa_write_file',
  'mcp__scopa__scopa_check',
  'mcp__scopa__scopa_assurance',
  'mcp__scopa__scopa_transcript',
]);
export const CLAUDE_AGENT_INVENTORY = Object.freeze([
  'claude',
  'Explore',
  'general-purpose',
  'Plan',
  'statusline-setup',
]);

export const CLAUDE_FINAL_SCHEMA = Object.freeze({
  type: 'object',
  properties: Object.freeze({
    scenario: Object.freeze({ type: 'string' }),
    status: Object.freeze({
      type: 'string',
      enum: Object.freeze([
        'blocked',
        'satisfied',
      ]),
    }),
    canStop: Object.freeze({ type: 'boolean' }),
    denialObserved: Object.freeze({ type: 'boolean' }),
  }),
  required: Object.freeze([
    'canStop',
    'denialObserved',
    'scenario',
    'status',
  ]),
  additionalProperties: false,
});

const ADAPTER_CLI = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../adapter-host/src/cli.js',
);
const DISALLOWED_BUILT_INS = Object.freeze([
  'Agent',
  'Bash',
  'Edit',
  'Glob',
  'Grep',
  'NotebookEdit',
  'Read',
  'Skill',
  'Task',
  'WebFetch',
  'WebSearch',
  'Write',
]);
const SYSTEM_PROMPT = [
  'You are the live client in a bounded SCOPA conformance fixture.',
  'Use only the explicitly advertised mcp__scopa tools.',
  'Do not infer completion from prose: report canStop exactly as scopa_check returns it.',
  'Always call scopa_transcript after the final scopa_check and before your final JSON object.',
  'Your final response must be only one JSON object with exactly scenario, status, canStop, and denialObserved; status is satisfied or blocked.',
].join(' ');

export function parseClaudeVersion(stdout) {
  const match = String(stdout).trim().match(/^(\d+\.\d+\.\d+) \(Claude Code\)$/);
  if (!match) throw new Error('unrecognized Claude Code version output');
  return match[1];
}

export function createClaudeSession({
  sessionId,
  request,
  model = CLAUDE_MODEL_REQUEST,
}) {
  return {
    schema: 'scopa.adapter-session.v1',
    sessionId,
    request,
    agent: {
      provider: 'anthropic',
      model,
      provenance: 'launcher-declared',
    },
  };
}

function advertised(id, category, mediation, effect, evidence) {
  return {
    id,
    category,
    exposure: 'advertised',
    mediation,
    effect,
    evidence,
  };
}

function disabled(id, category, evidence) {
  return {
    id,
    category,
    exposure: 'disabled',
    mediation: 'disabled',
    effect: null,
    evidence,
  };
}

function uncontrolled(id, category, evidence) {
  return {
    id,
    category,
    exposure: 'native',
    mediation: 'uncontrolled',
    effect: null,
    evidence,
  };
}

export function createClaudeCapabilityMatrix({
  version = EXPECTED_CLAUDE_CODE_VERSION,
}) {
  return validateCapabilityMatrix({
    schema: 'scopa.capability-matrix.v1',
    subject: {
      adapter: 'scopa-mcp@0.1.0',
      client: `claude-code@${version}`,
      transport: 'mcp-stdio',
    },
    capabilities: [
      advertised(
        'scopa.orientation',
        'observe',
        'read-only',
        'OBSERVE',
        'Claude init inventory and scopa_orientation live result',
      ),
      advertised(
        'scopa.read_file',
        'observe',
        'read-only',
        'OBSERVE',
        'Claude init inventory and contained-read live result',
      ),
      advertised(
        'scopa.write_file',
        'mutate',
        'scopa-dispatcher',
        'MUTATE',
        'Claude allowed and denied write transcripts',
      ),
      advertised(
        'scopa.check',
        'observe',
        'scopa-gate',
        'OBSERVE',
        'Claude passing and failing gate transcripts',
      ),
      advertised(
        'scopa.assurance',
        'observe',
        'read-only',
        'OBSERVE',
        'Claude matrix inspection result',
      ),
      advertised(
        'scopa.transcript',
        'observe',
        'read-only',
        'OBSERVE',
        'Claude transcript inspection result',
      ),
      disabled(
        'native.filesystem-write',
        'mutate',
        '--tools contains only mcp__scopa and init inventory contains no built-in write/edit tool',
      ),
      disabled(
        'native.process-execution',
        'execute',
        '--tools contains only mcp__scopa and init inventory contains no Bash/Agent tool',
      ),
      disabled(
        'claude.builtin-agents',
        'execute',
        'Claude init reports pinned built-in agent definitions, but Agent and Task are absent from the model-callable tool inventory',
      ),
      uncontrolled(
        'native.network',
        'network',
        'Claude provider API and CLI telemetry remain outside SCOPA',
      ),
      disabled(
        'native.extensions',
        'extension',
        'empty setting sources, strict MCP config, and no plugin directory',
      ),
      disabled(
        'claude.chrome',
        'network',
        '--no-chrome',
      ),
      disabled(
        'claude.ide',
        'extension',
        'no --ide flag and disposable non-IDE working directory',
      ),
      uncontrolled(
        'claude.session-persistence',
        'mutate',
        '--no-session-persistence suppresses resumable content, but the reviewed Claude client may still write bounded non-resumable metadata under its user project store',
      ),
      disabled(
        'claude.skills-and-slash-commands',
        'extension',
        '--disable-slash-commands and init skills inventory is empty',
      ),
      disabled(
        'claude.user-project-settings',
        'extension',
        '--setting-sources is the empty string',
      ),
      disabled(
        'claude.hooks-and-plugins',
        'extension',
        'empty setting sources and init plugin inventory is empty',
      ),
      uncontrolled(
        'claude.auto-memory-discovery',
        'extension',
        'Claude init reports an auto-memory path even with empty setting sources',
      ),
      uncontrolled(
        'claude.admin-policy',
        'extension',
        'Claude documents managed policy as outside per-run setting-source controls',
      ),
    ],
    assurance: 'partial',
  });
}

export function createClaudeMcpConfig({
  repoRoot,
  sessionFile,
  matrixFile,
  adapterCli = ADAPTER_CLI,
}) {
  return {
    mcpServers: {
      [CLAUDE_MCP_SERVER_NAME]: {
        type: 'stdio',
        command: process.execPath,
        args: [
          path.resolve(adapterCli),
          '--repo',
          path.resolve(repoRoot),
          '--session-file',
          path.resolve(sessionFile),
          '--matrix-file',
          path.resolve(matrixFile),
        ],
      },
    },
  };
}

export function buildClaudeInvocation({
  mcpConfigFile,
  prompt,
  model = CLAUDE_MODEL_REQUEST,
  maxBudgetUsd = '0.20',
  maxTurns = CLAUDE_MAX_TURNS,
}) {
  const args = [
    '-p',
    '--input-format',
    'stream-json',
    '--output-format',
    'stream-json',
    '--verbose',
    '--no-session-persistence',
    '--prompt-suggestions',
    'false',
    '--tools',
    `mcp__${CLAUDE_MCP_SERVER_NAME}`,
    '--setting-sources',
    '',
    '--disable-slash-commands',
    '--no-chrome',
    '--strict-mcp-config',
    '--mcp-config',
    path.resolve(mcpConfigFile),
    '--allowedTools',
    `mcp__${CLAUDE_MCP_SERVER_NAME}`,
    '--disallowedTools',
    DISALLOWED_BUILT_INS.join(','),
    '--permission-mode',
    'dontAsk',
    '--max-budget-usd',
    String(maxBudgetUsd),
    '--max-turns',
    String(maxTurns),
    '--model',
    model,
    '--effort',
    'low',
    '--system-prompt',
    SYSTEM_PROMPT,
  ];
  return Object.freeze({
    command: 'claude',
    args: Object.freeze(args),
    env: Object.freeze({
      DISABLE_AUTOUPDATER: '1',
    }),
    stdin: `${JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    })}\n`,
  });
}

export function validateClaudeInvocation(invocation, {
  expectedMaxTurns = CLAUDE_MAX_TURNS,
} = {}) {
  if (
    !Number.isSafeInteger(expectedMaxTurns) ||
    expectedMaxTurns <= 0
  ) {
    throw new TypeError('expected Claude max turns must be positive');
  }
  const joined = invocation.args.join('\0');
  for (const forbidden of [
    '--add-dir',
    '--allow-dangerously-skip-permissions',
    '--bare',
    '--chrome',
    '--dangerously-skip-permissions',
    '--ide',
    '--plugin-dir',
    '--plugin-url',
    '--safe-mode',
  ]) {
    if (invocation.args.includes(forbidden)) {
      throw new Error(`forbidden Claude flag: ${forbidden}`);
    }
  }
  for (const required of [
    '--disable-slash-commands',
    '--no-chrome',
    '--no-session-persistence',
    '--prompt-suggestions',
    '--strict-mcp-config',
    '--tools',
    '--max-turns',
  ]) {
    if (!invocation.args.includes(required)) {
      throw new Error(`missing Claude flag: ${required}`);
    }
  }
  if (
    !joined.includes('--input-format\0stream-json') ||
    !joined.includes(`--max-turns\0${expectedMaxTurns}`) ||
    !joined.includes('--prompt-suggestions\0false') ||
    !joined.includes(`--tools\0mcp__${CLAUDE_MCP_SERVER_NAME}`) ||
    !joined.includes('--setting-sources\0\0') ||
    !joined.includes(`--allowedTools\0mcp__${CLAUDE_MCP_SERVER_NAME}`)
  ) {
    throw new Error('Claude input, tool, or setting surface is not closed');
  }
  let input;
  try {
    input = JSON.parse(invocation.stdin);
  } catch {
    throw new Error('Claude streaming input is not one JSON value');
  }
  if (
    input?.type !== 'user' ||
    input?.message?.role !== 'user' ||
    input?.message?.content?.length !== 1 ||
    input.message.content[0]?.type !== 'text' ||
    typeof input.message.content[0]?.text !== 'string'
  ) {
    throw new Error('Claude streaming input envelope is invalid');
  }
  return invocation;
}
