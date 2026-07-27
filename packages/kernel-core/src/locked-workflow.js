export class AmbientAuthorityError extends Error {
  constructor(authority) {
    super(`ambient authority is unavailable inside the SCOPA core: ${authority}`);
    this.name = 'AmbientAuthorityError';
    this.code = 'SCOPA_AMBIENT_AUTHORITY_DENIED';
    this.authority = authority;
  }
}

function requireLockdown() {
  if (typeof globalThis.Compartment !== 'function') {
    throw new Error(
      'SES lockdown is required; import @endo/lockdown before locked-workflow.js',
    );
  }
}

function deepFreeze(value, seen = new WeakSet()) {
  if (
    !value ||
    (typeof value !== 'object' && typeof value !== 'function') ||
    seen.has(value)
  ) {
    return value;
  }
  seen.add(value);
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
    if (Object.hasOwn(descriptor, 'value')) deepFreeze(descriptor.value, seen);
  }
  return Object.freeze(value);
}

function deterministicMath() {
  const integerArgs = (name, args, minimum = 1) => {
    if (
      args.length < minimum ||
      args.some((value) => !Number.isSafeInteger(value))
    ) {
      throw new TypeError(`Math.${name} accepts safe integers only`);
    }
  };
  const unary = (name, operation) =>
    deepFreeze((value) => {
      integerArgs(name, [value]);
      const result = operation(value);
      if (!Number.isSafeInteger(result)) {
        throw new RangeError(`Math.${name} produced an unsafe integer`);
      }
      return result;
    });
  const safeMath = {
    abs: unary('abs', Math.abs),
    ceil: unary('ceil', Math.ceil),
    clz32: unary('clz32', Math.clz32),
    floor: unary('floor', Math.floor),
    imul: deepFreeze((left, right) => {
      integerArgs('imul', [left, right], 2);
      return Math.imul(left, right);
    }),
    max: deepFreeze((...values) => {
      integerArgs('max', values);
      return Math.max(...values);
    }),
    min: deepFreeze((...values) => {
      integerArgs('min', values);
      return Math.min(...values);
    }),
    random: deepFreeze(() => {
      throw new AmbientAuthorityError('Math.random');
    }),
    sign: unary('sign', Math.sign),
    trunc: unary('trunc', Math.trunc),
  };
  return deepFreeze(safeMath);
}

export function compileLockedWorkflow(source, input = null) {
  requireLockdown();
  if (typeof source !== 'string' || source.length === 0) {
    throw new TypeError('workflow source must be a non-empty string');
  }
  const compartment = new globalThis.Compartment({
    Date: undefined,
    Intl: undefined,
    Math: deterministicMath(),
    input: deepFreeze(structuredClone(input)),
  });
  const factory = compartment.evaluate(`(${source})`);
  if (typeof factory !== 'function') {
    throw new TypeError('workflow source must evaluate to a function');
  }
  const iterator = factory(input);
  if (!iterator || typeof iterator.next !== 'function') {
    throw new TypeError('workflow factory must return a generator');
  }
  return iterator;
}
