import assert from 'node:assert/strict';
import {
  createHash,
} from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  fileURLToPath,
} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  runClaudeSession,
} from '../../integrations/claude/src/run.js';
import {
  createClaudeCapabilityMatrix,
  createClaudeSession,
} from '../../integrations/claude/src/profile.js';
import {
  runCodexSession,
} from '../../integrations/codex/src/run.js';
import {
  createCodexCapabilityMatrix,
  createCodexSession,
} from '../../integrations/codex/src/profile.js';
import {
  scanPrivateText,
} from '../../release-readiness/src/package-privacy.js';
import {
  bindNormalizedCompletion,
  createControlledEnvironment,
  createLiveReceipt,
  createPrivateLiveEvidence,
  createPublicLiveEvidence,
  persistLiveEvidence,
  superviseProcess,
  validateLiveReceipt,
  validateTerminalEnvelope,
} from '../src/index.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);
const FAULT_CLIENT = path.join(ROOT, 'fixtures/S14/fault-client.mjs');
const ARTIFACT = Object.freeze({
  schema: 'scopa.installed-artifact-identity.v1',
  sourceCommit: 'a'.repeat(40),
  package: Object.freeze({
    name: '@heart-ai-foundation/scopa',
    version: '0.2.0-dev.1',
    sha256: 'b'.repeat(64),
    integrity: `sha512-${Buffer.alloc(64, 7).toString('base64')}`,
  }),
});

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function directFault(mode, {
  timeoutMs = 2_000,
  maxCaptureBytes = 64 * 1024,
} = {}) {
  return superviseProcess({
    command: process.execPath,
    args: [
      FAULT_CLIENT,
      '--direct',
      mode,
    ],
    cwd: ROOT,
    env: {
      ...process.env,
    },
    timeoutMs,
    maxCaptureBytes,
    terminateGraceMs: 30,
    cleanupWaitMs: 1_000,
    cleanupPollMs: 5,
  });
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

async function withFaultEnvironment(provider, mode, operation) {
  const names = [
    'SCOPA_S14_FIXTURE_ROOT',
    'SCOPA_S14_MODE',
    'SCOPA_S14_PROVIDER',
  ];
  const previous = Object.fromEntries(
    names.map((name) => [
      name,
      process.env[name],
    ]),
  );
  process.env.SCOPA_S14_FIXTURE_ROOT = ROOT;
  process.env.SCOPA_S14_MODE = mode;
  process.env.SCOPA_S14_PROVIDER = provider;
  try {
    return await operation();
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
}

async function providerRoot(prefix) {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  await mkdir(path.join(root, '.git'));
  return root;
}

function claudeOptions(root) {
  return {
    repoRoot: root,
    session: createClaudeSession({
      sessionId: 'S14-claude',
      request: 'deterministic fault session',
    }),
    capabilityMatrix: createClaudeCapabilityMatrix({}),
    prompt: 'deterministic fault session',
    installedArtifact: ARTIFACT,
    scenario: {
      id: 'claude-fault',
      version: 'S14.v1',
    },
    adapterCli: path.join(root, 'scopa-mcp.js'),
    claudeCommand: FAULT_CLIENT,
    timeoutMs: 2_000,
    inputSettleMs: 0,
    terminateGraceMs: 30,
    cleanupWaitMs: 1_000,
  };
}

function codexOptions(root) {
  return {
    repoRoot: root,
    session: createCodexSession({
      sessionId: 'S14-codex',
      request: 'deterministic fault session',
    }),
    capabilityMatrix: createCodexCapabilityMatrix({}),
    prompt: 'deterministic fault session',
    installedArtifact: ARTIFACT,
    scenario: {
      id: 'codex-fault',
      version: 'S14.v1',
    },
    adapterCli: path.join(root, 'scopa-mcp.js'),
    codexCommand: FAULT_CLIENT,
    timeoutMs: 2_000,
    terminateGraceMs: 30,
    cleanupWaitMs: 1_000,
  };
}

test('supervisor closes success, exit, signal, and spawn failure as data', async () => {
  const success = await directFault('success');
  assert.equal(success.terminal.state, 'succeeded');
  assert.equal(success.terminal.ok, true);
  assert.equal(success.terminal.canStop, false);
  assert.equal(success.stdout, 'ok\n');
  assert.equal(success.terminal.cleanup.groupGone, true);

  const exited = await directFault('exit');
  assert.equal(exited.terminal.state, 'exited');
  assert.equal(exited.terminal.exitCode, 7);
  assert.equal(exited.terminal.canStop, false);

  const signaled = await directFault('signal');
  assert.equal(signaled.terminal.state, 'signaled');
  assert.equal(signaled.terminal.signal, 'SIGTERM');

  const missing = await superviseProcess({
    command: path.join(ROOT, 'fixtures/S14/does-not-exist'),
    args: [],
    cwd: ROOT,
    env: {
      ...process.env,
    },
    timeoutMs: 100,
    maxCaptureBytes: 1024,
  });
  assert.equal(missing.terminal.state, 'spawn-failed');
  assert.equal(missing.terminal.ok, false);
});

test('timeout and output limits kill an ignoring descendant process group', async () => {
  const timedOut = await directFault('timeout', {
    timeoutMs: 1_000,
  });
  assert.equal(timedOut.terminal.state, 'timed-out');
  assert.equal(timedOut.terminal.cleanup.termSent, true);
  assert.equal(timedOut.terminal.cleanup.killSent, true);
  assert.equal(timedOut.terminal.cleanup.groupGone, true);
  const timeoutChild = Number.parseInt(timedOut.stdout.trim(), 10);
  assert.equal(Number.isSafeInteger(timeoutChild), true);
  assert.equal(processExists(timeoutChild), false);

  const outputLimited = await directFault('output', {
    maxCaptureBytes: 1024,
  });
  assert.equal(outputLimited.terminal.state, 'output-limit');
  assert.equal(outputLimited.terminal.output.truncated, true);
  assert.equal(outputLimited.terminal.output.capturedBytes, 1024);
  assert.equal(outputLimited.terminal.cleanup.killSent, true);
  assert.equal(outputLimited.terminal.cleanup.groupGone, true);
  const outputChild = Number.parseInt(outputLimited.stdout.split('\n')[0], 10);
  assert.equal(Number.isSafeInteger(outputChild), true);
  assert.equal(processExists(outputChild), false);
});

test('a successful parent that leaves a child is a cleanup failure', async () => {
  const orphan = await directFault('orphan');
  assert.equal(orphan.terminal.state, 'cleanup-failed');
  assert.equal(orphan.terminal.reason, 'orphan-process-detected');
  assert.equal(orphan.terminal.cleanup.orphanDetected, true);
  assert.equal(orphan.terminal.cleanup.groupGone, true);
  const childPid = Number.parseInt(orphan.stdout.trim(), 10);
  assert.equal(processExists(childPid), false);
});

test('terminal validator is closed and only normalization can permit stop', async () => {
  const execution = await directFault('success');
  assert.equal(
    validateTerminalEnvelope(execution.terminal),
    execution.terminal,
  );
  const normalized = bindNormalizedCompletion(execution.terminal, true);
  assert.equal(normalized.canStop, true);
  const unknown = {
    ...normalized,
    injected: true,
  };
  assert.throws(
    () => validateTerminalEnvelope(unknown),
    /unknown or missing fields/,
  );
  const falseGreen = {
    ...normalized,
    state: 'exited',
    ok: false,
  };
  assert.throws(
    () => validateTerminalEnvelope(falseGreen),
    /failed live terminal cannot permit completion/,
  );
});

test('environment policy binds names and safe additions without values', () => {
  const first = createControlledEnvironment({
    baseEnvironment: {
      SAFE_NAME: 'one',
      OPENAI_API_KEY: 'protected-one',
    },
    additions: {
      SCOPA_MODE: 'bounded',
    },
    removedNames: [
      'OPENAI_API_KEY',
    ],
  });
  const second = createControlledEnvironment({
    baseEnvironment: {
      SAFE_NAME: 'two',
      OPENAI_API_KEY: 'protected-two',
    },
    additions: {
      SCOPA_MODE: 'bounded',
    },
    removedNames: [
      'OPENAI_API_KEY',
    ],
  });
  assert.equal(first.environment.OPENAI_API_KEY, undefined);
  assert.equal(first.policy.policySha256, second.policy.policySha256);
  const serialized = canonicalJsonPretty(first.policy);
  assert.equal(serialized.includes('protected-one'), false);
  assert.equal(serialized.includes('one'), false);
});

test('Claude and Codex use shared custody for success and drift failures', async (context) => {
  await chmod(FAULT_CLIENT, 0o755);
  const claudeRoot = await providerRoot('scopa-s14-claude-');
  const codexRoot = await providerRoot('scopa-s14-codex-');
  context.after(async () => {
    await rm(claudeRoot, {
      recursive: true,
      force: true,
    });
    await rm(codexRoot, {
      recursive: true,
      force: true,
    });
  });

  const claude = await withFaultEnvironment(
    'claude',
    'success',
    () => runClaudeSession(claudeOptions(claudeRoot)),
  );
  assert.equal(claude.terminal.state, 'succeeded');
  assert.equal(claude.terminal.canStop, true);
  assert.equal(claude.normalized.final.canStop, true);
  assert.equal(claude.receipt.client.observedVersion, '2.1.170');

  const claudeDrift = await withFaultEnvironment(
    'claude',
    'version-drift',
    () => runClaudeSession(claudeOptions(claudeRoot)),
  );
  assert.equal(claudeDrift.terminal.state, 'version-drift');
  assert.equal(claudeDrift.terminal.canStop, false);
  assert.equal(claudeDrift.normalized, null);

  const claudeMalformed = await withFaultEnvironment(
    'claude',
    'malformed',
    () => runClaudeSession(claudeOptions(claudeRoot)),
  );
  assert.equal(claudeMalformed.terminal.state, 'normalization-failed');
  assert.equal(claudeMalformed.terminal.canStop, false);

  const codex = await withFaultEnvironment(
    'codex',
    'success',
    () => runCodexSession(codexOptions(codexRoot)),
  );
  assert.equal(codex.terminal.state, 'succeeded');
  assert.equal(codex.terminal.canStop, true);
  assert.deepEqual(
    codex.inventory.map((server) => server.name),
    [
      'scopa',
    ],
  );

  const codexInventoryDrift = await withFaultEnvironment(
    'codex',
    'inventory-drift',
    () => runCodexSession(codexOptions(codexRoot)),
  );
  assert.equal(codexInventoryDrift.terminal.state, 'inventory-drift');
  assert.equal(codexInventoryDrift.terminal.canStop, false);

  const codexTruncated = await withFaultEnvironment(
    'codex',
    'truncated',
    () => runCodexSession(codexOptions(codexRoot)),
  );
  assert.equal(codexTruncated.terminal.state, 'normalization-failed');
  assert.equal(codexTruncated.terminal.canStop, false);

  for (const run of [
    claude,
    claudeDrift,
    claudeMalformed,
    codex,
    codexInventoryDrift,
    codexTruncated,
  ]) {
    const serialized = canonicalJsonPretty(run.receipt);
    assert.equal(serialized.includes(claudeRoot), false);
    assert.equal(serialized.includes(codexRoot), false);
    assert.equal(serialized.includes('SCOPA_S14_FIXTURE_ROOT'), false);
    assert.equal(run.receipt.artifact.package.sha256, ARTIFACT.package.sha256);
    assert.equal(run.receipt.environmentPolicy.policySha256.length, 64);
  }

  const claudeSource = await readFile(
    path.join(ROOT, 'packages/integrations/claude/src/run.js'),
    'utf8',
  );
  const codexSource = await readFile(
    path.join(ROOT, 'packages/integrations/codex/src/run.js'),
    'utf8',
  );
  assert.equal(claudeSource.includes('node:child_process'), false);
  assert.equal(codexSource.includes('node:child_process'), false);
  assert.equal(claudeSource.includes('superviseProcess'), true);
  assert.equal(codexSource.includes('superviseProcess'), true);
});

test('private/public evidence is atomic, restricted, deterministic, and collision-safe', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s14-evidence-'));
  const privateRoot = path.join(root, 'private');
  const publicRoot = path.join(root, 'public');
  await mkdir(privateRoot);
  await mkdir(publicRoot);
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));

  const execution = await directFault('success');
  const controlled = createControlledEnvironment({
    baseEnvironment: {
      SAFE_NAME: 'safe',
      OPENAI_API_KEY: 'forbidden-secret-value',
    },
    additions: {},
    removedNames: [
      'OPENAI_API_KEY',
    ],
  });
  const receipt = createLiveReceipt({
    artifact: ARTIFACT,
    clientName: 'fault-client',
    expectedVersion: '1.0.0',
    observedVersion: '1.0.0',
    requestedModel: 'deterministic',
    profileName: 'S14-fault-v1',
    profile: {
      mode: 'success',
    },
    capabilityMatrix: {
      schema: 'scopa.capability-matrix.v1',
      assurance: 'partial',
    },
    scenario: {
      id: 'evidence',
      version: 'S14.v1',
    },
    limits: {
      timeoutMs: 2_000,
      maxCaptureBytes: 64 * 1024,
    },
    environmentPolicy: controlled.policy,
    invocation: {
      command: FAULT_CLIENT,
      args: [
        '--direct',
        'success',
      ],
      stdin: '',
    },
  });
  assert.equal(validateLiveReceipt(receipt), receipt);
  const injectedReceipt = {
    ...receipt,
    rawEnvironment: {
      OPENAI_API_KEY: 'forbidden-secret-value',
    },
  };
  assert.throws(
    () => createPrivateLiveEvidence({
      receipt: injectedReceipt,
      terminal: execution.terminal,
      summary: {},
      repositoryRoot: path.join(root, 'repository'),
      controlRoot: path.join(root, 'control'),
      stdout: '',
      stderr: '',
      raw: null,
    }),
    /unknown or missing fields/,
  );
  const evidence = createPrivateLiveEvidence({
    receipt,
    terminal: execution.terminal,
    summary: {
      assurance: 'partial',
      provider: 'fault-client',
    },
    repositoryRoot: path.join(root, 'repository'),
    controlRoot: path.join(root, 'control'),
    stdout: 'forbidden-secret-value',
    stderr: '',
    raw: {
      providerOutput: 'forbidden-secret-value',
    },
  });
  const privateText = canonicalJsonPretty(evidence);
  const firstPublic = createPublicLiveEvidence(privateText, {
    protectedValues: [
      'forbidden-secret-value',
    ],
  });
  const secondPublic = createPublicLiveEvidence(privateText, {
    protectedValues: [
      'forbidden-secret-value',
    ],
  });
  assert.equal(firstPublic.text, secondPublic.text);
  assert.equal(
    firstPublic.evidence.publicationReceipt.sourceSha256,
    sha256(privateText),
  );
  assert.deepEqual(
    scanPrivateText(firstPublic.text, {
      forbiddenValues: [
        'forbidden-secret-value',
        evidence.private.repositoryRoot,
        evidence.private.controlRoot,
      ],
    }),
    [],
  );

  const privatePath = path.join(privateRoot, 'run.private.json');
  const publicPath = path.join(publicRoot, 'run.public.json');
  const persisted = await persistLiveEvidence({
    privateRoot,
    privatePath,
    publicRoot,
    publicPath,
    evidence,
    protectedValues: [
      'forbidden-secret-value',
    ],
  });
  assert.equal(persisted.privateSha256, sha256(privateText));
  assert.equal(
    (await lstat(privatePath)).mode & 0o777,
    0o600,
  );
  assert.equal(
    (await lstat(publicPath)).mode & 0o777,
    0o644,
  );
  assert.equal(await readFile(publicPath, 'utf8'), firstPublic.text);
  await assert.rejects(
    () => persistLiveEvidence({
      privateRoot,
      privatePath,
      publicRoot,
      publicPath,
      evidence,
    }),
    /already exists/,
  );

  await assert.rejects(
    () => persistLiveEvidence({
      privateRoot,
      privatePath: path.join(privateRoot, 'alias.json'),
      publicRoot: privateRoot,
      publicPath: path.join(privateRoot, 'alias.json'),
      evidence,
    }),
    /destinations alias/,
  );

  const outside = path.join(root, 'outside');
  await mkdir(outside);
  await symlink(outside, path.join(publicRoot, 'escape'));
  await assert.rejects(
    () => persistLiveEvidence({
      privateRoot,
      privatePath: path.join(privateRoot, 'escape.private.json'),
      publicRoot,
      publicPath: path.join(publicRoot, 'escape/public.json'),
      evidence,
    }),
    /parent aliases are not allowed|escapes its declared root/,
  );
  await assert.rejects(
    () => lstat(path.join(privateRoot, 'escape.private.json')),
    {
      code: 'ENOENT',
    },
  );

  const inside = path.join(publicRoot, 'inside');
  await mkdir(inside);
  await symlink(inside, path.join(publicRoot, 'inside-alias'));
  await assert.rejects(
    () => persistLiveEvidence({
      privateRoot,
      privatePath: path.join(privateRoot, 'inside-alias.private.json'),
      publicRoot,
      publicPath: path.join(publicRoot, 'inside-alias/public.json'),
      evidence,
    }),
    /parent aliases are not allowed/,
  );
  await assert.rejects(
    () => lstat(path.join(privateRoot, 'inside-alias.private.json')),
    {
      code: 'ENOENT',
    },
  );

  const collision = structuredClone(evidence);
  collision.summary.note = collision.private.repositoryRoot;
  assert.throws(
    () => createPublicLiveEvidence(canonicalJsonPretty(collision)),
    /semantic collision/,
  );
  const placeholder = structuredClone(evidence);
  placeholder.private.stdout = '[SCOPA_STDOUT_REDACTED]';
  assert.throws(
    () => createPublicLiveEvidence(canonicalJsonPretty(placeholder)),
    /reserved placeholder/,
  );
});

test('published live schemas accept receipts, terminals, and private evidence', async () => {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
  });
  const terminalSchema = JSON.parse(
    await readFile(
      path.join(ROOT, 'schemas/scopa.live-terminal.v1.schema.json'),
      'utf8',
    ),
  );
  const receiptSchema = JSON.parse(
    await readFile(
      path.join(ROOT, 'schemas/scopa.live-receipt.v1.schema.json'),
      'utf8',
    ),
  );
  const evidenceSchema = JSON.parse(
    await readFile(
      path.join(ROOT, 'schemas/scopa.live-evidence.v1.schema.json'),
      'utf8',
    ),
  );
  const publicEvidenceSchema = JSON.parse(
    await readFile(
      path.join(ROOT, 'schemas/scopa.live-evidence.public.v1.schema.json'),
      'utf8',
    ),
  );
  ajv.addSchema(terminalSchema);
  ajv.addSchema(receiptSchema);
  const validateEvidence = ajv.compile(evidenceSchema);
  const validatePublicEvidence = ajv.compile(publicEvidenceSchema);

  const execution = await directFault('success');
  const controlled = createControlledEnvironment({
    baseEnvironment: {
      SAFE_NAME: 'safe',
    },
    additions: {},
    removedNames: [
      'OPENAI_API_KEY',
    ],
  });
  const receipt = createLiveReceipt({
    artifact: ARTIFACT,
    clientName: 'fault-client',
    expectedVersion: '1.0.0',
    observedVersion: '1.0.0',
    requestedModel: 'deterministic',
    profileName: 'S14-fault-v1',
    profile: {
      mode: 'success',
    },
    capabilityMatrix: {
      schema: 'scopa.capability-matrix.v1',
    },
    scenario: {
      id: 'schema',
      version: 'S14.v1',
    },
    limits: {
      timeoutMs: 2_000,
    },
    environmentPolicy: controlled.policy,
    invocation: {
      command: FAULT_CLIENT,
      args: [],
      stdin: '',
    },
  });
  const evidence = createPrivateLiveEvidence({
    receipt,
    terminal: execution.terminal,
    summary: {},
    repositoryRoot: '/controlled/repository',
    controlRoot: '/controlled/control',
    stdout: '',
    stderr: '',
    raw: null,
  });
  assert.equal(validateEvidence(evidence), true, ajv.errorsText(
    validateEvidence.errors,
  ));
  const publication = createPublicLiveEvidence(canonicalJsonPretty(evidence));
  assert.equal(
    validatePublicEvidence(publication.evidence),
    true,
    ajv.errorsText(validatePublicEvidence.errors),
  );
});
