import {
  jsonHash,
} from '../../../enforcement/src/index.js';
import {
  CODEX_DISABLED_FEATURES,
  CODEX_MCP_SERVER_NAME,
  CODEX_MCP_TOOLS,
  CODEX_MODEL_REQUEST,
  EXPECTED_CODEX_CLI_VERSION,
} from './profile.js';
import {
  CODEX_ALLOWED_ENVIRONMENT_NAMES,
  codexUsageTotal,
} from './run.js';

export const CODEX_LIVE_POLICY_SCHEMA = 'scopa.codex-live-policy.v1';
export const CODEX_LIVE_POLICY_SCOPE =
  'S16-production-live-run-edge-campaign';
export const CODEX_LIVE_POLICY_V2_SCOPE =
  'S16-v2-production-live-run-edge-campaign';
export const CODEX_PROVIDER_GATE_CLOSED =
  'closed-pending-explicit-approval';
export const CODEX_PROVIDER_GATE_OPEN = 'authorized';
export const CODEX_LIVE_SCENARIO_IDS = Object.freeze([
  'clean',
  'denied',
  'false-green',
  'cold-restart',
]);
export const CODEX_LIVE_STOP_CONDITIONS = Object.freeze([
  'account-boundary-drift',
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
  'usage-limit',
]);

const POLICY_KEYS = Object.freeze([
  'account',
  'authorization',
  'cleanup',
  'environment',
  'evidence',
  'limits',
  'model',
  'nativeSurface',
  'network',
  'policyId',
  'policySha256',
  'repository',
  'scenarios',
  'schema',
  'stopConditions',
  'tools',
]);

const CAMPAIGN_PROFILES = Object.freeze({
  'S16-production-live-v1': Object.freeze({
    scope: CODEX_LIVE_POLICY_SCOPE,
    scenarioVersion: 'S16.v1',
    privateDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S16',
  }),
  'S16-v2-production-live-v1': Object.freeze({
    scope: CODEX_LIVE_POLICY_V2_SCOPE,
    scenarioVersion: 'S16.v2',
    privateDestination: 'SCOPA_PRIVATE_EVIDENCE_ROOT/S16R2',
  }),
});

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

function exactString(value, expected, label) {
  if (value !== expected) {
    throw new TypeError(`${label} must be ${expected}`);
  }
}

function nonempty(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
}

function boundedInteger(value, minimum, maximum, label) {
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new TypeError(
      `${label} must be an integer between ${minimum} and ${maximum}`,
    );
  }
}

function exactStringSet(value, expected, label) {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string') ||
    JSON.stringify([...value].sort()) !==
      JSON.stringify([...expected].sort())
  ) {
    throw new TypeError(`${label} differs from the closed inventory`);
  }
}

function requiredTrue(value, label) {
  if (value !== true) throw new TypeError(`${label} must be enabled`);
}

export function validateCodexLivePolicy(value) {
  exactKeys(value, POLICY_KEYS, 'Codex live policy');
  exactString(value.schema, CODEX_LIVE_POLICY_SCHEMA, 'policy schema');
  nonempty(value.policyId, 'policy id');
  const campaign = CAMPAIGN_PROFILES[value.policyId];
  if (campaign === undefined) {
    throw new TypeError('Codex live policy has an unknown campaign id');
  }

  exactKeys(
    value.authorization,
    [
      'approvedOn',
      'principalApproval',
      'privateEvidenceDestinationApproval',
      'providerGate',
      'scope',
    ],
    'Codex authorization',
  );
  exactString(
    value.authorization.scope,
    campaign.scope,
    'authorization scope',
  );
  if (value.authorization.providerGate === CODEX_PROVIDER_GATE_CLOSED) {
    if (
      value.authorization.approvedOn !== null ||
      value.authorization.principalApproval !== 'not-granted' ||
      value.authorization.privateEvidenceDestinationApproval !==
        'not-granted'
    ) {
      throw new TypeError('closed Codex provider gate claims approval');
    }
  } else if (value.authorization.providerGate === CODEX_PROVIDER_GATE_OPEN) {
    if (
      typeof value.authorization.approvedOn !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.authorization.approvedOn) ||
      value.authorization.principalApproval !== 'conversation-explicit' ||
      value.authorization.privateEvidenceDestinationApproval !==
        'conversation-explicit'
    ) {
      throw new TypeError('authorized Codex provider gate lacks approval');
    }
  } else {
    throw new TypeError('unknown Codex provider gate state');
  }

  exactKeys(
    value.account,
    [
      'authMethod',
      'boundary',
      'identityHandling',
      'verification',
    ],
    'Codex account policy',
  );
  exactString(
    value.account.boundary,
    'current-authenticated-principal-controlled-openai-codex-session',
    'account boundary',
  );
  exactString(
    value.account.authMethod,
    'codex-cli-session',
    'account auth method',
  );
  exactString(
    value.account.identityHandling,
    'verified-private-not-retained',
    'account identity handling',
  );
  exactString(
    value.account.verification,
    'required-before-first-provider-call',
    'account verification',
  );

  exactKeys(
    value.network,
    [
      'allowedClass',
      'alternateProvidersDisabled',
      'osEnforced',
    ],
    'Codex network policy',
  );
  exactString(
    value.network.allowedClass,
    'openai-first-party-via-codex-cli',
    'network class',
  );
  requiredTrue(
    value.network.alternateProvidersDisabled,
    'alternate provider disablement',
  );
  if (value.network.osEnforced !== false) {
    throw new TypeError('Codex network policy must not overstate OS enforcement');
  }

  exactKeys(
    value.model,
    [
      'provenance',
      'requested',
      'snapshotStatus',
    ],
    'Codex model policy',
  );
  exactString(value.model.requested, CODEX_MODEL_REQUEST, 'requested model');
  exactString(
    value.model.provenance,
    'launcher-declared',
    'model provenance',
  );
  exactString(
    value.model.snapshotStatus,
    'requested-name-not-provider-signed-snapshot',
    'model snapshot status',
  );

  exactKeys(
    value.tools,
    [
      'allowed',
      'mcpServer',
      'strictMcpOnly',
    ],
    'Codex tool policy',
  );
  exactString(
    value.tools.mcpServer,
    CODEX_MCP_SERVER_NAME,
    'MCP server',
  );
  exactStringSet(value.tools.allowed, CODEX_MCP_TOOLS, 'MCP tools');
  requiredTrue(value.tools.strictMcpOnly, 'strict MCP-only policy');

  exactKeys(
    value.nativeSurface,
    [
      'approvalPolicy',
      'disabledFeatures',
      'ephemeral',
      'ignoreRules',
      'ignoreUserConfig',
      'sandbox',
      'webSearch',
    ],
    'Codex native surface',
  );
  exactString(value.nativeSurface.sandbox, 'read-only', 'native sandbox');
  exactString(value.nativeSurface.approvalPolicy, 'never', 'approval policy');
  exactString(value.nativeSurface.webSearch, 'disabled', 'web search policy');
  requiredTrue(value.nativeSurface.ephemeral, 'ephemeral execution');
  requiredTrue(value.nativeSurface.ignoreRules, 'rules isolation');
  requiredTrue(value.nativeSurface.ignoreUserConfig, 'user config isolation');
  exactStringSet(
    value.nativeSurface.disabledFeatures,
    CODEX_DISABLED_FEATURES,
    'disabled native feature inventory',
  );

  exactKeys(
    value.environment,
    [
      'allowedNames',
      'inheritance',
    ],
    'Codex environment policy',
  );
  exactString(
    value.environment.inheritance,
    'explicit-allowlist',
    'environment inheritance',
  );
  exactStringSet(
    value.environment.allowedNames,
    CODEX_ALLOWED_ENVIRONMENT_NAMES,
    'allowed environment names',
  );

  exactKeys(
    value.limits,
    [
      'maxCampaignInputTokens',
      'maxCampaignOutputTokens',
      'maxCampaignTotalTokens',
      'maxCaptureBytes',
      'maxInputBytes',
      'maxInputTokensPerRun',
      'maxOutputTokensPerRun',
      'maxProviderInvocations',
      'maxReasoningTokensPerRun',
      'maxTotalTokensPerRun',
      'maxTurnsPerRun',
      'timeoutMs',
    ],
    'Codex limits',
  );
  boundedInteger(value.limits.maxProviderInvocations, 1, 64, 'invocations');
  boundedInteger(value.limits.maxTurnsPerRun, 1, 64, 'turns');
  boundedInteger(value.limits.timeoutMs, 1, 900_000, 'timeout');
  boundedInteger(
    value.limits.maxCaptureBytes,
    1,
    64 * 1024 * 1024,
    'capture bytes',
  );
  boundedInteger(
    value.limits.maxInputBytes,
    1,
    1024 * 1024,
    'input bytes',
  );
  for (const [field, maximum] of [
    ['maxInputTokensPerRun', 2_000_000],
    ['maxOutputTokensPerRun', 1_000_000],
    ['maxReasoningTokensPerRun', 1_000_000],
    ['maxTotalTokensPerRun', 3_000_000],
    ['maxCampaignInputTokens', 100_000_000],
    ['maxCampaignOutputTokens', 50_000_000],
    ['maxCampaignTotalTokens', 150_000_000],
  ]) {
    boundedInteger(value.limits[field], 1, maximum, field);
  }
  if (
    value.limits.maxTotalTokensPerRun <
      value.limits.maxInputTokensPerRun +
      value.limits.maxOutputTokensPerRun +
      value.limits.maxReasoningTokensPerRun ||
    value.limits.maxCampaignInputTokens >
      value.limits.maxInputTokensPerRun *
        value.limits.maxProviderInvocations ||
    value.limits.maxCampaignOutputTokens >
      value.limits.maxOutputTokensPerRun *
        value.limits.maxProviderInvocations ||
    value.limits.maxCampaignTotalTokens >
      value.limits.maxTotalTokensPerRun *
        value.limits.maxProviderInvocations
  ) {
    throw new TypeError('Codex aggregate usage bounds conflict with run bounds');
  }

  exactKeys(
    value.repository,
    [
      'classification',
      'customerDataAllowed',
      'externalSecretsAllowed',
    ],
    'Codex repository policy',
  );
  exactString(
    value.repository.classification,
    'disposable-synthetic',
    'repository classification',
  );
  if (
    value.repository.customerDataAllowed !== false ||
    value.repository.externalSecretsAllowed !== false
  ) {
    throw new TypeError('Codex repository data policy is not closed');
  }

  exactKeys(
    value.evidence,
    [
      'maxPrivateBytesPerRun',
      'privateDestination',
      'privateMode',
      'privateRetentionHours',
      'publicMode',
      'repositoryRawEvidenceAllowed',
    ],
    'Codex evidence policy',
  );
  exactString(
    value.evidence.privateDestination,
    campaign.privateDestination,
    'private evidence destination',
  );
  boundedInteger(
    value.evidence.privateRetentionHours,
    1,
    720,
    'private retention hours',
  );
  boundedInteger(
    value.evidence.maxPrivateBytesPerRun,
    value.limits.maxCaptureBytes,
    64 * 1024 * 1024,
    'private evidence bytes',
  );
  exactString(value.evidence.privateMode, '0600', 'private evidence mode');
  exactString(value.evidence.publicMode, '0644', 'public evidence mode');
  if (value.evidence.repositoryRawEvidenceAllowed !== false) {
    throw new TypeError('raw Codex evidence cannot enter the repository');
  }

  exactKeys(
    value.cleanup,
    [
      'clientStoreAuditRequired',
      'controlRootDeletionRequired',
      'disposableRepositoryDeletionRequired',
      'noSurvivorRequired',
      'processGroupRequired',
      'providerResidueAuditRequired',
    ],
    'Codex cleanup policy',
  );
  for (const [key, enabled] of Object.entries(value.cleanup)) {
    requiredTrue(enabled, `cleanup.${key}`);
  }

  exactKeys(
    value.scenarios,
    [
      'ids',
      'version',
    ],
    'Codex scenario policy',
  );
  exactString(
    value.scenarios.version,
    campaign.scenarioVersion,
    'scenario version',
  );
  exactStringSet(
    value.scenarios.ids,
    CODEX_LIVE_SCENARIO_IDS,
    'live scenario ids',
  );
  if (
    value.scenarios.ids.length !== value.limits.maxProviderInvocations
  ) {
    throw new TypeError('Codex scenario count differs from invocation limit');
  }

  exactStringSet(
    value.stopConditions,
    CODEX_LIVE_STOP_CONDITIONS,
    'Codex stop conditions',
  );
  if (
    typeof value.policySha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(value.policySha256)
  ) {
    throw new TypeError('Codex policy digest is invalid');
  }
  const {
    policySha256,
    ...descriptor
  } = value;
  if (policySha256 !== jsonHash(descriptor)) {
    throw new TypeError('Codex policy digest does not bind the policy');
  }
  return value;
}

export function createCodexLivePolicy({
  campaignId = 'S16-production-live-v1',
  providerGate = CODEX_PROVIDER_GATE_CLOSED,
  approvedOn = null,
  principalApproval = 'not-granted',
  privateEvidenceDestinationApproval = 'not-granted',
} = {}) {
  const campaign = CAMPAIGN_PROFILES[campaignId];
  if (campaign === undefined) {
    throw new TypeError('Codex live policy has an unknown campaign id');
  }
  const descriptor = {
    schema: CODEX_LIVE_POLICY_SCHEMA,
    policyId: campaignId,
    authorization: {
      providerGate,
      approvedOn,
      principalApproval,
      privateEvidenceDestinationApproval,
      scope: campaign.scope,
    },
    account: {
      boundary:
        'current-authenticated-principal-controlled-openai-codex-session',
      authMethod: 'codex-cli-session',
      identityHandling: 'verified-private-not-retained',
      verification: 'required-before-first-provider-call',
    },
    network: {
      allowedClass: 'openai-first-party-via-codex-cli',
      alternateProvidersDisabled: true,
      osEnforced: false,
    },
    model: {
      requested: CODEX_MODEL_REQUEST,
      provenance: 'launcher-declared',
      snapshotStatus: 'requested-name-not-provider-signed-snapshot',
    },
    tools: {
      mcpServer: CODEX_MCP_SERVER_NAME,
      allowed: [...CODEX_MCP_TOOLS],
      strictMcpOnly: true,
    },
    nativeSurface: {
      sandbox: 'read-only',
      approvalPolicy: 'never',
      ephemeral: true,
      ignoreUserConfig: true,
      ignoreRules: true,
      webSearch: 'disabled',
      disabledFeatures: [...CODEX_DISABLED_FEATURES],
    },
    environment: {
      inheritance: 'explicit-allowlist',
      allowedNames: [...CODEX_ALLOWED_ENVIRONMENT_NAMES],
    },
    limits: {
      maxProviderInvocations: 4,
      maxTurnsPerRun: 1,
      timeoutMs: 180_000,
      maxCaptureBytes: 20 * 1024 * 1024,
      maxInputBytes: 1024 * 1024,
      maxInputTokensPerRun: 120_000,
      maxOutputTokensPerRun: 4_000,
      maxReasoningTokensPerRun: 2_000,
      maxTotalTokensPerRun: 126_000,
      maxCampaignInputTokens: 480_000,
      maxCampaignOutputTokens: 16_000,
      maxCampaignTotalTokens: 504_000,
    },
    repository: {
      classification: 'disposable-synthetic',
      customerDataAllowed: false,
      externalSecretsAllowed: false,
    },
    evidence: {
      privateDestination: campaign.privateDestination,
      privateRetentionHours: 168,
      maxPrivateBytesPerRun: 25 * 1024 * 1024,
      privateMode: '0600',
      publicMode: '0644',
      repositoryRawEvidenceAllowed: false,
    },
    cleanup: {
      processGroupRequired: true,
      noSurvivorRequired: true,
      controlRootDeletionRequired: true,
      disposableRepositoryDeletionRequired: true,
      clientStoreAuditRequired: true,
      providerResidueAuditRequired: true,
    },
    scenarios: {
      version: campaign.scenarioVersion,
      ids: [...CODEX_LIVE_SCENARIO_IDS],
    },
    stopConditions: [...CODEX_LIVE_STOP_CONDITIONS],
  };
  return validateCodexLivePolicy({
    ...descriptor,
    policySha256: jsonHash(descriptor),
  });
}

export function assertCodexProviderAuthorized(policy) {
  const current = validateCodexLivePolicy(policy);
  if (current.authorization.providerGate !== CODEX_PROVIDER_GATE_OPEN) {
    throw new TypeError(
      'Codex provider gate is closed; explicit campaign approval is required',
    );
  }
  return current;
}

export function codexPolicyUsageLimits(policy) {
  const current = validateCodexLivePolicy(policy);
  return {
    maxInputTokens: current.limits.maxInputTokensPerRun,
    maxOutputTokens: current.limits.maxOutputTokensPerRun,
    maxReasoningTokens: current.limits.maxReasoningTokensPerRun,
    maxTotalTokens: current.limits.maxTotalTokensPerRun,
  };
}

export function assertCodexUsageWithinPolicy(policy, usage) {
  const current = validateCodexLivePolicy(policy);
  const limits = codexPolicyUsageLimits(current);
  if (
    usage.input_tokens > limits.maxInputTokens ||
    usage.output_tokens > limits.maxOutputTokens ||
    usage.reasoning_output_tokens > limits.maxReasoningTokens ||
    codexUsageTotal(usage) > limits.maxTotalTokens
  ) {
    throw new TypeError('Codex usage exceeds the live policy');
  }
  return usage;
}
