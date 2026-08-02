#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  access,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  canonicalJson,
  canonicalJsonPretty,
} from '../../packages/enforcement/src/index.js';
import { scanPrivateText } from '../../packages/release-readiness/src/package-privacy.js';
import {
  assertS26R1ProviderAuthorized,
  authorizeS26R1LiveMatrix,
} from './s26r1-requalification-policy.mjs';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const EXPECTED_PACKAGE =
  'aa744c45c8d28bc609205748f4594a9dc6fa829fd996e63c3917a0693165e8d6';
const EXPECTED_SOURCE = '395a7e340084bbefbb5fb1ae575193eb33cacef4';
const EXPECTED_CLOSURE =
  '6071fda7b96dbe6bb87ed154ef3dc3d94e5f53be114148e663a7e9523e76180e';
const EXPECTED_PAYLOAD =
  'd876bb115d8dd8755dfbddcbdabf84bf931487b177f24daf29a3d90aef5d7477';
const TOOL_ORDER = [
  'scopa_orientation',
  'scopa_read_file',
  'scopa_write_file',
  'scopa_check',
  'scopa_assurance',
  'scopa_transcript',
];

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

async function assertAbsent(target, label) {
  try {
    await access(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new TypeError(`${label} already exists; S26R1 replay is forbidden`);
}

async function writeNoReplace(filename, value, mode) {
  const bytes = typeof value === 'string' ? value : canonicalJsonPretty(value);
  const handle = await open(filename, 'wx', mode);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  return { bytes: Buffer.byteLength(bytes), sha256: sha256(bytes) };
}

async function moduleInside(installedRoot, relative) {
  const resolved = await realpath(path.join(installedRoot, relative));
  if (!withinRoot(installedRoot, resolved)) {
    throw new TypeError('installed candidate module escaped package root');
  }
  return resolved;
}

export function parseS26R1LiveArguments(argv) {
  const names = ['--matrix', '--approval', '--candidate', '--private-root'];
  if (argv.length !== 8 || names.some((name, index) => argv[index * 2] !== name)) {
    throw new TypeError(
      'usage: s26r1-production-live-cli.mjs --matrix <json> --approval <json> ' +
      '--candidate <tgz> --private-root <directory>',
    );
  }
  const parsed = {
    matrixPath: path.resolve(argv[1]),
    approvalPath: path.resolve(argv[3]),
    candidatePath: path.resolve(argv[5]),
    privateRoot: path.resolve(argv[7]),
  };
  if (withinRoot(ROOT, parsed.privateRoot)) {
    throw new TypeError('S26R1 private root must be outside the repository');
  }
  return parsed;
}

export function assertS26R1StaticPreflight({
  matrix,
  approval,
  candidateSha256,
  promptsSha256,
  claudeVersion,
  codexVersion,
  executionInstant,
}) {
  const authorized = authorizeS26R1LiveMatrix(matrix, approval);
  assertS26R1ProviderAuthorized(authorized, approval, { executionInstant });
  if (candidateSha256 !== EXPECTED_PACKAGE) {
    throw new TypeError('S26R1 candidate tarball digest drifted');
  }
  if (promptsSha256 !== matrix.deterministicPrerequisites.promptsSha256) {
    throw new TypeError('S26R1 prompt bytes drifted');
  }
  const expectedClaude =
    `${matrix.providers.claude.client.slice('claude-code@'.length)} (Claude Code)`;
  const expectedCodex =
    `codex-cli ${matrix.providers.codex.client.slice('codex-mcp-client@'.length)}`;
  if (claudeVersion.trim() !== expectedClaude || codexVersion.trim() !== expectedCodex) {
    throw new TypeError('S26R1 approved client version drifted');
  }
  return authorized;
}

async function installCandidate({ candidatePath, temporary, qualification }) {
  if (sha256(await readFile(candidatePath)) !== EXPECTED_PACKAGE) {
    throw new TypeError('S26R1 candidate tarball digest drifted');
  }
  const consumer = path.join(temporary, 'installed-consumer');
  await mkdir(consumer);
  await writeNoReplace(path.join(consumer, 'package.json'), {
    name: 'scopa-s26r1-live',
    version: '1.0.0',
    private: true,
  }, 0o600);
  await execFileAsync('npm', [
    'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
    '--package-lock=false', '--cache', path.join(temporary, 'npm-cache'),
    candidatePath,
  ], { cwd: consumer, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const installedRoot = await realpath(path.join(
    consumer,
    'node_modules/@heart-ai-foundation/scopa',
  ));
  const load = async (relative) => import(pathToFileURL(
    await moduleInside(installedRoot, relative),
  ).href);
  const [claudeIntegration, codexIntegration, releaseReadiness, project, codexProbe] =
    await Promise.all([
      load('packages/integrations/claude/src/index.js'),
      load('packages/integrations/codex/src/index.js'),
      load('packages/release-readiness/src/index.js'),
      load('packages/cli/src/project.js'),
      load('packages/integrations/codex/src/production-live-probe.js'),
    ]);
  const bundleManifest = JSON.parse(await readFile(
    path.join(installedRoot, 'production-bundle.json'),
    'utf8',
  ));
  const bundle = await releaseReadiness.verifyProductionBundleRoot({
    root: installedRoot,
    manifest: bundleManifest,
  });
  if (
    qualification.source.commit !== EXPECTED_SOURCE ||
    qualification.candidate.packageSha256 !== EXPECTED_PACKAGE ||
    bundle.closureSha256 !== EXPECTED_CLOSURE ||
    bundle.installedPayloadSha256 !== EXPECTED_PAYLOAD ||
    bundleManifest.bundledPayloadSha256 !== EXPECTED_PAYLOAD
  ) {
    throw new TypeError('S26R1 installed production identity drifted');
  }
  const pkg = qualification.candidate.package;
  return {
    adapterCli: await moduleInside(installedRoot, 'packages/adapter-host/src/cli.js'),
    claudeIntegration,
    codexIntegration,
    project,
    prepareCodexEnvironment: codexProbe.prepareCodexEnvironment,
    bundle,
    artifact: {
      schema: 'scopa.installed-artifact-identity.v1',
      sourceCommit: EXPECTED_SOURCE,
      package: {
        name: pkg.name,
        version: pkg.version,
        sha256: pkg.sha256,
        integrity: pkg.integrity,
      },
    },
  };
}

async function createRepository(root, project, target) {
  await mkdir(root);
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'workspace'));
  const definition = JSON.parse(await readFile(
    path.join(ROOT, 'fixtures/S8/clean.slice-definition.json'),
    'utf8',
  ));
  await writeFile(
    path.join(root, 'scopa.slice-definition.json'),
    canonicalJsonPretty(definition),
    { mode: 0o600 },
  );
  await writeFile(
    path.join(root, 'task.txt'),
    `Write only the exact S26R1 content requested for ${target}.\n`,
    { mode: 0o600 },
  );
  await project.initializeProject({
    repoRoot: root,
    definitionPath: 'scopa.slice-definition.json',
  });
}

function toolNames(provider, run) {
  if (provider === 'claude') {
    return run.normalized.toolCalls.map(({ name }) =>
      name.replace(/^mcp__scopa__/, ''),
    );
  }
  return run.normalized.toolCalls.map(({ tool }) => tool);
}

function assertPassingRun(provider, run) {
  if (run.normalized === null || run.terminal.state !== 'succeeded') {
    throw new TypeError(`${provider} S26R1 run did not reach normalized success`);
  }
  if (run.normalized.final.canStop !== true) {
    throw new TypeError(`${provider} S26R1 run did not preserve terminal polarity`);
  }
  if (canonicalJson(toolNames(provider, run)) !== canonicalJson(TOOL_ORDER)) {
    throw new TypeError(`${provider} S26R1 SCOPA-only tool order drifted`);
  }
  const cleanup = run.terminal.cleanup;
  if (cleanup.groupGone !== true || cleanup.orphanDetected !== false) {
    throw new TypeError(`${provider} S26R1 process-group cleanup failed`);
  }
}

export async function retainThenValidateS26R1Run({ provider, run, filename }) {
  const retained = await writeNoReplace(filename, privateRun(run), 0o600);
  assertPassingRun(provider, run);
  return { run, retained };
}

async function runClaude({ installed, matrix, prompt, repoRoot, command }) {
  const limits = matrix.providers.claude.limits;
  const policy = installed.claudeIntegration.createClaudeLivePolicy({
    policyId: 'S26R1-exact-byte-qualification-v1',
    approvedOn: matrix.approvalTerms.notBefore.slice(0, 10),
    model: matrix.providers.claude.requestedModel,
    maxProviderInvocations: 1,
    maxTurnsPerRun: limits.maxTurnsPerRun,
    timeoutMs: limits.timeoutMsPerRun,
    maxCaptureBytes: limits.maxCaptureBytesPerRun,
    maxInputBytes: limits.maxInputBytesPerRun,
    maxBudgetUsdPerRun: limits.maxBudgetUsdPerRun,
    maxCampaignBudgetUsd: limits.maxCampaignBudgetUsd,
    privateRetentionHours: matrix.evidence.privateRetentionHours,
    maxPrivateBytesPerRun: limits.maxPrivateEvidenceBytesPerRun,
  });
  const run = await installed.claudeIntegration.runClaudeSession({
    claudeCommand: command,
    repoRoot,
    adapterCli: installed.adapterCli,
    session: installed.claudeIntegration.createClaudeSession({
      sessionId: 'S26R1-claude-clean',
      request: prompt,
    }),
    capabilityMatrix: installed.claudeIntegration.createClaudeCapabilityMatrix({}),
    installedArtifact: installed.artifact,
    livePolicy: policy,
    scenario: { id: 'clean', version: 'S26R1.v1' },
    prompt,
    model: matrix.providers.claude.requestedModel,
    maxBudgetUsd: limits.maxBudgetUsdPerRun,
    timeoutMs: limits.timeoutMsPerRun,
  });
  return run;
}

async function runCodex({ installed, matrix, prompt, repoRoot, command, auth }) {
  const limits = matrix.providers.codex.limits;
  const run = await installed.codexIntegration.runCodexSession({
    codexCommand: command,
    repoRoot,
    adapterCli: installed.adapterCli,
    session: installed.codexIntegration.createCodexSession({
      sessionId: 'S26R1-codex-clean',
      request: prompt,
    }),
    capabilityMatrix: installed.codexIntegration.createCodexCapabilityMatrix({}),
    installedArtifact: installed.artifact,
    scenario: { id: 'clean', version: 'S26R1.v1' },
    prompt,
    model: matrix.providers.codex.requestedModel,
    timeoutMs: limits.timeoutMsPerRun,
    maxCaptureBytes: limits.maxCaptureBytesPerRun,
    usageLimits: {
      maxInputTokens: limits.maxInputTokensPerRun,
      maxOutputTokens: limits.maxOutputTokensPerRun,
      maxReasoningTokens: limits.maxReasoningTokensPerRun,
      maxTotalTokens: limits.maxTotalTokensPerRun,
    },
    baseEnvironment: auth.environment,
    environmentInheritance: 'explicit-allowlist',
  });
  return run;
}

function privateRun(run) {
  return {
    receipt: run.receipt,
    terminal: run.terminal,
    normalized: run.normalized,
    privateCapture: run.privateCapture,
  };
}

function publicRun(provider, run) {
  return {
    provider,
    scenario: 'clean',
    terminalState: run.terminal.state,
    canStop: run.normalized.final.canStop,
    tools: toolNames(provider, run),
    cleanup: run.terminal.cleanup,
    ...(provider === 'claude'
      ? { costUsd: run.normalized.result.costUsd, turns: run.normalized.result.turns }
      : { usage: run.normalized.result.usage }),
  };
}

async function main() {
  const args = parseS26R1LiveArguments(process.argv.slice(2));
  const [matrixText, approvalText, candidateBytes, promptsBytes, qualification] =
    await Promise.all([
      readFile(args.matrixPath, 'utf8'),
      readFile(args.approvalPath, 'utf8'),
      readFile(args.candidatePath),
      readFile(path.join(ROOT, 'fixtures/S26R1/prompts.json')),
      readFile(path.join(ROOT, 'evidence/S25/exact-candidate-qualification.json'), 'utf8')
        .then(JSON.parse),
    ]);
  const matrix = JSON.parse(matrixText);
  const approval = JSON.parse(approvalText);
  const prompts = JSON.parse(promptsBytes);
  const approvalInstant = new Date().toISOString();
  const approvalBoundMatrix = authorizeS26R1LiveMatrix(matrix, approval);
  assertS26R1ProviderAuthorized(approvalBoundMatrix, approval, {
    executionInstant: approvalInstant,
  });
  const claudeCommand = process.env.SCOPA_S26R1_CLAUDE_COMMAND ?? 'claude';
  const codexCommand = process.env.SCOPA_S26R1_CODEX_COMMAND ?? 'codex';
  const [claudeVersion, codexVersion] = await Promise.all([
    execFileAsync(claudeCommand, ['--version'], { encoding: 'utf8' }),
    execFileAsync(codexCommand, ['--version'], { encoding: 'utf8' }),
  ]);
  const executedAt = new Date().toISOString();
  const authorized = assertS26R1StaticPreflight({
    matrix,
    approval,
    candidateSha256: sha256(candidateBytes),
    promptsSha256: sha256(promptsBytes),
    claudeVersion: claudeVersion.stdout,
    codexVersion: codexVersion.stdout,
    executionInstant: executedAt,
  });
  const privateCampaignRoot = path.join(args.privateRoot, 'S26R1');
  const publicRoot = path.join(ROOT, 'evidence/S26R1/live');
  await assertAbsent(privateCampaignRoot, 'S26R1 private campaign');
  await assertAbsent(publicRoot, 'S26R1 public campaign');
  await assertAbsent(
    path.join(ROOT, 'evidence/S26R1/consumed-approvals.json'),
    'S26R1 consumed approval receipt',
  );

  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s26r1-live-'));
  let claude;
  let codex;
  let installed;
  try {
    installed = await installCandidate({
      candidatePath: args.candidatePath,
      temporary,
      qualification,
    });
    const auth = await installed.prepareCodexEnvironment({
      installedIntegration: installed.codexIntegration,
      codexCommand,
      temporary,
    });
    await mkdir(args.privateRoot, { recursive: true, mode: 0o700 });
    const rootMetadata = await stat(args.privateRoot);
    if (!rootMetadata.isDirectory() || (rootMetadata.mode & 0o077) !== 0) {
      throw new TypeError('S26R1 private evidence root must have mode 0700');
    }
    await mkdir(privateCampaignRoot, { mode: 0o700 });
    const claudeRoot = path.join(privateCampaignRoot, 'claude');
    const codexRoot = path.join(privateCampaignRoot, 'codex');
    await mkdir(claudeRoot, { mode: 0o700 });
    await mkdir(codexRoot, { mode: 0o700 });
    await writeNoReplace(path.join(privateCampaignRoot, 'intent.private.json'), {
      schema: 'scopa.s26r1-live-authorization.v1',
      approvalSha256: approval.approvalSha256,
      closedMatrixSha256: matrix.matrixSha256,
      authorizedMatrixSha256: authorized.matrixSha256,
      intendedAt: executedAt,
      callOrder: matrix.goal.calls.map(({ id }) => id),
      invocationLimit: 2,
    }, 0o600);
    const claudeRepo = path.join(temporary, 'claude-clean-repo');
    await createRepository(claudeRepo, installed.project, 'workspace/claude.txt');
    claude = await runClaude({
      installed,
      matrix,
      prompt: prompts['claude-clean'],
      repoRoot: claudeRepo,
      command: claudeCommand,
    });
    await retainThenValidateS26R1Run({
      provider: 'claude',
      run: claude,
      filename: path.join(claudeRoot, 'run.private.json'),
    });
    const codexRepo = path.join(temporary, 'codex-clean-repo');
    await createRepository(codexRepo, installed.project, 'workspace/codex.txt');
    codex = await runCodex({
      installed,
      matrix,
      prompt: prompts['codex-clean'],
      repoRoot: codexRepo,
      command: codexCommand,
      auth,
    });
    await retainThenValidateS26R1Run({
      provider: 'codex',
      run: codex,
      filename: path.join(codexRoot, 'run.private.json'),
    });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }

  const completedAt = new Date().toISOString();
  const privateSummary = {
    schema: 'scopa.s26r1-live-campaign.private.v1',
    executedAt,
    completedAt,
    approvalSha256: approval.approvalSha256,
    authorizedMatrixSha256: authorized.matrixSha256,
    packageSha256: EXPECTED_PACKAGE,
    claude: privateRun(claude),
    codex: privateRun(codex),
  };
  const privateWrite = await writeNoReplace(
    path.join(privateCampaignRoot, 'campaign.private.json'),
    privateSummary,
    0o600,
  );
  const publicSummary = {
    schema: 'scopa.s26r1-live-campaign.public.v1',
    executedAt,
    completedAt,
    sourceCommit: EXPECTED_SOURCE,
    packageSha256: EXPECTED_PACKAGE,
    closureSha256: installed.bundle.closureSha256,
    bundledPayloadSha256: EXPECTED_PAYLOAD,
    installedPayloadSha256: installed.bundle.installedPayloadSha256,
    closedMatrixSha256: matrix.matrixSha256,
    authorizedMatrixSha256: authorized.matrixSha256,
    approvalSha256: approval.approvalSha256,
    callOrder: matrix.goal.calls.map(({ id }) => id),
    invocationCount: 2,
    runs: [publicRun('claude', claude), publicRun('codex', codex)],
    privateEvidence: {
      retainedOutsideRepository: true,
      destinationAlias: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S26R1',
      retentionHours: matrix.evidence.privateRetentionHours,
      sha256: privateWrite.sha256,
      bytes: privateWrite.bytes,
    },
  };
  const publicText = canonicalJsonPretty(publicSummary);
  const privacyFindings = scanPrivateText(publicText, {
    forbiddenValues: [args.privateRoot],
  });
  if (privacyFindings.length !== 0) {
    throw new TypeError(`S26R1 public evidence privacy failure: ${privacyFindings.join(', ')}`);
  }
  await mkdir(publicRoot);
  const publicWrite = await writeNoReplace(
    path.join(publicRoot, 'campaign.public.json'),
    publicText,
    0o644,
  );
  await writeNoReplace(path.join(ROOT, 'evidence/S26R1/consumed-approvals.json'), {
    schema: 'scopa.s26r1-consumed-approvals.v1',
    approvals: [{
      approvalSha256: approval.approvalSha256,
      executedAt,
      invocationCount: 2,
      publicCampaignSha256: publicWrite.sha256,
    }],
  }, 0o644);
  process.stdout.write(canonicalJsonPretty({
    schema: 'scopa.s26r1-live-campaign-result.v1',
    authorizedMatrixSha256: authorized.matrixSha256,
    invocationCount: 2,
    publicCampaignSha256: publicWrite.sha256,
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
