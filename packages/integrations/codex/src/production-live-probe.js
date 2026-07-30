#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  execFile,
} from 'node:child_process';
import {
  createHash,
} from 'node:crypto';
import {
  access,
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  open,
  opendir,
  readFile,
  realpath,
  rm,
  stat,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  promisify,
} from 'node:util';
import {
  fileURLToPath,
  pathToFileURL,
} from 'node:url';
import {
  canonicalJsonPretty,
  jsonHash,
} from '../../../enforcement/src/index.js';
import {
  packCandidate,
} from '../../../release-readiness/src/artifact.js';
import {
  scanPrivateText,
} from '../../../release-readiness/src/package-privacy.js';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const FIXTURE = path.join(ROOT, 'fixtures/S16');
const CAMPAIGN_CONFIGS = Object.freeze([
  Object.freeze({
    policyPath: path.join(FIXTURE, 'codex-live-policy.json'),
    policyId: 'S16-production-live-v1',
    publicRoot: path.join(ROOT, 'evidence/S16'),
  }),
  Object.freeze({
    policyPath: path.join(
      ROOT,
      'fixtures/S16R2/codex-live-policy.json',
    ),
    policyId: 'S16-v2-production-live-v1',
    publicRoot: path.join(ROOT, 'evidence/S16R2'),
  }),
  Object.freeze({
    policyPath: path.join(
      ROOT,
      'fixtures/S16R3/codex-live-policy.json',
    ),
    policyId: 'S16-v3-production-live-v1',
    publicRoot: path.join(ROOT, 'evidence/S16R3'),
  }),
]);
const MAX_AUTH_BYTES = 1024 * 1024;
const MAX_STORE_HASH_BYTES = 2 * 1024 * 1024;
export const CODEX_STORE_ENTRY_AUDIT_LIMIT = 4096;

export const S16_PRODUCTION_SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'clean',
    promptKey: 'clean',
    repository: 'clean',
    definition: 'clean.slice-definition.json',
    expectedCanStop: true,
    expectedTools: Object.freeze([
      'scopa_orientation',
      'scopa_read_file',
      'scopa_write_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ]),
  }),
  Object.freeze({
    id: 'denied',
    promptKey: 'denied',
    repository: 'denied',
    definition: 'clean.slice-definition.json',
    expectedCanStop: true,
    expectedTools: Object.freeze([
      'scopa_orientation',
      'scopa_write_file',
      'scopa_write_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ]),
  }),
  Object.freeze({
    id: 'false-green',
    promptKey: 'falseGreen',
    repository: 'false-green',
    definition: 'failing.slice-definition.json',
    expectedCanStop: false,
    expectedTools: Object.freeze([
      'scopa_orientation',
      'scopa_write_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ]),
  }),
  Object.freeze({
    id: 'cold-restart',
    promptKey: 'coldRestart',
    repository: 'clean',
    definition: null,
    expectedCanStop: true,
    expectedTools: Object.freeze([
      'scopa_orientation',
      'scopa_read_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ]),
  }),
]);

export function productionScenariosForPolicy(policy) {
  return policy.scenarios.ids.map((id) => {
    const scenario = S16_PRODUCTION_SCENARIOS.find(
      (candidate) => candidate.id === id,
    );
    if (scenario === undefined) {
      throw new TypeError(`unknown Codex production scenario ${id}`);
    }
    return scenario;
  });
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function withinRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export function parseProductionLiveArguments(argv) {
  if (
    argv.length !== 4 ||
    argv[0] !== '--policy' ||
    argv[2] !== '--private-root'
  ) {
    throw new Error(
      'usage: production-live-probe.js --policy <json-file> ' +
      '--private-root <directory>',
    );
  }
  const privateRoot = path.resolve(argv[3]);
  const policyPath = path.resolve(argv[1]);
  const campaign = CAMPAIGN_CONFIGS.find(
    (candidate) => candidate.policyPath === policyPath,
  );
  if (campaign === undefined) {
    throw new TypeError(
      'campaign policy must be a committed Codex production policy',
    );
  }
  if (withinRoot(ROOT, privateRoot)) {
    throw new TypeError(
      'private Codex evidence root must be outside the repository',
    );
  }
  return {
    policyPath,
    privateRoot,
    publicRoot: campaign.publicRoot,
    expectedPolicyId: campaign.policyId,
    expectedPolicyPath: campaign.policyPath,
  };
}

export async function assertCleanCandidate() {
  const status = (
    await execFileAsync('git', [
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    })
  ).stdout;
  if (status.length !== 0) {
    throw new TypeError(
      'Codex production campaign requires a clean committed candidate',
    );
  }
  return (
    await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
  ).stdout.trim();
}

export async function installPackedRuntime(temporary, sourceCommit) {
  const packed = await packCandidate({
    sourceRoot: ROOT,
    outputDirectory: temporary,
    requireClean: true,
  });
  if (packed.manifest.source.commit !== sourceCommit) {
    throw new TypeError('packed candidate changed during Codex staging');
  }
  const consumer = path.join(temporary, 'installed-consumer');
  await mkdir(consumer);
  await writeNoReplace(
    path.join(consumer, 'package.json'),
    {
      name: 'scopa-s16-production',
      version: '1.0.0',
      private: true,
    },
    0o600,
  );
  await execFileAsync('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
    packed.artifactPath,
  ], {
    cwd: consumer,
    encoding: 'utf8',
  });
  const installedRoot = await realpath(path.join(
    consumer,
    'node_modules/@heart-ai-foundation/scopa',
  ));
  const modulePath = async (relative) => {
    const resolved = await realpath(path.join(installedRoot, relative));
    assert.equal(withinRoot(installedRoot, resolved), true);
    return resolved;
  };
  return {
    adapterCli: await modulePath('packages/adapter-host/src/cli.js'),
    integration: await import(pathToFileURL(
      await modulePath('packages/integrations/codex/src/index.js'),
    ).href),
    liveRun: await import(pathToFileURL(
      await modulePath('packages/live-run/src/index.js'),
    ).href),
    project: await import(pathToFileURL(
      await modulePath('packages/cli/src/project.js'),
    ).href),
    artifact: {
      schema: 'scopa.installed-artifact-identity.v1',
      sourceCommit,
      package: {
        name: packed.manifest.package.name,
        version: packed.manifest.package.version,
        sha256: packed.manifest.package.sha256,
        integrity: packed.manifest.package.integrity,
      },
    },
    package: {
      name: packed.manifest.package.name,
      version: packed.manifest.package.version,
      sourceCommit,
      sha256: packed.manifest.package.sha256,
      integrity: packed.manifest.package.integrity,
      entryCount: packed.manifest.package.entryCount,
    },
  };
}

async function createRepository({
  root,
  definitionFile,
  initializeProject,
}) {
  await mkdir(root);
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'workspace'));
  const definition = JSON.parse(await readFile(
    path.join(ROOT, 'fixtures/S9', definitionFile),
    'utf8',
  ));
  await writeNoReplace(
    path.join(root, 'scopa.slice-definition.json'),
    definition,
    0o600,
  );
  const task = await open(path.join(root, 'task.txt'), 'wx', 0o600);
  try {
    await task.writeFile(
      'Write only the exact synthetic scenario content requested.\n',
      'utf8',
    );
    await task.sync();
  } finally {
    await task.close();
  }
  await initializeProject({
    repoRoot: root,
    definitionPath: 'scopa.slice-definition.json',
  });
}

export async function writeNoReplace(filename, value, mode) {
  const text = typeof value === 'string'
    ? value
    : canonicalJsonPretty(value);
  const handle = await open(filename, 'wx', mode);
  try {
    await handle.writeFile(text, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  return {
    bytes: Buffer.byteLength(text, 'utf8'),
    sha256: sha256(text),
  };
}

export async function assertPathAbsent(target, label) {
  try {
    await access(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new TypeError(`${label} already exists; refusing provider replay`);
}

export async function removeAndVerify(target) {
  await rm(target, {
    recursive: true,
    force: true,
  });
  await assert.rejects(
    () => access(target),
    { code: 'ENOENT' },
  );
}

function accountIdentifier(auth) {
  for (const value of [
    auth?.tokens?.account_id,
    auth?.tokens?.accountId,
    auth?.account_id,
    auth?.accountId,
  ]) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

async function authBoundary(authPath) {
  const bytes = await readFile(authPath);
  if (bytes.length === 0 || bytes.length > MAX_AUTH_BYTES) {
    throw new TypeError('Codex auth material is outside the bounded size');
  }
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new TypeError('Codex auth material is not valid JSON');
  }
  const identifier = accountIdentifier(parsed);
  return jsonHash({
    kind: identifier === null ? 'bounded-auth-file' : 'account-id',
    valueSha256: sha256(identifier === null ? bytes : identifier),
  });
}

export async function snapshotCodexStore(
  root,
  {
    maxEntries = CODEX_STORE_ENTRY_AUDIT_LIMIT,
  } = {},
) {
  if (
    !Number.isSafeInteger(maxEntries) ||
    maxEntries <= 0 ||
    maxEntries > CODEX_STORE_ENTRY_AUDIT_LIMIT
  ) {
    throw new TypeError('Codex store entry audit limit is invalid');
  }
  const resolvedRoot = await realpath(root);
  const records = [];
  async function walk(directory, prefix) {
    const entries = [];
    const handle = await opendir(directory);
    for await (const entry of handle) {
      entries.push(entry);
      if (records.length + entries.length > maxEntries) {
        throw new TypeError(
          'Codex isolated store exceeds its entry audit bound',
        );
      }
    }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const relative = prefix === ''
        ? entry.name
        : `${prefix}/${entry.name}`;
      const filename = path.join(directory, entry.name);
      const metadata = await lstat(filename);
      if (metadata.isSymbolicLink()) {
        throw new TypeError('Codex isolated store contains a symlink');
      }
      if (metadata.isDirectory()) {
        records.push({
          path: relative,
          kind: 'directory',
          bytes: 0,
          sha256: null,
        });
        await walk(filename, relative);
      } else if (metadata.isFile()) {
        const digest = metadata.size <= MAX_STORE_HASH_BYTES
          ? sha256(await readFile(filename))
          : null;
        records.push({
          path: relative,
          kind: 'file',
          bytes: metadata.size,
          sha256: digest,
        });
      } else {
        throw new TypeError('Codex isolated store has a special file');
      }
      if (records.length > maxEntries) {
        throw new TypeError(
          'Codex isolated store exceeds its entry audit bound',
        );
      }
    }
  }
  await walk(resolvedRoot, '');
  return records;
}

export function providerStoreDelta(before, after) {
  const prior = new Map(before.map((entry) => [entry.path, entry]));
  const current = new Map(after.map((entry) => [entry.path, entry]));
  const added = after.filter((entry) => !prior.has(entry.path));
  const removed = before.filter((entry) => !current.has(entry.path));
  const changed = after.filter((entry) => {
    const previous = prior.get(entry.path);
    return previous && (
      previous.kind !== entry.kind ||
      previous.bytes !== entry.bytes ||
      previous.sha256 !== entry.sha256
    );
  });
  const onlyAuthRefresh = (
    added.length === 0 &&
    removed.length === 0 &&
    changed.every(
      (entry) =>
        entry.kind === 'file' &&
        entry.path === '.codex/auth.json',
    )
  );
  const safeEntries = (entries) => entries.map((entry) => ({
    pathSha256: jsonHash(entry.path),
    kind: entry.kind,
    bytes: entry.bytes,
  }));
  return {
    added: safeEntries(added),
    removed: safeEntries(removed),
    changed: safeEntries(changed),
    onlyBoundedAuthRefresh: onlyAuthRefresh,
  };
}

export function assertCodexStoreBaselineAuditable(snapshot) {
  const ambiguous = snapshot.filter(
    (entry) => entry.kind === 'file' && entry.sha256 === null,
  );
  if (ambiguous.length > 0) {
    throw new TypeError(
      'Codex isolated store baseline contains an oversized file',
    );
  }
  return snapshot;
}

export async function prepareCodexEnvironment({
  installedIntegration,
  codexCommand,
  temporary,
  sourceHome = os.homedir(),
}) {
  const sourceCodexRoot = await realpath(path.join(sourceHome, '.codex'));
  const sourceAuth = await realpath(path.join(sourceCodexRoot, 'auth.json'));
  if (!withinRoot(sourceCodexRoot, sourceAuth)) {
    throw new TypeError('Codex auth material escaped its source root');
  }
  const sourceMetadata = await lstat(sourceAuth);
  if (
    !sourceMetadata.isFile() ||
    sourceMetadata.isSymbolicLink() ||
    (sourceMetadata.mode & 0o077) !== 0
  ) {
    throw new TypeError('Codex auth material has unsafe metadata');
  }
  const authBytes = await readFile(sourceAuth);
  if (authBytes.length === 0 || authBytes.length > MAX_AUTH_BYTES) {
    throw new TypeError('Codex auth material is outside the bounded size');
  }

  const isolatedHome = path.join(temporary, 'isolated-codex-home');
  const isolatedCodexRoot = path.join(isolatedHome, '.codex');
  await mkdir(isolatedCodexRoot, {
    recursive: true,
    mode: 0o700,
  });
  for (const directory of [
    '.cache',
    '.config',
    '.local/share',
    '.runtime',
  ]) {
    await mkdir(path.join(isolatedHome, directory), {
      recursive: true,
      mode: 0o700,
    });
  }
  const isolatedAuth = path.join(isolatedCodexRoot, 'auth.json');
  const authHandle = await open(isolatedAuth, 'wx', 0o600);
  try {
    await authHandle.writeFile(authBytes);
    await authHandle.sync();
  } finally {
    await authHandle.close();
  }
  await chmod(isolatedAuth, 0o600);

  const environment = installedIntegration.createCodexAllowedEnvironment();
  Object.assign(environment, {
    HOME: isolatedHome,
    XDG_CACHE_HOME: path.join(isolatedHome, '.cache'),
    XDG_CONFIG_HOME: path.join(isolatedHome, '.config'),
    XDG_DATA_HOME: path.join(isolatedHome, '.local/share'),
    XDG_RUNTIME_DIR: path.join(isolatedHome, '.runtime'),
  });
  const statusResult = await execFileAsync(
    codexCommand,
    ['login', 'status'],
    {
      cwd: temporary,
      encoding: 'utf8',
      env: environment,
      timeout: 10_000,
      maxBuffer: 64 * 1024,
    },
  );
  const statusText = `${statusResult.stdout}${statusResult.stderr}`;
  if (statusText.length === 0) {
    throw new TypeError('Codex login status returned no bounded evidence');
  }
  const baselineStore = assertCodexStoreBaselineAuditable(
    await snapshotCodexStore(isolatedHome),
  );
  return {
    environment,
    isolatedHome,
    authPath: isolatedAuth,
    authBoundarySha256: await authBoundary(isolatedAuth),
    statusSha256: sha256(statusText),
    baselineStore,
  };
}

function shortToolNames(run) {
  return run.normalized.toolCalls.map((call) => call.tool);
}

function findTool(run, name) {
  const call = run.normalized.toolCalls.findLast(
    (entry) => entry.tool === name,
  );
  assert.ok(call, `missing ${name}`);
  return call;
}

async function assertScenarioOutcome({
  run,
  scenario,
  repositoryRoot,
  campaignRoot,
}) {
  assert.equal(run.terminal.state, 'succeeded', scenario.id);
  assert.equal(run.terminal.cleanup.groupGone, true, scenario.id);
  assert.equal(run.terminal.cleanup.orphanDetected, false, scenario.id);
  assert.ok(run.normalized, scenario.id);
  assert.equal(run.normalized.final.scenario, scenario.id, scenario.id);
  assert.equal(
    run.normalized.final.canStop,
    scenario.expectedCanStop,
    scenario.id,
  );
  assert.deepEqual(
    shortToolNames(run),
    scenario.expectedTools,
    scenario.id,
  );
  if (scenario.id === 'clean') {
    assert.equal(
      await readFile(
        path.join(repositoryRoot, 'workspace/codex.txt'),
        'utf8',
      ),
      'CODEX_ALLOWED\n',
    );
  }
  if (scenario.id === 'denied') {
    const writes = run.normalized.toolCalls.filter(
      (entry) => entry.tool === 'scopa_write_file',
    );
    assert.equal(writes[0]?.isError, true);
    assert.equal(writes[0]?.result?.code, 'SCOPA_SCOPE_DENIED');
    assert.equal(writes[1]?.isError, false);
    assert.equal(run.normalized.final.denialObserved, true);
    await assert.rejects(
      () => access(path.join(campaignRoot, 'codex-escape.txt')),
      { code: 'ENOENT' },
    );
  }
  if (scenario.id === 'false-green') {
    const check = findTool(run, 'scopa_check');
    assert.equal(check.isError, true);
    assert.equal(check.result.state.canStop, false);
    assert.equal(run.normalized.final.status, 'blocked');
  }
  if (scenario.id === 'cold-restart') {
    assert.equal(
      findTool(run, 'scopa_read_file').result.content,
      'CODEX_ALLOWED\n',
    );
  }
}

function zeroUsage() {
  return {
    input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 0,
  };
}

function addUsage(current, usage, codexUsageTotal) {
  return {
    input_tokens: current.input_tokens + usage.input_tokens,
    output_tokens: current.output_tokens + usage.output_tokens,
    reasoning_output_tokens:
      current.reasoning_output_tokens + usage.reasoning_output_tokens,
    total_tokens: current.total_tokens + codexUsageTotal(usage),
  };
}

function assertCampaignUsage(policy, usage) {
  if (
    usage.input_tokens > policy.limits.maxCampaignInputTokens ||
    usage.output_tokens > policy.limits.maxCampaignOutputTokens ||
    usage.total_tokens > policy.limits.maxCampaignTotalTokens
  ) {
    throw new TypeError('Codex campaign exceeded aggregate token policy');
  }
}

export async function runCampaign({
  installed,
  policy,
  prompts,
  temporary,
  privateRoot,
  publicRoot,
  codexCommand = 'codex',
  codexEnvironment,
  codexHome,
  authPath,
  authBoundarySha256,
  scenarios = S16_PRODUCTION_SCENARIOS,
  scenarioEnvironment = () => ({}),
}) {
  installed.integration.assertCodexProviderAuthorized(policy);
  assert.equal(scenarios.length, policy.limits.maxProviderInvocations);
  assert.deepEqual(
    scenarios.map((scenario) => scenario.id),
    policy.scenarios.ids,
  );
  const matrix = installed.integration.createCodexCapabilityMatrix({});
  const repositories = new Map();
  const records = [];
  let aggregateUsage = zeroUsage();
  let providerInvocations = 0;
  let repositoryCleanupVerified = false;
  try {
    for (const scenario of scenarios) {
      if (scenario.definition !== null) {
        const repositoryRoot = path.join(
          temporary,
          `repository-${scenario.repository}`,
        );
        await createRepository({
          root: repositoryRoot,
          definitionFile: scenario.definition,
          initializeProject: installed.project.initializeProject,
        });
        repositories.set(scenario.repository, repositoryRoot);
      }
      const repositoryRoot = repositories.get(scenario.repository);
      assert.ok(repositoryRoot, `missing repository for ${scenario.id}`);
      const prompt = prompts[scenario.promptKey];
      assert.equal(typeof prompt, 'string');
      const intentPath = path.join(
        privateRoot,
        `${scenario.id}.intent.private.json`,
      );
      const journalPath = path.join(
        privateRoot,
        `${scenario.id}.inflight.private.json`,
      );
      const privatePath = path.join(
        privateRoot,
        `${scenario.id}.private.json`,
      );
      const publicPath = path.join(
        publicRoot,
        `${scenario.id}.public.json`,
      );
      for (const [target, label] of [
        [intentPath, `${scenario.id} invocation intent`],
        [journalPath, `${scenario.id} recovery journal`],
        [privatePath, `${scenario.id} private evidence`],
        [publicPath, `${scenario.id} public evidence`],
      ]) {
        await assertPathAbsent(target, label);
      }
      const beforeStore = await snapshotCodexStore(codexHome);
      const beforeIdentity = await authBoundary(authPath);
      if (beforeIdentity !== authBoundarySha256) {
        throw new TypeError('authenticated Codex identity changed');
      }
      await writeNoReplace(intentPath, {
        schema: 'scopa.codex-live-run-intent.private.v1',
        sourceCommit: installed.artifact.sourceCommit,
        livePolicySha256: policy.policySha256,
        scenario: {
          id: scenario.id,
          version: policy.scenarios.version,
        },
        providerInvocationMayBeConsumed: true,
        tokenReservation: {
          input: policy.limits.maxInputTokensPerRun,
          output: policy.limits.maxOutputTokensPerRun,
          reasoning: policy.limits.maxReasoningTokensPerRun,
          total: policy.limits.maxTotalTokensPerRun,
        },
      }, 0o600);
      if (providerInvocations >= policy.limits.maxProviderInvocations) {
        throw new TypeError('Codex provider invocation limit exhausted');
      }
      const run = await installed.integration.runCodexSession({
        repoRoot: repositoryRoot,
        adapterCli: installed.adapterCli,
        session: installed.integration.createCodexSession({
          sessionId: `S16-${scenario.id}`,
          request: prompt,
        }),
        capabilityMatrix: matrix,
        installedArtifact: installed.artifact,
        scenario: {
          id: scenario.id,
          version: policy.scenarios.version,
        },
        prompt,
        model: policy.model.requested,
        codexCommand,
        timeoutMs: policy.limits.timeoutMs,
        maxCaptureBytes: policy.limits.maxCaptureBytes,
        usageLimits:
          installed.integration.codexPolicyUsageLimits(policy),
        baseEnvironment: {
          ...codexEnvironment,
          ...scenarioEnvironment(scenario),
        },
        environmentInheritance: policy.environment.inheritance,
      });
      if (run.providerInvocationStarted === true) {
        providerInvocations += 1;
      }
      const journal = {
        schema: 'scopa.codex-live-run-journal.private.v1',
        sourceCommit: installed.artifact.sourceCommit,
        livePolicySha256: policy.policySha256,
        scenario: {
          id: scenario.id,
          version: policy.scenarios.version,
        },
        receipt: run.receipt,
        terminal: run.terminal,
        private: {
          stdout: run.privateCapture.stdout,
          stderr: run.privateCapture.stderr,
          accountBoundarySha256: authBoundarySha256,
        },
      };
      const journalText = canonicalJsonPretty(journal);
      if (
        Buffer.byteLength(journalText, 'utf8') >
        policy.evidence.maxPrivateBytesPerRun
      ) {
        throw new TypeError(
          `${scenario.id} recovery journal exceeds evidence policy`,
        );
      }
      await writeNoReplace(journalPath, journal, 0o600);
      const afterStore = await snapshotCodexStore(codexHome);
      const residue = providerStoreDelta(beforeStore, afterStore);
      if (!residue.onlyBoundedAuthRefresh) {
        throw new TypeError(
          `${scenario.id} left Codex client-store residue`,
        );
      }
      if (await authBoundary(authPath) !== authBoundarySha256) {
        throw new TypeError('authenticated Codex identity changed');
      }
      if (run.normalized === null) {
        const providerStage = run.providerInvocationStarted
          ? 'after provider launch'
          : 'before provider launch';
        throw new TypeError(
          `${scenario.id} stopped ${providerStage}: ` +
          `${run.terminal.state}/${run.terminal.reason}`,
        );
      }
      const usage = installed.integration.assertCodexUsageWithinPolicy(
        policy,
        run.normalized.result.usage,
      );
      aggregateUsage = addUsage(
        aggregateUsage,
        usage,
        installed.integration.codexUsageTotal,
      );
      assertCampaignUsage(policy, aggregateUsage);
      await assertScenarioOutcome({
        run,
        scenario,
        repositoryRoot,
        campaignRoot: temporary,
      });
      const summary = {
        schema: 'scopa.codex-live-run-summary.v1',
        scenario: scenario.id,
        scenarioVersion: policy.scenarios.version,
        livePolicySha256: policy.policySha256,
        expectedCanStop: scenario.expectedCanStop,
        observedCanStop: run.terminal.canStop,
        observedClientVersion: run.receipt.client.observedVersion,
        requestedModel: run.receipt.requestedModel,
        observedModel: run.normalized.initialization.model,
        usage: structuredClone(usage),
        onlyScopaMcpTools: run.normalized.toolCalls.every(
          (call) => call.server === 'scopa',
        ),
        exactSingleMcpInventory:
          run.inventory.length === 1 &&
          run.inventory[0].name === 'scopa',
        processGroupGone: run.terminal.cleanup.groupGone,
        orphanDetected: run.terminal.cleanup.orphanDetected,
        providerResidue: residue,
      };
      const evidence = installed.liveRun.createPrivateLiveEvidence({
        receipt: run.receipt,
        terminal: run.terminal,
        summary,
        repositoryRoot,
        controlRoot: temporary,
        stdout: run.privateCapture.stdout,
        stderr: run.privateCapture.stderr,
        raw: {
          accountBoundarySha256: authBoundarySha256,
          normalizedSha256: jsonHash(run.normalized),
          rawStreamSha256: run.terminal.output.stdoutSha256,
        },
      });
      const privateText = canonicalJsonPretty(evidence);
      if (
        Buffer.byteLength(privateText, 'utf8') >
        policy.evidence.maxPrivateBytesPerRun
      ) {
        throw new TypeError(
          `${scenario.id} private evidence exceeds evidence policy`,
        );
      }
      const write = await installed.liveRun.persistLiveEvidence({
        privateRoot,
        privatePath,
        publicRoot,
        publicPath,
        evidence,
        protectedValues: [authBoundarySha256],
      });
      records.push({
        scenario: scenario.id,
        expectedCanStop: scenario.expectedCanStop,
        observedCanStop: run.terminal.canStop,
        terminalState: run.terminal.state,
        terminalReason: run.terminal.reason,
        processGroupGone: run.terminal.cleanup.groupGone,
        observedClientVersion: run.receipt.client.observedVersion,
        observedModel: run.normalized.initialization.model,
        usage: structuredClone(usage),
        publicEvidence: {
          filename: path.basename(publicPath),
          bytes: write.publicBytes,
          sha256: write.publicSha256,
        },
        privateEvidence: {
          filename: path.basename(privatePath),
          bytes: write.privateBytes,
          sha256: write.privateSha256,
          mode: write.privateMode,
        },
        residue,
        repositoryLineageSha256: jsonHash(repositoryRoot),
        sourceCommit: installed.artifact.sourceCommit,
        qualification: 'direct',
      });
      await removeAndVerify(journalPath);
      await removeAndVerify(intentPath);
    }
  } finally {
    for (const repositoryRoot of repositories.values()) {
      await removeAndVerify(repositoryRoot);
    }
    repositoryCleanupVerified = true;
  }
  return {
    package: installed.package,
    capabilityMatrix: matrix,
    policy,
    providerInvocations,
    aggregateUsage,
    authBoundarySha256,
    records,
    cleanup: {
      repositoryCleanupVerified,
      processGroupsGone: records.every(
        (record) => record.processGroupGone === true,
      ),
      perRunControlRootDeletionVerified: true,
    },
  };
}

async function main() {
  const {
    policyPath,
    privateRoot,
    publicRoot,
    expectedPolicyId,
    expectedPolicyPath,
  } = parseProductionLiveArguments(process.argv.slice(2));
  if (
    await realpath(policyPath) !==
    await realpath(expectedPolicyPath)
  ) {
    throw new TypeError('campaign policy path changed during preflight');
  }
  const sourceCommit = await assertCleanCandidate();
  await mkdir(privateRoot, {
    recursive: true,
    mode: 0o700,
  });
  await mkdir(publicRoot, {
    recursive: true,
  });
  const privateMetadata = await stat(privateRoot);
  if (
    !privateMetadata.isDirectory() ||
    (privateMetadata.mode & 0o077) !== 0
  ) {
    throw new TypeError('private Codex evidence root has unsafe metadata');
  }
  for (const target of [
    path.join(privateRoot, 'campaign.private.json'),
    path.join(publicRoot, 'campaign.public.json'),
  ]) {
    await assertPathAbsent(target, 'Codex campaign evidence');
  }

  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-s16-codex-production-'),
  );
  let campaign;
  try {
    const installed = await installPackedRuntime(temporary, sourceCommit);
    const policy = installed.integration.assertCodexProviderAuthorized(
      JSON.parse(await readFile(policyPath, 'utf8')),
    );
    if (policy.policyId !== expectedPolicyId) {
      throw new TypeError('campaign policy id differs from its namespace');
    }
    const auth = await prepareCodexEnvironment({
      installedIntegration: installed.integration,
      codexCommand: 'codex',
      temporary,
    });
    campaign = await runCampaign({
      installed,
      policy,
      prompts: JSON.parse(await readFile(
        path.join(FIXTURE, 'prompts.json'),
        'utf8',
      )),
      temporary,
      privateRoot,
      publicRoot,
      codexCommand: 'codex',
      codexEnvironment: auth.environment,
      codexHome: auth.isolatedHome,
      authPath: auth.authPath,
      authBoundarySha256: auth.authBoundarySha256,
      scenarios: productionScenariosForPolicy(policy),
    });
    const finalStore = providerStoreDelta(
      auth.baselineStore,
      await snapshotCodexStore(auth.isolatedHome),
    );
    if (!finalStore.onlyBoundedAuthRefresh) {
      throw new TypeError('Codex campaign left client-store residue');
    }
  } finally {
    await removeAndVerify(temporary);
  }

  const executedAt = new Date().toISOString();
  const deleteAfter = new Date(
    Date.parse(executedAt) +
    campaign.policy.evidence.privateRetentionHours * 60 * 60 * 1_000,
  ).toISOString();
  const publicCampaign = {
    schema: 'scopa.codex-live-campaign.public.v1',
    executedAt,
    sourceCommit: campaign.package.sourceCommit,
    package: campaign.package,
    livePolicySha256: campaign.policy.policySha256,
    requestedModel: campaign.policy.model.requested,
    observedModels: [...new Set(
      campaign.records.map((record) => record.observedModel),
    )],
    observedClientVersions: [...new Set(
      campaign.records.map((record) => record.observedClientVersion),
    )],
    assurance: campaign.capabilityMatrix.assurance,
    invocationCount: campaign.providerInvocations,
    allDirect: campaign.records.every(
      (record) => record.qualification === 'direct',
    ),
    allExpectedPolaritiesObserved: campaign.records.every(
      (record) =>
        record.terminalState === 'succeeded' &&
        record.expectedCanStop === record.observedCanStop,
    ),
    aggregateUsage: campaign.aggregateUsage,
    runs: campaign.records.map((record) => ({
      scenario: record.scenario,
      expectedCanStop: record.expectedCanStop,
      observedCanStop: record.observedCanStop,
      terminalState: record.terminalState,
      terminalReason: record.terminalReason,
      usage: record.usage,
      publicEvidence: record.publicEvidence,
      sourceCommit: record.sourceCommit,
      qualification: record.qualification,
      onlyBoundedAuthRefresh:
        record.residue.onlyBoundedAuthRefresh,
    })),
    cleanup: {
      ...campaign.cleanup,
      isolatedCodexHomeDeletionVerified: true,
      temporaryRootDeletionVerified: true,
    },
    privateEvidence: {
      retainedOutsideRepository: true,
      rawEvidenceInRepository: false,
      destinationAlias: campaign.policy.evidence.privateDestination,
      retentionHours: campaign.policy.evidence.privateRetentionHours,
      deleteAfter,
    },
  };
  const privateCampaign = {
    schema: 'scopa.codex-live-campaign.private.v1',
    executedAt,
    deleteAfter,
    sourceCommit,
    livePolicySha256: campaign.policy.policySha256,
    authBoundarySha256: campaign.authBoundarySha256,
    runs: campaign.records,
    cleanup: publicCampaign.cleanup,
  };
  const privateWrite = await writeNoReplace(
    path.join(privateRoot, 'campaign.private.json'),
    privateCampaign,
    0o600,
  );
  const publicValue = {
    ...publicCampaign,
    privateCampaignBinding: {
      sha256: privateWrite.sha256,
      bytes: privateWrite.bytes,
    },
  };
  const publicText = canonicalJsonPretty(publicValue);
  const findings = scanPrivateText(publicText, {
    forbiddenValues: [
      privateRoot,
      campaign.authBoundarySha256,
    ],
  });
  if (findings.length !== 0) {
    throw new TypeError(
      `Codex public campaign failed privacy scan: ${findings.join(', ')}`,
    );
  }
  const publicWrite = await writeNoReplace(
    path.join(publicRoot, 'campaign.public.json'),
    publicText,
    0o644,
  );
  process.stdout.write(canonicalJsonPretty({
    schema: 'scopa.codex-live-campaign-result.v1',
    sourceCommit,
    policySha256: campaign.policy.policySha256,
    invocationCount: campaign.providerInvocations,
    aggregateUsage: campaign.aggregateUsage,
    cleanup: publicCampaign.cleanup,
    publicCampaignSha256: publicWrite.sha256,
  }));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
