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
  normalizeCodexStream,
} from './normalize.js';
import {
  CODEX_FINAL_SCHEMA,
  CODEX_MODEL_REQUEST,
  EXPECTED_CODEX_CLI_VERSION,
  buildCodexInvocation,
  buildCodexMcpInventoryInvocation,
  createCodexMcpProfile,
  parseCodexVersion,
  validateCodexInvocation,
} from './profile.js';

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_CAPTURE_BYTES = 20 * 1024 * 1024;
const REMOVED_ENVIRONMENT_NAMES = Object.freeze([
  'CODEX_API_KEY',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'NODE_OPTIONS',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'OPENAI_ORG_ID',
  'OPENAI_PROJECT_ID',
  'OPENAI_PROXY_URL',
  'ALL_PROXY',
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
  return parseCodexVersion(result.stdout);
}

async function inventory(invocation) {
  const result = await execFileAsync(invocation.command, invocation.args, {
    encoding: 'utf8',
    env: controlledEnvironment({}),
    maxBuffer: MAX_CAPTURE_BYTES,
  });
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Codex MCP inventory is not JSON: ${error.message}`);
  }
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 1 ||
    parsed[0]?.name !== 'scopa' ||
    parsed[0]?.enabled !== true ||
    parsed[0]?.transport?.type !== 'stdio'
  ) {
    const error = new Error('Codex MCP inventory is not exactly one SCOPA server');
    error.details = {
      inventory: parsed,
      stderr: result.stderr,
    };
    throw error;
  }
  return {
    servers: parsed,
    stderr: result.stderr,
  };
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
  child.stdin.end(invocation.stdin);
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
  }, timeoutMs);
  const [exitCode, signal] = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (...values) => resolve(values));
  });
  clearTimeout(timeout);
  if (timedOut) throw new Error(`Codex timed out after ${timeoutMs} ms`);
  if (exceeded) throw new Error('Codex output exceeded capture limit');
  return {
    exitCode,
    signal,
    stdout,
    stderr,
  };
}

export async function runCodexSession({
  repoRoot,
  session,
  capabilityMatrix,
  prompt,
  model = CODEX_MODEL_REQUEST,
  adapterCli,
  codexCommand = 'codex',
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const version = await installedVersion(codexCommand);
  if (version !== EXPECTED_CODEX_CLI_VERSION) {
    throw new Error(
      `Codex CLI version drift: expected ${EXPECTED_CODEX_CLI_VERSION}, received ${version}`,
    );
  }
  const controlRoot = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-codex-control-'),
  );
  try {
    const sessionFile = path.join(controlRoot, 'session.json');
    const matrixFile = path.join(controlRoot, 'capability-matrix.json');
    const outputSchemaFile = path.join(controlRoot, 'final.schema.json');
    await writeFile(sessionFile, canonicalJsonPretty(session), {
      mode: 0o600,
    });
    await writeFile(matrixFile, canonicalJsonPretty(capabilityMatrix), {
      mode: 0o600,
    });
    await writeFile(outputSchemaFile, canonicalJsonPretty(CODEX_FINAL_SCHEMA), {
      mode: 0o600,
    });
    const profile = createCodexMcpProfile({
      repoRoot,
      sessionFile,
      matrixFile,
      adapterCli,
    });
    const mcpInventory = await inventory(
      buildCodexMcpInventoryInvocation({ profile }),
    );
    const built = buildCodexInvocation({
      repoRoot,
      outputSchemaFile,
      profile,
      prompt,
      model,
    });
    const invocation = validateCodexInvocation({
      command: codexCommand,
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
        `Codex exited ${execution.exitCode ?? execution.signal}`,
      );
      error.details = {
        ...execution,
        invocation: {
          command: invocation.command,
          args: [...invocation.args],
        },
      };
      throw error;
    }
    let normalized;
    try {
      normalized = normalizeCodexStream(execution.stdout);
    } catch (error) {
      error.details = {
        ...(error.details ?? {}),
        stdout: execution.stdout,
        stderr: execution.stderr,
      };
      throw error;
    }
    return {
      schema: 'scopa.codex-session-result.v1',
      receipt: {
        codexCliVersion: version,
        requestedModel: model,
        invocation: {
          command: invocation.command,
          args: [...invocation.args],
        },
        mcpProfile: {
          mcp_servers: structuredClone(profile.mcp_servers),
        },
        mcpInventory,
        limits: {
          timeoutMs,
          maxCaptureBytes: MAX_CAPTURE_BYTES,
        },
        environment: {
          set: structuredClone(invocation.env),
          removed: [...REMOVED_ENVIRONMENT_NAMES],
        },
        flags: [
          'exec',
          'strict-config',
          'ignore-user-config',
          'ignore-rules',
          'ephemeral',
          'read-only-sandbox',
          'never-approve',
          'jsonl',
          'fixed-output-schema',
          'required-scopa-mcp',
          'scopa-tool-allowlist',
          'native-feature-denylist',
          'web-search-disabled',
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
