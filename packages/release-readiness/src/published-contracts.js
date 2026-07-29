import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  normalizeCandidatePath,
} from './candidate-path.js';

const SCHEMA_FILES = [
  'scopa.candidate-manifest.v1.schema.json',
  'scopa.claude-live-policy.v1.schema.json',
  'scopa.consumer-proof.v1.schema.json',
  'scopa.live-terminal.v1.schema.json',
  'scopa.live-receipt.v1.schema.json',
  'scopa.live-evidence.v1.schema.json',
  'scopa.live-evidence.public.v1.schema.json',
  'scopa.release-posture.v1.schema.json',
];

function loadSchema(filename) {
  return JSON.parse(readFileSync(
    new URL(`../../../schemas/${filename}`, import.meta.url),
    'utf8',
  ));
}

const schemas = SCHEMA_FILES.map(loadSchema);

function candidateInvariants(enabled, value) {
  if (!enabled) return true;

  const errors = [];
  const files = Array.isArray(value?.files) ? value.files : [];
  const paths = files.map((entry) => entry?.path);
  const normalizedPaths = paths.map(normalizeCandidatePath);

  if (
    normalizedPaths.some(
      (normalizedPath, index) => normalizedPath !== paths[index],
    )
  ) {
    errors.push({
      instancePath: '/files',
      keyword: 'x-scopa-candidate-invariants',
      message: 'must contain only canonical POSIX-relative file paths',
      params: { invariant: 'canonical-file-paths' },
    });
  }

  if (
    normalizedPaths.includes(null) ||
    new Set(normalizedPaths).size !== normalizedPaths.length
  ) {
    errors.push({
      instancePath: '/files',
      keyword: 'x-scopa-candidate-invariants',
      message: 'must contain unique normalized file paths',
      params: { invariant: 'unique-normalized-file-paths' },
    });
  }

  const sorted = [...paths].sort();
  if (JSON.stringify(paths) !== JSON.stringify(sorted)) {
    errors.push({
      instancePath: '/files',
      keyword: 'x-scopa-candidate-invariants',
      message: 'must be sorted by path',
      params: { invariant: 'sorted-file-paths' },
    });
  }

  if (value?.package?.entryCount !== files.length) {
    errors.push({
      instancePath: '/package/entryCount',
      keyword: 'x-scopa-candidate-invariants',
      message: 'must equal the files array length',
      params: { invariant: 'entry-count-equals-files-length' },
    });
  }

  candidateInvariants.errors = errors.length === 0 ? null : errors;
  return errors.length === 0;
}

function claudeLivePolicyInvariants(enabled, value) {
  if (!enabled) return true;

  const errors = [];
  const {
    policySha256,
    ...descriptor
  } = value ?? {};

  if (policySha256 !== jsonHash(descriptor)) {
    errors.push({
      instancePath: '/policySha256',
      keyword: 'x-scopa-claude-live-policy-invariants',
      message: 'must bind the complete policy descriptor',
      params: { invariant: 'policy-digest-binds-descriptor' },
    });
  }

  const perRun = Number(value?.limits?.maxBudgetUsdPerRun);
  const campaign = Number(value?.limits?.maxCampaignBudgetUsd);
  const invocations = value?.limits?.maxProviderInvocations;
  if (
    !Number.isFinite(perRun) ||
    perRun <= 0 ||
    !Number.isFinite(campaign) ||
    campaign < perRun ||
    !Number.isSafeInteger(invocations) ||
    campaign > perRun * invocations + Number.EPSILON
  ) {
    errors.push({
      instancePath: '/limits/maxCampaignBudgetUsd',
      keyword: 'x-scopa-claude-live-policy-invariants',
      message: 'must fit the per-run and invocation budget bounds',
      params: { invariant: 'campaign-budget-fits-run-bounds' },
    });
  }

  if (
    value?.evidence?.maxPrivateBytesPerRun <
    value?.limits?.maxCaptureBytes
  ) {
    errors.push({
      instancePath: '/evidence/maxPrivateBytesPerRun',
      keyword: 'x-scopa-claude-live-policy-invariants',
      message: 'must be at least the provider capture bound',
      params: { invariant: 'private-evidence-fits-capture' },
    });
  }

  claudeLivePolicyInvariants.errors =
    errors.length === 0 ? null : errors;
  return errors.length === 0;
}

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
});

ajv.addKeyword({
  keyword: 'x-scopa-candidate-invariants',
  schemaType: 'boolean',
  errors: true,
  validate: candidateInvariants,
});

ajv.addKeyword({
  keyword: 'x-scopa-claude-live-policy-invariants',
  schemaType: 'boolean',
  errors: true,
  validate: claudeLivePolicyInvariants,
});

for (const schema of schemas) {
  ajv.addSchema(schema);
}

const validators = new Map(
  schemas.map((schema) => [
    schema.properties.schema.const,
    ajv.getSchema(schema.$id),
  ]),
);

function formatErrors(errors) {
  return errors
    .map((error) => {
      const location = error.instancePath || '/';
      return `${location} ${error.message}`;
    })
    .join('; ');
}

export function validatePublishedContract(schemaId, value) {
  const validator = validators.get(schemaId);
  if (!validator) {
    throw new TypeError(`unknown published contract: ${schemaId}`);
  }
  if (!validator(value)) {
    throw new TypeError(
      `${schemaId} contract violation: ${formatErrors(validator.errors)}`,
    );
  }
  return structuredClone(value);
}

export function publishedContractAccepts(schemaId, value) {
  try {
    validatePublishedContract(schemaId, value);
    return true;
  } catch {
    return false;
  }
}

export function publishedContractIds() {
  return [...validators.keys()].sort();
}
