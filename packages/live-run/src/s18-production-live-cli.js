#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  access, mkdir, mkdtemp, open, readFile, realpath, rm, stat,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonicalJsonPretty } from '../../enforcement/src/index.js';
import { scanPrivateText } from '../../release-readiness/src/package-privacy.js';
import {
  S15_LIVE_SCENARIOS,
  runCampaign as runClaudeCampaign,
} from '../../integrations/claude/src/production-live-probe.js';
import {
  S16_PRODUCTION_SCENARIOS,
  prepareCodexEnvironment,
  productionScenariosForPolicy,
  runCampaign as runCodexCampaign,
  writeNoReplace,
} from '../../integrations/codex/src/production-live-probe.js';
import {
  assertS18ProviderAuthorized,
  authorizeS18LiveMatrix,
} from './requalification-policy.js';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const EXPECTED_CANDIDATE =
  'e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498';

function withinRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (
    relative !== '..' && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function parseS18LiveArguments(argv) {
  const names = ['--matrix', '--approval', '--candidate', '--private-root'];
  if (argv.length !== 8 || names.some((name, index) => argv[index * 2] !== name)) {
    throw new TypeError(
      'usage: s18-production-live-cli.js --matrix <json> --approval <json> ' +
      '--candidate <tgz> --private-root <directory>',
    );
  }
  const result = {
    matrixPath: path.resolve(argv[1]),
    approvalPath: path.resolve(argv[3]),
    candidatePath: path.resolve(argv[5]),
    privateRoot: path.resolve(argv[7]),
  };
  if (withinRoot(ROOT, result.privateRoot)) {
    throw new TypeError('S18 private root must be outside the repository');
  }
  return result;
}

async function assertAbsent(target, label) {
  try {
    await access(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new TypeError(`${label} already exists; replay is forbidden`);
}

async function moduleInside(installedRoot, relative) {
  const resolved = await realpath(path.join(installedRoot, relative));
  if (!withinRoot(installedRoot, resolved)) {
    throw new TypeError('installed candidate module escaped package root');
  }
  return resolved;
}

export async function installExactS18Candidate({
  candidatePath, temporary, qualification,
}) {
  const bytes = await readFile(candidatePath);
  if (sha256(bytes) !== EXPECTED_CANDIDATE ||
      qualification.candidate.packageSha256 !== EXPECTED_CANDIDATE) {
    throw new TypeError('S18 candidate tarball digest drifted');
  }
  const consumer = path.join(temporary, 'installed-consumer');
  await mkdir(consumer);
  const handle = await open(path.join(consumer, 'package.json'), 'wx', 0o600);
  try {
    await handle.writeFile(
      '{"name":"scopa-s18-live","version":"1.0.0","private":true}\n',
    );
    await handle.sync();
  } finally {
    await handle.close();
  }
  await execFileAsync('npm', [
    'install', '--ignore-scripts', '--no-audit', '--no-fund',
    '--package-lock=false', candidatePath,
  ], { cwd: consumer, encoding: 'utf8' });
  const installedRoot = await realpath(path.join(
    consumer, 'node_modules/@heart-ai-foundation/scopa',
  ));
  const load = async (relative) => import(pathToFileURL(
    await moduleInside(installedRoot, relative),
  ).href);
  const manifestPackage = qualification.candidate.manifest.package;
  const sourceCommit = qualification.source.commit;
  return {
    adapterCli: await moduleInside(
      installedRoot, 'packages/adapter-host/src/cli.js',
    ),
    claudeIntegration: await load(
      'packages/integrations/claude/src/index.js',
    ),
    codexIntegration: await load(
      'packages/integrations/codex/src/index.js',
    ),
    liveRun: await load('packages/live-run/src/index.js'),
    project: await load('packages/cli/src/project.js'),
    artifact: {
      schema: 'scopa.installed-artifact-identity.v1',
      sourceCommit,
      package: {
        name: manifestPackage.name,
        version: manifestPackage.version,
        sha256: manifestPackage.sha256,
        integrity: manifestPackage.integrity,
      },
    },
    package: {
      name: manifestPackage.name,
      version: manifestPackage.version,
      sourceCommit,
      sha256: manifestPackage.sha256,
      integrity: manifestPackage.integrity,
      entryCount: manifestPackage.entryCount,
    },
  };
}

function providerInstalled(common, integration) {
  return { ...common, integration };
}

export function assertCandidateClientBindings(matrix, installed) {
  const candidateClaude =
    `claude-code@${installed.claudeIntegration.EXPECTED_CLAUDE_CODE_VERSION}`;
  const candidateCodex =
    `codex-mcp-client@${installed.codexIntegration.EXPECTED_CODEX_CLI_VERSION}`;
  if (matrix.providers.claude.client !== candidateClaude ||
      matrix.providers.codex.client !== candidateCodex) {
    throw new TypeError('S18 matrix client versions differ from candidate bytes');
  }
  return matrix;
}

export function assertS18ApprovalUnconsumed(approval, registry) {
  if (registry === null) return approval;
  if (registry?.schema !== 'scopa.s18-consumed-approvals.v1' ||
      !Array.isArray(registry.approvals)) {
    throw new TypeError('S18 consumed-approval registry is malformed');
  }
  if (registry.approvals.some((entry) =>
    entry?.approvalSha256 === approval.approvalSha256)) {
    throw new TypeError('S18 approval is closed and cannot be replayed');
  }
  return approval;
}

function assertPassingCampaign(provider, records, cleanup) {
  if (records.length !== 2 || records.some((record) =>
    record.terminalState !== 'succeeded' ||
    record.expectedCanStop !== record.observedCanStop)) {
    throw new TypeError(`${provider} live polarity failed; campaign stopped`);
  }
  for (const [key, value] of Object.entries(cleanup)) {
    if (value !== true) {
      throw new TypeError(`${provider} cleanup ${key} did not pass`);
    }
  }
}

async function main() {
  const args = parseS18LiveArguments(process.argv.slice(2));
  const [matrix, approval, qualification] = await Promise.all([
    readFile(args.matrixPath, 'utf8').then(JSON.parse),
    readFile(args.approvalPath, 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'evidence/S18/exact-candidate-qualification.json'),
      'utf8').then(JSON.parse),
  ]);
  const authorized = authorizeS18LiveMatrix(matrix, approval);
  const executionDate = new Date().toISOString().slice(0, 10);
  assertS18ProviderAuthorized(authorized, approval, { executionDate });
  if (matrix.matrixSha256 !== approval.closedMatrixSha256) {
    throw new TypeError('S18 approval does not bind the supplied matrix');
  }
  let consumedRegistry = null;
  try {
    consumedRegistry = JSON.parse(await readFile(
      path.join(ROOT, 'evidence/S18/consumed-approvals.json'), 'utf8',
    ));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  assertS18ApprovalUnconsumed(approval, consumedRegistry);
  const claudeCommand = process.env.SCOPA_S18_CLAUDE_COMMAND ?? 'claude';
  const codexCommand = process.env.SCOPA_S18_CODEX_COMMAND ?? 'codex';
  const [claudeVersion, codexVersion] = await Promise.all([
    execFileAsync(claudeCommand, ['--version'], { encoding: 'utf8' }),
    execFileAsync(codexCommand, ['--version'], { encoding: 'utf8' }),
  ]);
  const approvedClaudeVersion =
    `${matrix.providers.claude.client.slice('claude-code@'.length)} (Claude Code)`;
  const approvedCodexVersion =
    `codex-cli ${matrix.providers.codex.client.slice('codex-mcp-client@'.length)}`;
  if (claudeVersion.stdout.trim() !== approvedClaudeVersion ||
      codexVersion.stdout.trim() !== approvedCodexVersion) {
    throw new TypeError('S18 approved client version drifted');
  }
  const privateCampaignRoot = path.join(args.privateRoot, 'S18');
  const claudeRoot = path.join(privateCampaignRoot, 'claude');
  const codexRoot = path.join(privateCampaignRoot, 'codex');
  const stagingRoot = path.join(privateCampaignRoot, 'public-staging');
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s18-live-'));
  let claude;
  let codex;
  try {
    const common = await installExactS18Candidate({
      candidatePath: args.candidatePath, temporary, qualification,
    });
    assertCandidateClientBindings(matrix, common);
    await assertAbsent(privateCampaignRoot, 'S18 private campaign');
    await mkdir(args.privateRoot, { recursive: true, mode: 0o700 });
    const rootMetadata = await stat(args.privateRoot);
    if (!rootMetadata.isDirectory() || (rootMetadata.mode & 0o077) !== 0) {
      throw new TypeError('S18 private evidence root must have mode 0700');
    }
    for (const directory of [privateCampaignRoot, claudeRoot, codexRoot,
      stagingRoot, path.join(stagingRoot, 'claude'),
      path.join(stagingRoot, 'codex')]) {
      await mkdir(directory, { mode: 0o700 });
    }
    const claudePolicy = common.claudeIntegration.validateClaudeLivePolicy(
      JSON.parse(await readFile(
        path.join(ROOT, 'fixtures/S15R2/claude-live-policy.json'), 'utf8',
      )),
    );
    const clean = S15_LIVE_SCENARIOS.find(({ id }) => id === 'clean');
    const cold = S15_LIVE_SCENARIOS.find(({ id }) => id === 'cold-restart');
    claude = await runClaudeCampaign({
      installed: providerInstalled(common, common.claudeIntegration),
      policy: claudePolicy,
      prompts: JSON.parse(await readFile(
        path.join(ROOT, 'fixtures/S15/prompts.json'), 'utf8',
      )),
      temporary,
      privateRoot: claudeRoot,
      publicRoot: path.join(stagingRoot, 'claude'),
      resumeDrift: null,
      resumeFault: null,
      configuredScenarios: [clean, { ...cold, repository: 'clean' }],
      scenarioVersion: 'S18.v1',
      sessionPrefix: 'S18-claude',
      claudeCommand,
    });
    assertPassingCampaign('Claude', claude.runRecords, claude.cleanup);

    const codexPolicy = common.codexIntegration.createCodexLivePolicy({
      campaignId: 'S16-v7-production-live-v1',
      providerGate: common.codexIntegration.CODEX_PROVIDER_GATE_OPEN,
      approvedOn: approval.approvedOn,
      principalApproval: 'conversation-explicit',
      privateEvidenceDestinationApproval: 'conversation-explicit',
    });
    const auth = await prepareCodexEnvironment({
      installedIntegration: common.codexIntegration,
      codexCommand,
      temporary,
    });
    codex = await runCodexCampaign({
      installed: providerInstalled(common, common.codexIntegration),
      policy: codexPolicy,
      prompts: JSON.parse(await readFile(
        path.join(ROOT, 'fixtures/S16/prompts.json'), 'utf8',
      )),
      temporary,
      privateRoot: codexRoot,
      publicRoot: path.join(stagingRoot, 'codex'),
      codexCommand,
      codexEnvironment: auth.environment,
      codexHome: auth.isolatedHome,
      authPath: auth.authPath,
      authBytes: auth.authBytes,
      authBoundarySha256: auth.authBoundarySha256,
      scenarios: productionScenariosForPolicy(codexPolicy),
    });
    assertPassingCampaign('Codex', codex.records, codex.cleanup);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }

  const privateValue = {
    schema: 'scopa.s18-live-campaign.private.v1',
    executedAt: new Date().toISOString(),
    matrixSha256: authorized.matrixSha256,
    approvalSha256: approval.approvalSha256,
    candidateSha256: EXPECTED_CANDIDATE,
    claude: { totalCostUsd: claude.totalCostUsd, runs: claude.runRecords },
    codex: { aggregateUsage: codex.aggregateUsage, runs: codex.records },
  };
  const privateWrite = await writeNoReplace(
    path.join(privateCampaignRoot, 'campaign.private.json'), privateValue, 0o600,
  );
  const publicValue = {
    schema: 'scopa.s18-live-campaign.public.v1',
    executedAt: privateValue.executedAt,
    sourceCommit: qualification.source.commit,
    candidateSha256: EXPECTED_CANDIDATE,
    closedMatrixSha256: matrix.matrixSha256,
    authorizedMatrixSha256: authorized.matrixSha256,
    approvalSha256: approval.approvalSha256,
    providerOrder: ['claude', 'codex'],
    invocationCount: 4,
    claude: {
      scenarios: claude.runRecords.map(({ scenario, terminalState,
        expectedCanStop, observedCanStop, costUsd }) => ({
        scenario, terminalState, expectedCanStop, observedCanStop, costUsd,
      })),
      totalCostUsd: claude.totalCostUsd,
      cleanup: claude.cleanup,
    },
    codex: {
      scenarios: codex.records.map(({ scenario, terminalState,
        expectedCanStop, observedCanStop, usage }) => ({
        scenario, terminalState, expectedCanStop, observedCanStop, usage,
      })),
      aggregateUsage: codex.aggregateUsage,
      cleanup: codex.cleanup,
    },
    privateEvidence: {
      retainedOutsideRepository: true,
      destinationAlias: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S18',
      retentionHours: 168,
      sha256: privateWrite.sha256,
      bytes: privateWrite.bytes,
    },
  };
  const publicText = canonicalJsonPretty(publicValue);
  const findings = scanPrivateText(publicText, {
    forbiddenValues: [args.privateRoot],
  });
  if (findings.length !== 0) {
    throw new TypeError(`S18 public evidence privacy failure: ${findings.join(', ')}`);
  }
  const publicRoot = path.join(ROOT, 'evidence/S18/live');
  await assertAbsent(publicRoot, 'S18 public campaign');
  await mkdir(publicRoot);
  const publicWrite = await writeNoReplace(
    path.join(publicRoot, 'campaign.public.json'), publicText, 0o644,
  );
  process.stdout.write(canonicalJsonPretty({
    schema: 'scopa.s18-live-campaign-result.v1',
    authorizedMatrixSha256: authorized.matrixSha256,
    invocationCount: 4,
    publicCampaignSha256: publicWrite.sha256,
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
