import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  canonicalJsonPretty,
  jsonHash,
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
  ClaudeTerminalError,
  normalizeClaudeStream,
} from './normalize.js';
import {
  EXPECTED_CLAUDE_CODE_VERSION,
  CLAUDE_INPUT_SETTLE_MS,
  CLAUDE_MODEL_REQUEST,
  buildClaudeInvocation,
  createClaudeCapabilityMatrix,
  createClaudeMcpConfig,
  parseClaudeVersion,
  validateClaudeInvocation,
} from './profile.js';
import {
  assertClaudeRunWithinPolicy,
  parseClaudeAuthBoundary,
  validateClaudeLivePolicy,
} from './live-policy.js';

const DEFAULT_TIMEOUT_MS = 120_000;
const VERSION_TIMEOUT_MS = 10_000;
const VERSION_CAPTURE_BYTES = 64 * 1024;
const DEFAULT_TERMINATE_GRACE_MS = 500;
const DEFAULT_CLEANUP_WAIT_MS = 1_000;
const INHERITED_ENVIRONMENT_NAMES = Object.freeze([
  'HOME',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'LANG',
  'LC_ALL',
  'LOGNAME',
  'NO_PROXY',
  'PATH',
  'SCOPA_S15_MODE',
  'SHELL',
  'SSL_CERT_DIR',
  'SSL_CERT_FILE',
  'TMPDIR',
  'USER',
  'XDG_CACHE_HOME',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
  'XDG_STATE_HOME',
]);
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

function claudeBaseEnvironment() {
  return Object.fromEntries(
    INHERITED_ENVIRONMENT_NAMES
      .filter((name) => typeof process.env[name] === 'string')
      .map((name) => [
        name,
        process.env[name],
      ]),
  );
}

function controlledClaudeEnvironment(additions) {
  return createControlledEnvironment({
    additions,
    removedNames: REMOVED_ENVIRONMENT_NAMES,
    baseEnvironment: claudeBaseEnvironment(),
    inheritance: 'explicit-allowlist',
  });
}

function result({
  terminal,
  receipt,
  execution,
  normalized = null,
  rawStream = [],
  authBoundary = null,
  privateAuthIdentitySha256 = null,
}) {
  return {
    schema: 'scopa.claude-session-result.v1',
    terminal,
    receipt,
    authBoundary,
    rawStream,
    normalized,
    stderr: execution.stderr,
    privateCapture: {
      stdout: execution.stdout,
      stderr: execution.stderr,
      authIdentitySha256: privateAuthIdentitySha256,
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
  const controlled = controlledClaudeEnvironment({});
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

async function installedAuthBoundary({
  command,
  cwd,
  livePolicy,
  terminateGraceMs,
  cleanupWaitMs,
}) {
  const controlled = controlledClaudeEnvironment({});
  const invocation = {
    command,
    args: [
      'auth',
      'status',
    ],
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
      boundary: null,
      execution,
      environmentPolicy: controlled.policy,
      invocation,
      privateIdentitySha256: null,
    };
  }
  try {
    const parsed = parseClaudeAuthBoundary(execution.stdout, livePolicy);
    return {
      ...parsed,
      execution,
      environmentPolicy: controlled.policy,
      invocation,
    };
  } catch {
    return {
      boundary: null,
      execution: {
        ...execution,
        terminal: replaceTerminalState(execution.terminal, {
          state: 'provider-refused',
          reason: 'authentication-boundary-mismatch',
        }),
      },
      environmentPolicy: controlled.policy,
      invocation,
      privateIdentitySha256: null,
    };
  }
}

export async function runClaudeSession({
  repoRoot,
  session,
  capabilityMatrix,
  prompt,
  installedArtifact,
  livePolicy,
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
  if (
    jsonHash(capabilityMatrix) !==
    jsonHash(createClaudeCapabilityMatrix({}))
  ) {
    throw new TypeError(
      'Claude capability matrix differs from the reviewed profile',
    );
  }
  const policy = validateClaudeLivePolicy(livePolicy);
  const root = path.resolve(repoRoot);
  const maxTurns = policy.limits.maxTurnsPerRun;
  const maxCaptureBytes = policy.limits.maxCaptureBytes;
  const limits = {
    timeoutMs,
    maxCaptureBytes,
    inputSettleMs,
    terminateGraceMs,
    cleanupWaitMs,
    maxTurns,
    maxBudgetUsd: String(maxBudgetUsd),
    livePolicySha256: policy.policySha256,
    maxProviderInvocations: policy.limits.maxProviderInvocations,
    maxCampaignBudgetUsd: policy.limits.maxCampaignBudgetUsd,
    maxPrivateEvidenceBytes: policy.evidence.maxPrivateBytesPerRun,
  };
  assertClaudeRunWithinPolicy(policy, {
    model,
    maxBudgetUsd,
    maxTurns,
    timeoutMs,
    maxCaptureBytes,
    inputBytes: Buffer.byteLength(String(prompt), 'utf8'),
  });
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

  const authProbe = await installedAuthBoundary({
    command: claudeCommand,
    cwd: root,
    livePolicy: policy,
    terminateGraceMs,
    cleanupWaitMs,
  });
  if (authProbe.execution.terminal.state !== 'succeeded') {
    return result({
      terminal: authProbe.execution.terminal,
      receipt: receipt({
        installedArtifact,
        observedVersion: versionProbe.version,
        model,
        profile: {
          kind: 'claude-auth-boundary-probe-v1',
          livePolicySha256: policy.policySha256,
        },
        capabilityMatrix,
        scenario,
        limits,
        environmentPolicy: authProbe.environmentPolicy,
        invocation: authProbe.invocation,
      }),
      execution: authProbe.execution,
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
      maxTurns,
    });
    const invocation = validateClaudeInvocation({
      command: claudeCommand,
      args: built.args,
      env: built.env,
      stdin: built.stdin,
    }, {
      expectedMaxTurns: maxTurns,
    });
    assertClaudeRunWithinPolicy(policy, {
      model,
      maxBudgetUsd,
      maxTurns,
      timeoutMs,
      maxCaptureBytes,
      inputBytes: Buffer.byteLength(invocation.stdin, 'utf8'),
    });
    const controlled = controlledClaudeEnvironment(invocation.env);
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
          `max-turns-${maxTurns}`,
          'fixed-system-prompt',
          'closed-structured-output',
          'prompt-suggestions-disabled',
        ],
        authBoundary: authProbe.boundary,
        livePolicySha256: policy.policySha256,
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
      maxCaptureBytes,
      terminateGraceMs,
      cleanupWaitMs,
    });
    if (execution.terminal.state !== 'succeeded') {
      if (
        execution.terminal.state === 'exited' &&
        execution.stdout.length > 0
      ) {
        try {
          normalizeClaudeStream(execution.stdout);
        } catch (error) {
          if (error instanceof ClaudeTerminalError) {
            return result({
              terminal: replaceTerminalState(execution.terminal, {
                state: error.state,
                reason: error.reason,
              }),
              receipt: liveReceipt,
              execution,
              authBoundary: authProbe.boundary,
              privateAuthIdentitySha256:
                authProbe.privateIdentitySha256,
            });
          }
        }
      }
      return result({
        terminal: execution.terminal,
        receipt: liveReceipt,
        execution,
        authBoundary: authProbe.boundary,
        privateAuthIdentitySha256: authProbe.privateIdentitySha256,
      });
    }

    let normalized;
    try {
      normalized = normalizeClaudeStream(execution.stdout);
    } catch (error) {
      if (error instanceof ClaudeTerminalError) {
        return result({
          terminal: replaceTerminalState(execution.terminal, {
            state: error.state,
            reason: error.reason,
          }),
          receipt: liveReceipt,
          execution,
          authBoundary: authProbe.boundary,
          privateAuthIdentitySha256: authProbe.privateIdentitySha256,
        });
      }
      return result({
        terminal: replaceTerminalState(execution.terminal, {
          state: 'normalization-failed',
          reason: 'stream-normalization-error',
        }),
        receipt: liveReceipt,
        execution,
        authBoundary: authProbe.boundary,
        privateAuthIdentitySha256: authProbe.privateIdentitySha256,
      });
    }
    if (normalized.final.scenario !== scenario.id) {
      return result({
        terminal: replaceTerminalState(execution.terminal, {
          state: 'normalization-failed',
          reason: 'stream-normalization-error',
        }),
        receipt: liveReceipt,
        execution,
        authBoundary: authProbe.boundary,
        privateAuthIdentitySha256: authProbe.privateIdentitySha256,
      });
    }
    if (normalized.result.turns > maxTurns) {
      return result({
        terminal: replaceTerminalState(execution.terminal, {
          state: 'turn-limit',
          reason: 'provider-turn-limit-exceeded',
        }),
        receipt: liveReceipt,
        execution,
        authBoundary: authProbe.boundary,
        privateAuthIdentitySha256: authProbe.privateIdentitySha256,
      });
    }
    if (
      normalized.result.costUsd >
      Number(policy.limits.maxBudgetUsdPerRun) + Number.EPSILON
    ) {
      return result({
        terminal: replaceTerminalState(execution.terminal, {
          state: 'budget-exhausted',
          reason: 'provider-budget-exhausted',
        }),
        receipt: liveReceipt,
        execution,
        authBoundary: authProbe.boundary,
        privateAuthIdentitySha256: authProbe.privateIdentitySha256,
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
      authBoundary: authProbe.boundary,
      privateAuthIdentitySha256: authProbe.privateIdentitySha256,
    });
  } finally {
    await rm(controlRoot, {
      recursive: true,
      force: true,
    });
  }
}
