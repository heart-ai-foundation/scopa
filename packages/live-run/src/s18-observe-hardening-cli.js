#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  access, mkdir, mkdtemp, readFile, rm, stat,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  prepareCodexEnvironment,
  productionScenariosForPolicy,
  runCampaign as runCodexCampaign,
  writeNoReplace,
} from '../../integrations/codex/src/production-live-probe.js';
import {
  scanPrivateText,
} from '../../release-readiness/src/package-privacy.js';
import {
  assertS18ApprovalUnconsumed,
  installExactS18Candidate,
} from './s18-production-live-cli.js';
import {
  assertS18ObserveHardeningAuthorized,
  authorizeS18ObserveHardeningMatrix,
} from './observe-hardening-policy.js';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const EXPECTED_CANDIDATE =
  'e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498';
const RETAINED = Object.freeze({
  'campaign-stop.public.json':
    '22f73ea041b73a4166339b9d345684c285843331e08204005db24cb6497f699c',
  'claude-clean.public.json':
    '857f515c08b3982918d56fd34fd642b77946ec3ba28b5b94777a306cebb3329a',
  'claude-cold-restart.public.json':
    '04c8f6873c3e45b711e5f992926ce6d9fb4707da058e28e742a5bf14ae5ec48b',
});

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

async function assertAbsent(target, label) {
  try {
    await access(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new TypeError(`${label} already exists; replay is forbidden`);
}

export function parseS18ObserveHardeningArguments(argv) {
  const names = ['--matrix', '--approval', '--candidate', '--private-root'];
  if (argv.length !== 8 || names.some((name, i) => argv[i * 2] !== name)) {
    throw new TypeError(
      'usage: s18-observe-hardening-cli.js --matrix <json> ' +
      '--approval <json> --candidate <tgz> --private-root <directory>',
    );
  }
  const parsed = {
    matrixPath: path.resolve(argv[1]),
    approvalPath: path.resolve(argv[3]),
    candidatePath: path.resolve(argv[5]),
    privateRoot: path.resolve(argv[7]),
  };
  if (withinRoot(ROOT, parsed.privateRoot)) {
    throw new TypeError('S18-v3 private root must be outside the repository');
  }
  return parsed;
}

export async function assertS18V3RetainedEvidence(root = ROOT) {
  const liveV2 = path.join(root, 'evidence/S18/live-v2');
  for (const [filename, expected] of Object.entries(RETAINED)) {
    if (sha256(await readFile(path.join(liveV2, filename))) !== expected) {
      throw new TypeError(`S18-v3 retained evidence drifted: ${filename}`);
    }
  }
  return RETAINED;
}

function assertPassingCampaign(campaign) {
  if (
    campaign.providerInvocations !== 2 ||
    campaign.records.length !== 2 ||
    campaign.records.some((record) =>
      record.terminalState !== 'succeeded' ||
      record.expectedCanStop !== record.observedCanStop)
  ) {
    throw new TypeError('S18-v3 Codex polarity failed; campaign stopped');
  }
  if (Object.values(campaign.cleanup).some((value) => value !== true)) {
    throw new TypeError('S18-v3 Codex cleanup failed');
  }
}

async function main() {
  const args = parseS18ObserveHardeningArguments(process.argv.slice(2));
  const [closed, approval, qualification, registry] = await Promise.all([
    readFile(args.matrixPath, 'utf8').then(JSON.parse),
    readFile(args.approvalPath, 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'evidence/S18/exact-candidate-qualification.json'),
      'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'evidence/S18/consumed-approvals.json'), 'utf8')
      .then(JSON.parse),
  ]);
  const authorized = authorizeS18ObserveHardeningMatrix(closed, approval);
  assertS18ObserveHardeningAuthorized(authorized, approval, {
    executionDate: new Date().toISOString().slice(0, 10),
  });
  if (closed.matrixSha256 !== approval.closedMatrixSha256) {
    throw new TypeError('S18-v3 approval does not bind the supplied matrix');
  }
  assertS18ApprovalUnconsumed(approval, registry);
  await assertS18V3RetainedEvidence();

  const codexCommand = process.env.SCOPA_S18_CODEX_COMMAND ?? 'codex';
  const version = await execFileAsync(codexCommand, ['--version'], {
    encoding: 'utf8', timeout: 10_000, maxBuffer: 64 * 1024,
  });
  if (version.stdout.trim() !== 'codex-cli 0.146.0') {
    throw new TypeError('S18-v3 approved Codex client version drifted');
  }

  const campaignRoot = path.join(args.privateRoot, 'S18V3');
  const codexRoot = path.join(campaignRoot, 'codex');
  const stagingRoot = path.join(campaignRoot, 'public-staging');
  const publicRoot = path.join(ROOT, 'evidence/S18/live-v3');
  await assertAbsent(campaignRoot, 'S18-v3 private campaign');
  await assertAbsent(publicRoot, 'S18-v3 public campaign');
  await mkdir(args.privateRoot, { recursive: true, mode: 0o700 });
  const rootMetadata = await stat(args.privateRoot);
  if (!rootMetadata.isDirectory() || (rootMetadata.mode & 0o077) !== 0) {
    throw new TypeError('S18-v3 private evidence root must have mode 0700');
  }
  for (const directory of [campaignRoot, codexRoot, stagingRoot]) {
    await mkdir(directory, { mode: 0o700 });
  }

  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s18-v3-'));
  let campaign;
  try {
    const installed = await installExactS18Candidate({
      candidatePath: args.candidatePath,
      temporary,
      qualification,
    });
    if (
      `codex-mcp-client@${installed.codexIntegration.EXPECTED_CODEX_CLI_VERSION}`
      !== closed.constraints.client
    ) {
      throw new TypeError('S18-v3 candidate Codex binding drifted');
    }
    const policy = installed.codexIntegration.createCodexLivePolicy({
      campaignId: 'S16-v7-production-live-v1',
      providerGate: installed.codexIntegration.CODEX_PROVIDER_GATE_OPEN,
      approvedOn: approval.approvedOn,
      principalApproval: 'conversation-explicit',
      privateEvidenceDestinationApproval: 'conversation-explicit',
    });
    const auth = await prepareCodexEnvironment({
      installedIntegration: installed.codexIntegration,
      codexCommand,
      temporary,
    });
    campaign = await runCodexCampaign({
      installed: { ...installed, integration: installed.codexIntegration },
      policy,
      prompts: JSON.parse(await readFile(
        path.join(ROOT, 'fixtures/S16/prompts.json'), 'utf8')),
      temporary,
      privateRoot: codexRoot,
      publicRoot: stagingRoot,
      codexCommand,
      codexEnvironment: auth.environment,
      codexHome: auth.isolatedHome,
      authPath: auth.authPath,
      authBytes: auth.authBytes,
      authBoundarySha256: auth.authBoundarySha256,
      scenarios: productionScenariosForPolicy(policy),
      sequencePolicy: closed.sequencePolicy,
    });
    assertPassingCampaign(campaign);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }

  const executedAt = new Date().toISOString();
  const privateWrite = await writeNoReplace(
    path.join(campaignRoot, 'campaign.private.json'),
    {
      schema: 'scopa.s18-observe-hardening-campaign.private.v3',
      executedAt,
      closedMatrixSha256: closed.matrixSha256,
      authorizedMatrixSha256: authorized.matrixSha256,
      approvalSha256: approval.approvalSha256,
      candidateSha256: EXPECTED_CANDIDATE,
      aggregateUsage: campaign.aggregateUsage,
      runs: campaign.records,
    },
    0o600,
  );
  const publicValue = {
    schema: 'scopa.s18-observe-hardening-campaign.public.v3',
    executedAt,
    sourceCommit: qualification.source.commit,
    candidateSha256: EXPECTED_CANDIDATE,
    closedMatrixSha256: closed.matrixSha256,
    authorizedMatrixSha256: authorized.matrixSha256,
    approvalSha256: approval.approvalSha256,
    retainedV2CampaignStopSha256: RETAINED['campaign-stop.public.json'],
    provider: 'codex',
    invocationCount: 2,
    sequencePolicy: closed.sequencePolicy,
    scenarios: campaign.records.map(({ scenario, terminalState,
      expectedCanStop, observedCanStop, usage, publicEvidence,
      runtimeStateDeletionVerified }) => ({
      scenario, terminalState, expectedCanStop, observedCanStop, usage,
      publicEvidence, runtimeStateDeletionVerified,
    })),
    aggregateUsage: campaign.aggregateUsage,
    cleanup: campaign.cleanup,
    privateEvidence: {
      retainedOutsideRepository: true,
      destinationAlias: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S18V3',
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
    throw new TypeError(`S18-v3 public evidence privacy failure: ${findings.join(', ')}`);
  }
  await mkdir(publicRoot);
  for (const record of campaign.records) {
    const filename = record.publicEvidence.filename;
    const bytes = await readFile(path.join(stagingRoot, filename));
    if (sha256(bytes) !== record.publicEvidence.sha256) {
      throw new TypeError(`S18-v3 staged evidence drifted: ${filename}`);
    }
    await writeNoReplace(path.join(publicRoot, filename), bytes, 0o644);
  }
  const result = await writeNoReplace(
    path.join(publicRoot, 'campaign.public.json'), publicText, 0o644,
  );
  process.stdout.write(canonicalJsonPretty({
    schema: 'scopa.s18-observe-hardening-result.v3',
    authorizedMatrixSha256: authorized.matrixSha256,
    invocationCount: 2,
    publicCampaignSha256: result.sha256,
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
