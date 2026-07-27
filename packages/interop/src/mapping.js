import {
  EFFECT_CATEGORIES,
  effectKind,
} from '../../journal/src/effect-schema.js';
import { deepFreeze, InteropVerificationError } from './schema.js';

const LABELS = Object.freeze({
  CLOCK: 'Read clock',
  ENTROPY: 'Request entropy',
  'SOURCE.INGEST': 'Ingest source',
  'SOURCE.EXTRACT': 'Extract source content',
  INFER: 'Perform model inference',
  'TOOL.QUERY': 'Query through tool',
  'TOOL.COMMAND': 'Execute tool command',
  EMIT: 'Emit output',
  SIGN: 'Create signature',
  DECISION: 'Record principal decision',
});

function createMapping() {
  const mapping = {};
  for (const category of EFFECT_CATEGORIES) {
    const label = LABELS[category];
    if (!label) {
      throw new InteropVerificationError(
        `missing CASE mapping for SCOPA effect category ${category}`,
      );
    }
    mapping[category] = {
      actionType: 'uco-action:Action',
      effectKind: effectKind(category),
      label,
      tag: `scopa:effect-category:${category}`,
    };
  }
  const actual = Object.keys(mapping).sort();
  const expected = [...EFFECT_CATEGORIES].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new InteropVerificationError(
      'CASE effect mapping must exactly cover the frozen SCOPA effect ABI',
    );
  }
  return deepFreeze(mapping);
}

export const CASE_EFFECT_MAPPING = createMapping();

export function mappingForEffect(category) {
  const mapping = CASE_EFFECT_MAPPING[category];
  if (!mapping) {
    throw new InteropVerificationError(
      `unknown SCOPA effect category in CASE export: ${category}`,
    );
  }
  return mapping;
}
