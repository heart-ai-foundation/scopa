import assert from 'node:assert/strict';
import {
  chmod,
  mkdir,
  mkdtemp,
  rm,
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
} from '../../../enforcement/src/index.js';
import {
  validatePublishedContract,
} from '../../../release-readiness/src/published-contracts.js';
import {
  CLAUDE_LIVE_POLICY_SCHEMA,
  createClaudeLivePolicy,
  parseClaudeAuthBoundary,
  validateClaudeLivePolicy,
} from '../src/live-policy.js';
import {
  createClaudeCapabilityMatrix,
  createClaudeSession,
  EXPECTED_CLAUDE_CODE_VERSION,
} from '../src/profile.js';
import {
  runClaudeSession,
} from '../src/run.js';
import {
  S15_LIVE_SCENARIOS,
  parseProductionLiveArguments,
} from '../src/production-live-probe.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const FAULT_CLIENT = path.join(
  ROOT,
  'fixtures/S15/claude-fault-client.mjs',
);
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

function policy(overrides = {}) {
  return createClaudeLivePolicy({
    ...overrides,
  });
}

async function repository() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s15-'));
  await mkdir(path.join(root, '.git'));
  return root;
}

async function withMode(mode, operation) {
  const names = [
    'SCOPA_S15_FIXTURE_ROOT',
    'SCOPA_S15_MODE',
  ];
  const previous = Object.fromEntries(
    names.map((name) => [
      name,
      process.env[name],
    ]),
  );
  process.env.SCOPA_S15_FIXTURE_ROOT = ROOT;
  process.env.SCOPA_S15_MODE = mode;
  try {
    return await operation();
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
}

function options(repoRoot, livePolicy = policy()) {
  return {
    repoRoot,
    session: createClaudeSession({
      sessionId: 'S15-fixture',
      request: 'deterministic S15 fault session',
    }),
    capabilityMatrix: createClaudeCapabilityMatrix({}),
    prompt: 'deterministic S15 fault session',
    installedArtifact: ARTIFACT,
    livePolicy,
    scenario: {
      id: 'fixture',
      version: 'S15.v1',
    },
    adapterCli: path.join(repoRoot, 'scopa-mcp.js'),
    claudeCommand: FAULT_CLIENT,
    timeoutMs: livePolicy.limits.timeoutMs,
    inputSettleMs: 0,
    terminateGraceMs: 30,
    cleanupWaitMs: 1_000,
  };
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

test('approved Claude policy is closed, digest-bound, and published', async () => {
  const current = policy();
  assert.equal(validateClaudeLivePolicy(current), current);
  assert.equal(current.model.requestedAlias, 'sonnet');
  assert.equal(current.limits.maxBudgetUsdPerRun, '0.20');
  assert.equal(current.limits.maxProviderInvocations, 6);
  assert.equal(current.limits.maxCampaignBudgetUsd, '1.20');
  assert.equal(current.limits.maxTurnsPerRun, 12);
  assert.equal(current.limits.timeoutMs, 120_000);
  assert.equal(current.limits.maxCaptureBytes, 20 * 1024 * 1024);
  assert.equal(current.tools.allowed.length, 6);
  assert.equal(current.network.osEnforced, false);

  const unknown = {
    ...current,
    rawAccount: 'forbidden',
  };
  assert.throws(
    () => validateClaudeLivePolicy(unknown),
    /unknown or missing fields/,
  );
  const mutated = structuredClone(current);
  mutated.limits.maxBudgetUsdPerRun = '0.21';
  assert.throws(
    () => validateClaudeLivePolicy(mutated),
    /campaign budget conflicts|digest does not bind/,
  );
  const overclaim = structuredClone(current);
  overclaim.network.osEnforced = true;
  assert.throws(
    () => validateClaudeLivePolicy(overclaim),
    /must not overstate OS enforcement/,
  );

  const schema = JSON.parse(
    await import('node:fs/promises').then(({ readFile }) =>
      readFile(
        path.join(
          ROOT,
          'schemas/scopa.claude-live-policy.v1.schema.json',
        ),
        'utf8',
      )),
  );
  const validate = new Ajv2020({
    allErrors: true,
    strict: true,
  });
  validate.addKeyword({
    keyword: 'x-scopa-claude-live-policy-invariants',
    schemaType: 'boolean',
    validate: () => true,
  });
  assert.equal(validate.compile(schema)(current), true);
  assert.deepEqual(
    validatePublishedContract(CLAUDE_LIVE_POLICY_SCHEMA, current),
    current,
  );
  const digestDrift = structuredClone(current);
  digestDrift.policySha256 = '0'.repeat(64);
  assert.throws(
    () => validatePublishedContract(
      CLAUDE_LIVE_POLICY_SCHEMA,
      digestDrift,
    ),
    /must bind the complete policy descriptor/,
  );
});

test('production campaign is explicit, six-run, and private-root closed', () => {
  assert.equal(S15_LIVE_SCENARIOS.length, 6);
  assert.deepEqual(
    S15_LIVE_SCENARIOS.map((scenario) => scenario.id),
    [
      'clean',
      'denied',
      'false-green',
      'cold-restart',
      'repeat-read-1',
      'repeat-read-2',
    ],
  );
  const parsed = parseProductionLiveArguments([
    '--policy',
    path.join(ROOT, 'fixtures/S15/claude-live-policy.json'),
    '--private-root',
    '/tmp/scopa-s15-private-evidence',
  ]);
  assert.equal(parsed.publicRoot, path.join(ROOT, 'evidence/S15'));
  assert.equal(
    parsed.privateRoot,
    '/tmp/scopa-s15-private-evidence',
  );
  assert.throws(
    () => parseProductionLiveArguments([
      '--policy',
      path.join(ROOT, 'fixtures/S15/claude-live-policy.json'),
      '--private-root',
      path.join(ROOT, 'evidence/S15/private'),
    ]),
    /must be outside the repository/,
  );
});

test('auth boundary verifies the account class without retaining identity', () => {
  const current = policy();
  const first = parseClaudeAuthBoundary(JSON.stringify({
    loggedIn: true,
    authMethod: 'claude.ai',
    apiProvider: 'firstParty',
    email: 'first@example.invalid',
    orgId: 'org-one',
    orgName: 'first organization',
    subscriptionType: 'max',
  }), current);
  const second = parseClaudeAuthBoundary(JSON.stringify({
    loggedIn: true,
    authMethod: 'claude.ai',
    apiProvider: 'firstParty',
    email: 'second@example.invalid',
    orgId: 'org-two',
    orgName: 'second organization',
    subscriptionType: 'max',
  }), current);
  assert.deepEqual(first.boundary, second.boundary);
  assert.notEqual(
    first.privateIdentitySha256,
    second.privateIdentitySha256,
  );
  const publicText = canonicalJsonPretty(first.boundary);
  assert.equal(publicText.includes('first@example.invalid'), false);
  assert.equal(publicText.includes('org-one'), false);
  assert.equal(publicText.includes(first.privateIdentitySha256), false);
});

test('policy mismatch and account drift stop before provider execution', async (context) => {
  await chmod(FAULT_CLIENT, 0o755);
  const root = await repository();
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));

  const missing = options(root);
  delete missing.livePolicy;
  await assert.rejects(
    () => runClaudeSession(missing),
    /Claude live policy must be a plain object/,
  );

  const modelMismatch = options(root);
  modelMismatch.model = 'opus';
  await assert.rejects(
    () => runClaudeSession(modelMismatch),
    /differs from the approved live policy/,
  );

  const matrixMismatch = options(root);
  matrixMismatch.capabilityMatrix = structuredClone(
    matrixMismatch.capabilityMatrix,
  );
  matrixMismatch.capabilityMatrix.subject.client =
    'claude-code@unreviewed';
  await assert.rejects(
    () => runClaudeSession(matrixMismatch),
    /differs from the reviewed profile/,
  );

  for (const mode of [
    'auth-drift',
    'auth-missing',
  ]) {
    const run = await withMode(
      mode,
      () => runClaudeSession(options(root)),
    );
    assert.equal(run.terminal.state, 'provider-refused');
    assert.equal(run.terminal.reason, 'authentication-boundary-mismatch');
    assert.equal(run.terminal.canStop, false);
    assert.equal(run.normalized, null);
  }
});

test('capability drift and malformed streams fail closed', async (context) => {
  const root = await repository();
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));
  const expected = new Map([
    [
      'version-drift',
      'version-drift',
    ],
    [
      'model-drift',
      'normalization-failed',
    ],
    [
      'tool-drift',
      'normalization-failed',
    ],
    [
      'agent-drift',
      'normalization-failed',
    ],
    [
      'mcp-config-error',
      'normalization-failed',
    ],
    [
      'malformed',
      'normalization-failed',
    ],
    [
      'early-eof',
      'normalization-failed',
    ],
  ]);
  for (const [mode, state] of expected) {
    const run = await withMode(
      mode,
      () => runClaudeSession(options(root)),
    );
    assert.equal(run.terminal.state, state, mode);
    assert.equal(run.terminal.canStop, false, mode);
    assert.equal(run.normalized, null, mode);
  }
});

test('provider refusal, rate, budget, turn, and execution failures are first-class', async (context) => {
  const root = await repository();
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));
  const expected = new Map([
    [
      'provider-refusal',
      'provider-refused',
    ],
    [
      'exited-refusal',
      'provider-refused',
    ],
    [
      'rate-limit',
      'rate-limited',
    ],
    [
      'budget-stop',
      'budget-exhausted',
    ],
    [
      'turn-limit',
      'turn-limit',
    ],
    [
      'provider-failed',
      'provider-failed',
    ],
    [
      'cost-overrun',
      'budget-exhausted',
    ],
    [
      'turn-overrun',
      'turn-limit',
    ],
  ]);
  for (const [mode, state] of expected) {
    const run = await withMode(
      mode,
      () => runClaudeSession(options(root)),
    );
    assert.equal(run.terminal.state, state, mode);
    assert.equal(run.terminal.canStop, false, mode);
    assert.equal(run.normalized, null, mode);
  }
});

test('timeout and capture pressure terminate the full provider process group', async (context) => {
  const root = await repository();
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));

  const timeoutPolicy = policy({
    timeoutMs: 500,
  });
  const timedOut = await withMode(
    'timeout',
    () => runClaudeSession(options(root, timeoutPolicy)),
  );
  assert.equal(timedOut.terminal.state, 'timed-out');
  assert.equal(timedOut.terminal.cleanup.killSent, true);
  assert.equal(timedOut.terminal.cleanup.groupGone, true);
  const timeoutChild = Number.parseInt(
    timedOut.privateCapture.stdout.trim(),
    10,
  );
  assert.equal(processExists(timeoutChild), false);

  const capturePolicy = policy({
    maxCaptureBytes: 1_024,
  });
  const outputLimited = await withMode(
    'output-limit',
    () => runClaudeSession(options(root, capturePolicy)),
  );
  assert.equal(outputLimited.terminal.state, 'output-limit');
  assert.equal(outputLimited.terminal.output.capturedBytes, 1_024);
  assert.equal(outputLimited.terminal.cleanup.killSent, true);
  assert.equal(outputLimited.terminal.cleanup.groupGone, true);
  const outputChild = Number.parseInt(
    outputLimited.privateCapture.stdout.split('\n')[0],
    10,
  );
  assert.equal(processExists(outputChild), false);
});

test('successful runs bind safe policy/auth receipts and repeated identity', async (context) => {
  const root = await repository();
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));
  const livePolicy = policy();
  const first = await withMode(
    'success',
    () => runClaudeSession(options(root, livePolicy)),
  );
  const second = await withMode(
    'success',
    () => runClaudeSession(options(root, livePolicy)),
  );
  assert.equal(first.terminal.state, 'succeeded');
  assert.equal(first.terminal.canStop, true);
  assert.equal(first.receipt.client.observedVersion, EXPECTED_CLAUDE_CODE_VERSION);
  assert.equal(
    first.receipt.limits.livePolicySha256,
    livePolicy.policySha256,
  );
  assert.deepEqual(first.authBoundary, second.authBoundary);
  assert.equal(
    first.privateCapture.authIdentitySha256,
    second.privateCapture.authIdentitySha256,
  );
  const publicText = canonicalJsonPretty({
    authBoundary: first.authBoundary,
    receipt: first.receipt,
    terminal: first.terminal,
  });
  for (const forbidden of [
    'fixture@example.invalid',
    'fixture-org',
    root,
  ]) {
    assert.equal(publicText.includes(forbidden), false);
  }
});
