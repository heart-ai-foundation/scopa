import {
  execFile,
  spawn,
} from 'node:child_process';
import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  promisify,
} from 'node:util';
import {
  canonicalJsonPretty,
} from '../../../enforcement/src/index.js';
import {
  normalizeClaudeStream,
} from './normalize.js';
import {
  EXPECTED_CLAUDE_CODE_VERSION,
  CLAUDE_INPUT_SETTLE_MS,
  CLAUDE_MODEL_REQUEST,
  buildClaudeInvocation,
  createClaudeMcpConfig,
  parseClaudeVersion,
  validateClaudeInvocation,
} from './profile.js';

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_CAPTURE_BYTES = 20 * 1024 * 1024;
const REMOVED_ENVIRONMENT_NAMES = Object.freeze([
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'CLAUDE_CODE_USE_BEDROCK',
  'CLAUDE_CODE_USE_FOUNDRY',
  'CLAUDE_CODE_USE_VERTEX',
  'CLAUDE_CONFIG_DIR',
  'NODE_OPTIONS',
]);

function controlledEnvironment(additions) {
  const env = {
    ...process.env,
    ...additions,
  };
  for (const name of REMOVED_ENVIRONMENT_NAMES) {
    delete env[name];
  }
  return env;
}

async function installedVersion(command) {
  const result = await execFileAsync(command, ['--version'], {
    encoding: 'utf8',
    env: controlledEnvironment({}),
  });
  return parseClaudeVersion(result.stdout);
}

async function execute(invocation, {
  cwd,
  timeoutMs,
}) {
  const child = spawn(invocation.command, invocation.args, {
    cwd,
    env: controlledEnvironment(invocation.env),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stdin.on('error', () => {});
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  let stdout = '';
  let stderr = '';
  let exceeded = false;
  const capture = (kind, chunk) => {
    if (kind === 'stdout') stdout += chunk;
    else stderr += chunk;
    if (
      Buffer.byteLength(stdout, 'utf8') +
        Buffer.byteLength(stderr, 'utf8') >
      MAX_CAPTURE_BYTES
    ) {
      exceeded = true;
      child.kill('SIGTERM');
    }
  };
  child.stdout.on('data', (chunk) => capture('stdout', chunk));
  child.stderr.on('data', (chunk) => capture('stderr', chunk));
  const inputTimer = setTimeout(() => {
    if (!child.stdin.destroyed) child.stdin.end(invocation.stdin);
  }, CLAUDE_INPUT_SETTLE_MS);
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
  }, timeoutMs);
  const [exitCode, signal] = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (...values) => resolve(values));
  });
  clearTimeout(inputTimer);
  clearTimeout(timeout);
  if (timedOut) throw new Error(`Claude timed out after ${timeoutMs} ms`);
  if (exceeded) throw new Error('Claude output exceeded capture limit');
  return {
    exitCode,
    signal,
    stdout,
    stderr,
  };
}

export async function runClaudeSession({
  repoRoot,
  session,
  capabilityMatrix,
  prompt,
  model = CLAUDE_MODEL_REQUEST,
  maxBudgetUsd = '0.20',
  adapterCli,
  claudeCommand = 'claude',
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const version = await installedVersion(claudeCommand);
  if (version !== EXPECTED_CLAUDE_CODE_VERSION) {
    throw new Error(
      `Claude Code version drift: expected ${EXPECTED_CLAUDE_CODE_VERSION}, received ${version}`,
    );
  }
  const controlRoot = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-claude-control-'),
  );
  try {
    const sessionFile = path.join(controlRoot, 'session.json');
    const matrixFile = path.join(controlRoot, 'capability-matrix.json');
    const mcpConfigFile = path.join(controlRoot, 'mcp.json');
    await writeFile(sessionFile, canonicalJsonPretty(session), {
      mode: 0o600,
    });
    await writeFile(matrixFile, canonicalJsonPretty(capabilityMatrix), {
      mode: 0o600,
    });
    const mcpConfig = createClaudeMcpConfig({
      repoRoot,
      sessionFile,
      matrixFile,
      adapterCli,
    });
    await writeFile(mcpConfigFile, canonicalJsonPretty(mcpConfig), {
      mode: 0o600,
    });
    const built = buildClaudeInvocation({
      mcpConfigFile,
      prompt,
      model,
      maxBudgetUsd,
    });
    const invocation = validateClaudeInvocation({
      command: claudeCommand,
      args: built.args,
      env: built.env,
      stdin: built.stdin,
    });
    const execution = await execute(invocation, {
      cwd: path.resolve(repoRoot),
      timeoutMs,
    });
    if (execution.exitCode !== 0) {
      const error = new Error(
        `Claude exited ${execution.exitCode ?? execution.signal}`,
      );
      error.details = execution;
      throw error;
    }
    let normalized;
    try {
      normalized = normalizeClaudeStream(execution.stdout);
    } catch (error) {
      error.details = {
        ...(error.details ?? {}),
        stdout: execution.stdout,
        stderr: execution.stderr,
      };
      throw error;
    }
    return {
      schema: 'scopa.claude-session-result.v1',
      receipt: {
        claudeCodeVersion: version,
        requestedModel: model,
        maxBudgetUsd: String(maxBudgetUsd),
        invocation: {
          command: invocation.command,
          args: [...invocation.args],
        },
        mcpConfig,
        limits: {
          timeoutMs,
          maxCaptureBytes: MAX_CAPTURE_BYTES,
          inputSettleMs: CLAUDE_INPUT_SETTLE_MS,
          maxTurns: 12,
        },
        environment: {
          set: structuredClone(invocation.env),
          removed: [...REMOVED_ENVIRONMENT_NAMES],
        },
        flags: [
          'print',
          'stream-json',
          'delayed-stream-input',
          'verbose',
          'no-session-persistence',
          'scopa-only-tool-namespace',
          'empty-setting-sources',
          'disable-slash-commands',
          'no-chrome',
          'strict-mcp-config',
          'scopa-mcp-only',
          'dontAsk',
          'max-turns-12',
          'fixed-system-prompt',
        ],
      },
      rawStream: execution.stdout
        .split(/\r?\n/)
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line)),
      normalized,
      stderr: execution.stderr,
    };
  } finally {
    await rm(controlRoot, { recursive: true, force: true });
  }
}
