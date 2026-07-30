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
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  fileURLToPath,
} from 'node:url';
import {
  jsonHash,
} from '../../../enforcement/src/index.js';
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
  CODEX_STORE_ENTRY_AUDIT_LIMIT,
  assertCodexStoreBaselineAuditable,
  parseProductionLiveArguments,
  prepareCodexEnvironment,
  productionScenariosForPolicy,
  providerStoreDelta,
  runCampaign,
  snapshotCodexStore,
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
const V2_POLICY_PATH = path.join(
  ROOT,
  'fixtures/S16R2/codex-live-policy.json',
);
const V3_POLICY_PATH = path.join(
  ROOT,
  'fixtures/S16R3/codex-live-policy.json',
);
const V4_POLICY_PATH = path.join(
  ROOT,
  'fixtures/S16R4/codex-live-policy.json',
);
const V5_POLICY_PATH = path.join(
  ROOT,
  'fixtures/S16R5/codex-live-policy.json',
);
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

test('S16-v2 policy closes the consumed fresh allowance', async () => {
  const text = await readFile(V2_POLICY_PATH, 'utf8');
  const policy = JSON.parse(text);
  const authorized = createCodexLivePolicy({
    campaignId: 'S16-v2-production-live-v1',
    providerGate: CODEX_PROVIDER_GATE_OPEN,
    approvedOn: '2026-07-29',
    principalApproval: 'conversation-explicit',
    privateEvidenceDestinationApproval: 'conversation-explicit',
  });
  assert.equal(text.endsWith('\n'), true);
  assert.equal(validateCodexLivePolicy(policy), policy);
  assert.deepEqual(
    validatePublishedContract(CODEX_LIVE_POLICY_SCHEMA, policy),
    policy,
  );
  assert.deepEqual(
    policy,
    createCodexLivePolicy({
      campaignId: 'S16-v2-production-live-v1',
    }),
  );
  assert.equal(assertCodexProviderAuthorized(authorized), authorized);
  assert.throws(
    () => assertCodexProviderAuthorized(policy),
    /provider gate is closed/,
  );
  assert.equal(
    policy.authorization.scope,
    'S16-v2-production-live-run-edge-campaign',
  );
  assert.equal(policy.scenarios.version, 'S16.v2');
  assert.equal(
    policy.evidence.privateDestination,
    'SCOPA_PRIVATE_EVIDENCE_ROOT/S16R2',
  );
  assert.equal(
    authorized.policySha256,
    'c159b0f24c78e3625fa385eb8f9c13c5375d7d130ca19deeae1ea555eb313d95',
  );
  assert.equal(
    policy.policySha256,
    '979712321d12492d4cf8701c04fd2096ed1252e597f14f361211e3452f11bf82',
  );

  const matrixPath = path.join(
    ROOT,
    'evidence/S16R2/policy-and-scenario-matrix.json',
  );
  const matrixText = await readFile(matrixPath, 'utf8');
  const matrix = JSON.parse(matrixText);
  assert.equal(
    matrix.policy.fileSha256,
    createHash('sha256').update(text).digest('hex'),
  );
  assert.equal(matrix.policy.descriptorSha256, policy.policySha256);
  assert.equal(matrix.policy.providerInvocationsAuthorized, 0);
  assert.equal(matrix.providerExecutionCompleted, false);
  assert.equal(
    matrix.attempt.authorizedPolicySha256,
    authorized.policySha256,
  );
  assert.equal(matrix.attempt.providerInvocationsConsumed, 1);
  assert.equal(matrix.attempt.providerInvocationsUnlaunched, 3);
  assert.equal(matrix.attempt.accepted, false);
  assert.equal(matrix.attempt.replayAllowed, false);
  assert.deepEqual(scanPrivateText(matrixText), []);

  const stopText = await readFile(
    path.join(ROOT, 'evidence/S16R2/campaign-stop.public.json'),
    'utf8',
  );
  const stop = JSON.parse(stopText);
  assert.equal(stop.policy.authorizedSha256, authorized.policySha256);
  assert.equal(stop.providerExecution.consumedInvocations, 1);
  assert.equal(stop.providerExecution.unlaunchedInvocations, 3);
  assert.equal(stop.providerExecution.replayAllowed, false);
  assert.equal(stop.qualification.accepted, false);
  assert.equal(stop.scenario.terminalState, 'succeeded');
  assert.equal(stop.scenario.canStop, true);
  assert.deepEqual(scanPrivateText(stopText), []);
});

test('S16-v3 closes the stopped three-scenario continuation', async () => {
  const text = await readFile(V3_POLICY_PATH, 'utf8');
  const policy = JSON.parse(text);
  const authorized = createCodexLivePolicy({
    campaignId: 'S16-v3-production-live-v1',
    providerGate: CODEX_PROVIDER_GATE_OPEN,
    approvedOn: '2026-07-30',
    principalApproval: 'conversation-explicit',
    privateEvidenceDestinationApproval: 'conversation-explicit',
  });
  const closed = createCodexLivePolicy({
    campaignId: 'S16-v3-production-live-v1',
  });
  assert.equal(text.endsWith('\n'), true);
  assert.equal(validateCodexLivePolicy(policy), policy);
  assert.deepEqual(
    validatePublishedContract(CODEX_LIVE_POLICY_SCHEMA, policy),
    policy,
  );
  assert.deepEqual(policy, closed);
  assert.equal(assertCodexProviderAuthorized(authorized), authorized);
  assert.throws(
    () => assertCodexProviderAuthorized(policy),
    /provider gate is closed/,
  );
  assert.notEqual(authorized.policySha256, policy.policySha256);
  assert.equal(
    policy.authorization.scope,
    'S16-v3-production-live-run-edge-continuation',
  );
  assert.equal(policy.scenarios.version, 'S16.v3');
  assert.deepEqual(policy.scenarios.ids, [
    'denied',
    'false-green',
    'cold-restart',
  ]);
  assert.equal(policy.limits.maxProviderInvocations, 3);
  assert.equal(policy.limits.maxCampaignInputTokens, 360_000);
  assert.equal(policy.limits.maxCampaignOutputTokens, 12_000);
  assert.equal(policy.limits.maxCampaignTotalTokens, 378_000);
  assert.equal(
    policy.evidence.privateDestination,
    'SCOPA_PRIVATE_EVIDENCE_ROOT/S16R3',
  );
  assert.equal(
    policy.policySha256,
    '898e96d064ca9789ffe095e32e4d8e0dc6bb1072c142257c0c609f186f448ccc',
  );
  assert.deepEqual(
    productionScenariosForPolicy(policy).map((scenario) => scenario.id),
    policy.scenarios.ids,
  );
  const crossed = structuredClone(policy);
  crossed.scenarios.ids[0] = 'clean';
  const {
    policySha256: ignoredPolicySha256,
    ...crossedDescriptor
  } = crossed;
  crossed.policySha256 = jsonHash(crossedDescriptor);
  assert.equal(typeof ignoredPolicySha256, 'string');
  assert.throws(
    () => validateCodexLivePolicy(crossed),
    /live scenario ids/,
  );
  assert.throws(
    () => validatePublishedContract(CODEX_LIVE_POLICY_SCHEMA, crossed),
    TypeError,
  );

  const matrixText = await readFile(
    path.join(ROOT, 'evidence/S16R3/policy-and-scenario-matrix.json'),
    'utf8',
  );
  const matrix = JSON.parse(matrixText);
  assert.equal(
    matrix.policy.fileSha256,
    createHash('sha256').update(text).digest('hex'),
  );
  assert.equal(matrix.policy.descriptorSha256, policy.policySha256);
  assert.equal(matrix.policy.providerInvocationsAuthorized, 0);
  assert.equal(matrix.providerExecutionCompleted, false);
  assert.equal(
    matrix.attempt.authorizedPolicySha256,
    authorized.policySha256,
  );
  assert.equal(matrix.attempt.providerInvocationsConsumed, 1);
  assert.equal(matrix.attempt.providerInvocationsUnlaunched, 2);
  assert.equal(matrix.attempt.accepted, false);
  assert.equal(matrix.attempt.replayAllowed, false);
  assert.equal(matrix.replayOfPredecessor, false);
  assert.deepEqual(
    matrix.liveScenarios.map((scenario) => scenario.id),
    policy.scenarios.ids,
  );
  assert.deepEqual(scanPrivateText(matrixText), []);

  const stopText = await readFile(
    path.join(ROOT, 'evidence/S16R3/campaign-stop.public.json'),
    'utf8',
  );
  const stop = JSON.parse(stopText);
  assert.equal(stop.policy.authorizedSha256, authorized.policySha256);
  assert.equal(stop.providerExecution.consumedInvocations, 1);
  assert.equal(stop.providerExecution.unlaunchedInvocations, 2);
  assert.equal(stop.providerExecution.replayAllowed, false);
  assert.equal(stop.qualification.accepted, false);
  assert.equal(
    stop.qualification.reason,
    'client-store-entry-audit-bound-exceeded',
  );
  assert.equal(stop.scenario.id, 'denied');
  assert.equal(stop.scenario.terminalState, 'succeeded');
  assert.equal(stop.scenario.canStop, true);
  assert.equal(stop.scenario.processGroupGone, true);
  assert.deepEqual(scanPrivateText(stopText), []);
});

test('S16-v4 closes the stopped two-scenario continuation', async () => {
  const text = await readFile(V4_POLICY_PATH, 'utf8');
  const policy = JSON.parse(text);
  const authorized = createCodexLivePolicy({
    campaignId: 'S16-v4-production-live-v1',
    providerGate: CODEX_PROVIDER_GATE_OPEN,
    approvedOn: '2026-07-30',
    principalApproval: 'conversation-explicit',
    privateEvidenceDestinationApproval: 'conversation-explicit',
  });
  const closed = createCodexLivePolicy({
    campaignId: 'S16-v4-production-live-v1',
  });
  assert.equal(text.endsWith('\n'), true);
  assert.equal(validateCodexLivePolicy(policy), policy);
  assert.deepEqual(
    validatePublishedContract(CODEX_LIVE_POLICY_SCHEMA, policy),
    policy,
  );
  assert.deepEqual(policy, closed);
  assert.equal(assertCodexProviderAuthorized(authorized), authorized);
  assert.throws(
    () => assertCodexProviderAuthorized(policy),
    /provider gate is closed/,
  );
  assert.notEqual(authorized.policySha256, policy.policySha256);
  assert.equal(
    policy.authorization.scope,
    'S16-v4-production-live-run-edge-continuation',
  );
  assert.equal(policy.scenarios.version, 'S16.v4');
  assert.deepEqual(policy.scenarios.ids, [
    'false-green',
    'cold-restart',
  ]);
  assert.equal(policy.limits.maxProviderInvocations, 2);
  assert.equal(policy.limits.maxCampaignInputTokens, 240_000);
  assert.equal(policy.limits.maxCampaignOutputTokens, 8_000);
  assert.equal(policy.limits.maxCampaignTotalTokens, 252_000);
  assert.equal(
    policy.evidence.privateDestination,
    'SCOPA_PRIVATE_EVIDENCE_ROOT/S16R4',
  );
  assert.equal(
    policy.policySha256,
    'd55501f9212e1c8b2f0f68e3e649ecdaf80de4fbcb0fbc30a7316f95d3ac657c',
  );
  assert.deepEqual(
    productionScenariosForPolicy(policy).map((scenario) => scenario.id),
    policy.scenarios.ids,
  );
  const crossed = structuredClone(policy);
  crossed.scenarios.ids[0] = 'denied';
  const {
    policySha256: ignoredPolicySha256,
    ...crossedDescriptor
  } = crossed;
  crossed.policySha256 = jsonHash(crossedDescriptor);
  assert.equal(typeof ignoredPolicySha256, 'string');
  assert.throws(
    () => validateCodexLivePolicy(crossed),
    /live scenario ids/,
  );
  assert.throws(
    () => validatePublishedContract(CODEX_LIVE_POLICY_SCHEMA, crossed),
    TypeError,
  );

  const matrixText = await readFile(
    path.join(ROOT, 'evidence/S16R4/policy-and-scenario-matrix.json'),
    'utf8',
  );
  const matrix = JSON.parse(matrixText);
  assert.equal(
    matrix.policy.fileSha256,
    createHash('sha256').update(text).digest('hex'),
  );
  assert.equal(matrix.policy.descriptorSha256, policy.policySha256);
  assert.equal(matrix.policy.providerInvocationsAuthorized, 0);
  assert.equal(matrix.providerExecutionCompleted, false);
  assert.equal(matrix.predecessor.providerInvocationsConsumed, 1);
  assert.equal(matrix.predecessor.providerInvocationsUnlaunched, 2);
  assert.equal(matrix.predecessor.replayAllowed, false);
  assert.equal(matrix.replayOfPredecessor, false);
  assert.equal(
    matrix.attempt.authorizedPolicySha256,
    authorized.policySha256,
  );
  assert.equal(matrix.attempt.providerInvocationsConsumed, 1);
  assert.equal(matrix.attempt.providerInvocationsUnlaunched, 1);
  assert.equal(matrix.attempt.accepted, false);
  assert.equal(matrix.attempt.replayAllowed, false);
  assert.deepEqual(
    matrix.liveScenarios.map((scenario) => scenario.id),
    policy.scenarios.ids,
  );
  assert.deepEqual(scanPrivateText(matrixText), []);

  const stopText = await readFile(
    path.join(ROOT, 'evidence/S16R4/campaign-stop.public.json'),
    'utf8',
  );
  const stop = JSON.parse(stopText);
  assert.equal(stop.policy.authorizedSha256, authorized.policySha256);
  assert.equal(stop.providerExecution.consumedInvocations, 1);
  assert.equal(stop.providerExecution.unlaunchedInvocations, 1);
  assert.equal(stop.providerExecution.replayAllowed, false);
  assert.equal(stop.qualification.accepted, false);
  assert.equal(
    stop.qualification.reason,
    'unexpected-client-store-residue',
  );
  assert.equal(stop.scenario.id, 'false-green');
  assert.equal(stop.scenario.terminalState, 'succeeded');
  assert.equal(stop.scenario.canStop, false);
  assert.equal(stop.scenario.processGroupGone, true);
  assert.deepEqual(scanPrivateText(stopText), []);
});

test('S16-v5 rejects a standalone cold-restart before provider intent', async () => {
  const text = await readFile(V5_POLICY_PATH, 'utf8');
  const policy = JSON.parse(text);
  assert.deepEqual(
    policy,
    createCodexLivePolicy({ campaignId: 'S16-v5-production-live-v1' }),
  );
  assert.deepEqual(
    validatePublishedContract(CODEX_LIVE_POLICY_SCHEMA, policy),
    policy,
  );
  assert.throws(
    () => assertCodexProviderAuthorized(policy),
    /provider gate is closed/,
  );
  assert.deepEqual(policy.scenarios.ids, ['cold-restart']);
  assert.equal(policy.limits.maxProviderInvocations, 1);
  assert.equal(policy.policySha256, 'b24554363a35b461833e6dbe90e8ce18a816aeceff56adce2b1c0634c5dba921');
  assert.throws(
    () => productionScenariosForPolicy(policy),
    /cold-restart requires an earlier defined repository lineage/,
  );
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

test('oversized client-store residue is metadata-audited and rejected', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s16-store-'));
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));
  await mkdir(path.join(root, '.codex'));
  await writeFile(
    path.join(root, '.codex/provider-state.sqlite'),
    Buffer.alloc(3 * 1024 * 1024, 7),
  );
  const snapshot = await snapshotCodexStore(root);
  const oversized = snapshot.find(
    (entry) => entry.path === '.codex/provider-state.sqlite',
  );
  assert.equal(oversized.bytes, 3 * 1024 * 1024);
  assert.equal(oversized.sha256, null);

  const auth = {
    path: '.codex/auth.json',
    kind: 'file',
    bytes: 128,
    sha256: 'a'.repeat(64),
  };
  const residue = providerStoreDelta(
    [auth],
    [
      auth,
      {
        ...oversized,
      },
    ],
  );
  assert.equal(residue.onlyBoundedAuthRefresh, false);
  assert.equal(residue.added.length, 1);
  assert.equal(residue.added[0].bytes, 3 * 1024 * 1024);
  assert.equal('path' in residue.added[0], false);
  assert.match(residue.added[0].pathSha256, /^[0-9a-f]{64}$/);
  assert.throws(
    () => assertCodexStoreBaselineAuditable(snapshot),
    /baseline contains an oversized file/,
  );
});

test('client-store audit streams current inventories and rejects exhaustion', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s16-hostile-store-'));
  context.after(() => rm(root, {
    recursive: true,
    force: true,
  }));
  await writeFile(path.join(root, 'target'), 'bounded\n');
  await symlink('target', path.join(root, 'link'));
  await assert.rejects(
    () => snapshotCodexStore(root),
    /contains a symlink/,
  );

  await rm(path.join(root, 'link'));
  await rm(path.join(root, 'target'));
  await Promise.all(
    Array.from({ length: 256 }, (_, index) =>
      writeFile(path.join(root, `entry-${String(index).padStart(3, '0')}`), '')
    ),
  );
  assert.equal((await snapshotCodexStore(root)).length, 256);
  await assert.rejects(
    () => snapshotCodexStore(root, {
      maxEntries: 64,
    }),
    /entry audit bound/,
  );
  assert.equal(CODEX_STORE_ENTRY_AUDIT_LIMIT, 4096);
  await assert.rejects(
    () => snapshotCodexStore(root, {
      maxEntries: CODEX_STORE_ENTRY_AUDIT_LIMIT + 1,
    }),
    /audit limit is invalid/,
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
    policyPath: POLICY_PATH,
  });
  assert.deepEqual(
    parseDeterministicArguments([
      '--policy',
      V2_POLICY_PATH,
      '--output',
      path.join(os.tmpdir(), 's16-v2-deterministic.json'),
    ]),
    {
      output: path.join(os.tmpdir(), 's16-v2-deterministic.json'),
      policyPath: V2_POLICY_PATH,
    },
  );
  assert.deepEqual(
    parseDeterministicArguments([
      '--policy',
      V3_POLICY_PATH,
    ]),
    {
      output: null,
      policyPath: V3_POLICY_PATH,
    },
  );
  assert.deepEqual(
    parseDeterministicArguments([
      '--policy',
      V4_POLICY_PATH,
    ]),
    {
      output: null,
      policyPath: V4_POLICY_PATH,
    },
  );
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
  assert.equal(parsed.publicRoot, path.join(ROOT, 'evidence/S16'));
  assert.equal(parsed.expectedPolicyId, 'S16-production-live-v1');
  const v2 = parseProductionLiveArguments([
    '--policy',
    V2_POLICY_PATH,
    '--private-root',
    path.join(os.tmpdir(), 'scopa-s16-v2-private-test'),
  ]);
  assert.equal(v2.publicRoot, path.join(ROOT, 'evidence/S16R2'));
  assert.equal(v2.expectedPolicyId, 'S16-v2-production-live-v1');
  const v3 = parseProductionLiveArguments([
    '--policy',
    V3_POLICY_PATH,
    '--private-root',
    path.join(os.tmpdir(), 'scopa-s16-v3-private-test'),
  ]);
  assert.equal(v3.publicRoot, path.join(ROOT, 'evidence/S16R3'));
  assert.equal(v3.expectedPolicyId, 'S16-v3-production-live-v1');
  const v4 = parseProductionLiveArguments([
    '--policy',
    V4_POLICY_PATH,
    '--private-root',
    path.join(os.tmpdir(), 'scopa-s16-v4-private-test'),
  ]);
  assert.equal(v4.publicRoot, path.join(ROOT, 'evidence/S16R4'));
  assert.equal(v4.expectedPolicyId, 'S16-v4-production-live-v1');
  const v5 = parseProductionLiveArguments([
    '--policy',
    V5_POLICY_PATH,
    '--private-root',
    path.join(os.tmpdir(), 'scopa-s16-v5-private-test'),
  ]);
  assert.equal(v5.publicRoot, path.join(ROOT, 'evidence/S16R5'));
  assert.equal(v5.expectedPolicyId, 'S16-v5-production-live-v1');
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

test('production campaign control enforces approval, accounting, evidence, and cleanup', {
  concurrency: false,
}, async (context) => {
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
    authBytes: auth.authBytes,
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
        record.runtimeStateDeletionVerified,
    ),
    true,
  );
  assert.equal(campaign.aggregateUsage.input_tokens, 400);
  assert.equal(campaign.aggregateUsage.output_tokens, 80);
  assert.equal(campaign.aggregateUsage.reasoning_output_tokens, 20);
  assert.equal(campaign.aggregateUsage.total_tokens, 500);
  assert.equal(campaign.cleanup.repositoryCleanupVerified, true);
  assert.equal(campaign.cleanup.runtimeStateDeletionVerified, true);
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
    await assert.rejects(
      () => access(path.join(privateRoot, `${scenario}.store-audit.private.json`)),
      { code: 'ENOENT' },
    );
  }
});

test('disposable Codex runtime state is bounded, private, and deleted between runs', {
  concurrency: false,
}, async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s16-residue-test-'));
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
  const prompts = JSON.parse(await readFile(
    path.join(FIXTURE, 'prompts.json'),
    'utf8',
  ));
  const campaign = await runCampaign({
    installed: {
      adapterCli: path.join(ROOT, 'packages/adapter-host/src/cli.js'), integration, liveRun, project, artifact: ARTIFACT,
      package: { ...ARTIFACT.package, sourceCommit: ARTIFACT.sourceCommit, entryCount: 173 },
    }, policy, prompts, temporary, privateRoot, publicRoot, codexCommand: faultClient,
    codexEnvironment: auth.environment, codexHome: auth.isolatedHome,
    authPath: auth.authPath, authBytes: auth.authBytes,
    authBoundarySha256: auth.authBoundarySha256,
    scenarioEnvironment: (scenario) => ({
      SCOPA_S16_BASE_SCENARIO: {
        clean: 'clean', denied: 'denied', 'false-green': 'falseGreen',
        'cold-restart': 'coldRestart',
      }[scenario.id],
      SCOPA_S16_FIXTURE_ROOT: ROOT,
      SCOPA_S16_MODE: 'store-residue',
      SCOPA_S16_MUTATE_REPOSITORY: '1',
    }),
  });
  assert.equal(campaign.records[0].residue.added.length, 1);
  assert.equal(campaign.records[0].runtimeStateDeletionVerified, true);
  await assert.rejects(() => access(path.join(temporary, 'codex-runtime-clean')), { code: 'ENOENT' });
  await mkdir(path.join(root, 'drift-private'), { mode: 0o700 });
  await mkdir(path.join(root, 'drift-public'));
  await assert.rejects(
    () => runCampaign({
      installed: {
        adapterCli: path.join(ROOT, 'packages/adapter-host/src/cli.js'), integration, liveRun, project, artifact: ARTIFACT,
        package: { ...ARTIFACT.package, sourceCommit: ARTIFACT.sourceCommit, entryCount: 173 },
      }, policy, prompts, temporary,
      privateRoot: path.join(root, 'drift-private'),
      publicRoot: path.join(root, 'drift-public'),
      codexCommand: faultClient,
      codexEnvironment: auth.environment, codexHome: auth.isolatedHome,
      authPath: auth.authPath, authBytes: auth.authBytes,
      authBoundarySha256: auth.authBoundarySha256,
      scenarioEnvironment: () => ({
        SCOPA_S16_BASE_SCENARIO: 'clean', SCOPA_S16_FIXTURE_ROOT: ROOT,
        SCOPA_S16_MODE: 'auth-drift',
      }),
    }),
    /authenticated Codex identity changed/,
  );
  await assert.rejects(
    () => access(path.join(temporary, 'codex-runtime-clean')),
    { code: 'ENOENT' },
  );
});

test('all S16 deterministic edge classes preserve expected polarity and cleanup', {
  concurrency: false,
}, async (context) => {
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
    ROOT_PACKAGE.files.some((entry) => entry.startsWith('fixtures/S16')),
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
