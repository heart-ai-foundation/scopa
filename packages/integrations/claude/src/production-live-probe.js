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
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rm,
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

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const FIXTURE = path.join(ROOT, 'fixtures/S15');
const PUBLIC_ROOT = path.join(ROOT, 'evidence/S15');
const PROJECT_STORE_ROOT = path.join(os.homedir(), '.claude/projects');

export const S15_LIVE_SCENARIOS = Object.freeze([
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
  Object.freeze({
    id: 'repeat-read-1',
    promptKey: 'repeatRead1',
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
  Object.freeze({
    id: 'repeat-read-2',
    promptKey: 'repeatRead2',
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

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function withinRoot(root, candidate) {
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
  const policyPath = path.resolve(argv[1]);
  const privateRoot = path.resolve(argv[3]);
  if (withinRoot(ROOT, privateRoot)) {
    throw new TypeError(
      'private Claude evidence root must be outside the repository',
    );
  }
  return {
    policyPath,
    privateRoot,
    publicRoot: PUBLIC_ROOT,
  };
}

async function assertCleanCandidate() {
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
      'production live campaign requires a clean committed candidate',
    );
  }
  return (
    await execFileAsync('git', [
      'rev-parse',
      'HEAD',
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    })
  ).stdout.trim();
}

async function installPackedRuntime(temporary, sourceCommit) {
  const pack = await execFileAsync('npm', [
    'pack',
    '--json',
    '--pack-destination',
    temporary,
  ], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const [manifest] = JSON.parse(pack.stdout);
  const tarball = path.join(temporary, manifest.filename);
  const packageSha256 = sha256(await readFile(tarball));
  const consumer = path.join(temporary, 'installed-consumer');
  await mkdir(consumer);
  const packageFile = await open(
    path.join(consumer, 'package.json'),
    'wx',
    0o600,
  );
  await packageFile.writeFile(
    '{"name":"scopa-s15-installed","version":"1.0.0","private":true}\n',
  );
  await packageFile.close();
  await execFileAsync('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
    tarball,
  ], {
    cwd: consumer,
    encoding: 'utf8',
  });

  const packageRoot = path.join(
    consumer,
    'node_modules/@heart-ai-foundation/scopa',
  );
  const installedRoot = await realpath(packageRoot);
  const modulePath = async (relative) => {
    const resolved = await realpath(path.join(installedRoot, relative));
    assert.equal(withinRoot(installedRoot, resolved), true);
    return resolved;
  };
  const integration = await import(pathToFileURL(
    await modulePath('packages/integrations/claude/src/index.js'),
  ).href);
  const liveRun = await import(pathToFileURL(
    await modulePath('packages/live-run/src/index.js'),
  ).href);
  const project = await import(pathToFileURL(
    await modulePath('packages/cli/src/project.js'),
  ).href);
  return {
    adapterCli: await modulePath('packages/adapter-host/src/cli.js'),
    integration,
    liveRun,
    project,
    artifact: {
      schema: 'scopa.installed-artifact-identity.v1',
      sourceCommit,
      package: {
        name: manifest.name,
        version: manifest.version,
        sha256: packageSha256,
        integrity: manifest.integrity,
      },
    },
    package: {
      name: manifest.name,
      version: manifest.version,
      sourceCommit,
      sha256: packageSha256,
      integrity: manifest.integrity,
      entryCount: manifest.entryCount,
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
  const definition = JSON.parse(
    await readFile(
      path.join(ROOT, 'fixtures/S8', definitionFile),
      'utf8',
    ),
  );
  const definitionHandle = await open(
    path.join(root, 'scopa.slice-definition.json'),
    'wx',
    0o600,
  );
  await definitionHandle.writeFile(canonicalJsonPretty(definition));
  await definitionHandle.close();
  const taskHandle = await open(
    path.join(root, 'task.txt'),
    'wx',
    0o600,
  );
  await taskHandle.writeFile(
    'Write only the exact synthetic scenario content requested.\n',
  );
  await taskHandle.close();
  await initializeProject({
    repoRoot: root,
    definitionPath: 'scopa.slice-definition.json',
  });
}

function projectStorePath(repositoryRoot) {
  const encoded = repositoryRoot.split(path.sep).join('-');
  return path.join(PROJECT_STORE_ROOT, encoded);
}

async function snapshotProviderStore(storeRoot) {
  const snapshot = new Map();
  let entries;
  try {
    entries = await readdir(storeRoot, {
      withFileTypes: true,
    });
  } catch (error) {
    if (error?.code === 'ENOENT') return snapshot;
    throw error;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.jsonl')) {
      snapshot.set(entry.name, {
        digest: null,
        bytes: null,
        safe: false,
        types: [],
      });
      continue;
    }
    const filename = path.join(storeRoot, entry.name);
    const metadata = await lstat(filename);
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      snapshot.set(entry.name, {
        digest: null,
        bytes: metadata.size,
        safe: false,
        types: [],
      });
      continue;
    }
    if (metadata.size > 64 * 1024) {
      snapshot.set(entry.name, {
        digest: null,
        bytes: metadata.size,
        safe: false,
        types: [],
      });
      continue;
    }
    const bytes = await readFile(filename);
    const lines = bytes
      .toString('utf8')
      .split(/\r?\n/)
      .filter((line) => line.length > 0);
    const types = [];
    let safe = lines.length > 0;
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        types.push(event?.type ?? null);
        if (event?.type !== 'ai-title') safe = false;
      } catch {
        safe = false;
      }
    }
    snapshot.set(entry.name, {
      digest: sha256(bytes),
      bytes: bytes.length,
      safe,
      types,
    });
  }
  return snapshot;
}

function providerStoreDelta(before, after) {
  const changed = [];
  for (const [name, state] of after) {
    if (before.get(name)?.digest !== state.digest) {
      changed.push({
        nameSha256: jsonHash(name),
        bytes: state.bytes,
        safe: state.safe,
        types: state.types,
      });
    }
  }
  return {
    changedFileCount: changed.length,
    totalChangedBytes: changed.reduce(
      (total, entry) => total + (entry.bytes ?? 0),
      0,
    ),
    onlyBoundedNonResumableMetadata: changed.every(
      (entry) => entry.safe,
    ),
    files: changed,
  };
}

function shortToolNames(run) {
  return run.normalized.toolCalls.map((call) =>
    call.name.replace(/^mcp__scopa__/, ''),
  );
}

function findTool(run, name) {
  const call = run.normalized.toolCalls.findLast(
    (entry) => entry.name === `mcp__scopa__${name}`,
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
  assert.equal(
    run.normalized.final.scenario,
    scenario.id,
    scenario.id,
  );
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
        path.join(repositoryRoot, 'workspace/claude.txt'),
        'utf8',
      ),
      'CLAUDE_ALLOWED\n',
    );
  }
  if (scenario.id === 'denied') {
    const writes = run.normalized.toolCalls.filter(
      (entry) => entry.name.endsWith('scopa_write_file'),
    );
    assert.equal(writes[0]?.isError, true);
    assert.equal(writes[0]?.result?.code, 'SCOPA_SCOPE_DENIED');
    assert.equal(writes[1]?.isError, false);
    assert.equal(run.normalized.final.denialObserved, true);
    await assert.rejects(
      () => access(path.join(campaignRoot, 'claude-escape.txt')),
      { code: 'ENOENT' },
    );
  }
  if (scenario.id === 'false-green') {
    const check = findTool(run, 'scopa_check');
    assert.equal(check.isError, true);
    assert.equal(check.result.state.canStop, false);
    assert.equal(run.normalized.final.status, 'blocked');
  }
}

async function writeNoReplace(filename, value, mode) {
  const text = canonicalJsonPretty(value);
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

async function removeAndVerify(target) {
  await rm(target, {
    recursive: true,
    force: true,
  });
  await assert.rejects(
    () => access(target),
    { code: 'ENOENT' },
  );
}

async function runCampaign({
  installed,
  policy,
  prompts,
  temporary,
  privateRoot,
  publicRoot,
}) {
  const matrix = installed.integration.createClaudeCapabilityMatrix({});
  assert.equal(
    S15_LIVE_SCENARIOS.length,
    policy.limits.maxProviderInvocations,
  );
  const repositories = new Map();
  const providerStores = new Set();
  const runRecords = [];
  let authIdentitySha256 = null;
  let totalCostUsd = 0;
  let repositoryCleanupVerified = false;
  let providerMetadataCleanupVerified = false;

  try {
    for (const scenario of S15_LIVE_SCENARIOS) {
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
      const storeRoot = projectStorePath(repositoryRoot);
      providerStores.add(storeRoot);
      const beforeStore = await snapshotProviderStore(storeRoot);
      const prompt = prompts[scenario.promptKey];
      assert.equal(typeof prompt, 'string');
      const run = await installed.integration.runClaudeSession({
        repoRoot: repositoryRoot,
        adapterCli: installed.adapterCli,
        session: installed.integration.createClaudeSession({
          sessionId: `S15-${scenario.id}`,
          request: prompt,
        }),
        capabilityMatrix: matrix,
        installedArtifact: installed.artifact,
        livePolicy: policy,
        scenario: {
          id: scenario.id,
          version: 'S15.v1',
        },
        prompt,
        model: policy.model.requestedAlias,
        maxBudgetUsd: policy.limits.maxBudgetUsdPerRun,
        timeoutMs: policy.limits.timeoutMs,
      });
      const afterStore = await snapshotProviderStore(storeRoot);
      const residue = providerStoreDelta(beforeStore, afterStore);
      if (!residue.onlyBoundedNonResumableMetadata) {
        throw new TypeError(
          `${scenario.id} left resumable or unbounded provider content`,
        );
      }

      const currentIdentity = run.privateCapture.authIdentitySha256;
      if (
        typeof currentIdentity !== 'string' ||
        !/^[0-9a-f]{64}$/.test(currentIdentity)
      ) {
        throw new TypeError(
          `${scenario.id} lacks a private account-boundary binding`,
        );
      }
      if (authIdentitySha256 === null) {
        authIdentitySha256 = currentIdentity;
      } else if (currentIdentity !== authIdentitySha256) {
        throw new TypeError('authenticated Claude identity changed mid-campaign');
      }

      const costUsd = run.normalized?.result?.costUsd ?? 0;
      totalCostUsd += costUsd;
      if (
        totalCostUsd >
        Number(policy.limits.maxCampaignBudgetUsd) + Number.EPSILON
      ) {
        throw new TypeError('Claude campaign exceeded its aggregate budget');
      }
      const summary = {
        schema: 'scopa.claude-live-run-summary.v1',
        scenario: scenario.id,
        scenarioVersion: 'S15.v1',
        livePolicySha256: policy.policySha256,
        expectedCanStop: scenario.expectedCanStop,
        observedCanStop: run.terminal.canStop,
        observedClientVersion: run.receipt.client.observedVersion,
        requestedModel: run.receipt.requestedModel,
        observedModel: run.normalized?.initialization?.model ?? null,
        costUsd,
        turns: run.normalized?.result?.turns ?? null,
        modelCallableToolsScopaOnly:
          run.normalized?.initialization?.tools?.every(
            (tool) => tool.startsWith('mcp__scopa__'),
          ) ?? false,
        processGroupGone: run.terminal.cleanup.groupGone,
        orphanDetected: run.terminal.cleanup.orphanDetected,
        providerResidue: {
          changedFileCount: residue.changedFileCount,
          totalChangedBytes: residue.totalChangedBytes,
          onlyBoundedNonResumableMetadata:
            residue.onlyBoundedNonResumableMetadata,
          files: residue.files,
        },
      };
      const evidence = installed.liveRun.createPrivateLiveEvidence({
        receipt: run.receipt,
        terminal: run.terminal,
        summary,
        repositoryRoot,
        controlRoot: temporary,
        stdout: run.privateCapture.stdout,
        stderr: run.privateCapture.stderr,
        raw: canonicalJsonPretty({
          authIdentitySha256: currentIdentity,
          normalizedSha256: jsonHash(run.normalized),
          rawStreamSha256: run.terminal.output.stdoutSha256,
        }),
      });
      const privateText = canonicalJsonPretty(evidence);
      if (
        Buffer.byteLength(privateText, 'utf8') >
        policy.evidence.maxPrivateBytesPerRun
      ) {
        throw new TypeError(
          `${scenario.id} private evidence exceeds its bound`,
        );
      }
      const privatePath = path.join(
        privateRoot,
        `${scenario.id}.private.json`,
      );
      const publicPath = path.join(
        publicRoot,
        `${scenario.id}.public.json`,
      );
      const evidenceWrite = await installed.liveRun.persistLiveEvidence({
        privateRoot,
        privatePath,
        publicRoot,
        publicPath,
        evidence,
        protectedValues: [currentIdentity],
      });
      runRecords.push({
        scenario: scenario.id,
        expectedCanStop: scenario.expectedCanStop,
        observedCanStop: run.terminal.canStop,
        terminalState: run.terminal.state,
        terminalReason: run.terminal.reason,
        observedClientVersion: run.receipt.client.observedVersion,
        observedModel: run.normalized?.initialization?.model ?? null,
        costUsd,
        turns: run.normalized?.result?.turns ?? null,
        publicEvidence: {
          filename: path.basename(publicPath),
          bytes: evidenceWrite.publicBytes,
          sha256: evidenceWrite.publicSha256,
        },
        privateEvidence: {
          filename: path.basename(privatePath),
          bytes: evidenceWrite.privateBytes,
          sha256: evidenceWrite.privateSha256,
          mode: evidenceWrite.privateMode,
        },
        residue,
      });
      await assertScenarioOutcome({
        run,
        scenario,
        repositoryRoot,
        campaignRoot: temporary,
      });
    }
  } finally {
    for (const repositoryRoot of repositories.values()) {
      await removeAndVerify(repositoryRoot);
    }
    repositoryCleanupVerified = true;
    for (const storeRoot of providerStores) {
      const resolvedProjectRoot = await realpath(PROJECT_STORE_ROOT);
      const declaredStore = path.resolve(storeRoot);
      if (!withinRoot(resolvedProjectRoot, declaredStore)) {
        throw new TypeError('provider metadata store escaped its root');
      }
      await removeAndVerify(declaredStore);
    }
    providerMetadataCleanupVerified = true;
  }

  return {
    package: installed.package,
    capabilityMatrix: matrix,
    policy,
    totalCostUsd,
    authIdentitySha256,
    runRecords,
    cleanup: {
      repositoryCleanupVerified,
      providerMetadataCleanupVerified,
      processGroupsGone: runRecords.every(
        (record) => record.terminalState === 'succeeded',
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
  } = parseProductionLiveArguments(process.argv.slice(2));
  const expectedPolicyPath = await realpath(
    path.join(FIXTURE, 'claude-live-policy.json'),
  );
  if (await realpath(policyPath) !== expectedPolicyPath) {
    throw new TypeError('campaign policy must be the committed S15 policy');
  }
  const sourceCommit = await assertCleanCandidate();
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-s15-claude-live-'),
  );
  await mkdir(privateRoot, {
    recursive: true,
    mode: 0o700,
  });
  await mkdir(publicRoot, {
    recursive: true,
  });

  let campaign;
  try {
    const installed = await installPackedRuntime(temporary, sourceCommit);
    const policy = installed.integration.validateClaudeLivePolicy(
      JSON.parse(await readFile(policyPath, 'utf8')),
    );
    const prompts = JSON.parse(
      await readFile(path.join(FIXTURE, 'prompts.json'), 'utf8'),
    );
    campaign = await runCampaign({
      installed,
      policy,
      prompts,
      temporary,
      privateRoot,
      publicRoot,
    });
  } finally {
    await removeAndVerify(temporary);
  }

  const executedAt = new Date().toISOString();
  const deleteAfter = new Date(
    Date.parse(executedAt) +
    campaign.policy.evidence.privateRetentionHours * 60 * 60 * 1_000,
  ).toISOString();
  const publicCampaign = {
    schema: 'scopa.claude-live-campaign.public.v1',
    executedAt,
    sourceCommit: campaign.package.sourceCommit,
    package: campaign.package,
    livePolicySha256: campaign.policy.policySha256,
    requestedModel: campaign.policy.model.requestedAlias,
    observedModels: [...new Set(
      campaign.runRecords.map((record) => record.observedModel),
    )],
    observedClientVersions: [...new Set(
      campaign.runRecords.map(
        (record) => record.observedClientVersion,
      ),
    )],
    assurance: campaign.capabilityMatrix.assurance,
    invocationCount: campaign.runRecords.length,
    totalCostUsd: campaign.totalCostUsd,
    budgetUsd: campaign.policy.limits.maxCampaignBudgetUsd,
    runs: campaign.runRecords.map((record) => ({
      scenario: record.scenario,
      expectedCanStop: record.expectedCanStop,
      observedCanStop: record.observedCanStop,
      terminalState: record.terminalState,
      terminalReason: record.terminalReason,
      costUsd: record.costUsd,
      turns: record.turns,
      publicEvidence: record.publicEvidence,
      onlyBoundedNonResumableMetadata:
        record.residue.onlyBoundedNonResumableMetadata,
    })),
    cleanup: {
      ...campaign.cleanup,
      temporaryRootDeletionVerified: true,
    },
    privateEvidence: {
      retainedOutsideRepository: true,
      rawEvidenceInRepository: false,
      retentionHours: campaign.policy.evidence.privateRetentionHours,
      deleteAfter,
    },
  };
  const privateCampaign = {
    schema: 'scopa.claude-live-campaign.private.v1',
    executedAt,
    deleteAfter,
    sourceCommit,
    livePolicySha256: campaign.policy.policySha256,
    authIdentitySha256: campaign.authIdentitySha256,
    runs: campaign.runRecords,
    cleanup: publicCampaign.cleanup,
  };
  const privateWrite = await writeNoReplace(
    path.join(privateRoot, 'campaign.private.json'),
    privateCampaign,
    0o600,
  );
  const publicWrite = await writeNoReplace(
    path.join(publicRoot, 'campaign.public.json'),
    {
      ...publicCampaign,
      privateCampaignBinding: {
        sha256: privateWrite.sha256,
        bytes: privateWrite.bytes,
      },
    },
    0o644,
  );
  process.stdout.write(`${canonicalJsonPretty({
    schema: 'scopa.claude-live-campaign-result.v1',
    sourceCommit,
    policySha256: campaign.policy.policySha256,
    invocationCount: campaign.runRecords.length,
    totalCostUsd: campaign.totalCostUsd,
    cleanup: publicCampaign.cleanup,
    publicCampaignSha256: publicWrite.sha256,
  })}`);
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
