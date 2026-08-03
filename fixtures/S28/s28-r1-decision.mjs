import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsonHash } from '../../packages/enforcement/src/index.js';
import { scanPrivateText } from '../../packages/release-readiness/src/package-privacy.js';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PLAN = 'fixtures/S28/r1-eligibility-plan.json';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function add(blockers, condition, id, contract, detail) {
  if (!condition) blockers.push({ id, contract, detail });
}

function validReceipt(value) {
  if (!value || typeof value !== 'object' || typeof value.receiptSha256 !== 'string') return false;
  const { receiptSha256, ...body } = value;
  return jsonHash(body) === receiptSha256;
}

export async function loadS28Inputs(root = ROOT) {
  const planText = await readFile(path.join(root, PLAN), 'utf8');
  const plan = JSON.parse(planText);
  const documents = {};
  const texts = {};
  const fileHashes = {};
  for (const [id, binding] of Object.entries(plan.inputs)) {
    const text = await readFile(path.join(root, binding.path), 'utf8');
    texts[id] = text;
    fileHashes[id] = sha256(text);
    if (binding.path.endsWith('.json')) documents[id] = JSON.parse(text);
  }
  return { plan, planSha256: sha256(planText), documents, texts, fileHashes };
}

export function evaluateS28Eligibility({ plan, planSha256, documents, texts, fileHashes }) {
  const blockers = [];
  const {
    s24Closeout: s24,
    s25Qualification: qualification,
    s25Closeout: s25,
    s26r3Closeout: s26r3,
    s27Review: s27Review,
    s27Closeout: s27,
    releasePosture,
  } = documents;

  for (const [id, binding] of Object.entries(plan.inputs)) {
    add(blockers, fileHashes[id] === binding.sha256,
      `byte-binding-${id}`, 'PLQ3', `${id} input bytes diverged`);
  }

  const candidate = plan.candidate;
  add(blockers,
    qualification?.candidate?.packageSha256 === candidate.packageSha256
      && s25?.qualification?.packageSha256 === candidate.packageSha256
      && s25?.qualification?.closureSha256 === candidate.closureSha256
      && s25?.qualification?.bundledPayloadSha256 === candidate.bundledPayloadSha256
      && s25?.qualification?.installedPayloadSha256 === candidate.installedPayloadSha256
      && s25?.qualification?.licenseInventorySha256 === candidate.licenseInventorySha256
      && s26r3?.identity?.packageSha256 === candidate.packageSha256
      && s26r3?.identity?.closureSha256 === candidate.closureSha256
      && s26r3?.identity?.bundledPayloadSha256 === candidate.bundledPayloadSha256
      && s26r3?.identity?.installedPayloadSha256 === candidate.installedPayloadSha256,
    'exact-candidate-identity', 'PLQ1', 'candidate identity generations diverged');
  add(blockers,
    s24?.result === 'accepted'
      && validReceipt(s24)
      && s24?.runtime?.timeoutDescendantGone === true
      && s24?.runtime?.outputLimitDescendantGone === true
      && s24?.runtime?.orphanDescendantGone === true
      && s25?.result === 'accepted'
      && validReceipt(s25)
      && qualification?.qualification === 'pass'
      && qualification?.deterministicMatrix?.ok === true,
    'runtime-and-candidate-qualification', 'PLQ1',
    'process custody or exact candidate qualification is incomplete');

  add(blockers,
    s27Review?.verdict === 'ACCEPT'
      && s27Review?.findings?.length === 0
      && s27Review?.findingCounts?.critical === 0
      && s27Review?.findingCounts?.high === 0
      && s27Review?.findingCounts?.medium === 0
      && s27Review?.findingCounts?.unadjudicatedLow === 0
      && validReceipt(s27Review)
      && s27?.result === 'accepted'
      && validReceipt(s27)
      && s27?.contracts?.PLQ2 === 'satisfied'
      && s27?.hosted?.conclusion === 'success',
    'compressed-review-accepted', 'PLQ2', 'S27 review or hosted closeout is not accepted');

  add(blockers,
    s25?.matrix?.privacyFindings === 0
      && s25?.matrix?.bundledPrivacyFindings === 0
      && s25?.matrix?.policyChecksPassed === s25?.matrix?.policyChecksTotal
      && s25?.hosted?.conclusion === 'success'
      && s25?.hosted?.npmParity === 'passed'
      && s25?.hosted?.caseValidation === 'passed'
      && s26r3?.result === 'accepted'
      && validReceipt(s26r3)
      && s26r3?.authorization?.singleUseConsumed === true
      && s26r3?.campaign?.allCleanupChecks === true
      && s26r3?.evidence?.privacyFindings === 0
      && s26r3?.hostedApproval?.conclusion === 'success'
      && s27?.local?.protocolCheck === 'passed'
      && s27?.hosted?.accumulatedGate === 'passed'
      && s27?.hosted?.npmParity === 'passed'
      && s27?.hosted?.caseValidation === 'passed',
    'final-gates-green', 'PLQ3',
    'dependency, policy, privacy, protocol, local, hosted, or CASE gate is not green');

  for (const [id, text] of Object.entries(texts)) {
    add(blockers, scanPrivateText(text).length === 0,
      `privacy-${id}`, 'PLQ3', `${id} contains private topology or credential residue`);
  }
  add(blockers,
    releasePosture?.license === 'Apache-2.0'
      && releasePosture?.publication?.npm === false
      && releasePosture?.publication?.githubRelease === false
      && releasePosture?.publication?.publicRelease === false
      && releasePosture?.publication?.production === false
      && releasePosture?.publication?.requiresSeparatePrincipalApproval === true
      && s26r3?.traffic?.experimentCalls === 0
      && s26r3?.traffic?.publicationActions === 0
      && s26r3?.traffic?.releaseActions === 0
      && s27?.traffic?.providerCalls === 0
      && s27?.traffic?.experimentCalls === 0
      && s27?.traffic?.publicationActions === 0
      && s27?.traffic?.releaseActions === 0,
    'license-traffic-release-boundary', 'PLQ3',
    'license, traffic, publication, or release boundary diverged');

  const contracts = plan.requiredContracts.map((id) => ({
    id,
    result: blockers.some((blocker) => blocker.contract === id) ? 'FAIL' : 'PASS',
  }));
  const body = {
    schema: 'scopa.s28-r1-eligibility.v1',
    evaluationId: plan.evaluationId,
    evaluatedAt: '2026-08-03T02:15:00Z',
    planSha256,
    inputBindings: structuredClone(plan.inputs),
    candidate: structuredClone(candidate),
    contracts,
    blockers,
    eligibleForPrincipalDecision: blockers.length === 0,
    principalDecision: 'PENDING',
    releaseExecutionAuthorized: false,
    traffic: {
      providerCalls: 0,
      experimentCalls: 0,
      publicationActions: 0,
      releaseActions: 0,
    },
    nextAuthority: blockers.length === 0
      ? 'exact-principal-go-no-go-decision-required'
      : 'no-go-eligibility-only',
  };
  return { ...body, receiptSha256: jsonHash(body) };
}

export function createClosedS28DecisionPosture(eligibility) {
  if (eligibility?.eligibleForPrincipalDecision !== true
    || eligibility?.contracts?.some(({ result }) => result !== 'PASS')) {
    throw new TypeError('S28 decision posture requires eligible exact evidence');
  }
  const body = {
    schema: 'scopa.s28-r1-decision-posture.v1',
    candidate: structuredClone(eligibility.candidate),
    eligibilityReceiptSha256: eligibility.receiptSha256,
    decision: 'PENDING',
    permittedDecisions: ['GO', 'NO-GO'],
    releaseExecutionAuthorized: false,
    publicationAuthorized: false,
    providerCallsAuthorized: 0,
    experimentUseAuthorized: false,
    effectOnGo: 'eligible-for-separately-authorized-r1-release-action',
    effectOnNoGo: 'release-remains-closed',
    nextAuthority: 'explicit-principal-decision-on-exact-posture-digest-required',
  };
  return { ...body, postureSha256: jsonHash(body) };
}

export function createS28PrincipalDecision(posture, decision) {
  if (!['GO', 'NO-GO'].includes(decision)) {
    throw new TypeError('S28 principal decision must be GO or NO-GO');
  }
  if (posture?.decision !== 'PENDING'
    || posture?.postureSha256 !== jsonHash((({ postureSha256, ...body }) => body)(posture))) {
    throw new TypeError('S28 decision requires the exact closed posture');
  }
  const body = {
    schema: 'scopa.s28-r1-principal-decision.v1',
    authority: 'conversation-explicit-principal-decision',
    decidedAt: '2026-08-03T02:30:00Z',
    postureSha256: posture.postureSha256,
    eligibilityReceiptSha256: posture.eligibilityReceiptSha256,
    candidate: structuredClone(posture.candidate),
    decision,
    rationale: decision === 'GO'
      ? 'Exact candidate is eligible for a separately authorized R1 release action.'
      : 'R1 release eligibility is declined; release remains closed.',
    releaseExecutionAuthorized: false,
    publicationAuthorized: false,
    tagAuthorized: false,
    versionChangeAuthorized: false,
    deploymentAuthorized: false,
    announcementAuthorized: false,
    nextAuthority: decision === 'GO'
      ? 'separate-exact-r1-release-action-authorization-required'
      : 'queue-closed-no-release',
  };
  return { ...body, decisionSha256: jsonHash(body) };
}

export async function runS28Eligibility(root = ROOT) {
  return evaluateS28Eligibility(await loadS28Inputs(root));
}
