#!/usr/bin/env node

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
  prepareCodexEnvironment,
  productionScenariosForPolicy,
  runCampaign as runCodexCampaign,
  writeNoReplace,
} from '../../integrations/codex/src/production-live-probe.js';
import {
  assertS21ProviderAuthorized,
  authorizeS21LiveMatrix,
} from './s21-requalification-policy.js';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const EXPECTED_PACKAGE =
  '49b62ac4b4d869dbca8459aa08f515427e0a04349f014c85cc422d7e0625f147';
const EXPECTED_CLOSURE =
  '6071fda7b96dbe6bb87ed154ef3dc3d94e5f53be114148e663a7e9523e76180e';
const EXPECTED_PAYLOAD =
  'd876bb115d8dd8755dfbddcbdabf84bf931487b177f24daf29a3d90aef5d7477';

function withinRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}
function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
async function assertAbsent(target, label) {
  try {
    await access(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new TypeError(`${label} already exists; approval replay is forbidden`);
}
async function moduleInside(installedRoot, relative) {
  const resolved = await realpath(path.join(installedRoot, relative));
  if (!withinRoot(installedRoot, resolved)) {
    throw new TypeError('installed candidate module escaped package root');
  }
  return resolved;
}

export function parseS21LiveArguments(argv) {
  const names = ['--matrix', '--approval', '--candidate', '--private-root'];
  if (argv.length !== 8 || names.some((name, i) => argv[i * 2] !== name)) {
    throw new TypeError('usage: s21-production-live-cli.js --matrix <json> ' +
      '--approval <json> --candidate <tgz> --private-root <directory>');
  }
  const parsed = { matrixPath: path.resolve(argv[1]),
    approvalPath: path.resolve(argv[3]), candidatePath: path.resolve(argv[5]),
    privateRoot: path.resolve(argv[7]) };
  if (withinRoot(ROOT, parsed.privateRoot)) {
    throw new TypeError('S21 private root must be outside the repository');
  }
  return parsed;
}

async function installCandidate({ candidatePath, temporary, qualification }) {
  const bytes = await readFile(candidatePath);
  if (sha256(bytes) !== EXPECTED_PACKAGE ||
      qualification.candidate.packageSha256 !== EXPECTED_PACKAGE) {
    throw new TypeError('S21 candidate tarball digest drifted');
  }
  const consumer = path.join(temporary, 'installed-consumer');
  await mkdir(consumer);
  const handle = await open(path.join(consumer, 'package.json'), 'wx', 0o600);
  try {
    await handle.writeFile(
      '{"name":"scopa-s21-live","version":"1.0.0","private":true}\n',
    );
    await handle.sync();
  } finally {
    await handle.close();
  }
  await execFileAsync('npm', [
    'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
    '--package-lock=false', '--cache', path.join(temporary, 'npm-cache'),
    candidatePath,
  ], { cwd: consumer, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const installedRoot = await realpath(path.join(
    consumer, 'node_modules/@heart-ai-foundation/scopa',
  ));
  const load = async (relative) => import(pathToFileURL(
    await moduleInside(installedRoot, relative),
  ).href);
  const [claudeIntegration, codexIntegration, releaseReadiness] =
    await Promise.all([
      load('packages/integrations/claude/src/index.js'),
      load('packages/integrations/codex/src/index.js'),
      load('packages/release-readiness/src/index.js'),
    ]);
  const bundleManifest = JSON.parse(await readFile(
    path.join(installedRoot, 'production-bundle.json'), 'utf8',
  ));
  const bundle = await releaseReadiness.verifyProductionBundleRoot({
    root: installedRoot,
    manifest: bundleManifest,
  });
  if (bundle.closureSha256 !== EXPECTED_CLOSURE ||
      bundle.installedPayloadSha256 !== EXPECTED_PAYLOAD ||
      bundleManifest.bundledPayloadSha256 !== EXPECTED_PAYLOAD) {
    throw new TypeError('S21 installed production identity drifted');
  }
  const pkg = qualification.candidate.package;
  const common = {
    adapterCli: await moduleInside(installedRoot,
      'packages/adapter-host/src/cli.js'),
    claudeIntegration,
    codexIntegration,
    liveRun: await load('packages/live-run/src/index.js'),
    project: await load('packages/cli/src/project.js'),
    artifact: { schema: 'scopa.installed-artifact-identity.v1',
      sourceCommit: qualification.source.commit,
      package: { name: pkg.name, version: pkg.version, sha256: pkg.sha256,
        integrity: pkg.integrity } },
    package: { name: pkg.name, version: pkg.version,
      sourceCommit: qualification.source.commit, sha256: pkg.sha256,
      integrity: pkg.integrity, entryCount: pkg.entryCount },
  };
  return { common, bundle };
}

function assertClientBindings(matrix, installed) {
  const claude =
    `claude-code@${installed.claudeIntegration.EXPECTED_CLAUDE_CODE_VERSION}`;
  const codex =
    `codex-mcp-client@${installed.codexIntegration.EXPECTED_CODEX_CLI_VERSION}`;
  if (matrix.providers.claude.client !== claude ||
      matrix.providers.codex.client !== codex) {
    throw new TypeError('S21 matrix client versions differ from candidate bytes');
  }
}
function providerInstalled(common, integration) {
  return { ...common, integration };
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
  const args = parseS21LiveArguments(process.argv.slice(2));
  const [matrix, approval, qualification] = await Promise.all([
    readFile(args.matrixPath, 'utf8').then(JSON.parse),
    readFile(args.approvalPath, 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'evidence/S20/exact-candidate-qualification.json'),
      'utf8').then(JSON.parse),
  ]);
  const authorized = authorizeS21LiveMatrix(matrix, approval);
  assertS21ProviderAuthorized(authorized, approval);
  if (matrix.matrixSha256 !== approval.closedMatrixSha256) {
    throw new TypeError('S21 approval does not bind the supplied matrix');
  }
  const privateCampaignRoot = path.join(args.privateRoot, 'S21');
  const publicRoot = path.join(ROOT, 'evidence/S21/live');
  await assertAbsent(privateCampaignRoot, 'S21 private campaign');
  await assertAbsent(publicRoot, 'S21 public campaign');

  const claudeCommand = process.env.SCOPA_S21_CLAUDE_COMMAND ?? 'claude';
  const codexCommand = process.env.SCOPA_S21_CODEX_COMMAND ?? 'codex';
  const [claudeVersion, codexVersion] = await Promise.all([
    execFileAsync(claudeCommand, ['--version'], { encoding: 'utf8' }),
    execFileAsync(codexCommand, ['--version'], { encoding: 'utf8' }),
  ]);
  const expectedClaude =
    `${matrix.providers.claude.client.slice('claude-code@'.length)} (Claude Code)`;
  const expectedCodex =
    `codex-cli ${matrix.providers.codex.client.slice('codex-mcp-client@'.length)}`;
  if (claudeVersion.stdout.trim() !== expectedClaude ||
      codexVersion.stdout.trim() !== expectedCodex) {
    throw new TypeError('S21 approved client version drifted');
  }

  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s21-live-'));
  let claude;
  let codex;
  let bundle;
  try {
    const installed = await installCandidate({ candidatePath: args.candidatePath,
      temporary, qualification });
    const common = installed.common;
    bundle = installed.bundle;
    assertClientBindings(matrix, common);
    const codexAuth = await prepareCodexEnvironment({
      installedIntegration: common.codexIntegration,
      codexCommand,
      temporary,
    });
    await mkdir(args.privateRoot, { recursive: true, mode: 0o700 });
    const rootMetadata = await stat(args.privateRoot);
    if (!rootMetadata.isDirectory() || (rootMetadata.mode & 0o077) !== 0) {
      throw new TypeError('S21 private evidence root must have mode 0700');
    }
    const claudeRoot = path.join(privateCampaignRoot, 'claude');
    const codexRoot = path.join(privateCampaignRoot, 'codex');
    const stagingRoot = path.join(privateCampaignRoot, 'public-staging');
    for (const directory of [privateCampaignRoot, claudeRoot, codexRoot,
      stagingRoot, path.join(stagingRoot, 'claude'),
      path.join(stagingRoot, 'codex')]) {
      await mkdir(directory, { mode: 0o700 });
    }
    await writeNoReplace(path.join(privateCampaignRoot,
      'authorization-intent.private.json'), {
      schema: 'scopa.s21-live-authorization.v1',
      approvalSha256: approval.approvalSha256,
      authorizedMatrixSha256: authorized.matrixSha256,
      intendedAt: new Date().toISOString(),
      invocationLimit: 4,
    }, 0o600);

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
        path.join(ROOT, 'fixtures/S15/prompts.json'), 'utf8')),
      temporary, privateRoot: claudeRoot,
      publicRoot: path.join(stagingRoot, 'claude'),
      resumeDrift: null, resumeFault: null,
      configuredScenarios: [clean, { ...cold, repository: 'clean' }],
      scenarioVersion: 'S21.v1', sessionPrefix: 'S21-claude', claudeCommand,
    });
    assertPassingCampaign('Claude', claude.runRecords, claude.cleanup);

    const codexPolicy = common.codexIntegration.createCodexLivePolicy({
      campaignId: 'S16-v7-production-live-v1',
      providerGate: common.codexIntegration.CODEX_PROVIDER_GATE_OPEN,
      approvedOn: approval.notBefore.slice(0, 10),
      principalApproval: 'conversation-explicit',
      privateEvidenceDestinationApproval: 'conversation-explicit',
    });
    codex = await runCodexCampaign({
      installed: providerInstalled(common, common.codexIntegration),
      policy: codexPolicy,
      prompts: JSON.parse(await readFile(
        path.join(ROOT, 'fixtures/S16/prompts.json'), 'utf8')),
      temporary, privateRoot: codexRoot,
      publicRoot: path.join(stagingRoot, 'codex'), codexCommand,
      codexEnvironment: codexAuth.environment,
      codexHome: codexAuth.isolatedHome, authPath: codexAuth.authPath,
      authBytes: codexAuth.authBytes,
      authBoundarySha256: codexAuth.authBoundarySha256,
      scenarios: productionScenariosForPolicy(codexPolicy),
    });
    assertPassingCampaign('Codex', codex.records, codex.cleanup);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }

  const executedAt = new Date().toISOString();
  const privateValue = { schema: 'scopa.s21-live-campaign.private.v1',
    executedAt, matrixSha256: authorized.matrixSha256,
    approvalSha256: approval.approvalSha256,
    packageSha256: EXPECTED_PACKAGE,
    productionIdentity: { closureSha256: bundle.closureSha256,
      installedPayloadSha256: bundle.installedPayloadSha256 },
    claude: { totalCostUsd: claude.totalCostUsd, runs: claude.runRecords },
    codex: { aggregateUsage: codex.aggregateUsage, runs: codex.records } };
  const privateWrite = await writeNoReplace(
    path.join(privateCampaignRoot, 'campaign.private.json'), privateValue, 0o600,
  );
  const publicValue = { schema: 'scopa.s21-live-campaign.public.v1', executedAt,
    sourceCommit: qualification.source.commit,
    packageSha256: EXPECTED_PACKAGE, closureSha256: EXPECTED_CLOSURE,
    bundledPayloadSha256: EXPECTED_PAYLOAD,
    installedPayloadSha256: EXPECTED_PAYLOAD,
    closedMatrixSha256: matrix.matrixSha256,
    authorizedMatrixSha256: authorized.matrixSha256,
    approvalSha256: approval.approvalSha256,
    callOrder: matrix.goal.calls.map(({ id }) => id), invocationCount: 4,
    claude: { scenarios: claude.runRecords.map(({ scenario, terminalState,
      expectedCanStop, observedCanStop, costUsd }) => ({ scenario,
      terminalState, expectedCanStop, observedCanStop, costUsd })),
      totalCostUsd: claude.totalCostUsd, cleanup: claude.cleanup },
    codex: { scenarios: codex.records.map(({ scenario, terminalState,
      expectedCanStop, observedCanStop, usage }) => ({ scenario, terminalState,
      expectedCanStop, observedCanStop, usage })),
      aggregateUsage: codex.aggregateUsage, cleanup: codex.cleanup },
    privateEvidence: { retainedOutsideRepository: true,
      destinationAlias: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S21', retentionHours: 168,
      sha256: privateWrite.sha256, bytes: privateWrite.bytes } };
  const publicText = canonicalJsonPretty(publicValue);
  const findings = scanPrivateText(publicText, {
    forbiddenValues: [args.privateRoot],
  });
  if (findings.length !== 0) {
    throw new TypeError(`S21 public evidence privacy failure: ${findings.join(', ')}`);
  }
  await mkdir(publicRoot);
  const publicWrite = await writeNoReplace(
    path.join(publicRoot, 'campaign.public.json'), publicText, 0o644,
  );
  await writeNoReplace(path.join(ROOT, 'evidence/S21/consumed-approvals.json'), {
    schema: 'scopa.s21-consumed-approvals.v1',
    approvals: [{ approvalSha256: approval.approvalSha256, executedAt,
      invocationCount: 4, publicCampaignSha256: publicWrite.sha256 }],
  }, 0o644);
  process.stdout.write(canonicalJsonPretty({
    schema: 'scopa.s21-live-campaign-result.v1',
    authorizedMatrixSha256: authorized.matrixSha256,
    invocationCount: 4, publicCampaignSha256: publicWrite.sha256,
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
