import assert from 'node:assert/strict';
import test from 'node:test';
import {
  S18_CODEX_OBSERVE_SEQUENCE_POLICY,
  validateBoundedObserveSequence,
} from '../src/observe-sequence.js';

const EXPECTED = [
  'scopa_orientation',
  'scopa_read_file',
  'scopa_check',
  'scopa_assurance',
  'scopa_transcript',
];

function call(tool, overrides = {}) {
  return {
    tool,
    status: 'completed',
    isError: false,
    result: tool === 'scopa_check' ? {
      schema: 'scopa.adapter-check-result.v1',
      state: {
        schema: 'scopa.stop-state.v1',
        sliceId: 'S9-codex-clean',
        status: 'satisfied',
        canStop: true,
        condition: 'all-gates-pass',
        failedGates: [],
        lockHash: '2abddfbc84f34c976c8d2b4d24cca7382847e2cd8296ba255cfcee59f1df8e3b',
      },
    } : {},
    ...overrides,
  };
}

function canonicalCalls() {
  return EXPECTED.map((tool) => call(tool));
}

test('exact canonical sequence remains accepted with zero extras', () => {
  const result = validateBoundedObserveSequence({
    calls: canonicalCalls(), expectedTools: EXPECTED,
  });
  assert.equal(result.extraCalls, 0);
});

test('one equivalent repeated check after assurance is accepted', () => {
  const calls = canonicalCalls();
  calls.splice(4, 0, call('scopa_check'));
  const result = validateBoundedObserveSequence({ calls, expectedTools: EXPECTED });
  assert.equal(result.extraCalls, 1);
  assert.deepEqual(result.repeatedTools, ['scopa_check']);
});

test('non-check repeats, order, count, error, malformed state, and drift stay rejected', () => {
  const hostile = [
    () => [call('scopa_orientation'), call('scopa_write_file'), ...canonicalCalls().slice(1)],
    () => { const x = canonicalCalls(); x.splice(4, 0, call('scopa_read_file')); return x; },
    () => { const x = canonicalCalls(); x.splice(4, 0, call('scopa_assurance')); return x; },
    () => [...canonicalCalls(), call('scopa_transcript')],
    () => [call('scopa_orientation'), call('scopa_check'), ...canonicalCalls().slice(1)],
    () => { const x = canonicalCalls(); x.splice(4, 0, call('scopa_check'), call('scopa_check')); return x; },
    () => { const x = canonicalCalls(); x.splice(4, 0, call('scopa_check', { isError: true })); return x; },
    () => {
      const malformed = call('scopa_check');
      delete malformed.result.state.lockHash;
      const x = canonicalCalls(); x.splice(4, 0, malformed); return x;
    },
    () => {
      const changed = call('scopa_check');
      changed.result.state.lockHash = '0'.repeat(64);
      const x = canonicalCalls(); x.splice(4, 0, changed); return x;
    },
  ];
  for (const build of hostile) {
    assert.throws(() => validateBoundedObserveSequence({
      calls: build(), expectedTools: EXPECTED,
    }));
  }
});

test('policy widening and malformed input fail closed', () => {
  assert.throws(() => validateBoundedObserveSequence({
    calls: canonicalCalls(), expectedTools: EXPECTED,
    policy: { ...S18_CODEX_OBSERVE_SEQUENCE_POLICY, maxExtraCalls: 2 },
  }), /differs from the frozen S18 policy/);
  assert.throws(() => validateBoundedObserveSequence({
    calls: null, expectedTools: EXPECTED,
  }), /malformed/);
});
