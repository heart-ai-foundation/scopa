import { canonicalJson, jsonHash } from '../../packages/enforcement/src/index.js';

export const S26R2_LIVE_MATRIX_SCHEMA = 'scopa.s26r2-production-live-matrix.v1';
export const S26R2_LIVE_APPROVAL_SCHEMA = 'scopa.s26r2-production-live-approval.v1';
export const S26R2_PROVIDER_GATE_CLOSED =
  'closed-pending-exact-principal-approval';
export const S26R2_PROVIDER_GATE_OPEN = 'authorized';

const NOT_BEFORE = '2026-08-02T13:15:00Z';
const EXPIRES_AT = '2026-08-03T13:15:00Z';
const SOURCE_COMMIT = '395a7e340084bbefbb5fb1ae575193eb33cacef4';
const PACKAGE_SHA256 =
  'aa744c45c8d28bc609205748f4594a9dc6fa829fd996e63c3917a0693165e8d6';
const CANDIDATE_MANIFEST_SHA256 =
  '254d6a8823060b81f4d44500941195d9d8e7be50443c136cb4d6264dbde43c99';
const QUALIFICATION_RECEIPT_SHA256 =
  'bf3a0a54cf6be03ce5e3a6f6d69b8ebe32ca3ad5e07a6fcab04110e6fea1f6d9';
const QUALIFICATION_FILE_SHA256 =
  '91a33cfadb482fbb809027c25eb567e4507eebd5ab35b285b4b9812b94446f12';
const S25_CLOSEOUT_RECEIPT_SHA256 =
  '30c433804929d71f43da71758cd7672abe67407e03f33cc07c05a41c0b7dd492';
const S25_CLOSEOUT_FILE_SHA256 =
  'dccc32c864bba86ef7931dd3c3adafcc357eb4da3563163154e081493af461a9';
const BUNDLE_MANIFEST_SHA256 =
  'd975f5914611d4185504acd58a25384de4a72ff89a54a6015a3c63b8b733e686';
const CLOSURE_SHA256 =
  '6071fda7b96dbe6bb87ed154ef3dc3d94e5f53be114148e663a7e9523e76180e';
const PAYLOAD_SHA256 =
  'd876bb115d8dd8755dfbddcbdabf84bf931487b177f24daf29a3d90aef5d7477';
const LICENSE_SHA256 =
  'a4066aa11d8d819047753fc841322b607807152f30a3a8342efc31f2fa7d84af';
const PROMPTS_SHA256 =
  '25e5a6b6b0f1a455421fa895ed5050c7669a1a9074026d848188887330d98eb8';
const PROCESS_TREE_FIXTURE_SHA256 =
  '247ae938eb94c47ff934fef782246923395a7f7e65329d7b44826a23a4901f3b';
const PRODUCTION_LIVE_RUNNER_SHA256 =
  '180e2e0828497731463a7ecfc54a45e77e76bf9686fc4917b2f92183fc6ddb85';
const S26R1_STOP_FILE_SHA256 =
  '096cc4d6655c083ae9938a61b270fa4515c89c5361174bbe0d3fcfdc5cccbac1';
const S26R1_CONSUMED_APPROVALS_FILE_SHA256 =
  'd63326d5ba76849ffe8383f36ea7512db7a86c9c1516a3ff0fe760dcd9f9a902';
const SUPERSEDED_RUNNER_SHA256 =
  '54eaafa95ae77af5083678a2ae8ebb6d87667bfb2a7ea485aeb911c90a002431';

const CALLS = Object.freeze([
  Object.freeze({
    ordinal: 1,
    id: 'claude-clean',
    provider: 'claude',
    scenario: 'clean',
    promptKey: 'claude-clean',
    client: 'claude-code@2.1.220',
    requestedModel: 'sonnet',
    expectedOutcome: 'allowedWork',
    custodyDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S26R2/claude',
  }),
  Object.freeze({
    ordinal: 2,
    id: 'codex-clean',
    provider: 'codex',
    scenario: 'clean',
    promptKey: 'codex-clean',
    client: 'codex-mcp-client@0.146.0',
    requestedModel: 'gpt-5.4',
    expectedOutcome: 'allowedWork',
    custodyDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S26R2/codex',
  }),
]);

const CLAUDE_LIMITS = Object.freeze({
  maxProviderInvocations: 1,
  maxTurnsPerRun: 12,
  timeoutMsPerRun: 120000,
  maxInputBytesPerRun: 1048576,
  maxCaptureBytesPerRun: 20971520,
  maxPrivateEvidenceBytesPerRun: 26214400,
  maxBudgetUsdPerRun: '0.20',
  maxCampaignBudgetUsd: '0.20',
});
const CODEX_LIMITS = Object.freeze({
  maxProviderInvocations: 1,
  maxTurnsPerRun: 1,
  timeoutMsPerRun: 180000,
  maxInputBytesPerRun: 1048576,
  maxCaptureBytesPerRun: 20971520,
  maxPrivateEvidenceBytesPerRun: 26214400,
  maxInputTokensPerRun: 120000,
  maxOutputTokensPerRun: 4000,
  maxReasoningTokensPerRun: 2000,
  maxTotalTokensPerRun: 126000,
  maxCampaignTotalTokens: 126000,
});
const STOP_CONDITIONS = Object.freeze([
  'account-boundary-drift',
  'approval-absent-expired-consumed-or-digest-mismatched',
  'budget-or-usage-limit',
  'candidate-or-production-identity-drift',
  'capture-limit',
  'cleanup-failure',
  'client-version-drift',
  'evidence-collision',
  'mcp-inventory-drift',
  'model-drift',
  'native-surface-drift',
  'privacy-event',
  'provider-rate-pressure',
  'provider-refusal',
  'scenario-session-binding-drift',
  'schema-drift',
  'timeout',
]);

function plainObject(value, label) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError(`${label} must be a plain object`);
  }
}

function exactKeys(value, keys, label) {
  plainObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function exact(value, expected, label) {
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new TypeError(`${label} differs from the frozen S26R2 value`);
  }
}

function digest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new TypeError(`${label} must be a SHA-256 digest`);
  }
}

function isoInstant(value, label) {
  if (
    typeof value !== 'string' ||
    new Date(value).toISOString().replace('.000Z', 'Z') !== value
  ) {
    throw new TypeError(`${label} must be a canonical ISO instant`);
  }
}

function descriptor() {
  return {
    schema: S26R2_LIVE_MATRIX_SCHEMA,
    version: {
      number: 1,
      date: '2026-08-02',
      changelog: 'Bind runtime scenario identity exactly to the SCOPA session/transcript identity while preserving S26R1 evidence retention.',
    },
    goal: {
      sourceCommit: SOURCE_COMMIT,
      packageSha256: PACKAGE_SHA256,
      candidateManifestSha256: CANDIDATE_MANIFEST_SHA256,
      qualificationReceiptSha256: QUALIFICATION_RECEIPT_SHA256,
      productionBundleManifestSha256: BUNDLE_MANIFEST_SHA256,
      closureSha256: CLOSURE_SHA256,
      bundledPayloadSha256: PAYLOAD_SHA256,
      installedPayloadSha256: PAYLOAD_SHA256,
      licenseInventorySha256: LICENSE_SHA256,
      sequence: 'claude-clean-then-codex-clean',
      calls: structuredClone(CALLS),
      successCriteria: [
        'every-returned-run-retained-before-qualification-assertion',
        'runtime-scenario-id-exactly-equals-scopa-session-and-transcript-id',
        'exact-s25-four-part-production-identity-used',
        'clean-outcome-passes-through-each-distinct-client-transport',
        'strict-scopa-only-tool-surface-and-terminal-polarity',
        'bounded-private-evidence-and-complete-process-group-cleanup',
        'no-assurance-transfer-experiment-publication-or-release-crossover',
      ],
    },
    approvalTerms: {
      notBefore: NOT_BEFORE,
      expiresAt: EXPIRES_AT,
      singleUse: true,
      replayAllowed: false,
      sequenceChangeAllowed: false,
      partialApprovalTransferAllowed: false,
    },
    authorization: {
      providerGate: S26R2_PROVIDER_GATE_CLOSED,
      principalApproval: 'not-granted',
      privateEvidenceDestinationApproval: 'not-granted',
      closedMatrixSha256: null,
      approvalSha256: null,
    },
    constraints: {
      providerTrafficAllowed: false,
      totalProviderCallsPlanned: 2,
      totalProviderCallsAuthorized: 0,
      candidateDriftAllowed: false,
      experimentUseAllowed: false,
      customerDataAllowed: false,
      externalFixtureSecretsAllowed: false,
      rawEvidenceInRepositoryAllowed: false,
      publicationAllowed: false,
      releaseAllowed: false,
    },
    deterministicPrerequisites: {
      s25Result: 'accepted',
      qualificationReceiptSha256: QUALIFICATION_RECEIPT_SHA256,
      qualificationFileSha256: QUALIFICATION_FILE_SHA256,
      s25CloseoutReceiptSha256: S25_CLOSEOUT_RECEIPT_SHA256,
      s25CloseoutFileSha256: S25_CLOSEOUT_FILE_SHA256,
      promptsSha256: PROMPTS_SHA256,
      processTreeFixtureSha256: PROCESS_TREE_FIXTURE_SHA256,
      productionLiveRunnerSha256: PRODUCTION_LIVE_RUNNER_SHA256,
      s26r1Result: 'stopped-runner-scenario-binding-mismatch',
      s26r1StopFileSha256: S26R1_STOP_FILE_SHA256,
      s26r1ConsumedApprovalsFileSha256:
        S26R1_CONSUMED_APPROVALS_FILE_SHA256,
      supersededRunnerSha256: SUPERSEDED_RUNNER_SHA256,
      scenarioBindingContracts: [
        'matrix-scenario-remains-clean-classification',
        'runtime-scenario-id-equals-session-id',
        'transcript-scenario-must-equal-runtime-scenario-id',
        'mismatch-rejects-before-provider-intent-or-qualification-acceptance',
      ],
      retentionContracts: [
        'returned-success-retained-before-validation',
        'returned-failure-retained-before-validation',
        'retention-failure-stops-before-qualification-assertion',
      ],
      packageCount: 12,
      fileCount: 893,
      candidateInstallExternalRequests: 0,
      hostedQualificationRunId: 30749095499,
      processTreeContracts: ['PTC1', 'PTC2', 'PTC3'],
    },
    providers: {
      claude: {
        id: 'claude',
        client: 'claude-code@2.1.220',
        requestedModel: 'sonnet',
        modelSnapshotStatus: 'requested-name-not-provider-signed-snapshot',
        accountBoundary: 'current-authenticated-principal-controlled-claude-ai-subscription',
        identityHandling: 'verified-private-not-retained',
        networkClass: 'anthropic-first-party-via-claude-code',
        alternateProvidersDisabled: true,
        osNetworkEnforcementClaimed: false,
        assurance: 'partial',
        assuranceTransferable: false,
        strictScopaMcpOnly: true,
        nativeMutationRoutesDisabled: true,
        plannedCalls: 1,
        providerCallsAuthorized: 0,
        limits: structuredClone(CLAUDE_LIMITS),
        privateEvidenceDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S26R2/claude',
      },
      codex: {
        id: 'codex',
        client: 'codex-mcp-client@0.146.0',
        requestedModel: 'gpt-5.4',
        modelSnapshotStatus: 'requested-name-not-provider-signed-snapshot',
        accountBoundary: 'current-authenticated-principal-controlled-openai-codex-session',
        identityHandling: 'verified-private-not-retained',
        networkClass: 'openai-first-party-via-codex-cli',
        alternateProvidersDisabled: true,
        osNetworkEnforcementClaimed: false,
        assurance: 'partial',
        assuranceTransferable: false,
        strictScopaMcpOnly: true,
        nativeMutationRoutesDisabled: true,
        plannedCalls: 1,
        providerCallsAuthorized: 0,
        limits: structuredClone(CODEX_LIMITS),
        privateEvidenceDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S26R2/codex',
      },
    },
    evidence: {
      rootToken: 'SCOPA_PRIVATE_EVIDENCE_ROOT',
      rootMustResolveOutsideRepository: true,
      rootMode: '0700',
      privateFileMode: '0600',
      publicDerivativeMode: '0644',
      privateRetentionHours: 168,
      noReplaceWritesRequired: true,
      pathFreePublicDerivativesRequired: true,
    },
    stopConditions: [...STOP_CONDITIONS],
    onFailure: {
      beforeProviderIntent: 'defer-with-zero-calls-consumed',
      afterProviderIntent: 'stop-campaign-close-evidence-and-forbid-replay',
      cleanupFailure: 'reject-qualification-and-require-reconciliation',
      privacyEvent: 'stop-retain-no-public-derivative-and-escalate',
    },
    ifAmbiguous: {
      action: 'defer-with-zero-provider-intent',
      authority: 'exact-principal-approval-required',
    },
    outputFormat: {
      privateCampaignSchema: 'scopa.s26r2-live-campaign.private.v1',
      publicCampaignSchema: 'scopa.s26r2-live-campaign.public.v1',
      authorizationReceiptSchema: 'scopa.s26r2-live-authorization.v1',
    },
  };
}

export function createClosedS26R2LiveMatrix() {
  const body = descriptor();
  return validateS26R2LiveMatrix({ ...body, matrixSha256: jsonHash(body) });
}

export function validateS26R2LiveMatrix(value) {
  const expected = descriptor();
  exactKeys(value, [...Object.keys(expected), 'matrixSha256'], 'S26R2 matrix');
  const gate = value.authorization?.providerGate;
  if (![S26R2_PROVIDER_GATE_CLOSED, S26R2_PROVIDER_GATE_OPEN].includes(gate)) {
    throw new TypeError('S26R2 provider gate is invalid');
  }
  for (const key of Object.keys(expected)) {
    if (!['authorization', 'constraints', 'providers'].includes(key)) {
      exact(value[key], expected[key], `S26R2 matrix ${key}`);
    }
  }
  if (gate === S26R2_PROVIDER_GATE_CLOSED) {
    exact(value.authorization, expected.authorization, 'closed authorization');
    exact(value.constraints, expected.constraints, 'closed constraints');
    exact(value.providers, expected.providers, 'closed providers');
  } else {
    digest(value.authorization?.approvalSha256, 'S26R2 approval digest');
    const authorized = structuredClone(expected);
    authorized.authorization = {
      providerGate: S26R2_PROVIDER_GATE_OPEN,
      principalApproval: 'conversation-explicit',
      privateEvidenceDestinationApproval: 'conversation-explicit',
      closedMatrixSha256: createClosedS26R2LiveMatrix().matrixSha256,
      approvalSha256: value.authorization.approvalSha256,
    };
    authorized.constraints.providerTrafficAllowed = true;
    authorized.constraints.totalProviderCallsAuthorized = 2;
    authorized.providers.claude.providerCallsAuthorized = 1;
    authorized.providers.codex.providerCallsAuthorized = 1;
    exact(value.authorization, authorized.authorization, 'authorized authorization');
    exact(value.constraints, authorized.constraints, 'authorized constraints');
    exact(value.providers, authorized.providers, 'authorized providers');
  }
  digest(value.matrixSha256, 'S26R2 matrix digest');
  const { matrixSha256, ...body } = value;
  if (jsonHash(body) !== matrixSha256) {
    throw new TypeError('S26R2 matrix digest does not bind the matrix');
  }
  return value;
}

function approvalCalls(matrix) {
  return matrix.goal.calls.map((call) => ({
    ordinal: call.ordinal,
    id: call.id,
    provider: call.provider,
    scenario: call.scenario,
    promptKey: call.promptKey,
    client: call.client,
    requestedModel: call.requestedModel,
    custodyDestination: call.custodyDestination,
    limits: structuredClone(matrix.providers[call.provider].limits),
  }));
}

export function createS26R2LiveApproval(closedMatrix) {
  const closed = validateS26R2LiveMatrix(closedMatrix);
  if (closed.authorization.providerGate !== S26R2_PROVIDER_GATE_CLOSED) {
    throw new TypeError('S26R2 approval requires the closed matrix');
  }
  const body = {
    schema: S26R2_LIVE_APPROVAL_SCHEMA,
    decision: 'approve-exact-s26r2-production-live-matrix',
    notBefore: NOT_BEFORE,
    expiresAt: EXPIRES_AT,
    closedMatrixSha256: closed.matrixSha256,
    sourceCommit: SOURCE_COMMIT,
    packageSha256: PACKAGE_SHA256,
    productionIdentity: {
      closureSha256: CLOSURE_SHA256,
      bundledPayloadSha256: PAYLOAD_SHA256,
      installedPayloadSha256: PAYLOAD_SHA256,
    },
    calls: approvalCalls(closed),
    privateEvidenceDestinationApproval: 'conversation-explicit',
    singleUse: true,
    experimentUseAllowed: false,
    publicationAllowed: false,
    releaseAllowed: false,
  };
  return { ...body, approvalSha256: jsonHash(body) };
}

export function authorizeS26R2LiveMatrix(closedMatrix, approval) {
  const closed = validateS26R2LiveMatrix(closedMatrix);
  exact(approval, createS26R2LiveApproval(closed), 'S26R2 approval');
  const authorized = structuredClone(closed);
  authorized.authorization = {
    providerGate: S26R2_PROVIDER_GATE_OPEN,
    principalApproval: 'conversation-explicit',
    privateEvidenceDestinationApproval: 'conversation-explicit',
    closedMatrixSha256: closed.matrixSha256,
    approvalSha256: approval.approvalSha256,
  };
  authorized.constraints.providerTrafficAllowed = true;
  authorized.constraints.totalProviderCallsAuthorized = 2;
  authorized.providers.claude.providerCallsAuthorized = 1;
  authorized.providers.codex.providerCallsAuthorized = 1;
  delete authorized.matrixSha256;
  authorized.matrixSha256 = jsonHash(authorized);
  return validateS26R2LiveMatrix(authorized);
}

export function assertS26R2ProviderAuthorized(matrix, approval, {
  executionInstant = new Date().toISOString(),
} = {}) {
  const current = validateS26R2LiveMatrix(matrix);
  if (current.authorization.providerGate !== S26R2_PROVIDER_GATE_OPEN) {
    throw new TypeError('S26R2 provider gate is closed; exact approval is required');
  }
  isoInstant(executionInstant, 'execution instant');
  if (executionInstant < NOT_BEFORE || executionInstant > EXPIRES_AT) {
    throw new TypeError('S26R2 approval is not valid at the execution instant');
  }
  const expected = authorizeS26R2LiveMatrix(createClosedS26R2LiveMatrix(), approval);
  exact(current, expected, 'authorized S26R2 matrix');
  return current;
}
