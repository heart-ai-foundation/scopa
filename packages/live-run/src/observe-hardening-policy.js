import {
  canonicalJson,
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  S18_CODEX_OBSERVE_SEQUENCE_POLICY,
} from './observe-sequence.js';

export const S18_OBSERVE_HARDENING_MATRIX_SCHEMA =
  'scopa.s18-production-live-continuation.v3';
export const S18_OBSERVE_HARDENING_APPROVAL_SCHEMA =
  'scopa.s18-production-live-continuation-approval.v3';

const CLOSED = 'closed-pending-explicit-approval';
const OPEN = 'authorized';
const SOURCE_COMMIT = '43fbb969f32c711d1a68b05ad73fb33717c90d8c';
const CANDIDATE_SHA256 =
  'e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498';
const V2_STOP_SHA256 =
  '22f73ea041b73a4166339b9d345684c285843331e08204005db24cb6497f699c';
const CLAUDE_CLEAN_SHA256 =
  '857f515c08b3982918d56fd34fd642b77946ec3ba28b5b94777a306cebb3329a';
const CLAUDE_COLD_SHA256 =
  '04c8f6873c3e45b711e5f992926ce6d9fb4707da058e28e742a5bf14ae5ec48b';

function exact(value, expected, label) {
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new TypeError(`${label} differs from the frozen S18-v3 value`);
  }
}

function digest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new TypeError(`${label} must be a SHA-256 digest`);
  }
}

function date(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${label} must be an ISO date`);
  }
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${label} must be a real calendar date`);
  }
}

function descriptor() {
  return {
    schema: S18_OBSERVE_HARDENING_MATRIX_SCHEMA,
    version: {
      number: 3,
      date: '2026-07-31',
      changelog: 'Retain accepted Claude evidence and authorize only a fresh Codex clean-to-cold-restart continuation under a bounded repeatable OBSERVE contract.',
    },
    goal: {
      sourceCommit: SOURCE_COMMIT,
      candidateSha256: CANDIDATE_SHA256,
      sequence: 'fresh-codex-clean-then-cold-restart',
      successCriteria: [
        'retained-v2-claude-evidence-remains-byte-identical',
        'fresh-codex-clean-and-cold-restart-pass-on-exact-candidate',
        'at-most-one-equivalent-repeated-scopa-check-per-run',
        'bounded-private-evidence-and-complete-cleanup',
      ],
    },
    retainedEvidence: {
      assuranceTransferAllowed: false,
      v2CampaignStopSha256: V2_STOP_SHA256,
      claudeCleanPublicSha256: CLAUDE_CLEAN_SHA256,
      claudeColdRestartPublicSha256: CLAUDE_COLD_SHA256,
      retainedProviderCalls: 2,
      retainedOutcomes: ['claude-clean', 'claude-cold-restart'],
    },
    authorization: {
      providerGate: CLOSED,
      approvedOn: null,
      expiresOn: null,
      principalApproval: 'not-granted',
      privateEvidenceDestinationApproval: 'not-granted',
      closedMatrixSha256: null,
      approvalSha256: null,
    },
    constraints: {
      providerTrafficAllowed: false,
      provider: 'codex',
      client: 'codex-mcp-client@0.146.0',
      requestedModel: 'gpt-5.4',
      strictScopaMcpOnly: true,
      nativeMutationRoutesDisabled: true,
      totalProviderCallsPlanned: 2,
      totalProviderCallsAuthorized: 0,
      candidateDriftAllowed: false,
      experimentUseAllowed: false,
      customerDataAllowed: false,
      rawEvidenceInRepositoryAllowed: false,
      publicationAllowed: false,
    },
    scenarios: [
      {
        id: 'clean', ordinal: 1, expectedOutcome: 'allowedWork',
        predecessorRequired: false, freshRuntimeRequired: true,
      },
      {
        id: 'cold-restart', ordinal: 2,
        expectedOutcome: 'coldRestartRecovered', predecessorRequired: true,
        freshRuntimeRequired: true,
      },
    ],
    sequencePolicy: structuredClone(S18_CODEX_OBSERVE_SEQUENCE_POLICY),
    limits: {
      maxProviderInvocations: 2,
      maxTurnsPerRun: 1,
      timeoutMsPerRun: 180000,
      maxInputBytesPerRun: 1048576,
      maxCaptureBytesPerRun: 20971520,
      maxPrivateEvidenceBytesPerRun: 26214400,
      maxInputTokensPerRun: 120000,
      maxOutputTokensPerRun: 4000,
      maxReasoningTokensPerRun: 2000,
      maxTotalTokensPerRun: 126000,
      maxCampaignTotalTokens: 252000,
    },
    evidence: {
      privateDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S18V3/codex',
      rootMustResolveOutsideRepository: true,
      rootMode: '0700',
      privateFileMode: '0600',
      publicDerivativeMode: '0644',
      privateRetentionHours: 168,
      noReplaceWritesRequired: true,
      pathFreePublicDerivativesRequired: true,
    },
    rejectIf: [
      'candidate-client-model-or-retained-evidence-digest-mismatch',
      'approval-absent-expired-consumed-or-digest-mismatched',
      'sequence-policy-drift-or-more-than-one-extra-call',
      'extra-call-is-not-a-successful-semantically-equivalent-scopa-check',
      'mutation-read-assurance-or-transcript-call-is-repeated-or-reordered',
      'private-destination-unapproved-inside-repository-or-unsafe-mode',
      'call-token-time-capture-retention-or-evidence-bound-exceeded',
      'predecessor-continuity-cleanup-residue-privacy-event-or-false-green',
    ],
    onFailure: {
      beforeProviderIntent: 'defer-with-zero-calls-consumed',
      afterProviderIntent: 'stop-campaign-close-evidence-and-forbid-replay',
      sequenceViolation: 'reject-run-and-stop-campaign-without-reclassification',
      cleanupFailure: 'reject-qualification-and-require-reconciliation',
      privacyEvent: 'stop-retain-no-public-derivative-and-escalate',
    },
    ifAmbiguous: {
      action: 'defer-with-zero-provider-intent',
      authority: 'fresh-exact-principal-approval-required',
    },
  };
}

export function createClosedS18ObserveHardeningMatrix() {
  const body = descriptor();
  return validateS18ObserveHardeningMatrix({
    ...body,
    matrixSha256: jsonHash(body),
  });
}

export function validateS18ObserveHardeningMatrix(value) {
  const expected = descriptor();
  const gate = value?.authorization?.providerGate;
  if (![CLOSED, OPEN].includes(gate)) {
    throw new TypeError('S18-v3 provider gate is invalid');
  }
  const normalized = structuredClone(expected);
  if (gate === OPEN) {
    date(value.authorization.approvedOn, 'approval date');
    date(value.authorization.expiresOn, 'approval expiry');
    normalized.authorization = structuredClone(value.authorization);
    normalized.constraints.providerTrafficAllowed = true;
    normalized.constraints.totalProviderCallsAuthorized = 2;
    if (
      value.authorization.principalApproval !== 'conversation-explicit' ||
      value.authorization.privateEvidenceDestinationApproval !== 'conversation-explicit' ||
      value.authorization.closedMatrixSha256 !==
        createClosedS18ObserveHardeningMatrix().matrixSha256
    ) {
      throw new TypeError('authorized S18-v3 matrix lacks exact approval');
    }
    digest(value.authorization.closedMatrixSha256, 'closed matrix digest');
    digest(value.authorization.approvalSha256, 'approval digest');
  }
  const { matrixSha256, ...body } = value ?? {};
  digest(matrixSha256, 'S18-v3 matrix digest');
  exact(body, normalized, 'S18-v3 matrix');
  if (jsonHash(body) !== matrixSha256) {
    throw new TypeError('S18-v3 matrix digest does not bind the matrix');
  }
  return value;
}

export function createS18ObserveHardeningApproval(
  closedMatrix,
  { approvedOn, expiresOn },
) {
  const closed = validateS18ObserveHardeningMatrix(closedMatrix);
  if (closed.authorization.providerGate !== CLOSED) {
    throw new TypeError('S18-v3 approval requires the closed matrix');
  }
  date(approvedOn, 'approval date');
  date(expiresOn, 'approval expiry');
  const validityDays = (Date.parse(`${expiresOn}T00:00:00Z`) -
    Date.parse(`${approvedOn}T00:00:00Z`)) / 86_400_000;
  if (!Number.isInteger(validityDays) || validityDays < 0 || validityDays > 1) {
    throw new TypeError('S18-v3 approval validity must not exceed one day');
  }
  const body = {
    schema: S18_OBSERVE_HARDENING_APPROVAL_SCHEMA,
    decision: 'approve-exact-s18-v3-codex-continuation',
    approvedOn,
    expiresOn,
    closedMatrixSha256: closed.matrixSha256,
    sourceCommit: SOURCE_COMMIT,
    candidateSha256: CANDIDATE_SHA256,
    privateEvidenceDestinationApproval: 'conversation-explicit',
    providerCalls: { codex: 2, total: 2 },
    codexUsage: { perRunTotalTokens: 126000, campaignTotalTokens: 252000 },
    retainedV2CampaignStopSha256: V2_STOP_SHA256,
    sequencePolicySha256: jsonHash(S18_CODEX_OBSERVE_SEQUENCE_POLICY),
  };
  return { ...body, approvalSha256: jsonHash(body) };
}

export function authorizeS18ObserveHardeningMatrix(closedMatrix, approval) {
  const closed = validateS18ObserveHardeningMatrix(closedMatrix);
  const expected = createS18ObserveHardeningApproval(closed, {
    approvedOn: approval?.approvedOn,
    expiresOn: approval?.expiresOn,
  });
  exact(approval, expected, 'S18-v3 approval');
  const authorized = structuredClone(closed);
  authorized.authorization = {
    providerGate: OPEN,
    approvedOn: approval.approvedOn,
    expiresOn: approval.expiresOn,
    principalApproval: 'conversation-explicit',
    privateEvidenceDestinationApproval: 'conversation-explicit',
    closedMatrixSha256: closed.matrixSha256,
    approvalSha256: approval.approvalSha256,
  };
  authorized.constraints.providerTrafficAllowed = true;
  authorized.constraints.totalProviderCallsAuthorized = 2;
  delete authorized.matrixSha256;
  authorized.matrixSha256 = jsonHash(authorized);
  return validateS18ObserveHardeningMatrix(authorized);
}
