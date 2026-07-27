function applyOperator(current, operator, value) {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError('synthetic observation values must be safe integers');
  }
  switch (operator) {
    case 'add':
      return current + value;
    case 'subtract':
      return current - value;
    case 'multiply':
      return current * value;
    default:
      throw new TypeError(`unknown synthetic operator: ${operator}`);
  }
}

function validatePlan(plan) {
  if (!plan || !Number.isSafeInteger(plan.initial) || !Array.isArray(plan.steps)) {
    throw new TypeError('synthetic plan requires a safe-integer initial value and steps');
  }
}

export function sequenceObserver(valuesByKey) {
  return async ({ key }) => {
    if (!Object.hasOwn(valuesByKey, key)) {
      throw new Error(`no synthetic observation configured for ${key}`);
    }
    const configured = valuesByKey[key];
    if (Array.isArray(configured)) {
      if (configured.length === 0) {
        throw new Error(`synthetic observation sequence exhausted for ${key}`);
      }
      return configured.shift();
    }
    return configured;
  };
}

export async function runSyntheticWorkflow({
  plan,
  mode,
  journal = [],
  replaySource,
  observe,
  observeHidden,
  onUnexpectedEffect = () => {},
}) {
  validatePlan(plan);
  if (!['live', 'replay'].includes(mode)) {
    throw new TypeError('mode must be live or replay');
  }
  if (typeof observeHidden !== 'function') {
    throw new TypeError('observeHidden must be a function');
  }
  if (mode === 'live' && typeof observe !== 'function') {
    throw new TypeError('live mode requires observe');
  }

  if (mode === 'replay' && (!replaySource || typeof replaySource.next !== 'function')) {
    throw new TypeError('replay mode requires a replaySource');
  }

  const captured = mode === 'live' ? [] : journal;
  const emitted = [];
  let cursor = 0;
  let value = plan.initial;

  for (const step of plan.steps) {
    if (step.type === 'emit') {
      emitted.push({ label: step.label, value });
      continue;
    }

    let observed;
    if (step.type === 'observe') {
      if (mode === 'live') {
        observed = await observe(step);
        captured.push({
          seq: captured.length,
          category: step.category,
          request: { key: step.key },
          result: { value: observed },
        });
      } else {
        const record = replaySource.next();
        if (
          record.seq !== cursor ||
          record.category !== step.category ||
          record.request?.key !== step.key
        ) {
          throw new Error(`journal effect ${cursor} does not match the synthetic plan`);
        }
        observed = record.result?.value;
      }
      cursor += 1;
    } else if (step.type === 'hidden-observe') {
      onUnexpectedEffect({
        category: 'AMBIENT',
        key: step.key,
      });
      observed = await observeHidden(step);
    } else {
      throw new TypeError(`unknown synthetic step type: ${step.type}`);
    }

    value = applyOperator(value, step.operator, observed);
    if (!Number.isSafeInteger(value)) {
      throw new RangeError('synthetic workflow exceeded safe-integer range');
    }
  }

  return {
    output: { value },
    emitted,
    journal: captured,
    consumedEffects: cursor,
  };
}
