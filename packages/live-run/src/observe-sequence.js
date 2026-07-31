import {
  canonicalJson,
} from '../../enforcement/src/index.js';

export const S18_OBSERVE_SEQUENCE_POLICY_SCHEMA =
  'scopa.s18-observe-sequence-policy.v1';

export const S18_CODEX_OBSERVE_SEQUENCE_POLICY = Object.freeze({
  schema: S18_OBSERVE_SEQUENCE_POLICY_SCHEMA,
  maxExtraCalls: 1,
  repeatableTools: Object.freeze([
    Object.freeze({
      tool: 'scopa_check',
      effect: 'OBSERVE',
      maxExtraCalls: 1,
      requireEquivalentResult: true,
    }),
  ]),
});

function exact(value, expected, label) {
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new TypeError(`${label} differs from the frozen S18 policy`);
  }
}

function checkProjection(call) {
  const state = call?.result?.state;
  if (
    call?.tool !== 'scopa_check' ||
    call?.status !== 'completed' ||
    call?.isError !== false ||
    call?.result?.schema !== 'scopa.adapter-check-result.v1' ||
    state === null ||
    typeof state !== 'object' ||
    state.schema !== 'scopa.stop-state.v1' ||
    typeof state.sliceId !== 'string' ||
    state.sliceId.length === 0 ||
    typeof state.status !== 'string' ||
    typeof state.canStop !== 'boolean' ||
    typeof state.condition !== 'string' ||
    !Array.isArray(state.failedGates) ||
    state.failedGates.some((gate) => typeof gate !== 'string') ||
    typeof state.lockHash !== 'string' ||
    !/^[0-9a-f]{64}$/.test(state.lockHash)
  ) {
    throw new TypeError('repeatable scopa_check is not a successful OBSERVE');
  }
  return {
    resultSchema: call.result.schema,
    stateSchema: state.schema,
    sliceId: state.sliceId,
    status: state.status,
    canStop: state.canStop,
    condition: state.condition,
    failedGates: state.failedGates,
    lockHash: state.lockHash,
  };
}

function observationProjection(call) {
  if (call.tool === 'scopa_check') return checkProjection(call);
  throw new TypeError(`tool ${call.tool} is not a repeatable OBSERVE`);
}

export function validateBoundedObserveSequence({
  calls,
  expectedTools,
  policy = S18_CODEX_OBSERVE_SEQUENCE_POLICY,
}) {
  exact(policy, S18_CODEX_OBSERVE_SEQUENCE_POLICY, 'OBSERVE sequence policy');
  if (
    !Array.isArray(calls) ||
    !Array.isArray(expectedTools) ||
    calls.some((call) => call === null || typeof call !== 'object') ||
    expectedTools.some((tool) => typeof tool !== 'string')
  ) {
    throw new TypeError('OBSERVE sequence inputs are malformed');
  }
  for (const rule of policy.repeatableTools) {
    if (expectedTools.filter((tool) => tool === rule.tool).length !== 1) {
      throw new TypeError(
        `canonical sequence must contain ${rule.tool} exactly once`,
      );
    }
  }
  const rules = new Map(policy.repeatableTools.map((rule) => [rule.tool, rule]));
  const canonicalCalls = new Map();
  const repeats = new Map();
  const repeatedTools = [];
  let expectedIndex = 0;
  let extraCalls = 0;

  for (const call of calls) {
    if (call.tool === expectedTools[expectedIndex]) {
      if (!canonicalCalls.has(call.tool)) canonicalCalls.set(call.tool, call);
      expectedIndex += 1;
      continue;
    }
    const rule = rules.get(call.tool);
    const canonical = canonicalCalls.get(call.tool);
    const priorRepeats = repeats.get(call.tool) ?? 0;
    if (
      expectedIndex >= expectedTools.length ||
      rule === undefined ||
      rule.effect !== 'OBSERVE' ||
      canonical === undefined ||
      priorRepeats >= rule.maxExtraCalls ||
      extraCalls >= policy.maxExtraCalls
    ) {
      throw new TypeError(`unexpected or excessive tool call ${call.tool}`);
    }
    if (
      rule.requireEquivalentResult &&
      canonicalJson(observationProjection(call)) !==
        canonicalJson(observationProjection(canonical))
    ) {
      throw new TypeError(`repeated ${call.tool} changed semantic result`);
    }
    repeats.set(call.tool, priorRepeats + 1);
    repeatedTools.push(call.tool);
    extraCalls += 1;
  }
  if (expectedIndex !== expectedTools.length) {
    throw new TypeError('required canonical tool sequence is incomplete');
  }
  return {
    schema: 'scopa.s18-observe-sequence-validation.v1',
    canonicalTools: [...expectedTools],
    actualTools: calls.map((call) => call.tool),
    extraCalls,
    repeatedTools,
  };
}
