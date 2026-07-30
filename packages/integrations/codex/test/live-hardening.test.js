import assert from 'node:assert/strict';
import {
  createHash,
} from 'node:crypto';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  fileURLToPath,
} from 'node:url';
import {
  scanPrivateText,
} from '../../../release-readiness/src/package-privacy.js';
import {
  validatePublishedContract,
} from '../../../release-readiness/src/published-contracts.js';
import * as liveRun from '../../../live-run/src/index.js';
import * as project from '../../../cli/src/project.js';
import * as integration from '../src/index.js';
import {
  parseDeterministicArguments,
  runDeterministicScenario,
  validateDeterministicCorpus,
} from '../src/deterministic-edge-probe.js';
import {
  parseProductionLiveArguments,
  prepareCodexEnvironment,
  runCampaign,
} from '../src/production-live-probe.js';
import {
  CODEX_LIVE_POLICY_SCHEMA,
  CODEX_PROVIDER_GATE_CLOSED,
  CODEX_PROVIDER_GATE_OPEN,
  assertCodexProviderAuthorized,
  assertCodexUsageWithinPolicy,
  codexPolicyUsageLimits,
  createCodexLivePolicy,
  validateCodexLivePolicy,
} from '../src/live-policy.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const FIXTURE = path.join(ROOT, 'fixtures/S16');
const POLICY_PATH = path.join(FIXTURE, 'codex-live-policy.json');
const CORPUS_PATH = path.join(FIXTURE, 'deterministic-scenarios.json');
const ROOT_PACKAGE = JSON.parse(
  await readFile(path.join(ROOT, 'package.json'), 'utf8'),
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

async function repository() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s16-test-'));
  await mkdir(path.join(root, '.git'));
  return root;
}

test('Codex campaign policy is closed after the stopped allowance', async () => {
  const text = await readFile(POLICY_PATH, 'utf8');
  const policy = JSON.parse(text);
  assert.equal(text.endsWith('\n'), true);
  assert.equal(text.includes('\r'), false);
  assert.equal(validateCodexLivePolicy(policy), policy);
  assert.deepEqual(
    validatePublishedContract(CODEX_LIVE_POLICY_SCHEMA, policy),
    policy,
  );
  assert.equal(
    policy.authorization.providerGate,
    CODEX_PROVIDER_GATE_CLOSED,
  );
  assert.equal(policy.authorization.approvedOn, null);
  assert.equal(
    policy.authorization.principalApproval,
    'not-granted',
  );
  assert.equal(
    policy.authorization.privateEvidenceDestinationApproval,
    'not-granted',
  );
  assert.equal(policy.limits.maxProviderInvocations, 4);
  assert.deepEqual(policy.scenarios.ids, [
    'clean',
    'denied',
    'false-green',
    'cold-restart',
  ]);
  assert.equal(policy.model.requested, 'gpt-5.4');
  assert.equal(policy.model.provenance, 'launcher-declared');
  assert.equal(policy.nativeSurface.sandbox, 'read-only');
  assert.equal(policy.nativeSurface.approvalPolicy, 'never');
  assert.equal(policy.tools.allowed.length, 6);
  assert.equal(policy.network.osEnforced, false);
  assert.throws(
    () => assertCodexProviderAuthorized(policy),
    /provider gate is closed/,
  );

  const mutated = structuredClone(policy);
  mutated.limits.maxInputTokensPerRun += 1;
  assert.throws(
    () => validateCodexLivePolicy(mutated),
    /aggregate usage bounds conflict|digest does not bind/,
  );
  const falseApproval = structuredClone(policy);
  falseApproval.authorization.principalApproval = 'conversation-explicit';
  assert.throws(
    () => validateCodexLivePolicy(falseApproval),
    /closed Codex provider gate claims approval/,
  );
  const unknown = {
    ...policy,
    credential: 'forbidden',
  };
  assert.throws(
    () => validateCodexLivePolicy(unknown),
    /unknown or missing fields/,
  );
});

test('fresh explicit approval differs from the closed stop posture', async () => {
  const fixture = JSON.parse(await readFile(POLICY_PATH, 'utf8'));
  const authorized = createCodexLivePolicy({
    providerGate: CODEX_PROVIDER_GATE_OPEN,
    approvedOn: '2026-07-29',
    principalApproval: 'conversation-explicit',
    privateEvidenceDestinationApproval: 'conversation-explicit',
  });
  assert.equal(assertCodexProviderAuthorized(authorized), authorized);
  assert.deepEqual(fixture, createCodexLivePolicy());
  assert.notEqual(authorized.policySha256, fixture.policySha256);
});

test('Codex policy enforces per-run and aggregate token accounting', () => {
  const policy = createCodexLivePolicy();
  assert.deepEqual(codexPolicyUsageLimits(policy), {
    maxInputTokens: 120_000,
    maxOutputTokens: 4_000,
    maxReasoningTokens: 2_000,
    maxTotalTokens: 126_000,
  });
  const usage = {
    input_tokens: 100_000,
    cached_input_tokens: 80_000,
    cache_write_input_tokens: 0,
    output_tokens: 1_000,
    reasoning_output_tokens: 500,
  };
  assert.equal(assertCodexUsageWithinPolicy(policy, usage), usage);
  assert.throws(
    () => assertCodexUsageWithinPolicy(policy, {
      ...usage,
      input_tokens: 120_001,
    }),
    /usage exceeds/,
  );
});

test('Codex production environment is an explicit non-secret allowlist', () => {
  const controlled = integration.createCodexAllowedEnvironment({
    HOME: '/controlled/home',
    LANG: 'C.UTF-8',
    PATH: '/usr/bin',
    OPENAI_API_KEY: 'must-not-pass',
    UNRELATED_SECRET: 'must-not-pass',
  });
  assert.deepEqual(controlled, {
    HOME: '/controlled/home',
    LANG: 'C.UTF-8',
    PATH: '/usr/bin',
  });
  assert.throws(
    () => integration.createCodexAllowedEnvironment({
      PATH: '/usr/bin',
    }),
    /requires HOME and PATH/,
  );
});

test('deterministic corpus is complete and network-closed', async () => {
  const text = await readFile(CORPUS_PATH, 'utf8');
  const corpus = validateDeterministicCorpus(JSON.parse(text));
  assert.equal(text.endsWith('\n'), true);
  assert.equal(text.includes('\r'), false);
  assert.equal(corpus.providerTrafficAllowed, false);
  assert.equal(corpus.scenarios.length, 21);
  assert.equal(
    new Set(corpus.scenarios.map((scenario) => scenario.id)).size,
    corpus.scenarios.length,
  );
  assert.deepEqual(parseDeterministicArguments([]), {
    output: null,
  });
  assert.throws(
    () => parseDeterministicArguments(['--live']),
    /usage/,
  );
  const prompts = await readFile(path.join(FIXTURE, 'prompts.json'), 'utf8');
  assert.match(
    createHash('sha256').update(prompts).digest('hex'),
    /^[0-9a-f]{64}$/,
  );
});

test('reviewer matrix binds the exact policy, prompts, and corpus', async () => {
  const matrixText = await readFile(
    path.join(ROOT, 'evidence/S16/policy-and-scenario-matrix.json'),
    'utf8',
  );
  const matrix = JSON.parse(matrixText);
  const digest = async (relative) => createHash('sha256')
    .update(await readFile(path.join(ROOT, relative)))
    .digest('hex');
  assert.equal(
    matrix.policy.fileSha256,
    await digest(matrix.policy.filename),
  );
  assert.equal(
    matrix.policy.descriptorSha256,
    validateCodexLivePolicy(JSON.parse(
      await readFile(POLICY_PATH, 'utf8'),
    )).policySha256,
  );
  assert.equal(
    matrix.prompts.sha256,
    await digest(matrix.prompts.filename),
  );
  assert.equal(
    matrix.deterministicCorpus.sha256,
    await digest(matrix.deterministicCorpus.filename),
  );
  assert.equal(matrix.policy.providerInvocationsAuthorized, 0);
  assert.equal(matrix.providerExecutionCompleted, false);
  assert.deepEqual(scanPrivateText(matrixText), []);
});

test('production CLI requires an external private root and exact arguments', () => {
  const parsed = parseProductionLiveArguments([
    '--policy',
    POLICY_PATH,
    '--private-root',
    path.join(os.tmpdir(), 'scopa-s16-private-test'),
  ]);
  assert.equal(parsed.policyPath, POLICY_PATH);
  assert.equal(
    parsed.privateRoot,
    path.join(os.tmpdir(), 'scopa-s16-private-test'),
  );
  assert.throws(
    () => parseProductionLiveArguments([
      '--policy',
      POLICY_PATH,
      '--private-root',
      path.join(ROOT, 'evidence/S16/private'),
    ]),
    /must be outside the repository/,
  );
  assert.throws(
    () => parseProductionLiveArguments([]),
    /usage:/,
  );
});

test('production campaign control enforces approval, accounting, evidence, and cleanup', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s16-live-test-'));
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));
  const temporary = path.join(root, 'temporary');
  const privateRoot = path.join(root, 'private');
  const publicRoot = path.join(root, 'public');
  const sourceHome = path.join(root, 'source-home');
  await mkdir(temporary);
  await mkdir(privateRoot, { mode: 0o700 });
  await mkdir(publicRoot);
  await mkdir(path.join(sourceHome, '.codex'), {
    recursive: true,
    mode: 0o700,
  });
  await writeFile(
    path.join(sourceHome, '.codex/auth.json'),
    '{"tokens":{"account_id":"S16-TEST-ACCOUNT"}}\n',
    { mode: 0o600 },
  );
  const faultClient = path.join(FIXTURE, 'codex-fault-client.mjs');
  const auth = await prepareCodexEnvironment({
    installedIntegration: integration,
    codexCommand: faultClient,
    temporary,
    sourceHome,
  });
  const policy = createCodexLivePolicy({
    providerGate: CODEX_PROVIDER_GATE_OPEN,
    approvedOn: '2026-07-29',
    principalApproval: 'conversation-explicit',
    privateEvidenceDestinationApproval: 'conversation-explicit',
  });
  const campaign = await runCampaign({
    installed: {
      adapterCli: path.join(ROOT, 'packages/adapter-host/src/cli.js'),
      integration,
      liveRun,
      project,
      artifact: ARTIFACT,
      package: {
        ...ARTIFACT.package,
        sourceCommit: ARTIFACT.sourceCommit,
        entryCount: 173,
      },
    },
    policy,
    prompts: JSON.parse(await readFile(
      path.join(FIXTURE, 'prompts.json'),
      'utf8',
    )),
    temporary,
    privateRoot,
    publicRoot,
    codexCommand: faultClient,
    codexEnvironment: auth.environment,
    codexHome: auth.isolatedHome,
    authPath: auth.authPath,
    authBoundarySha256: auth.authBoundarySha256,
    scenarioEnvironment: (scenario) => ({
      SCOPA_S16_BASE_SCENARIO: {
        clean: 'clean',
        denied: 'denied',
        'false-green': 'falseGreen',
        'cold-restart': 'coldRestart',
      }[scenario.id],
      SCOPA_S16_FIXTURE_ROOT: ROOT,
      SCOPA_S16_MODE: 'success',
      SCOPA_S16_MUTATE_REPOSITORY: '1',
    }),
  });
  assert.equal(campaign.providerInvocations, 4);
  assert.equal(campaign.records.length, 4);
  assert.equal(
    campaign.records.every(
      (record) =>
        record.expectedCanStop === record.observedCanStop &&
        record.processGroupGone &&
        record.residue.onlyBoundedAuthRefresh,
    ),
    true,
  );
  assert.equal(campaign.aggregateUsage.input_tokens, 400);
  assert.equal(campaign.aggregateUsage.output_tokens, 80);
  assert.equal(campaign.aggregateUsage.reasoning_output_tokens, 20);
  assert.equal(campaign.aggregateUsage.total_tokens, 500);
  assert.equal(campaign.cleanup.repositoryCleanupVerified, true);
  for (const scenario of policy.scenarios.ids) {
    await access(path.join(privateRoot, `${scenario}.private.json`));
    await access(path.join(publicRoot, `${scenario}.public.json`));
    assert.equal(
      (await stat(
        path.join(privateRoot, `${scenario}.private.json`),
      )).mode & 0o777,
      0o600,
    );
    await assert.rejects(
      () => access(
        path.join(privateRoot, `${scenario}.intent.private.json`),
      ),
      { code: 'ENOENT' },
    );
    await assert.rejects(
      () => access(
        path.join(privateRoot, `${scenario}.inflight.private.json`),
      ),
      { code: 'ENOENT' },
    );
  }
});

test('all S16 deterministic edge classes preserve expected polarity and cleanup', async (context) => {
  const root = await repository();
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));
  const policy = createCodexLivePolicy();
  const corpus = validateDeterministicCorpus(JSON.parse(
    await readFile(CORPUS_PATH, 'utf8'),
  ));
  const results = [];
  for (const scenario of corpus.scenarios) {
    results.push(await runDeterministicScenario({
      scenario,
      repositoryRoot: root,
      integration,
      adapterCli: path.join(ROOT, 'packages/adapter-host/src/cli.js'),
      artifact: ARTIFACT,
      policy,
    }));
  }
  assert.equal(results.length, 21);
  assert.equal(
    results.every((result) => result.terminal.cleanup.groupGone),
    true,
  );
  assert.equal(
    results.find(
      (_, index) => corpus.scenarios[index].id === 'clean',
    ).providerInvocationStarted,
    true,
  );
  assert.equal(
    results.find(
      (_, index) => corpus.scenarios[index].id === 'client-version-drift',
    ).providerInvocationStarted,
    false,
  );
  assert.equal(
    results.find(
      (_, index) => corpus.scenarios[index].id === 'mcp-inventory-drift',
    ).providerInvocationStarted,
    false,
  );
  assert.equal(
    results.find(
      (_, index) => corpus.scenarios[index].id === 'usage-limit',
    ).terminal.reason,
    'provider-usage-limit-exceeded',
  );
  assert.equal(
    results.find(
      (_, index) => corpus.scenarios[index].id === 'cleanup-orphan',
    ).terminal.cleanup.orphanDetected,
    true,
  );
  assert.equal(
    results.filter((result) => result.terminal.canStop).length,
    4,
  );
  assert.equal(
    results.every(
      (result) =>
        result.receipt.capabilityMatrix.schema ===
          'scopa.capability-matrix.v1',
    ),
    true,
  );
  assert.equal(
    results.every(
      (result) =>
        result.receipt.environmentPolicy.inheritance ===
          'explicit-allowlist',
    ),
    true,
  );
});

test('package surface excludes operator policy, raw evidence, and private topology', async () => {
  assert.equal(
    ROOT_PACKAGE.files.includes('fixtures/S16/codex-live-policy.json'),
    false,
  );
  assert.equal(
    ROOT_PACKAGE.files.some((entry) => entry.startsWith('evidence/S16')),
    false,
  );
  const publicPolicyFiles = await Promise.all([
    readFile(
      path.join(ROOT, 'packages/integrations/codex/src/live-policy.js'),
      'utf8',
    ),
    readFile(
      path.join(ROOT, 'schemas/scopa.codex-live-policy.v1.schema.json'),
      'utf8',
    ),
  ]);
  assert.equal(
    publicPolicyFiles.every(
      (text) => scanPrivateText(text).length === 0,
    ),
    true,
  );
  assert.equal(
    publicPolicyFiles.every(
      (text) => text.includes('SCOPA_PRIVATE_EVIDENCE_ROOT/S16'),
    ),
    true,
  );
});
