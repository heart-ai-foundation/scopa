import path from 'node:path';
import {
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  LIVE_ENVIRONMENT_POLICY_SCHEMA,
} from './environment.js';

export const LIVE_RECEIPT_SCHEMA = 'scopa.live-receipt.v1';
export const INSTALLED_ARTIFACT_SCHEMA =
  'scopa.installed-artifact-identity.v1';

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

function sha256(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new TypeError(`${label} must be a SHA-256 hex digest`);
  }
}

export function validateInstalledArtifactIdentity(value) {
  exactKeys(
    value,
    [
      'package',
      'schema',
      'sourceCommit',
    ],
    'installed artifact identity',
  );
  exactKeys(
    value.package,
    [
      'integrity',
      'name',
      'sha256',
      'version',
    ],
    'installed artifact package',
  );
  if (value.schema !== INSTALLED_ARTIFACT_SCHEMA) {
    throw new TypeError('installed artifact identity has an unknown schema');
  }
  if (
    typeof value.sourceCommit !== 'string' ||
    !/^[0-9a-f]{40}$/.test(value.sourceCommit)
  ) {
    throw new TypeError('installed artifact source commit is invalid');
  }
  nonempty(value.package.name, 'installed package name');
  nonempty(value.package.version, 'installed package version');
  sha256(value.package.sha256, 'installed package sha256');
  if (
    typeof value.package.integrity !== 'string' ||
    !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(value.package.integrity)
  ) {
    throw new TypeError('installed package integrity is invalid');
  }
  return value;
}

export function createInstalledArtifactIdentity({
  sourceCommit,
  name,
  version,
  sha256: packageSha256,
  integrity,
}) {
  return validateInstalledArtifactIdentity({
    schema: INSTALLED_ARTIFACT_SCHEMA,
    sourceCommit,
    package: {
      name,
      version,
      sha256: packageSha256,
      integrity,
    },
  });
}

export function createLiveReceipt({
  artifact,
  clientName,
  expectedVersion,
  observedVersion,
  requestedModel,
  profileName,
  profile,
  capabilityMatrix,
  scenario,
  limits,
  environmentPolicy,
  invocation,
}) {
  const installed = validateInstalledArtifactIdentity(artifact);
  for (const [value, label] of [
    [clientName, 'client name'],
    [expectedVersion, 'expected client version'],
    [requestedModel, 'requested model'],
    [profileName, 'profile name'],
  ]) {
    nonempty(value, label);
  }
  if (
    observedVersion !== null &&
    (typeof observedVersion !== 'string' || observedVersion.length === 0)
  ) {
    throw new TypeError('observed client version must be null or non-empty');
  }
  plainObject(profile, 'profile');
  plainObject(capabilityMatrix, 'capability matrix');
  plainObject(scenario, 'scenario');
  nonempty(scenario.id, 'scenario id');
  nonempty(scenario.version, 'scenario version');
  plainObject(limits, 'limits');
  plainObject(environmentPolicy, 'environment policy');
  if (environmentPolicy.schema !== LIVE_ENVIRONMENT_POLICY_SCHEMA) {
    throw new TypeError('environment policy schema is invalid');
  }
  sha256(environmentPolicy.policySha256, 'environment policy digest');
  plainObject(invocation, 'invocation');
  nonempty(invocation.command, 'invocation command');
  if (!Array.isArray(invocation.args)) {
    throw new TypeError('invocation args must be an array');
  }
  if (invocation.args.some((argument) => typeof argument !== 'string')) {
    throw new TypeError('invocation args must contain strings');
  }
  if (typeof invocation.stdin !== 'string') {
    throw new TypeError('invocation stdin must be a string');
  }

  return validateLiveReceipt({
    schema: LIVE_RECEIPT_SCHEMA,
    artifact: structuredClone(installed),
    client: {
      name: clientName,
      expectedVersion,
      observedVersion,
    },
    requestedModel,
    profile: {
      name: profileName,
      sha256: jsonHash(profile),
    },
    capabilityMatrix: {
      schema: capabilityMatrix.schema,
      sha256: jsonHash(capabilityMatrix),
    },
    scenario: {
      id: scenario.id,
      version: scenario.version,
    },
    limits: structuredClone(limits),
    environmentPolicy: structuredClone(environmentPolicy),
    invocation: {
      commandName: path.basename(invocation.command),
      argumentCount: invocation.args.length,
      argumentsSha256: jsonHash(invocation.args),
      stdinSha256: jsonHash(invocation.stdin),
    },
  });
}

export function validateLiveReceipt(value) {
  exactKeys(
    value,
    [
      'artifact',
      'capabilityMatrix',
      'client',
      'environmentPolicy',
      'invocation',
      'limits',
      'profile',
      'requestedModel',
      'scenario',
      'schema',
    ],
    'live receipt',
  );
  if (value.schema !== LIVE_RECEIPT_SCHEMA) {
    throw new TypeError('live receipt has an unknown schema');
  }
  validateInstalledArtifactIdentity(value.artifact);
  exactKeys(
    value.client,
    [
      'expectedVersion',
      'name',
      'observedVersion',
    ],
    'live receipt client',
  );
  nonempty(value.client.name, 'live receipt client name');
  nonempty(
    value.client.expectedVersion,
    'live receipt expected client version',
  );
  if (
    value.client.observedVersion !== null &&
    (
      typeof value.client.observedVersion !== 'string' ||
      value.client.observedVersion.length === 0
    )
  ) {
    throw new TypeError(
      'live receipt observed client version must be null or non-empty',
    );
  }
  nonempty(value.requestedModel, 'live receipt requested model');
  exactKeys(
    value.profile,
    [
      'name',
      'sha256',
    ],
    'live receipt profile',
  );
  nonempty(value.profile.name, 'live receipt profile name');
  sha256(value.profile.sha256, 'live receipt profile digest');
  exactKeys(
    value.capabilityMatrix,
    [
      'schema',
      'sha256',
    ],
    'live receipt capability matrix',
  );
  nonempty(
    value.capabilityMatrix.schema,
    'live receipt capability matrix schema',
  );
  sha256(
    value.capabilityMatrix.sha256,
    'live receipt capability matrix digest',
  );
  exactKeys(
    value.scenario,
    [
      'id',
      'version',
    ],
    'live receipt scenario',
  );
  nonempty(value.scenario.id, 'live receipt scenario id');
  nonempty(value.scenario.version, 'live receipt scenario version');

  plainObject(value.limits, 'live receipt limits');
  if (Object.keys(value.limits).length === 0) {
    throw new TypeError('live receipt limits cannot be empty');
  }
  for (const [name, limit] of Object.entries(value.limits)) {
    nonempty(name, 'live receipt limit name');
    if (
      !(
        typeof limit === 'string' && limit.length > 0
      ) &&
      !(
        Number.isSafeInteger(limit) && limit >= 0
      )
    ) {
      throw new TypeError(
        'live receipt limits must be nonnegative integers or strings',
      );
    }
  }

  exactKeys(
    value.environmentPolicy,
    [
      'inheritance',
      'inheritedNameCount',
      'inheritedNamesSha256',
      'policySha256',
      'removedNames',
      'schema',
      'setNames',
      'setValuesSha256',
    ],
    'live receipt environment policy',
  );
  if (
    value.environmentPolicy.schema !== LIVE_ENVIRONMENT_POLICY_SCHEMA ||
    value.environmentPolicy.inheritance !== 'host-minus-denylist'
  ) {
    throw new TypeError('live receipt environment policy is invalid');
  }
  if (
    !Number.isSafeInteger(value.environmentPolicy.inheritedNameCount) ||
    value.environmentPolicy.inheritedNameCount < 0
  ) {
    throw new TypeError(
      'live receipt inherited environment count is invalid',
    );
  }
  for (const key of [
    'inheritedNamesSha256',
    'policySha256',
    'setValuesSha256',
  ]) {
    sha256(
      value.environmentPolicy[key],
      `live receipt environment ${key}`,
    );
  }
  for (const key of [
    'removedNames',
    'setNames',
  ]) {
    const names = value.environmentPolicy[key];
    if (
      !Array.isArray(names) ||
      names.some((name) => typeof name !== 'string' || name.length === 0) ||
      JSON.stringify(names) !== JSON.stringify([...new Set(names)].sort())
    ) {
      throw new TypeError(
        `live receipt environment ${key} must be sorted and unique`,
      );
    }
  }
  const {
    policySha256,
    ...policyDescriptor
  } = value.environmentPolicy;
  if (policySha256 !== jsonHash(policyDescriptor)) {
    throw new TypeError('live receipt environment policy digest is invalid');
  }

  exactKeys(
    value.invocation,
    [
      'argumentCount',
      'argumentsSha256',
      'commandName',
      'stdinSha256',
    ],
    'live receipt invocation',
  );
  if (
    typeof value.invocation.commandName !== 'string' ||
    value.invocation.commandName.length === 0 ||
    /[/\\]/.test(value.invocation.commandName)
  ) {
    throw new TypeError('live receipt invocation command name is invalid');
  }
  if (
    !Number.isSafeInteger(value.invocation.argumentCount) ||
    value.invocation.argumentCount < 0
  ) {
    throw new TypeError('live receipt invocation argument count is invalid');
  }
  sha256(
    value.invocation.argumentsSha256,
    'live receipt invocation argument digest',
  );
  sha256(
    value.invocation.stdinSha256,
    'live receipt invocation stdin digest',
  );
  return value;
}
