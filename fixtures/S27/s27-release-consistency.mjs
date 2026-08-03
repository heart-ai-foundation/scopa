import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJsonPretty, jsonHash } from '../../packages/enforcement/src/index.js';
import { scanPrivateText } from '../../packages/release-readiness/src/package-privacy.js';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PLAN_PATH = path.join(ROOT, 'fixtures/S27/release-consistency-plan.json');
const PACKAGE = 'aa744c45c8d28bc609205748f4594a9dc6fa829fd996e63c3917a0693165e8d6';
const CLOSURE = '6071fda7b96dbe6bb87ed154ef3dc3d94e5f53be114148e663a7e9523e76180e';
const PAYLOAD = 'd876bb115d8dd8755dfbddcbdabf84bf931487b177f24daf29a3d90aef5d7477';
const APPROVAL = '5563e521614ea04834170545b07375e54613ef7ad1ba6519242b25dc4e7094eb';
const CLOSED_MATRIX = '237f90ea7c67cc5799c5a71fa17855304220f9028fe0d45ab3d2e9748fe93b9c';
const AUTHORIZED_MATRIX = '4e76e51f32b5aaf4a4a130e2c2e164a79f9ee926322a1fc2df64da97325b512c';
const PUBLIC_CAMPAIGN = '178092bff3078e5b6c43def13298779b2829895e2f32b67cdbebcfaae5eec076';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function issue(findings, id, boundary, detail) {
  findings.push({ id, boundary, severity: 'high', detail });
}

function check(findings, condition, id, boundary, detail) {
  if (!condition) issue(findings, id, boundary, detail);
}

function exactIdentity(value) {
  return value?.packageSha256 === PACKAGE
    && value?.closureSha256 === CLOSURE
    && value?.bundledPayloadSha256 === PAYLOAD
    && value?.installedPayloadSha256 === PAYLOAD;
}

export async function loadS27ReviewInputs(root = ROOT) {
  const planText = await readFile(path.join(root, path.relative(ROOT, PLAN_PATH)), 'utf8');
  const plan = JSON.parse(planText);
  const documents = {};
  const texts = {};
  const fileHashes = {};
  for (const [id, binding] of Object.entries(plan.inputs)) {
    const text = await readFile(path.join(root, binding.path), 'utf8');
    texts[id] = text;
    documents[id] = JSON.parse(text);
    fileHashes[id] = sha256(text);
  }
  return { plan, planSha256: sha256(planText), documents, texts, fileHashes };
}

export function evaluateS27Review({ plan, planSha256, documents, texts, fileHashes }) {
  const findings = [];
  const {
    s24Closeout: s24,
    s25Qualification: qualification,
    s25Closeout: s25,
    s26r3Matrix: matrix,
    s26r3Approval: approval,
    s26r3Campaign: campaign,
    s26r3Consumption: consumption,
    s26r3Closeout: closeout,
    releasePosture,
  } = documents;

  for (const [id, binding] of Object.entries(plan.inputs)) {
    check(findings, fileHashes[id] === binding.sha256,
      `byte-binding-${id}`, 'installed-production-identity',
      `${id} bytes differ from the compressed review plan`);
  }

  check(findings,
    qualification?.candidate?.packageSha256 === PACKAGE
      && exactIdentity(s25?.qualification)
      && exactIdentity(matrix?.goal)
      && exactIdentity(campaign)
      && exactIdentity(closeout?.identity),
    'four-part-production-identity', 'installed-production-identity',
    'package, closure, bundled payload, or installed payload identity diverged');
  check(findings,
    qualification?.installedByNpm?.npm10?.productionBundle?.ok === true
      && qualification?.installedByNpm?.npm11?.productionBundle?.ok === true
      && qualification?.candidate?.npmVersionPackingByteIdentical === true
      && qualification?.candidate?.repeatedPackingByteIdentical === true,
    'installed-candidate-qualification', 'installed-production-identity',
    'npm 10/11 installed candidate qualification is incomplete');
  check(findings,
    s24?.result === 'accepted'
      && s24?.runtime?.timeoutDescendantGone === true
      && s24?.runtime?.outputLimitDescendantGone === true
      && s24?.runtime?.orphanDescendantGone === true
      && s24?.runtime?.sigtermResistantEscalationPassed === true,
    'process-tree-custody', 'installed-production-identity',
    'S24 complete process-tree custody is not accepted');

  check(findings,
    matrix?.matrixSha256 === CLOSED_MATRIX
      && approval?.approvalSha256 === APPROVAL
      && approval?.closedMatrixSha256 === CLOSED_MATRIX
      && closeout?.authorization?.authorizedMatrixSha256 === AUTHORIZED_MATRIX,
    'authorization-chain', 'single-use-approval-closure',
    'matrix, approval, or authorized matrix binding diverged');
  check(findings,
    consumption?.approvals?.length === 1
      && consumption.approvals[0]?.approvalSha256 === APPROVAL
      && consumption.approvals[0]?.invocationCount === 2
      && consumption.approvals[0]?.publicCampaignSha256 === PUBLIC_CAMPAIGN
      && closeout?.authorization?.singleUseConsumed === true
      && closeout?.authorization?.replayProbe === 'refused-before-installation-or-provider-intent',
    'single-use-consumption', 'single-use-approval-closure',
    'approval consumption or replay closure diverged');

  const calls = campaign?.runs ?? [];
  const codexUsage = calls[1]?.usage ?? {};
  const codexTotal = (codexUsage.input_tokens ?? -1)
    + (codexUsage.output_tokens ?? -1)
    + (codexUsage.reasoning_output_tokens ?? -1);
  check(findings,
    campaign?.invocationCount === 2
      && JSON.stringify(campaign?.callOrder) === JSON.stringify(['claude-clean', 'codex-clean'])
      && calls.length === 2
      && calls.every((run) => run.terminalState === 'succeeded'
        && run.canStop === true
        && run.cleanup?.groupGone === true
        && run.cleanup?.orphanDetected === false),
    'campaign-outcomes', 'public-private-evidence-binding',
    'ordered terminal polarity or cleanup diverged');
  check(findings,
    typeof calls[0]?.costUsd === 'string'
      && /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(calls[0].costUsd)
      && Number(calls[0].costUsd) <= 0.20
      && calls[0]?.turns <= 12
      && codexTotal <= 126000,
    'campaign-bounds', 'public-private-evidence-binding',
    'cost, turn, or token boundary was exceeded');
  check(findings,
    sha256(texts.s26r3Campaign) === PUBLIC_CAMPAIGN
      && campaign?.privateEvidence?.sha256 === closeout?.evidence?.privateCampaignSha256
      && campaign?.privateEvidence?.bytes === closeout?.evidence?.privateCampaignBytes
      && closeout?.evidence?.privateFilesMode === '0600'
      && closeout?.evidence?.privateDirectoriesMode === '0700',
    'public-private-custody-binding', 'public-private-evidence-binding',
    'public derivative does not bind the external private campaign');
  for (const id of ['s26r3Matrix', 's26r3Approval', 's26r3Campaign',
    's26r3Consumption', 's26r3Closeout', 'releasePosture']) {
    check(findings, scanPrivateText(texts[id]).length === 0,
      `privacy-${id}`, 'public-private-evidence-binding',
      `${id} contains private topology or credential residue`);
  }

  check(findings,
    matrix?.constraints?.experimentUseAllowed === false
      && matrix?.constraints?.publicationAllowed === false
      && matrix?.constraints?.releaseAllowed === false
      && Object.values(matrix?.providers ?? {}).every((provider) =>
        provider.assurance === 'partial'
        && provider.assuranceTransferable === false
        && provider.osNetworkEnforcementClaimed === false),
    'assurance-boundary', 'release-claim-boundary',
    'client assurance or transfer claim expanded');
  check(findings,
    releasePosture?.publication?.npm === false
      && releasePosture?.publication?.githubRelease === false
      && releasePosture?.publication?.publicRelease === false
      && releasePosture?.publication?.production === false
      && releasePosture?.publication?.requiresSeparatePrincipalApproval === true
      && closeout?.traffic?.experimentCalls === 0
      && closeout?.traffic?.publicationActions === 0
      && closeout?.traffic?.releaseActions === 0,
    'release-posture-closed', 'release-claim-boundary',
    'release, publication, production, or experiment posture opened');

  const body = {
    schema: 'scopa.s27-release-consistency-review.v1',
    reviewId: plan.reviewId,
    reviewedAt: '2026-08-03T02:00:00Z',
    planSha256,
    inputBindings: structuredClone(plan.inputs),
    boundaries: plan.boundaries.map((boundary) => ({
      id: boundary,
      result: findings.some((finding) => finding.boundary === boundary)
        ? 'REJECT'
        : 'PASS',
    })),
    findings,
    findingCounts: {
      critical: 0,
      high: findings.length,
      medium: 0,
      low: 0,
      unadjudicatedLow: 0,
    },
    verdict: findings.length === 0 ? 'ACCEPT' : 'REJECT',
    traffic: {
      providerCalls: 0,
      experimentCalls: 0,
      publicationActions: 0,
      releaseActions: 0,
    },
    nextAuthority: findings.length === 0
      ? 'separate-s28-protocol-activation-required'
      : 'fresh-finding-bound-remediation-required',
  };
  return { ...body, receiptSha256: jsonHash(body) };
}

export async function runS27Review(root = ROOT) {
  return evaluateS27Review(await loadS27ReviewInputs(root));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await runS27Review();
  process.stdout.write(canonicalJsonPretty(receipt));
  if (receipt.verdict !== 'ACCEPT') process.exitCode = 1;
}
