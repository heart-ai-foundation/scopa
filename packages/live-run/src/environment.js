import {
  jsonHash,
} from '../../enforcement/src/index.js';

export const LIVE_ENVIRONMENT_POLICY_SCHEMA =
  'scopa.live-environment-policy.v1';

function uniqueSortedStrings(values, label) {
  if (
    !Array.isArray(values) ||
    values.some((value) => typeof value !== 'string' || value.length === 0)
  ) {
    throw new TypeError(`${label} must contain non-empty strings`);
  }
  return [...new Set(values)].sort();
}

function environmentObject(value, label) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new TypeError(`${label} must be an environment object`);
  }
  for (const [name, content] of Object.entries(value)) {
    if (
      typeof name !== 'string' ||
      name.length === 0 ||
      typeof content !== 'string'
    ) {
      throw new TypeError(`${label} must map names to strings`);
    }
  }
}

export function createControlledEnvironment({
  additions = {},
  removedNames,
  baseEnvironment = process.env,
}) {
  environmentObject(additions, 'environment additions');
  environmentObject(baseEnvironment, 'base environment');
  const removed = uniqueSortedStrings(removedNames, 'removedNames');
  for (const name of removed) {
    if (Object.hasOwn(additions, name)) {
      throw new TypeError(`removed environment name cannot be set: ${name}`);
    }
  }

  const environment = {
    ...baseEnvironment,
    ...additions,
  };
  for (const name of removed) delete environment[name];

  const inheritedNames = Object.keys(baseEnvironment)
    .filter((name) => !removed.includes(name) && !Object.hasOwn(additions, name))
    .sort();
  const setNames = Object.keys(additions).sort();
  const descriptor = {
    schema: LIVE_ENVIRONMENT_POLICY_SCHEMA,
    inheritance: 'host-minus-denylist',
    inheritedNameCount: inheritedNames.length,
    inheritedNamesSha256: jsonHash(inheritedNames),
    removedNames: removed,
    setNames,
    setValuesSha256: jsonHash(
      setNames.map((name) => [name, additions[name]]),
    ),
  };
  return {
    environment,
    policy: {
      ...descriptor,
      policySha256: jsonHash(descriptor),
    },
  };
}
