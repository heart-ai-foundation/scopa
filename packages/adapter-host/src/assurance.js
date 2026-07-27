import {
  deepFreeze,
} from '../../enforcement/src/index.js';
import {
  AdapterValidationError,
  exactObject,
  nonEmptyString,
} from './schema.js';

export const CAPABILITY_MATRIX_SCHEMA = 'scopa.capability-matrix.v1';

const MATRIX_KEYS = new Set([
  'assurance',
  'capabilities',
  'schema',
  'subject',
]);
const SUBJECT_KEYS = new Set([
  'adapter',
  'client',
  'transport',
]);
const CAPABILITY_KEYS = new Set([
  'category',
  'effect',
  'evidence',
  'exposure',
  'id',
  'mediation',
]);
const CATEGORIES = new Set([
  'execute',
  'extension',
  'mutate',
  'network',
  'observe',
]);
const EXPOSURES = new Set([
  'advertised',
  'disabled',
  'native',
]);
const MEDIATIONS = new Set([
  'disabled',
  'read-only',
  'scopa-dispatcher',
  'scopa-gate',
  'uncontrolled',
]);
const EFFECTS = new Set([
  null,
  'MUTATE',
  'OBSERVE',
]);
const REQUIRED_CAPABILITIES = new Set([
  'native.extensions',
  'native.filesystem-write',
  'native.network',
  'native.process-execution',
  'scopa.write_file',
]);

function enumValue(value, values, label) {
  if (!values.has(value)) {
    throw new AdapterValidationError(`${label} has unsupported value`);
  }
  return value;
}

function normalizeCapability(value, index) {
  const label = `capabilities[${index}]`;
  exactObject(value, CAPABILITY_KEYS, label);
  const normalized = {
    id: nonEmptyString(value.id, `${label}.id`),
    category: enumValue(value.category, CATEGORIES, `${label}.category`),
    exposure: enumValue(value.exposure, EXPOSURES, `${label}.exposure`),
    mediation: enumValue(value.mediation, MEDIATIONS, `${label}.mediation`),
    effect: enumValue(value.effect, EFFECTS, `${label}.effect`),
    evidence: nonEmptyString(value.evidence, `${label}.evidence`),
  };
  if (
    normalized.exposure === 'disabled' &&
    (normalized.mediation !== 'disabled' || normalized.effect !== null)
  ) {
    throw new AdapterValidationError(
      `${label} disabled capability must use disabled mediation and null effect`,
    );
  }
  if (
    normalized.exposure !== 'disabled' &&
    normalized.mediation === 'disabled'
  ) {
    throw new AdapterValidationError(
      `${label} active capability cannot use disabled mediation`,
    );
  }
  if (
    normalized.exposure === 'advertised' &&
    normalized.category === 'mutate' &&
    (
      normalized.mediation !== 'scopa-dispatcher' ||
      normalized.effect !== 'MUTATE'
    )
  ) {
    throw new AdapterValidationError(
      `${label} advertised mutation must be a SCOPA-dispatched MUTATE`,
    );
  }
  if (
    normalized.exposure === 'advertised' &&
    normalized.category === 'observe' &&
    (
      !['read-only', 'scopa-gate'].includes(normalized.mediation) ||
      normalized.effect !== 'OBSERVE'
    )
  ) {
    throw new AdapterValidationError(
      `${label} advertised observation must use a read-only or gate route`,
    );
  }
  return normalized;
}

export function validateCapabilityMatrix(value) {
  exactObject(value, MATRIX_KEYS, 'capability matrix');
  if (value.schema !== CAPABILITY_MATRIX_SCHEMA) {
    throw new AdapterValidationError('unsupported capability matrix schema');
  }
  exactObject(value.subject, SUBJECT_KEYS, 'capability matrix subject');
  if (!Array.isArray(value.capabilities) || value.capabilities.length === 0) {
    throw new AdapterValidationError('capabilities must be a non-empty array');
  }
  const capabilities = value.capabilities.map(normalizeCapability);
  const ids = new Set();
  for (const capability of capabilities) {
    if (ids.has(capability.id)) {
      throw new AdapterValidationError(
        `duplicate capability id: ${capability.id}`,
      );
    }
    ids.add(capability.id);
  }
  const missing = [...REQUIRED_CAPABILITIES].filter((id) => !ids.has(id));
  if (missing.length > 0) {
    throw new AdapterValidationError(
      `capability matrix omits required capabilities: ${missing.sort().join(', ')}`,
    );
  }
  const assurance = capabilities.some(
    (capability) =>
      capability.exposure !== 'disabled' &&
      capability.mediation === 'uncontrolled',
  )
    ? 'partial'
    : 'full';
  if (value.assurance !== assurance) {
    throw new AdapterValidationError(
      `claimed assurance ${value.assurance} does not match computed ${assurance}`,
    );
  }
  return deepFreeze({
    schema: CAPABILITY_MATRIX_SCHEMA,
    subject: {
      adapter: nonEmptyString(value.subject.adapter, 'subject.adapter'),
      client: nonEmptyString(value.subject.client, 'subject.client'),
      transport: nonEmptyString(value.subject.transport, 'subject.transport'),
    },
    capabilities,
    assurance,
  });
}
