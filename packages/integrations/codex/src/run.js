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

const DEFAULT_TIMEOUT_MS = 180_000;
const PREFLIGHT_TIMEOUT_MS = 10_000;
const PREFLIGHT_CAPTURE_BYTES = 256 * 1024;
const MAX_CAPTURE_BYTES = 20 * 1024 * 1024;
const DEFAULT_TERMINATE_GRACE_MS = 500;
const DEFAULT_CLEANUP_WAIT_MS = 1_000;
const REMOVED_ENVIRONMENT_NAMES = Object.freeze([
  'ALL_PROXY',
  'CODEX_API_KEY',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'NODE_OPTIONS',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'OPENAI_ORG_ID',
  'OPENAI_PROJECT_ID',
  'OPENAI_PROXY_URL',
]);

function result({
  terminal,
  receipt,
  execution,
  inventory = null,
  normalized = null,
  rawStream = [],
}) {
  return {
    schema: 'scopa.codex-session-result.v1',
    terminal,
    receipt,
    inventory,
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
    clientName: 'codex-cli',
    expectedVersion: EXPECTED_CODEX_CLI_VERSION,
    observedVersion,
    requestedModel: model,
    profileName: 'codex-headless-v1',
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
    timeoutMs: PREFLIGHT_TIMEOUT_MS,
    maxCaptureBytes: PREFLIGHT_CAPTURE_BYTES,
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
    version = parseCodexVersion(execution.stdout);
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
  if (version !== EXPECTED_CODEX_CLI_VERSION) {
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

async function inventory({
  command,
  profile,
  cwd,
  terminateGraceMs,
  cleanupWaitMs,
}) {
  const built = buildCodexMcpInventoryInvocation({
    profile,
  });
  const invocation = {
    command,
    args: [...built.args],
    stdin: '',
  };
  const controlled = createControlledEnvironment({
    additions: {},
    removedNames: REMOVED_ENVIRONMENT_NAMES,
  });
  const execution = await superviseProcess({
    ...invocation,
    cwd,
    env: controlled.environment,
    timeoutMs: PREFLIGHT_TIMEOUT_MS,
    maxCaptureBytes: PREFLIGHT_CAPTURE_BYTES,
    terminateGraceMs,
    cleanupWaitMs,
  });
  if (execution.terminal.state !== 'succeeded') {
    return {
      execution,
      invocation,
      environmentPolicy: controlled.policy,
      servers: null,
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(execution.stdout);
  } catch {
    return {
      execution: {
        ...execution,
        terminal: replaceTerminalState(execution.terminal, {
          state: 'inventory-drift',
          reason: 'capability-inventory-mismatch',
        }),
      },
      invocation,
      environmentPolicy: controlled.policy,
      servers: null,
    };
  }
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 1 ||
    parsed[0]?.name !== 'scopa' ||
    parsed[0]?.enabled !== true ||
    parsed[0]?.transport?.type !== 'stdio'
  ) {
    return {
      execution: {
        ...execution,
        terminal: replaceTerminalState(execution.terminal, {
          state: 'inventory-drift',
          reason: 'capability-inventory-mismatch',
        }),
      },
      invocation,
      environmentPolicy: controlled.policy,
      servers: parsed,
    };
  }
  return {
    execution,
    invocation,
    environmentPolicy: controlled.policy,
    servers: parsed,
  };
}

export async function runCodexSession({
  repoRoot,
  session,
  capabilityMatrix,
  prompt,
  installedArtifact,
  scenario = {
    id: session?.sessionId,
    version: '1',
  },
  model = CODEX_MODEL_REQUEST,
  adapterCli,
  codexCommand = 'codex',
  timeoutMs = DEFAULT_TIMEOUT_MS,
  terminateGraceMs = DEFAULT_TERMINATE_GRACE_MS,
  cleanupWaitMs = DEFAULT_CLEANUP_WAIT_MS,
}) {
  validateInstalledArtifactIdentity(installedArtifact);
  validateCapabilityMatrix(capabilityMatrix);
  const root = path.resolve(repoRoot);
  const limits = {
    timeoutMs,
    maxCaptureBytes: MAX_CAPTURE_BYTES,
    terminateGraceMs,
    cleanupWaitMs,
  };
  const versionProbe = await installedVersion({
    command: codexCommand,
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
          kind: 'codex-version-probe-v1',
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
      repoRoot: root,
      sessionFile,
      matrixFile,
      adapterCli,
    });
    const inventoryProbe = await inventory({
      command: codexCommand,
      profile,
      cwd: root,
      terminateGraceMs,
      cleanupWaitMs,
    });
    if (inventoryProbe.execution.terminal.state !== 'succeeded') {
      return result({
        terminal: inventoryProbe.execution.terminal,
        receipt: receipt({
          installedArtifact,
          observedVersion: versionProbe.version,
          model,
          profile: {
            mcpProfile: profile,
            inventorySha256: inventoryProbe.servers === null
              ? null
              : jsonHash(inventoryProbe.servers),
          },
          capabilityMatrix,
          scenario,
          limits,
          environmentPolicy: inventoryProbe.environmentPolicy,
          invocation: inventoryProbe.invocation,
        }),
        execution: inventoryProbe.execution,
        inventory: inventoryProbe.servers,
      });
    }

    const built = buildCodexInvocation({
      repoRoot: root,
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
    const controlled = createControlledEnvironment({
      additions: invocation.env,
      removedNames: REMOVED_ENVIRONMENT_NAMES,
    });
    const liveReceipt = receipt({
      installedArtifact,
      observedVersion: versionProbe.version,
      model,
      profile: {
        mcpProfile: profile,
        inventorySha256: jsonHash(inventoryProbe.servers),
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
        inventory: inventoryProbe.servers,
      });
    }

    let normalized;
    try {
      normalized = normalizeCodexStream(execution.stdout);
    } catch {
      return result({
        terminal: replaceTerminalState(execution.terminal, {
          state: 'normalization-failed',
          reason: 'stream-normalization-error',
        }),
        receipt: liveReceipt,
        execution,
        inventory: inventoryProbe.servers,
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
      inventory: inventoryProbe.servers,
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
