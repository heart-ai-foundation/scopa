import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createClosedS28DecisionPosture,
  createS28PrincipalDecision,
  evaluateS28Eligibility,
  loadS28Inputs,
  runS28Eligibility,
} from '../../../fixtures/S28/s28-r1-decision.mjs';
import { jsonHash } from '../../enforcement/src/index.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function mutate(inputs, callback) {
  const copy = structuredClone(inputs);
  callback(copy);
  return evaluateS28Eligibility(copy);
}

function blockerIds(receipt) {
  return receipt.blockers.map(({ id }) => id);
}

test('committed S28 eligibility and closed posture are exact and provider-off', async () => {
  const eligibility = await runS28Eligibility();
  const committedEligibility = JSON.parse(await readFile(
    path.join(ROOT, 'evidence/S28/r1-eligibility.json'), 'utf8'));
  const posture = createClosedS28DecisionPosture(eligibility);
  const committedPosture = JSON.parse(await readFile(
    path.join(ROOT, 'evidence/S28/closed-r1-decision-posture.json'), 'utf8'));
  assert.deepEqual(committedEligibility, eligibility);
  assert.deepEqual(committedPosture, posture);
  assert.deepEqual(eligibility.contracts.map(({ result }) => result), ['PASS', 'PASS', 'PASS']);
  assert.deepEqual(eligibility.blockers, []);
  assert.equal(posture.decision, 'PENDING');
  assert.equal(posture.releaseExecutionAuthorized, false);
  assert.equal(posture.publicationAuthorized, false);
  assert.equal(posture.providerCallsAuthorized, 0);
});

test('sanctioned R1 metadata drift uses only exact immutable S28 input bytes', async () => {
  const inputs = await loadS28Inputs();
  assert.equal(inputs.fileHashes.packageLock,
    '51c70cc1ef0e1411d48d57669fdc25699bd9ece65a934e54d2e1e3acadd1b95b');
  assert.equal(inputs.fileHashes.releasePosture,
    '6e3dc6f70b6d00d23916bb029abeb1e7f006ef0a0b8e55f2efd217b117baa3b2');
  assert.equal(inputs.documents.releasePosture.publication.repositoryVisibility, 'private');
});

test('S28 activation binds the exact protocol but authorizes no decision or traffic', async () => {
  const approval = JSON.parse(await readFile(
    path.join(ROOT, 'evidence/S28/activation-approval.json'), 'utf8'));
  assert.equal(approval.principalDecisionAuthorized, false);
  assert.equal(approval.providerCallsAuthorized, 0);
  assert.equal(approval.publicationAllowed, false);
  assert.equal(approval.releaseAllowed, false);
  assert.equal(sha256(await readFile(path.join(ROOT, approval.macroDeltaPath))),
    approval.macroDeltaFileSha256);
  assert.equal(sha256(await readFile(path.join(
    ROOT,
    approval.protocolPath.replace(/^next-prompt-protocols\/active\//,
      'next-prompt-protocols/completed/'),
  ))),
    approval.protocolFileSha256);
});

test('committed principal GO exactly matches the approved prospective digest', async () => {
  const posture = createClosedS28DecisionPosture(await runS28Eligibility());
  const expected = createS28PrincipalDecision(posture, 'GO');
  const committed = JSON.parse(await readFile(
    path.join(ROOT, 'evidence/S28/principal-decision.json'), 'utf8'));
  assert.deepEqual(committed, expected);
  assert.equal(committed.decisionSha256,
    'cb24c054a23594a8ea5d4608275b01c1bab6a3117b51f51c5dcc20736597464d');
  assert.equal(committed.releaseExecutionAuthorized, false);
});

test('S28 closeout binds GO while every release action remains closed', async () => {
  const closeout = JSON.parse(await readFile(
    path.join(ROOT, 'evidence/S28/closeout.json'), 'utf8'));
  const decision = JSON.parse(await readFile(
    path.join(ROOT, 'evidence/S28/principal-decision.json'), 'utf8'));
  assert.equal(closeout.result, 'accepted-go');
  assert.equal(closeout.principalDecision.decisionSha256, decision.decisionSha256);
  assert.equal(closeout.principalDecision.exactPostureMatched, true);
  assert.deepEqual(closeout.contracts,
    { PLQ1: 'satisfied', PLQ2: 'satisfied', PLQ3: 'satisfied' });
  assert.deepEqual(closeout.traffic,
    { providerCalls: 0, experimentCalls: 0, publicationActions: 0, releaseActions: 0 });
  assert.equal(closeout.releaseExecutionAuthorized, false);
  const { receiptSha256, ...body } = closeout;
  assert.equal(jsonHash(body), receiptSha256);
});

test('prospective GO and NO-GO decisions are exact and never execute release', async () => {
  const posture = createClosedS28DecisionPosture(await runS28Eligibility());
  const go = createS28PrincipalDecision(posture, 'GO');
  const noGo = createS28PrincipalDecision(posture, 'NO-GO');
  assert.equal(go.decisionSha256, 'cb24c054a23594a8ea5d4608275b01c1bab6a3117b51f51c5dcc20736597464d');
  assert.equal(noGo.decisionSha256, 'f717fc6d93edc883307951a24f5265d0f4837d183fde8919dc84acacc577cc41');
  for (const decision of [go, noGo]) {
    assert.equal(decision.releaseExecutionAuthorized, false);
    assert.equal(decision.publicationAuthorized, false);
    assert.equal(decision.tagAuthorized, false);
    assert.equal(decision.versionChangeAuthorized, false);
    assert.equal(decision.deploymentAuthorized, false);
    assert.equal(decision.announcementAuthorized, false);
  }
  assert.throws(() => createS28PrincipalDecision(posture, 'RELEASE'), /GO or NO-GO/);
  assert.throws(() => createS28PrincipalDecision({ ...posture, decision: 'GO' }, 'GO'),
    /exact closed posture/);
});

test('input-byte or candidate identity drift fails closed', async () => {
  const inputs = await loadS28Inputs();
  const bytes = mutate(inputs, (copy) => { copy.fileHashes.s27Closeout = '0'.repeat(64); });
  assert.equal(bytes.eligibleForPrincipalDecision, false);
  assert.ok(blockerIds(bytes).includes('byte-binding-s27Closeout'));
  const identity = mutate(inputs, (copy) => {
    copy.documents.s26r3Closeout.identity.closureSha256 = '0'.repeat(64);
  });
  assert.equal(identity.contracts.find(({ id }) => id === 'PLQ1').result, 'FAIL');
  assert.ok(blockerIds(identity).includes('exact-candidate-identity'));
});

test('review findings and hosted failure fail PLQ2', async () => {
  const inputs = await loadS28Inputs();
  const finding = mutate(inputs, (copy) => {
    copy.documents.s27Review.findings.push({ id: 'adversarial' });
  });
  assert.equal(finding.contracts.find(({ id }) => id === 'PLQ2').result, 'FAIL');
  const hosted = mutate(inputs, (copy) => { copy.documents.s27Closeout.hosted.conclusion = 'failure'; });
  assert.equal(hosted.contracts.find(({ id }) => id === 'PLQ2').result, 'FAIL');
});

test('cleanup, policy, privacy, traffic, and release drift fail PLQ3', async () => {
  const inputs = await loadS28Inputs();
  const cleanup = mutate(inputs, (copy) => {
    copy.documents.s26r3Closeout.campaign.allCleanupChecks = false;
  });
  assert.ok(blockerIds(cleanup).includes('final-gates-green'));
  const policy = mutate(inputs, (copy) => { copy.documents.s25Closeout.matrix.policyChecksPassed = 0; });
  assert.ok(blockerIds(policy).includes('final-gates-green'));
  const privacy = mutate(inputs, (copy) => { copy.texts.s27Review += '\n/home/example/private\n'; });
  assert.ok(blockerIds(privacy).includes('privacy-s27Review'));
  const traffic = mutate(inputs, (copy) => { copy.documents.s27Closeout.traffic.releaseActions = 1; });
  assert.ok(blockerIds(traffic).includes('license-traffic-release-boundary'));
  const release = mutate(inputs, (copy) => { copy.documents.releasePosture.publication.npm = true; });
  assert.ok(blockerIds(release).includes('license-traffic-release-boundary'));
});

test('an ineligible projection cannot produce a decision posture', async () => {
  const inputs = await loadS28Inputs();
  const ineligible = mutate(inputs, (copy) => { copy.fileHashes.license = '0'.repeat(64); });
  assert.throws(() => createClosedS28DecisionPosture(ineligible), /eligible exact evidence/);
});
