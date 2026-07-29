import {
  jsonHash,
} from '../../../enforcement/src/index.js';
import {
  CLAUDE_MCP_TOOLS,
  CLAUDE_MODEL_REQUEST,
} from './profile.js';

export const CLAUDE_LIVE_POLICY_SCHEMA = 'scopa.claude-live-policy.v1';
export const CLAUDE_AUTH_BOUNDARY_SCHEMA =
  'scopa.claude-auth-boundary.v1';

export const CLAUDE_LIVE_STOP_CONDITIONS = Object.freeze([
  'account-boundary-drift',
  'budget-exhausted',
  'capture-limit',
  'cleanup-failure',
  'client-version-drift',
  'mcp-configuration-error',
  'model-drift',
  'privacy-event',
  'provider-rate-pressure',
  'provider-refusal',
  'tool-inventory-drift',
  'turn-limit',
]);

const POLICY_KEYS = Object.freeze([
  'account',
  'authorization',
  'cleanup',
  'evidence',
  'limits',
  'model',
  'network',
  'policyId',
  'policySha256',
  'repository',
  'schema',
  'stopConditions',
  'tools',
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

function nonempty(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
}

function exactString(value, expected, label) {
  if (value !== expected) {
    throw new TypeError(`${label} must be ${expected}`);
  }
}

function boolean(value, label) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${label} must be boolean`);
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

function decimalAmount(value, maximum, label) {
  if (
    typeof value !== 'string' ||
    !/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/.test(value)
  ) {
    throw new TypeError(`${label} must be a canonical decimal string`);
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > maximum) {
    throw new TypeError(`${label} is outside the supported bound`);
  }
  return numeric;
}

function exactStringSet(value, expected, label) {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string') ||
    JSON.stringify([...value].sort()) !==
      JSON.stringify([...expected].sort())
  ) {
    throw new TypeError(`${label} differs from the approved inventory`);
  }
}

export function validateClaudeLivePolicy(value) {
  exactKeys(value, POLICY_KEYS, 'Claude live policy');
  exactString(
    value.schema,
    CLAUDE_LIVE_POLICY_SCHEMA,
    'Claude live policy schema',
  );
  nonempty(value.policyId, 'Claude live policy id');

  exactKeys(
    value.authorization,
    [
      'approvedOn',
      'principalApproval',
      'scope',
    ],
    'Claude live authorization',
  );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.authorization.approvedOn)) {
    throw new TypeError('Claude live approval date is invalid');
  }
  exactString(
    value.authorization.principalApproval,
    'conversation-explicit',
    'Claude live principal approval',
  );
  exactString(
    value.authorization.scope,
    'S15-production-live-run-edge-campaign',
    'Claude live authorization scope',
  );

  exactKeys(
    value.account,
    [
      'apiProvider',
      'authMethod',
      'boundary',
      'identityHandling',
      'subscriptionType',
    ],
    'Claude live account policy',
  );
  exactString(
    value.account.boundary,
    'current-authenticated-principal-controlled-claude-ai-subscription',
    'Claude live account boundary',
  );
  nonempty(value.account.authMethod, 'Claude live auth method');
  nonempty(value.account.apiProvider, 'Claude live API provider');
  nonempty(value.account.subscriptionType, 'Claude live subscription type');
  exactString(
    value.account.identityHandling,
    'verified-private-not-retained',
    'Claude live identity handling',
  );

  exactKeys(
    value.network,
    [
      'allowedClass',
      'alternateProvidersDisabled',
      'osEnforced',
    ],
    'Claude live network policy',
  );
  exactString(
    value.network.allowedClass,
    'anthropic-first-party-via-claude-code',
    'Claude live network class',
  );
  if (value.network.alternateProvidersDisabled !== true) {
    throw new TypeError('Claude alternate providers must be disabled');
  }
  if (value.network.osEnforced !== false) {
    throw new TypeError(
      'Claude network policy must not overstate OS enforcement',
    );
  }

  exactKeys(
    value.model,
    [
      'requestedAlias',
      'snapshotStatus',
    ],
    'Claude live model policy',
  );
  nonempty(value.model.requestedAlias, 'Claude requested model alias');
  exactString(
    value.model.snapshotStatus,
    'requested-alias-not-snapshot',
    'Claude live model snapshot status',
  );

  exactKeys(
    value.tools,
    [
      'allowed',
      'nativeMutationRoutesDisabled',
      'strictMcpOnly',
    ],
    'Claude live tool policy',
  );
  exactStringSet(
    value.tools.allowed,
    CLAUDE_MCP_TOOLS,
    'Claude live tool inventory',
  );
  if (
    value.tools.strictMcpOnly !== true ||
    value.tools.nativeMutationRoutesDisabled !== true
  ) {
    throw new TypeError('Claude live tool policy is not closed');
  }

  exactKeys(
    value.limits,
    [
      'maxBudgetUsdPerRun',
      'maxCampaignBudgetUsd',
      'maxCaptureBytes',
      'maxInputBytes',
      'maxProviderInvocations',
      'maxTurnsPerRun',
      'timeoutMs',
    ],
    'Claude live limits',
  );
  boundedInteger(
    value.limits.maxProviderInvocations,
    1,
    64,
    'maxProviderInvocations',
  );
  boundedInteger(value.limits.maxTurnsPerRun, 1, 64, 'maxTurnsPerRun');
  boundedInteger(value.limits.timeoutMs, 1, 900_000, 'timeoutMs');
  boundedInteger(
    value.limits.maxCaptureBytes,
    1,
    64 * 1024 * 1024,
    'maxCaptureBytes',
  );
  boundedInteger(
    value.limits.maxInputBytes,
    1,
    1024 * 1024,
    'maxInputBytes',
  );
  const perRun = decimalAmount(
    value.limits.maxBudgetUsdPerRun,
    100,
    'maxBudgetUsdPerRun',
  );
  const campaign = decimalAmount(
    value.limits.maxCampaignBudgetUsd,
    1_000,
    'maxCampaignBudgetUsd',
  );
  if (
    campaign < perRun ||
    campaign >
      perRun * value.limits.maxProviderInvocations + Number.EPSILON
  ) {
    throw new TypeError('Claude campaign budget conflicts with run bounds');
  }

  exactKeys(
    value.repository,
    [
      'classification',
      'customerDataAllowed',
      'externalSecretsAllowed',
    ],
    'Claude live repository policy',
  );
  exactString(
    value.repository.classification,
    'disposable-synthetic',
    'Claude live repository classification',
  );
  if (
    value.repository.customerDataAllowed !== false ||
    value.repository.externalSecretsAllowed !== false
  ) {
    throw new TypeError('Claude live repository data policy is not closed');
  }

  exactKeys(
    value.evidence,
    [
      'maxPrivateBytesPerRun',
      'privateMode',
      'privateRetentionHours',
      'publicMode',
      'repositoryRawEvidenceAllowed',
    ],
    'Claude live evidence policy',
  );
  boundedInteger(
    value.evidence.privateRetentionHours,
    1,
    720,
    'privateRetentionHours',
  );
  boundedInteger(
    value.evidence.maxPrivateBytesPerRun,
    value.limits.maxCaptureBytes,
    64 * 1024 * 1024,
    'maxPrivateBytesPerRun',
  );
  exactString(value.evidence.privateMode, '0600', 'private evidence mode');
  exactString(value.evidence.publicMode, '0644', 'public evidence mode');
  if (value.evidence.repositoryRawEvidenceAllowed !== false) {
    throw new TypeError('raw provider evidence cannot enter the repository');
  }

  exactKeys(
    value.cleanup,
    [
      'controlRootDeletionRequired',
      'disposableRepositoryDeletionRequired',
      'noSurvivorRequired',
      'processGroupRequired',
    ],
    'Claude live cleanup policy',
  );
  for (const [name, enabled] of Object.entries(value.cleanup)) {
    boolean(enabled, `cleanup.${name}`);
    if (!enabled) {
      throw new TypeError(`cleanup.${name} must be enabled`);
    }
  }

  exactStringSet(
    value.stopConditions,
    CLAUDE_LIVE_STOP_CONDITIONS,
    'Claude live stop conditions',
  );
  if (
    typeof value.policySha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(value.policySha256)
  ) {
    throw new TypeError('Claude live policy digest is invalid');
  }
  const {
    policySha256,
    ...descriptor
  } = value;
  if (policySha256 !== jsonHash(descriptor)) {
    throw new TypeError('Claude live policy digest does not bind the policy');
  }
  return value;
}

export function createClaudeLivePolicy({
  policyId = 'S15-production-live-v1',
  approvedOn = '2026-07-28',
  authMethod = 'claude.ai',
  apiProvider = 'firstParty',
  subscriptionType = 'max',
  model = CLAUDE_MODEL_REQUEST,
  maxProviderInvocations = 6,
  maxTurnsPerRun = 12,
  timeoutMs = 120_000,
  maxCaptureBytes = 20 * 1024 * 1024,
  maxInputBytes = 1024 * 1024,
  maxBudgetUsdPerRun = '0.20',
  maxCampaignBudgetUsd = '1.20',
  privateRetentionHours = 168,
  maxPrivateBytesPerRun = 25 * 1024 * 1024,
} = {}) {
  const descriptor = {
    schema: CLAUDE_LIVE_POLICY_SCHEMA,
    policyId,
    authorization: {
      approvedOn,
      principalApproval: 'conversation-explicit',
      scope: 'S15-production-live-run-edge-campaign',
    },
    account: {
      boundary:
        'current-authenticated-principal-controlled-claude-ai-subscription',
      authMethod,
      apiProvider,
      subscriptionType,
      identityHandling: 'verified-private-not-retained',
    },
    network: {
      allowedClass: 'anthropic-first-party-via-claude-code',
      alternateProvidersDisabled: true,
      osEnforced: false,
    },
    model: {
      requestedAlias: model,
      snapshotStatus: 'requested-alias-not-snapshot',
    },
    tools: {
      allowed: [...CLAUDE_MCP_TOOLS],
      strictMcpOnly: true,
      nativeMutationRoutesDisabled: true,
    },
    limits: {
      maxProviderInvocations,
      maxTurnsPerRun,
      timeoutMs,
      maxCaptureBytes,
      maxInputBytes,
      maxBudgetUsdPerRun: String(maxBudgetUsdPerRun),
      maxCampaignBudgetUsd: String(maxCampaignBudgetUsd),
    },
    repository: {
      classification: 'disposable-synthetic',
      customerDataAllowed: false,
      externalSecretsAllowed: false,
    },
    evidence: {
      privateRetentionHours,
      maxPrivateBytesPerRun,
      privateMode: '0600',
      publicMode: '0644',
      repositoryRawEvidenceAllowed: false,
    },
    cleanup: {
      processGroupRequired: true,
      noSurvivorRequired: true,
      controlRootDeletionRequired: true,
      disposableRepositoryDeletionRequired: true,
    },
    stopConditions: [...CLAUDE_LIVE_STOP_CONDITIONS],
  };
  return validateClaudeLivePolicy({
    ...descriptor,
    policySha256: jsonHash(descriptor),
  });
}

export function assertClaudeRunWithinPolicy(policy, {
  model,
  maxBudgetUsd,
  maxTurns,
  timeoutMs,
  maxCaptureBytes,
  inputBytes,
}) {
  const current = validateClaudeLivePolicy(policy);
  if (
    model !== current.model.requestedAlias ||
    String(maxBudgetUsd) !== current.limits.maxBudgetUsdPerRun ||
    maxTurns !== current.limits.maxTurnsPerRun ||
    timeoutMs !== current.limits.timeoutMs ||
    maxCaptureBytes !== current.limits.maxCaptureBytes ||
    !Number.isSafeInteger(inputBytes) ||
    inputBytes < 0 ||
    inputBytes > current.limits.maxInputBytes
  ) {
    throw new TypeError('Claude run differs from the approved live policy');
  }
  return current;
}

export function parseClaudeAuthBoundary(stdout, policy) {
  const current = validateClaudeLivePolicy(policy);
  let raw;
  try {
    raw = JSON.parse(String(stdout));
  } catch {
    throw new TypeError('Claude auth status is not JSON');
  }
  plainObject(raw, 'Claude auth status');
  for (const key of [
    'email',
    'orgId',
    'orgName',
  ]) {
    nonempty(raw[key], `Claude auth ${key}`);
  }
  if (
    raw.loggedIn !== true ||
    raw.authMethod !== current.account.authMethod ||
    raw.apiProvider !== current.account.apiProvider ||
    raw.subscriptionType !== current.account.subscriptionType
  ) {
    throw new TypeError('Claude authentication boundary differs from policy');
  }
  return {
    boundary: {
      schema: CLAUDE_AUTH_BOUNDARY_SCHEMA,
      loggedIn: true,
      authMethod: raw.authMethod,
      apiProvider: raw.apiProvider,
      subscriptionType: raw.subscriptionType,
      identityHandling: current.account.identityHandling,
    },
    privateIdentitySha256: jsonHash([
      raw.email,
      raw.orgId,
      raw.orgName,
    ]),
  };
}
