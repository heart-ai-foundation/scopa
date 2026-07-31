#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  normalizeCodexStream,
} from '../../integrations/codex/src/normalize.js';
import {
  writeNoReplace,
} from '../../integrations/codex/src/production-live-probe.js';
import {
  scanPrivateText,
} from '../../release-readiness/src/package-privacy.js';
import {
  authorizeS18ObserveHardeningMatrix,
} from './observe-hardening-policy.js';
import {
  validateBoundedObserveSequence,
} from './observe-sequence.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const PRIVATE_CAMPAIGN_SHA256 =
  'a3730bfb8a1c525f1ab94bce8136358776eacf7627f0b0b55121c6d939578c89';
const RUNS = Object.freeze([
  Object.freeze({
    scenario: 'clean',
    publicSha256:
      'a5b9843f29dafb03efdfff260dd5e00692a629ce084c9632b31b84b1bf3e03e3',
    privateSha256:
      '5a72a5bab2963147042ca6b7c214cfd005ad9214555e7740e51ee97ad6b2ab72',
    expectedTools: Object.freeze([
      'scopa_orientation', 'scopa_read_file', 'scopa_write_file',
      'scopa_check', 'scopa_assurance', 'scopa_transcript',
    ]),
  }),
  Object.freeze({
    scenario: 'cold-restart',
    publicSha256:
      'd432abbd2b3082b8dc4b41aa662bd787b264eeb1172acdeb5da3e7f6b580d262',
    privateSha256:
      '1491db6980d049a7c76973bd9a089442d53aa210be48302ee7236bdc17159aaf',
    expectedTools: Object.freeze([
      'scopa_orientation', 'scopa_read_file', 'scopa_check',
      'scopa_assurance', 'scopa_transcript',
    ]),
  }),
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function recoverS18V3Campaign({ privateRoot, publicRoot }) {
  const [closed, approval] = await Promise.all([
    readFile(path.join(ROOT, 'evidence/S18/closed-observe-hardening-v3.json'),
      'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'evidence/S18/observe-hardening-approval-v3.json'),
      'utf8').then(JSON.parse),
  ]);
  const authorized = authorizeS18ObserveHardeningMatrix(closed, approval);
  const campaignPath = path.join(privateRoot, 'campaign.private.json');
  const campaignBytes = await readFile(campaignPath);
  assert.equal(sha256(campaignBytes), PRIVATE_CAMPAIGN_SHA256);
  const campaign = JSON.parse(campaignBytes);
  assert.equal(campaign.schema,
    'scopa.s18-observe-hardening-campaign.private.v3');
  assert.equal(campaign.closedMatrixSha256, closed.matrixSha256);
  assert.equal(campaign.authorizedMatrixSha256, authorized.matrixSha256);
  assert.equal(campaign.approvalSha256, approval.approvalSha256);
  assert.equal(campaign.candidateSha256, closed.goal.candidateSha256);
  assert.deepEqual(campaign.runs.map(({ scenario }) => scenario),
    ['clean', 'cold-restart']);
  assert.equal(campaign.aggregateUsage.total_tokens, 103405);
  assert.ok(campaign.aggregateUsage.total_tokens <=
    closed.limits.maxCampaignTotalTokens);

  const recoveredRuns = [];
  for (const [index, expected] of RUNS.entries()) {
    const record = campaign.runs[index];
    const privatePath = path.join(privateRoot, 'codex',
      `${expected.scenario}.private.json`);
    const stagedPath = path.join(privateRoot, 'public-staging',
      `${expected.scenario}.public.json`);
    const [privateBytes, publicBytes] = await Promise.all([
      readFile(privatePath), readFile(stagedPath),
    ]);
    assert.equal(sha256(privateBytes), expected.privateSha256);
    assert.equal(sha256(publicBytes), expected.publicSha256);
    assert.equal(record.privateEvidence.sha256, expected.privateSha256);
    assert.equal(record.publicEvidence.sha256, expected.publicSha256);
    assert.equal(record.terminalState, 'succeeded');
    assert.equal(record.expectedCanStop, true);
    assert.equal(record.observedCanStop, true);
    assert.equal(record.processGroupGone, true);
    assert.equal(record.runtimeStateDeletionVerified, true);
    assert.equal(record.observedClientVersion, '0.146.0');
    assert.equal(record.observedModel, 'gpt-5.4');
    assert.equal(record.sourceCommit, closed.goal.sourceCommit);
    const privateEvidence = JSON.parse(privateBytes);
    const normalized = normalizeCodexStream(privateEvidence.private.stdout);
    const sequence = validateBoundedObserveSequence({
      calls: normalized.toolCalls,
      expectedTools: expected.expectedTools,
      policy: closed.sequencePolicy,
    });
    assert.equal(normalized.final.canStop, true);
    assert.equal(privateEvidence.terminal.cleanup.groupGone, true);
    assert.equal(privateEvidence.terminal.cleanup.orphanDetected, false);
    const publicText = publicBytes.toString('utf8');
    assert.deepEqual(scanPrivateText(publicText), []);
    recoveredRuns.push({
      scenario: expected.scenario,
      terminalState: record.terminalState,
      canStop: record.observedCanStop,
      toolSequence: sequence.actualTools,
      extraObserveCalls: sequence.extraCalls,
      usage: record.usage,
      runtimeStateDeletionVerified: record.runtimeStateDeletionVerified,
      processGroupGone: record.processGroupGone,
      publicEvidenceSha256: expected.publicSha256,
      privateEvidenceSha256: expected.privateSha256,
    });
  }
  const temporaryRoots = (await readdir(os.tmpdir())).filter(
    (entry) => entry.startsWith('scopa-s18-v3-'),
  );
  assert.deepEqual(temporaryRoots, []);
  const existing = await readdir(publicRoot);
  assert.deepEqual(existing, []);
  for (const expected of RUNS) {
    const filename = `${expected.scenario}.public.json`;
    const text = await readFile(
      path.join(privateRoot, 'public-staging', filename), 'utf8');
    await writeNoReplace(path.join(publicRoot, filename), text, 0o644);
  }
  const publicValue = {
    schema: 'scopa.s18-observe-hardening-recovery.public.v3',
    result: 'accepted-after-publication-only-recovery',
    providerCallsAuthorized: 2,
    providerCallsConsumed: 2,
    replayAllowed: false,
    execution: {
      executedAt: campaign.executedAt,
      sourceCommit: closed.goal.sourceCommit,
      candidateSha256: closed.goal.candidateSha256,
      closedMatrixSha256: closed.matrixSha256,
      authorizedMatrixSha256: authorized.matrixSha256,
      approvalSha256: approval.approvalSha256,
      sequencePolicy: closed.sequencePolicy,
    },
    publicationFailure: {
      stage: 'copy-accepted-public-derivative',
      reason: 'buffer-passed-to-canonical-json-writer',
      providerExecutionAffected: false,
      evidenceValidationAffected: false,
      fixedWithoutProviderReplay: true,
    },
    runs: recoveredRuns,
    aggregateUsage: campaign.aggregateUsage,
    cleanup: {
      perRunProcessGroupsGone: true,
      perRunOrphansAbsent: true,
      disposableRuntimeHomesDeleted: true,
      disposableRepositoriesDeleted: true,
      controllerTemporaryRootAbsent: true,
    },
    privateEvidence: {
      retainedOutsideRepository: true,
      destinationAlias: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S18V3',
      campaignSha256: PRIVATE_CAMPAIGN_SHA256,
      retentionHours: 168,
    },
  };
  const text = canonicalJsonPretty(publicValue);
  assert.deepEqual(scanPrivateText(text, { forbiddenValues: [privateRoot] }), []);
  const write = await writeNoReplace(
    path.join(publicRoot, 'campaign-recovery.public.json'), text, 0o644,
  );
  return { ...publicValue, publicRecoverySha256: write.sha256 };
}

async function main() {
  if (process.argv.length !== 4) {
    throw new TypeError(
      'usage: s18-observe-recovery.js <private-campaign-root> <public-root>',
    );
  }
  const result = await recoverS18V3Campaign({
    privateRoot: path.resolve(process.argv[2]),
    publicRoot: path.resolve(process.argv[3]),
  });
  process.stdout.write(canonicalJsonPretty({
    schema: 'scopa.s18-observe-hardening-recovery-result.v3',
    result: result.result,
    providerCallsConsumed: result.providerCallsConsumed,
    publicRecoverySha256: result.publicRecoverySha256,
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
