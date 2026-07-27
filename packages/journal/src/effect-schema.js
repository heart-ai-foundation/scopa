import { encodeDcbor, validateDcborValue } from './dcbor.js';
import { hashHex } from './hash.js';

export const OBSERVE_CATEGORIES = Object.freeze([
  'CLOCK',
  'ENTROPY',
  'SOURCE.INGEST',
  'SOURCE.EXTRACT',
  'INFER',
  'TOOL.QUERY',
]);

export const ACT_CATEGORIES = Object.freeze([
  'TOOL.COMMAND',
  'EMIT',
  'SIGN',
]);

export const PRINCIPAL_CATEGORIES = Object.freeze(['DECISION']);

export const EFFECT_CATEGORIES = Object.freeze([
  ...OBSERVE_CATEGORIES,
  ...ACT_CATEGORIES,
  ...PRINCIPAL_CATEGORIES,
]);

const CATEGORY_SET = new Set(EFFECT_CATEGORIES);
const OBSERVE_SET = new Set(OBSERVE_CATEGORIES);
const ACT_SET = new Set(ACT_CATEGORIES);
const PRINCIPAL_SET = new Set(PRINCIPAL_CATEGORIES);
const EFFECT_KEYS = new Set(['category', 'idempotencyKey', 'payload', 'scope']);

export class EffectDescriptorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EffectDescriptorError';
    this.code = 'SCOPA_EFFECT_INVALID';
  }
}

export function effectKind(category) {
  if (OBSERVE_SET.has(category)) return 'OBSERVE';
  if (ACT_SET.has(category)) return 'ACT';
  if (PRINCIPAL_SET.has(category)) return 'PRINCIPAL';
  throw new EffectDescriptorError(`unknown effect category: ${category}`);
}

export function assertEffectDescriptor(effect) {
  if (
    !effect ||
    typeof effect !== 'object' ||
    Array.isArray(effect) ||
    Object.getPrototypeOf(effect) !== Object.prototype
  ) {
    throw new EffectDescriptorError('effect must be a plain object');
  }
  const unknownKeys = Object.keys(effect).filter((key) => !EFFECT_KEYS.has(key));
  if (unknownKeys.length > 0) {
    throw new EffectDescriptorError(
      `effect contains unknown fields: ${unknownKeys.sort().join(', ')}`,
    );
  }
  if (!CATEGORY_SET.has(effect.category)) {
    throw new EffectDescriptorError(`unknown effect category: ${effect.category}`);
  }
  if (typeof effect.scope !== 'string' || effect.scope.length === 0) {
    throw new EffectDescriptorError('effect.scope must be a non-empty string');
  }
  if (!Object.hasOwn(effect, 'payload')) {
    throw new EffectDescriptorError('effect.payload is required');
  }
  try {
    validateDcborValue(effect.payload, '$.effect.payload');
  } catch (error) {
    throw new EffectDescriptorError(error.message);
  }
  const kind = effectKind(effect.category);
  if (
    kind === 'ACT' &&
    (typeof effect.idempotencyKey !== 'string' ||
      effect.idempotencyKey.length === 0)
  ) {
    throw new EffectDescriptorError(
      `ACT effect ${effect.category} requires an idempotencyKey`,
    );
  }
  if (kind !== 'ACT' && Object.hasOwn(effect, 'idempotencyKey')) {
    throw new EffectDescriptorError(
      `${kind} effect ${effect.category} cannot carry an idempotencyKey`,
    );
  }
  return effect;
}

export function effectHash(effect) {
  assertEffectDescriptor(effect);
  return hashHex(encodeDcbor(effect));
}
