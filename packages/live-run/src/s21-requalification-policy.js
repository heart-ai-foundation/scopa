import { canonicalJson, jsonHash } from '../../enforcement/src/index.js';

export const S21_LIVE_MATRIX_SCHEMA = 'scopa.s21-production-live-matrix.v1';
export const S21_LIVE_APPROVAL_SCHEMA = 'scopa.s21-production-live-approval.v1';
export const S21_PROVIDER_GATE_CLOSED =
  'closed-pending-exact-principal-approval';
export const S21_PROVIDER_GATE_OPEN = 'authorized';

const NOT_BEFORE = '2026-08-01T02:33:34Z';
const EXPIRES_AT = '2026-08-02T02:33:34Z';
const SOURCE_COMMIT = 'd56440195dcb24cb6dd43c24e484641b1646a5a9';
const PACKAGE_SHA256 =
  '49b62ac4b4d869dbca8459aa08f515427e0a04349f014c85cc422d7e0625f147';
const CANDIDATE_MANIFEST_SHA256 =
  '77e86bc4edec4a8fab4006217e40579ffc44a1e77d7e78255f3252352a241b85';
const QUALIFICATION_SHA256 =
  'ad9d2dc7e22cfd6e5de07ebce0b430f3970e2eb1072f0e1a78711a82559cec2f';
const BUNDLE_MANIFEST_SHA256 =
  'd975f5914611d4185504acd58a25384de4a72ff89a54a6015a3c63b8b733e686';
const CLOSURE_SHA256 =
  '6071fda7b96dbe6bb87ed154ef3dc3d94e5f53be114148e663a7e9523e76180e';
const PAYLOAD_SHA256 =
  'd876bb115d8dd8755dfbddcbdabf84bf931487b177f24daf29a3d90aef5d7477';
const LICENSE_SHA256 =
  'a4066aa11d8d819047753fc841322b607807152f30a3a8342efc31f2fa7d84af';
const S20_CLOSEOUT_SHA256 =
  'd46d3be02571b6d90fd4b4c6a9dda7320db1a2bec2811b3c1c32cbad72d6045c';

const CALLS = Object.freeze([
  Object.freeze({ ordinal: 1, id: 'claude-clean', provider: 'claude',
    scenario: 'clean', predecessorRequired: false,
    client: 'claude-code@2.1.220', requestedModel: 'sonnet',
    expectedOutcome: 'allowedWork',
    custodyDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S21/claude' }),
  Object.freeze({ ordinal: 2, id: 'claude-cold-restart', provider: 'claude',
    scenario: 'cold-restart', predecessorRequired: true,
    client: 'claude-code@2.1.220', requestedModel: 'sonnet',
    expectedOutcome: 'coldRestartRecovered',
    custodyDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S21/claude' }),
  Object.freeze({ ordinal: 3, id: 'codex-clean', provider: 'codex',
    scenario: 'clean', predecessorRequired: false,
    client: 'codex-mcp-client@0.146.0', requestedModel: 'gpt-5.4',
    expectedOutcome: 'allowedWork',
    custodyDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S21/codex' }),
  Object.freeze({ ordinal: 4, id: 'codex-cold-restart', provider: 'codex',
    scenario: 'cold-restart', predecessorRequired: true,
    client: 'codex-mcp-client@0.146.0', requestedModel: 'gpt-5.4',
    expectedOutcome: 'coldRestartRecovered',
    custodyDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S21/codex' }),
]);

const CLAUDE_LIMITS = Object.freeze({
  maxProviderInvocations: 2, maxTurnsPerRun: 12, timeoutMsPerRun: 120000,
  maxInputBytesPerRun: 1048576, maxCaptureBytesPerRun: 20971520,
  maxPrivateEvidenceBytesPerRun: 26214400, maxBudgetUsdPerRun: '0.20',
  maxCampaignBudgetUsd: '0.40',
});
const CODEX_LIMITS = Object.freeze({
  maxProviderInvocations: 2, maxTurnsPerRun: 1, timeoutMsPerRun: 180000,
  maxInputBytesPerRun: 1048576, maxCaptureBytesPerRun: 20971520,
  maxPrivateEvidenceBytesPerRun: 26214400, maxInputTokensPerRun: 120000,
  maxOutputTokensPerRun: 4000, maxReasoningTokensPerRun: 2000,
  maxTotalTokensPerRun: 126000, maxCampaignTotalTokens: 252000,
});
const STOP_CONDITIONS = Object.freeze([
  'account-boundary-drift',
  'approval-absent-expired-consumed-or-digest-mismatched',
  'budget-or-usage-limit', 'candidate-or-production-identity-drift',
  'capture-limit', 'cleanup-failure', 'client-version-drift',
  'evidence-collision', 'mcp-inventory-drift', 'model-drift',
  'native-surface-drift', 'privacy-event', 'provider-rate-pressure',
  'provider-refusal', 'schema-drift', 'timeout',
]);

function plainObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label} must be a plain object`);
  }
}
function exactKeys(value, keys, label) {
  plainObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length ||
      actual.some((key, index) => key !== expected[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}
function exact(value, expected, label) {
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new TypeError(`${label} differs from the frozen S21 value`);
  }
}
function digest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new TypeError(`${label} must be a SHA-256 digest`);
  }
}
function isoInstant(value, label) {
  if (typeof value !== 'string' ||
      new Date(value).toISOString().replace('.000Z', 'Z') !== value) {
    throw new TypeError(`${label} must be a canonical ISO instant`);
  }
}

function descriptor() {
  return {
    schema: S21_LIVE_MATRIX_SCHEMA,
    version: { number: 1, date: '2026-07-31',
      changelog: 'Bind the S20 bundled candidate to a fresh four-call production-live posture.' },
    goal: {
      sourceCommit: SOURCE_COMMIT,
      packageSha256: PACKAGE_SHA256,
      candidateManifestSha256: CANDIDATE_MANIFEST_SHA256,
      qualificationReceiptSha256: QUALIFICATION_SHA256,
      productionBundleManifestSha256: BUNDLE_MANIFEST_SHA256,
      closureSha256: CLOSURE_SHA256,
      bundledPayloadSha256: PAYLOAD_SHA256,
      installedPayloadSha256: PAYLOAD_SHA256,
      licenseInventorySha256: LICENSE_SHA256,
      sequence: 'claude-clean-then-claude-cold-restart-then-codex-clean-then-codex-cold-restart',
      calls: structuredClone(CALLS),
      successCriteria: [
        'exact-four-part-production-identity-used',
        'clean-and-cold-restart-outcomes-pass-for-each-client',
        'bounded-private-evidence-and-complete-cleanup',
        'no-assurance-transfer-publication-or-experiment-crossover',
      ],
    },
    approvalTerms: { notBefore: NOT_BEFORE, expiresAt: EXPIRES_AT,
      singleUse: true, replayAllowed: false, sequenceChangeAllowed: false,
      partialApprovalTransferAllowed: false },
    authorization: { providerGate: S21_PROVIDER_GATE_CLOSED,
      principalApproval: 'not-granted',
      privateEvidenceDestinationApproval: 'not-granted',
      closedMatrixSha256: null, approvalSha256: null },
    constraints: { providerTrafficAllowed: false,
      totalProviderCallsPlanned: 4, totalProviderCallsAuthorized: 0,
      candidateDriftAllowed: false, experimentUseAllowed: false,
      customerDataAllowed: false, externalFixtureSecretsAllowed: false,
      rawEvidenceInRepositoryAllowed: false, publicationAllowed: false },
    deterministicPrerequisites: { s20Result: 'accepted',
      s20CloseoutSha256: S20_CLOSEOUT_SHA256,
      exactQualificationSha256: QUALIFICATION_SHA256,
      packageCount: 12, fileCount: 893, externalInstallRequests: 0,
      hostedQualificationRunId: 30678929665 },
    providers: {
      claude: { id: 'claude', client: 'claude-code@2.1.220',
        requestedModel: 'sonnet',
        modelSnapshotStatus: 'requested-name-not-provider-signed-snapshot',
        accountBoundary: 'current-authenticated-principal-controlled-claude-ai-subscription',
        identityHandling: 'verified-private-not-retained',
        networkClass: 'anthropic-first-party-via-claude-code',
        alternateProvidersDisabled: true, osNetworkEnforcementClaimed: false,
        assurance: 'partial', assuranceTransferable: false,
        strictScopaMcpOnly: true, nativeMutationRoutesDisabled: true,
        plannedCalls: 2, providerCallsAuthorized: 0,
        limits: structuredClone(CLAUDE_LIMITS),
        privateEvidenceDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S21/claude' },
      codex: { id: 'codex', client: 'codex-mcp-client@0.146.0',
        requestedModel: 'gpt-5.4',
        modelSnapshotStatus: 'requested-name-not-provider-signed-snapshot',
        accountBoundary: 'current-authenticated-principal-controlled-openai-codex-session',
        identityHandling: 'verified-private-not-retained',
        networkClass: 'openai-first-party-via-codex-cli',
        alternateProvidersDisabled: true, osNetworkEnforcementClaimed: false,
        assurance: 'partial', assuranceTransferable: false,
        strictScopaMcpOnly: true, nativeMutationRoutesDisabled: true,
        plannedCalls: 2, providerCallsAuthorized: 0,
        limits: structuredClone(CODEX_LIMITS),
        privateEvidenceDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S21/codex' },
    },
    evidence: { rootToken: 'SCOPA_PRIVATE_EVIDENCE_ROOT',
      rootMustResolveOutsideRepository: true, rootMode: '0700',
      privateFileMode: '0600', publicDerivativeMode: '0644',
      privateRetentionHours: 168, noReplaceWritesRequired: true,
      pathFreePublicDerivativesRequired: true },
    stopConditions: [...STOP_CONDITIONS],
    onFailure: { beforeProviderIntent: 'defer-with-zero-calls-consumed',
      afterProviderIntent: 'stop-campaign-close-evidence-and-forbid-replay',
      cleanupFailure: 'reject-qualification-and-require-reconciliation',
      privacyEvent: 'stop-retain-no-public-derivative-and-escalate' },
    ifAmbiguous: { action: 'defer-with-zero-provider-intent',
      authority: 'exact-principal-approval-required' },
    outputFormat: { privateCampaignSchema: 'scopa.s21-live-campaign.private.v1',
      publicCampaignSchema: 'scopa.s21-live-campaign.public.v1',
      authorizationReceiptSchema: 'scopa.s21-live-authorization.v1' },
  };
}

export function createClosedS21LiveMatrix() {
  const body = descriptor();
  return validateS21LiveMatrix({ ...body, matrixSha256: jsonHash(body) });
}

export function validateS21LiveMatrix(value) {
  const expected = descriptor();
  exactKeys(value, [...Object.keys(expected), 'matrixSha256'], 'S21 matrix');
  const gate = value.authorization?.providerGate;
  if (![S21_PROVIDER_GATE_CLOSED, S21_PROVIDER_GATE_OPEN].includes(gate)) {
    throw new TypeError('S21 provider gate is invalid');
  }
  for (const key of Object.keys(expected)) {
    if (!['authorization', 'constraints', 'providers'].includes(key)) {
      exact(value[key], expected[key], `S21 matrix ${key}`);
    }
  }
  if (gate === S21_PROVIDER_GATE_CLOSED) {
    exact(value.authorization, expected.authorization, 'closed authorization');
    exact(value.constraints, expected.constraints, 'closed constraints');
    exact(value.providers, expected.providers, 'closed providers');
  } else {
    digest(value.authorization?.approvalSha256, 'S21 approval digest');
    const authorized = structuredClone(expected);
    authorized.authorization = { providerGate: S21_PROVIDER_GATE_OPEN,
      principalApproval: 'conversation-explicit',
      privateEvidenceDestinationApproval: 'conversation-explicit',
      closedMatrixSha256: createClosedS21LiveMatrix().matrixSha256,
      approvalSha256: value.authorization.approvalSha256 };
    authorized.constraints.providerTrafficAllowed = true;
    authorized.constraints.totalProviderCallsAuthorized = 4;
    authorized.providers.claude.providerCallsAuthorized = 2;
    authorized.providers.codex.providerCallsAuthorized = 2;
    exact(value.authorization, authorized.authorization, 'authorized authorization');
    exact(value.constraints, authorized.constraints, 'authorized constraints');
    exact(value.providers, authorized.providers, 'authorized providers');
  }
  digest(value.matrixSha256, 'S21 matrix digest');
  const { matrixSha256, ...body } = value;
  if (jsonHash(body) !== matrixSha256) {
    throw new TypeError('S21 matrix digest does not bind the matrix');
  }
  return value;
}

function approvalCalls(matrix) {
  return matrix.goal.calls.map((call) => ({ ordinal: call.ordinal, id: call.id,
    provider: call.provider, scenario: call.scenario, client: call.client,
    requestedModel: call.requestedModel,
    custodyDestination: call.custodyDestination,
    limits: structuredClone(matrix.providers[call.provider].limits) }));
}

export function createS21LiveApproval(closedMatrix) {
  const closed = validateS21LiveMatrix(closedMatrix);
  if (closed.authorization.providerGate !== S21_PROVIDER_GATE_CLOSED) {
    throw new TypeError('S21 approval requires the closed matrix');
  }
  const body = { schema: S21_LIVE_APPROVAL_SCHEMA,
    decision: 'approve-exact-s21-production-live-matrix',
    notBefore: NOT_BEFORE, expiresAt: EXPIRES_AT,
    closedMatrixSha256: closed.matrixSha256, sourceCommit: SOURCE_COMMIT,
    packageSha256: PACKAGE_SHA256,
    productionIdentity: { closureSha256: CLOSURE_SHA256,
      bundledPayloadSha256: PAYLOAD_SHA256,
      installedPayloadSha256: PAYLOAD_SHA256 },
    calls: approvalCalls(closed),
    privateEvidenceDestinationApproval: 'conversation-explicit',
    singleUse: true, experimentUseAllowed: false, publicationAllowed: false };
  return { ...body, approvalSha256: jsonHash(body) };
}

export function authorizeS21LiveMatrix(closedMatrix, approval) {
  const closed = validateS21LiveMatrix(closedMatrix);
  exact(approval, createS21LiveApproval(closed), 'S21 approval');
  const authorized = structuredClone(closed);
  authorized.authorization = { providerGate: S21_PROVIDER_GATE_OPEN,
    principalApproval: 'conversation-explicit',
    privateEvidenceDestinationApproval: 'conversation-explicit',
    closedMatrixSha256: closed.matrixSha256,
    approvalSha256: approval.approvalSha256 };
  authorized.constraints.providerTrafficAllowed = true;
  authorized.constraints.totalProviderCallsAuthorized = 4;
  authorized.providers.claude.providerCallsAuthorized = 2;
  authorized.providers.codex.providerCallsAuthorized = 2;
  delete authorized.matrixSha256;
  authorized.matrixSha256 = jsonHash(authorized);
  return validateS21LiveMatrix(authorized);
}

export function assertS21ProviderAuthorized(matrix, approval, {
  executionInstant = new Date().toISOString(),
} = {}) {
  const current = validateS21LiveMatrix(matrix);
  if (current.authorization.providerGate !== S21_PROVIDER_GATE_OPEN) {
    throw new TypeError('S21 provider gate is closed; exact approval is required');
  }
  isoInstant(executionInstant, 'execution instant');
  if (executionInstant < NOT_BEFORE || executionInstant > EXPIRES_AT) {
    throw new TypeError('S21 approval is not valid at the execution instant');
  }
  const expected = authorizeS21LiveMatrix(createClosedS21LiveMatrix(), approval);
  exact(current, expected, 'authorized S21 matrix');
  return current;
}
