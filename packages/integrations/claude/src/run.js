import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  canonicalJsonPretty,
} from '../../../enforcement/src/index.js';
import {
  validateCapabilityMatrix,
} from '../../../adapter-host/src/index.js';
import {
  bindNormalizedCompletion,
  createControlledEnvironment,
  createLiveReceipt,
  replaceTerminalState,
  superviseProcess,
  validateInstalledArtifactIdentity,
} from '../../../live-run/src/index.js';
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

const DEFAULT_TIMEOUT_MS = 120_000;
const VERSION_TIMEOUT_MS = 10_000;
const VERSION_CAPTURE_BYTES = 64 * 1024;
const MAX_CAPTURE_BYTES = 20 * 1024 * 1024;
const DEFAULT_TERMINATE_GRACE_MS = 500;
const DEFAULT_CLEANUP_WAIT_MS = 1_000;
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

function result({
  terminal,
  receipt,
  execution,
  normalized = null,
  rawStream = [],
}) {
  return {
    schema: 'scopa.claude-session-result.v1',
    terminal,
    receipt,
    rawStream,
    normalized,
    stderr: execution.stderr,
    privateCapture: {
      stdout: execution.stdout,
      stderr: execution.stderr,
    },
  };
}

function receipt({
  installedArtifact,
  observedVersion,
  model,
  profile,
  capabilityMatrix,
  scenario,
  limits,
  environmentPolicy,
  invocation,
}) {
  return createLiveReceipt({
    artifact: installedArtifact,
    clientName: 'claude-code',
    expectedVersion: EXPECTED_CLAUDE_CODE_VERSION,
    observedVersion,
    requestedModel: model,
    profileName: 'claude-code-headless-v1',
    profile,
    capabilityMatrix,
    scenario,
    limits,
    environmentPolicy,
    invocation,
  });
}

async function installedVersion({
  command,
  cwd,
  terminateGraceMs,
  cleanupWaitMs,
}) {
  const controlled = createControlledEnvironment({
    additions: {},
    removedNames: REMOVED_ENVIRONMENT_NAMES,
  });
  const invocation = {
    command,
    args: ['--version'],
    stdin: '',
  };
  const execution = await superviseProcess({
    ...invocation,
    cwd,
    env: controlled.environment,
    timeoutMs: VERSION_TIMEOUT_MS,
    maxCaptureBytes: VERSION_CAPTURE_BYTES,
    terminateGraceMs,
    cleanupWaitMs,
  });
  if (execution.terminal.state !== 'succeeded') {
    return {
      execution,
      invocation,
      environmentPolicy: controlled.policy,
      version: null,
    };
  }
  let version;
  try {
    version = parseClaudeVersion(execution.stdout);
  } catch {
    return {
      execution: {
        ...execution,
        terminal: replaceTerminalState(execution.terminal, {
          state: 'version-drift',
          reason: 'client-version-mismatch',
        }),
      },
      invocation,
      environmentPolicy: controlled.policy,
      version: null,
    };
  }
  if (version !== EXPECTED_CLAUDE_CODE_VERSION) {
    return {
      execution: {
        ...execution,
        terminal: replaceTerminalState(execution.terminal, {
          state: 'version-drift',
          reason: 'client-version-mismatch',
        }),
      },
      invocation,
      environmentPolicy: controlled.policy,
      version,
    };
  }
  return {
    execution,
    invocation,
    environmentPolicy: controlled.policy,
    version,
  };
}

export async function runClaudeSession({
  repoRoot,
  session,
  capabilityMatrix,
  prompt,
  installedArtifact,
  scenario = {
    id: session?.sessionId,
    version: '1',
  },
  model = CLAUDE_MODEL_REQUEST,
  maxBudgetUsd = '0.20',
  adapterCli,
  claudeCommand = 'claude',
  timeoutMs = DEFAULT_TIMEOUT_MS,
  inputSettleMs = CLAUDE_INPUT_SETTLE_MS,
  terminateGraceMs = DEFAULT_TERMINATE_GRACE_MS,
  cleanupWaitMs = DEFAULT_CLEANUP_WAIT_MS,
}) {
  validateInstalledArtifactIdentity(installedArtifact);
  validateCapabilityMatrix(capabilityMatrix);
  const root = path.resolve(repoRoot);
  const limits = {
    timeoutMs,
    maxCaptureBytes: MAX_CAPTURE_BYTES,
    inputSettleMs,
    terminateGraceMs,
    cleanupWaitMs,
    maxTurns: 12,
    maxBudgetUsd: String(maxBudgetUsd),
  };
  const versionProbe = await installedVersion({
    command: claudeCommand,
    cwd: root,
    terminateGraceMs,
    cleanupWaitMs,
  });
  if (versionProbe.execution.terminal.state !== 'succeeded') {
    return result({
      terminal: versionProbe.execution.terminal,
      receipt: receipt({
        installedArtifact,
        observedVersion: versionProbe.version,
        model,
        profile: {
          kind: 'claude-version-probe-v1',
        },
        capabilityMatrix,
        scenario,
        limits,
        environmentPolicy: versionProbe.environmentPolicy,
        invocation: versionProbe.invocation,
      }),
      execution: versionProbe.execution,
    });
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
      repoRoot: root,
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
    const controlled = createControlledEnvironment({
      additions: invocation.env,
      removedNames: REMOVED_ENVIRONMENT_NAMES,
    });
    const liveReceipt = receipt({
      installedArtifact,
      observedVersion: versionProbe.version,
      model,
      profile: {
        mcpConfig,
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
      capabilityMatrix,
      scenario,
      limits,
      environmentPolicy: controlled.policy,
      invocation,
    });
    const execution = await superviseProcess({
      command: invocation.command,
      args: invocation.args,
      cwd: root,
      env: controlled.environment,
      stdin: invocation.stdin,
      inputDelayMs: inputSettleMs,
      timeoutMs,
      maxCaptureBytes: MAX_CAPTURE_BYTES,
      terminateGraceMs,
      cleanupWaitMs,
    });
    if (execution.terminal.state !== 'succeeded') {
      return result({
        terminal: execution.terminal,
        receipt: liveReceipt,
        execution,
      });
    }

    let normalized;
    try {
      normalized = normalizeClaudeStream(execution.stdout);
    } catch {
      return result({
        terminal: replaceTerminalState(execution.terminal, {
          state: 'normalization-failed',
          reason: 'stream-normalization-error',
        }),
        receipt: liveReceipt,
        execution,
      });
    }
    const terminal = bindNormalizedCompletion(
      execution.terminal,
      normalized.final.canStop,
    );
    return result({
      terminal,
      receipt: liveReceipt,
      execution,
      rawStream: execution.stdout
        .split(/\r?\n/)
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line)),
      normalized,
    });
  } finally {
    await rm(controlRoot, {
      recursive: true,
      force: true,
    });
  }
}
