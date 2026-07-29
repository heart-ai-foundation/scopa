#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';
import {
  canonicalJsonPretty,
} from '../../../enforcement/src/index.js';
import {
  scanPrivateText,
} from '../../../release-readiness/src/package-privacy.js';
import {
  assertCleanCandidate,
  evidenceCostUsd,
  installPackedRuntime,
  removeAndVerify,
  runCampaign,
  withinRoot,
  writeNoReplace,
} from './production-live-probe.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const FIXTURE = path.join(ROOT, 'fixtures/S15R2');
const PUBLIC_ROOT = path.join(ROOT, 'evidence/S15R2');

export const S15_REMEDIAL_SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'denied',
    promptKey: 'denied',
    repository: 'direct-continuity',
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
    id: 'cold-restart',
    promptKey: 'coldRestart',
    repository: 'direct-continuity',
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

export function parseRemedialLiveArguments(argv) {
  if (
    argv.length !== 4 ||
    argv[0] !== '--policy' ||
    argv[2] !== '--private-root'
  ) {
    throw new Error(
      'usage: production-remedial-live-probe.js ' +
      '--policy <json-file> --private-root <fresh-directory>',
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

function assertRemedialPolicy(policy) {
  if (
    policy.policyId !== 'S15-production-live-remedial-v2' ||
    policy.authorization.approvedOn !== '2026-07-29' ||
    policy.limits.maxProviderInvocations !== 2 ||
    policy.limits.maxBudgetUsdPerRun !== '0.20' ||
    policy.limits.maxCampaignBudgetUsd !== '0.40'
  ) {
    throw new TypeError(
      'remedial campaign policy differs from the approved two-call bound',
    );
  }
}

function acceptedRun(record, scenario) {
  return (
    record?.scenario === scenario &&
    record.expectedCanStop === true &&
    record.observedCanStop === true &&
    record.terminalState === 'succeeded' &&
    record.terminalReason === 'completed' &&
    record.processGroupGone === true &&
    record.qualification === 'direct' &&
    record.residue.onlyBoundedNonResumableMetadata === true
  );
}

export function remedialAcceptance(campaign) {
  const [denied, coldRestart] = campaign.runRecords;
  const sameRepositoryLineage = (
    typeof denied?.repositoryLineageSha256 === 'string' &&
    denied.repositoryLineageSha256 ===
      coldRestart?.repositoryLineageSha256
  );
  const directDeniedPathPassed = acceptedRun(denied, 'denied');
  const directColdRestartContinuityPassed = (
    acceptedRun(coldRestart, 'cold-restart') &&
    sameRepositoryLineage
  );
  const cleanupPassed = (
    campaign.cleanup.repositoryCleanupVerified === true &&
    campaign.cleanup.providerMetadataCleanupVerified === true &&
    campaign.cleanup.processGroupsGone === true &&
    campaign.cleanup.perRunControlRootDeletionVerified === true
  );
  return {
    accepted: (
      campaign.runRecords.length === 2 &&
      directDeniedPathPassed &&
      directColdRestartContinuityPassed &&
      cleanupPassed &&
      campaign.continuityEvidenceReconstructed === false
    ),
    directDeniedPathPassed,
    directColdRestartContinuityPassed,
    sameRepositoryLineage,
    freshClaudeAndBridgePerRun: true,
    cleanupPassed,
  };
}

function publicRecord(record) {
  return {
    scenario: record.scenario,
    expectedCanStop: record.expectedCanStop,
    observedCanStop: record.observedCanStop,
    terminalState: record.terminalState,
    terminalReason: record.terminalReason,
    costUsd: record.costUsd,
    turns: record.turns,
    publicEvidence: record.publicEvidence,
    sourceCommit: record.sourceCommit,
    qualification: record.qualification,
    processGroupGone: record.processGroupGone,
    onlyBoundedNonResumableMetadata:
      record.residue.onlyBoundedNonResumableMetadata,
  };
}

async function main() {
  const {
    policyPath,
    privateRoot,
    publicRoot,
  } = parseRemedialLiveArguments(process.argv.slice(2));
  const expectedPolicyPath = await realpath(
    path.join(FIXTURE, 'claude-live-policy.json'),
  );
  if (await realpath(policyPath) !== expectedPolicyPath) {
    throw new TypeError(
      'campaign policy must be the committed S15 remedial policy',
    );
  }
  const sourceCommit = await assertCleanCandidate();
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-s15r2-claude-live-'),
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
    assertRemedialPolicy(policy);
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
      resumeDrift: null,
      resumeFault: null,
      configuredScenarios: S15_REMEDIAL_SCENARIOS,
      scenarioVersion: 'S15R2.v1',
      sessionPrefix: 'S15R2',
    });
  } finally {
    await removeAndVerify(temporary);
  }

  const acceptance = remedialAcceptance(campaign);
  assert.equal(
    acceptance.accepted,
    true,
    'S15 remedial evidence did not satisfy its closed acceptance gate',
  );
  const executedAt = new Date().toISOString();
  const deleteAfter = new Date(
    Date.parse(executedAt) +
    campaign.policy.evidence.privateRetentionHours * 60 * 60 * 1_000,
  ).toISOString();
  const cleanup = {
    ...campaign.cleanup,
    temporaryRootDeletionVerified: true,
  };
  const privateCampaign = {
    schema: 'scopa.claude-live-remedial-campaign.private.v1',
    executedAt,
    deleteAfter,
    sourceCommit,
    livePolicySha256: campaign.policy.policySha256,
    authIdentitySha256: campaign.authIdentitySha256,
    runs: campaign.runRecords,
    acceptance,
    cleanup,
  };
  const privateWrite = await writeNoReplace(
    path.join(privateRoot, 'campaign.private.json'),
    privateCampaign,
    0o600,
  );
  const publicCampaign = {
    schema: 'scopa.claude-live-remedial-campaign.public.v1',
    executedAt,
    sourceCommit,
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
    totalCostUsd: evidenceCostUsd(campaign.totalCostUsd),
    budgetUsd: campaign.policy.limits.maxCampaignBudgetUsd,
    continuityEvidenceReconstructed:
      campaign.continuityEvidenceReconstructed,
    acceptance,
    runs: campaign.runRecords.map(publicRecord),
    cleanup,
    privateEvidence: {
      retainedOutsideRepository: true,
      rawEvidenceInRepository: false,
      retentionHours: campaign.policy.evidence.privateRetentionHours,
      deleteAfter,
    },
    privateCampaignBinding: {
      sha256: privateWrite.sha256,
      bytes: privateWrite.bytes,
    },
  };
  const publicText = canonicalJsonPretty(publicCampaign);
  if (scanPrivateText(publicText).length !== 0) {
    throw new TypeError('remedial public campaign contains private material');
  }
  const publicWrite = await writeNoReplace(
    path.join(publicRoot, 'campaign.public.json'),
    publicCampaign,
    0o644,
  );
  process.stdout.write(canonicalJsonPretty({
    schema: 'scopa.claude-live-remedial-campaign-result.v1',
    sourceCommit,
    policySha256: campaign.policy.policySha256,
    invocationCount: campaign.runRecords.length,
    totalCostUsd: evidenceCostUsd(campaign.totalCostUsd),
    accepted: acceptance.accepted,
    cleanup,
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
