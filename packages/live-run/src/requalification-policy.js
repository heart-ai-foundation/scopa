import {
  canonicalJson,
  jsonHash,
} from '../../enforcement/src/index.js';

export const S18_LIVE_MATRIX_SCHEMA =
  'scopa.s18-production-live-matrix.v1';
export const S18_LIVE_APPROVAL_SCHEMA =
  'scopa.s18-production-live-approval.v1';
export const S18_PROVIDER_GATE_CLOSED =
  'closed-pending-explicit-approval';
export const S18_PROVIDER_GATE_OPEN = 'authorized';

const SOURCE_COMMIT = '43fbb969f32c711d1a68b05ad73fb33717c90d8c';
const CANDIDATE_SHA256 =
  'e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498';
const QUALIFICATION_SHA256 =
  'b1dff3b65d9dcd89b41d9b3e3c8080cce055f0082a96d5ae7013688921330f99';
const SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'clean',
    ordinal: 1,
    expectedOutcome: 'allowedWork',
    predecessorRequired: false,
  }),
  Object.freeze({
    id: 'cold-restart',
    ordinal: 2,
    expectedOutcome: 'coldRestartRecovered',
    predecessorRequired: true,
  }),
]);
const STOP_CONDITIONS = Object.freeze([
  'account-boundary-drift',
  'budget-or-usage-limit',
  'candidate-drift',
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
  'schema-drift',
  'timeout',
]);
const REJECT_IF = Object.freeze([
  'candidate-or-qualification-digest-mismatch',
  'approval-absent-expired-or-digest-mismatched',
  'private-destination-unapproved-inside-repository-or-unsafe-mode',
  'provider-account-client-model-tool-or-network-drift',
  'call-count-budget-usage-time-capture-or-retention-bound-exceeded',
  'predecessor-continuity-missing-or-provider-order-changed',
  'raw-provider-evidence-targets-repository-or-public-destination',
  'cleanup-residue-survivor-or-false-green-detected',
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
    throw new TypeError(`${label} differs from the frozen S18 value`);
  }
}

function digest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new TypeError(`${label} must be a SHA-256 digest`);
  }
}

function canonicalDate(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${label} must be an ISO date`);
  }
  const instant = Date.parse(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(instant) ||
    new Date(instant).toISOString().slice(0, 10) !== value
  ) {
    throw new TypeError(`${label} must be a real calendar date`);
  }
}

function providerDescriptor({
  id,
  client,
  requestedModel,
  accountBoundary,
  networkClass,
  privateDestination,
  limits,
}) {
  return {
    id,
    client,
    requestedModel,
    modelSnapshotStatus: 'requested-name-not-provider-signed-snapshot',
    accountBoundary,
    identityHandling: 'verified-private-not-retained',
    networkClass,
    alternateProvidersDisabled: true,
    osNetworkEnforcementClaimed: false,
    assurance: 'partial',
    assuranceTransferable: false,
    strictScopaMcpOnly: true,
    nativeMutationRoutesDisabled: true,
    plannedCalls: 2,
    providerCallsAuthorized: 0,
    scenarios: structuredClone(SCENARIOS),
    limits,
    privateEvidenceDestination: privateDestination,
  };
}

function descriptor() {
  return {
    schema: S18_LIVE_MATRIX_SCHEMA,
    version: {
      number: 1,
      date: '2026-07-31',
      changelog: 'Initial exact-candidate closed production-live posture.',
    },
    goal: {
      sourceCommit: SOURCE_COMMIT,
      candidateSha256: CANDIDATE_SHA256,
      qualificationReceiptSha256: QUALIFICATION_SHA256,
      sequence: 'clean-then-cold-restart-per-provider',
      providerOrder: ['claude', 'codex'],
      successCriteria: [
        'exact-candidate-bytes-used',
        'clean-and-cold-restart-outcomes-pass-for-each-client',
        'bounded-private-evidence-and-complete-cleanup',
        'no-assurance-transfer-publication-or-experiment-crossover',
      ],
    },
    authorization: {
      providerGate: S18_PROVIDER_GATE_CLOSED,
      approvedOn: null,
      expiresOn: null,
      principalApproval: 'not-granted',
      privateEvidenceDestinationApproval: 'not-granted',
      closedMatrixSha256: null,
      approvalSha256: null,
    },
    constraints: {
      providerTrafficAllowed: false,
      totalProviderCallsPlanned: 4,
      totalProviderCallsAuthorized: 0,
      candidateDriftAllowed: false,
      experimentUseAllowed: false,
      customerDataAllowed: false,
      externalFixtureSecretsAllowed: false,
      rawEvidenceInRepositoryAllowed: false,
      publicationAllowed: false,
    },
    deterministicPrerequisites: {
      blockedScope: true,
      falseGreenRefused: true,
      s17CloseoutSha256:
        'd7cd0e793df712b7a3f8d4417df04cccb87fc784f62331206fce608325e3267b',
      crossClientParitySha256:
        '9ab7996993946fb1fede94c21e21bd0241f37bc6d2ee434e1919f7671f07af8a',
    },
    providers: {
      claude: providerDescriptor({
        id: 'claude',
        client: 'claude-code@2.1.170',
        requestedModel: 'sonnet',
        accountBoundary:
          'current-authenticated-principal-controlled-claude-ai-subscription',
        networkClass: 'anthropic-first-party-via-claude-code',
        privateDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S18/claude',
        limits: {
          maxProviderInvocations: 2,
          maxTurnsPerRun: 12,
          timeoutMsPerRun: 120000,
          maxInputBytesPerRun: 1048576,
          maxCaptureBytesPerRun: 20971520,
          maxPrivateEvidenceBytesPerRun: 26214400,
          maxBudgetUsdPerRun: '0.20',
          maxCampaignBudgetUsd: '0.40',
          maxInputTokensPerRun: null,
          maxOutputTokensPerRun: null,
          maxReasoningTokensPerRun: null,
          maxTotalTokensPerRun: null,
          maxCampaignTotalTokens: null,
        },
      }),
      codex: providerDescriptor({
        id: 'codex',
        client: 'codex-mcp-client@0.145.0',
        requestedModel: 'gpt-5.4',
        accountBoundary:
          'current-authenticated-principal-controlled-openai-codex-session',
        networkClass: 'openai-first-party-via-codex-cli',
        privateDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S18/codex',
        limits: {
          maxProviderInvocations: 2,
          maxTurnsPerRun: 1,
          timeoutMsPerRun: 180000,
          maxInputBytesPerRun: 1048576,
          maxCaptureBytesPerRun: 20971520,
          maxPrivateEvidenceBytesPerRun: 26214400,
          maxBudgetUsdPerRun: null,
          maxCampaignBudgetUsd: null,
          maxInputTokensPerRun: 120000,
          maxOutputTokensPerRun: 4000,
          maxReasoningTokensPerRun: 2000,
          maxTotalTokensPerRun: 126000,
          maxCampaignTotalTokens: 252000,
        },
      }),
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
    rejectIf: [...REJECT_IF],
    onFailure: {
      beforeProviderIntent: 'defer-with-zero-calls-consumed',
      afterProviderIntent: 'stop-campaign-close-evidence-and-forbid-replay',
      cleanupFailure: 'reject-qualification-and-require-reconciliation',
      privacyEvent: 'stop-retain-no-public-derivative-and-escalate',
    },
    ifAmbiguous: {
      action: 'defer-with-zero-provider-intent',
      authority: 'explicit-principal-approval-required',
    },
    outputFormat: {
      privateCampaignSchema: 'scopa.s18-live-campaign.private.v1',
      publicCampaignSchema: 'scopa.s18-live-campaign.public.v1',
      authorizationReceiptSchema: 'scopa.s18-live-authorization.v1',
    },
  };
}

export function createClosedS18LiveMatrix() {
  const body = descriptor();
  return validateS18LiveMatrix({
    ...body,
    matrixSha256: jsonHash(body),
  });
}

function validateProvider(value, expected, gate) {
  exactKeys(value, Object.keys(expected), `${expected.id} provider`);
  const normalized = structuredClone(expected);
  normalized.providerCallsAuthorized = gate === S18_PROVIDER_GATE_OPEN ? 2 : 0;
  exact(value, normalized, `${expected.id} provider`);
}

export function validateS18LiveMatrix(value) {
  const expected = descriptor();
  exactKeys(value, [...Object.keys(expected), 'matrixSha256'], 'S18 matrix');
  digest(value.matrixSha256, 'S18 matrix digest');
  const gate = value.authorization?.providerGate;
  if (![S18_PROVIDER_GATE_CLOSED, S18_PROVIDER_GATE_OPEN].includes(gate)) {
    throw new TypeError('S18 provider gate is invalid');
  }
  for (const key of Object.keys(expected)) {
    if (['authorization', 'constraints', 'providers'].includes(key)) continue;
    exact(value[key], expected[key], `S18 matrix ${key}`);
  }
  exactKeys(
    value.authorization,
    Object.keys(expected.authorization),
    'S18 authorization',
  );
  exactKeys(
    value.constraints,
    Object.keys(expected.constraints),
    'S18 constraints',
  );
  exactKeys(value.providers, ['claude', 'codex'], 'S18 providers');
  validateProvider(value.providers.claude, expected.providers.claude, gate);
  validateProvider(value.providers.codex, expected.providers.codex, gate);
  if (gate === S18_PROVIDER_GATE_CLOSED) {
    exact(value.authorization, expected.authorization, 'closed authorization');
    exact(value.constraints, expected.constraints, 'closed constraints');
  } else {
    canonicalDate(value.authorization.approvedOn, 'approval date');
    canonicalDate(value.authorization.expiresOn, 'approval expiry');
    if (
      value.authorization.principalApproval !== 'conversation-explicit' ||
      value.authorization.privateEvidenceDestinationApproval !==
        'conversation-explicit' ||
      !/^[0-9a-f]{64}$/.test(value.authorization.closedMatrixSha256 ?? '') ||
      value.authorization.closedMatrixSha256 !==
        createClosedS18LiveMatrix().matrixSha256 ||
      !/^[0-9a-f]{64}$/.test(value.authorization.approvalSha256 ?? '') ||
      value.constraints.providerTrafficAllowed !== true ||
      value.constraints.totalProviderCallsAuthorized !== 4
    ) {
      throw new TypeError('authorized S18 matrix lacks exact approval');
    }
    const expectedConstraints = {
      ...expected.constraints,
      providerTrafficAllowed: true,
      totalProviderCallsAuthorized: 4,
    };
    exact(value.constraints, expectedConstraints, 'authorized constraints');
  }
  const { matrixSha256, ...body } = value;
  if (jsonHash(body) !== matrixSha256) {
    throw new TypeError('S18 matrix digest does not bind the matrix');
  }
  return value;
}

export function createS18LiveApproval(closedMatrix, { approvedOn, expiresOn }) {
  const closed = validateS18LiveMatrix(closedMatrix);
  if (closed.authorization.providerGate !== S18_PROVIDER_GATE_CLOSED) {
    throw new TypeError('S18 approval requires the closed matrix');
  }
  canonicalDate(approvedOn, 'approval date');
  canonicalDate(expiresOn, 'approval expiry');
  const validityDays = (
    Date.parse(`${expiresOn}T00:00:00Z`) -
    Date.parse(`${approvedOn}T00:00:00Z`)
  ) / 86_400_000;
  if (!Number.isInteger(validityDays) || validityDays < 0 || validityDays > 1) {
    throw new TypeError('S18 approval validity must not exceed one day');
  }
  const body = {
    schema: S18_LIVE_APPROVAL_SCHEMA,
    decision: 'approve-exact-s18-production-live-matrix',
    approvedOn,
    expiresOn,
    closedMatrixSha256: closed.matrixSha256,
    sourceCommit: SOURCE_COMMIT,
    candidateSha256: CANDIDATE_SHA256,
    privateEvidenceDestinationApproval: 'conversation-explicit',
    providerCalls: { claude: 2, codex: 2, total: 4 },
    claudeBudget: { perRunUsd: '0.20', campaignUsd: '0.40' },
    codexUsage: { perRunTotalTokens: 126000, campaignTotalTokens: 252000 },
  };
  return {
    ...body,
    approvalSha256: jsonHash(body),
  };
}

export function authorizeS18LiveMatrix(closedMatrix, approval) {
  const closed = validateS18LiveMatrix(closedMatrix);
  exactKeys(
    approval,
    [
      'approvalSha256', 'approvedOn', 'candidateSha256', 'claudeBudget',
      'closedMatrixSha256', 'codexUsage', 'decision', 'expiresOn', 'privateEvidenceDestinationApproval',
      'providerCalls', 'schema', 'sourceCommit',
    ],
    'S18 approval',
  );
  const expectedApproval = createS18LiveApproval(closed, {
    approvedOn: approval.approvedOn,
    expiresOn: approval.expiresOn,
  });
  exact(approval, expectedApproval, 'S18 approval');
  const authorized = structuredClone(closed);
  authorized.authorization = {
    providerGate: S18_PROVIDER_GATE_OPEN,
    approvedOn: approval.approvedOn,
    expiresOn: approval.expiresOn,
    principalApproval: 'conversation-explicit',
    privateEvidenceDestinationApproval: 'conversation-explicit',
    closedMatrixSha256: closed.matrixSha256,
    approvalSha256: approval.approvalSha256,
  };
  authorized.constraints.providerTrafficAllowed = true;
  authorized.constraints.totalProviderCallsAuthorized = 4;
  for (const provider of Object.values(authorized.providers)) {
    provider.providerCallsAuthorized = provider.plannedCalls;
  }
  delete authorized.matrixSha256;
  authorized.matrixSha256 = jsonHash(authorized);
  return validateS18LiveMatrix(authorized);
}

export function assertS18ProviderAuthorized(matrix, approval, {
  executionDate,
} = {}) {
  const current = validateS18LiveMatrix(matrix);
  if (current.authorization.providerGate !== S18_PROVIDER_GATE_OPEN) {
    throw new TypeError(
      'S18 provider gate is closed; exact principal approval is required',
    );
  }
  const closed = createClosedS18LiveMatrix();
  const expected = authorizeS18LiveMatrix(closed, approval);
  exact(current, expected, 'authorized S18 matrix');
  canonicalDate(executionDate, 'execution date');
  if (
    executionDate < approval.approvedOn ||
    executionDate > approval.expiresOn
  ) {
    throw new TypeError('S18 approval is not valid on the execution date');
  }
  return current;
}
