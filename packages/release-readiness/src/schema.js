import {
  RELEASE_SCHEMAS,
} from './constants.js';
import {
  validatePublishedContract,
} from './published-contracts.js';

function fail(message) {
  throw new TypeError(message);
}

function object(value, name) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    fail(`${name} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, name) {
  object(value, name);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(
      `${name} keys must be exactly ${expected.join(', ')}; received ` +
      actual.join(', '),
    );
  }
}

function literal(value, expected, name) {
  if (value !== expected) {
    fail(`${name} must equal ${JSON.stringify(expected)}`);
  }
}

function nonempty(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    fail(`${name} must be a non-empty string`);
  }
}

function bool(value, name) {
  if (typeof value !== 'boolean') fail(`${name} must be boolean`);
}

export function validateReleasePosture(value) {
  return validatePublishedContract(RELEASE_SCHEMAS.posture, value);
}

export function validateCandidateManifest(value) {
  return validatePublishedContract(RELEASE_SCHEMAS.candidateManifest, value);
}

export function validateConsumerProof(value) {
  return validatePublishedContract(RELEASE_SCHEMAS.consumerProof, value);
}

export function validatePolicyAudit(value) {
  exactKeys(value, [
    'schema',
    'ok',
    'checks',
  ], 'policy audit');
  literal(
    value.schema,
    RELEASE_SCHEMAS.policyAudit,
    'policy audit schema',
  );
  bool(value.ok, 'policy audit ok');
  if (!Array.isArray(value.checks) || value.checks.length === 0) {
    fail('policy audit checks must be a non-empty array');
  }
  for (const [index, check] of value.checks.entries()) {
    exactKeys(check, ['id', 'passed', 'evidence'], `policy check ${index}`);
    nonempty(check.id, `policy check ${index} id`);
    bool(check.passed, `policy check ${index} passed`);
    nonempty(check.evidence, `policy check ${index} evidence`);
  }
  literal(
    value.ok,
    value.checks.every((check) => check.passed),
    'policy audit aggregate',
  );
  return structuredClone(value);
}
