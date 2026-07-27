import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  assertUntrustedDataContained,
  ContainmentGraphError,
  evaluateUntrustedDataContainment,
  UntrustedInstructionFlowError,
} from '../src/untrusted-data-containment.js';
import { generateContainmentCases } from './generators.js';

async function fixture(relativePath) {
  return JSON.parse(
    await readFile(new URL(`../../../fixtures/${relativePath}`, import.meta.url), 'utf8'),
  );
}

function expectedTaintedInstructionIds(graph) {
  const tainted = new Set(
    graph.nodes.filter((node) => node.kind === 'untrusted').map((node) => node.id),
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of graph.nodes) {
      if (
        node.kind === 'derived' &&
        node.derivedFrom.some((parent) => tainted.has(parent)) &&
        !tainted.has(node.id)
      ) {
        tainted.add(node.id);
        changed = true;
      }
    }
  }
  return graph.inferCalls
    .flatMap((call) => call.instructionNodeIds)
    .filter((nodeId) => tainted.has(nodeId))
    .sort();
}

test('clean golden flow permits untrusted content only in the data channel', async () => {
  const report = assertUntrustedDataContained(
    await fixture('golden/untrusted-data-flow.json'),
  );
  assert.deepEqual(
    report,
    await fixture('golden/untrusted-data-containment-report.json'),
  );
});

test('derived untrusted content in an INFER instruction channel fails', async () => {
  const graph = await fixture('faults/instruction-leak-flow.json');
  const report = evaluateUntrustedDataContainment(graph);

  assert.equal(report.ok, false);
  assert.deepEqual(report.violations, [
    {
      inferCallId: 'infer-1',
      nodeId: 'extract-1',
      origins: ['source-1'],
    },
  ]);
  assert.throws(
    () => assertUntrustedDataContained(graph),
    (error) =>
      error instanceof UntrustedInstructionFlowError &&
      error.code === 'SCOPA_UNTRUSTED_INSTRUCTION_FLOW' &&
      error.report.violations[0].origins[0] === 'source-1',
  );
});

test('generated provenance DAGs report exactly the tainted instruction nodes', () => {
  const cases = generateContainmentCases({ seed: 0xc01a1, count: 256 });
  for (const { graph } of cases) {
    const expectedViolationIds = expectedTaintedInstructionIds(graph);
    const report = evaluateUntrustedDataContainment(graph);
    assert.deepEqual(
      report.violations.map((violation) => violation.nodeId).sort(),
      expectedViolationIds,
    );
    assert.equal(report.ok, expectedViolationIds.length === 0);
  }
});

test('trusted source nodes cannot launder untrusted provenance', () => {
  assert.throws(
    () =>
      evaluateUntrustedDataContainment({
        nodes: [
          { id: 'source', kind: 'untrusted' },
          {
            id: 'laundered',
            kind: 'trusted',
            derivedFrom: ['source'],
          },
        ],
        inferCalls: [
          {
            id: 'infer',
            instructionNodeIds: ['laundered'],
            dataNodeIds: [],
          },
        ],
      }),
    (error) =>
      error instanceof ContainmentGraphError &&
      /trusted source node cannot declare derivedFrom/.test(error.message),
  );
});

test('unknown provenance and instruction-channel fields fail closed', () => {
  assert.throws(
    () =>
      evaluateUntrustedDataContainment({
        nodes: [
          { id: 'source', kind: 'untrusted' },
          { id: 'laundered', kind: 'trusted', parents: ['source'] },
        ],
        inferCalls: [
          {
            id: 'infer',
            instructionNodeIds: ['laundered'],
            dataNodeIds: [],
          },
        ],
      }),
    (error) =>
      error instanceof ContainmentGraphError &&
      /node contains unknown field: parents/.test(error.message),
  );

  assert.throws(
    () =>
      evaluateUntrustedDataContainment({
        nodes: [{ id: 'source', kind: 'untrusted' }],
        inferCalls: [
          {
            id: 'infer',
            instructionNodeIds: [],
            dataNodeIds: [],
            instructionNodeId: 'source',
          },
        ],
      }),
    (error) =>
      error instanceof ContainmentGraphError &&
      /INFER call contains unknown field: instructionNodeId/.test(error.message),
  );
});

test('duplicate INFER call ids fail closed', () => {
  const inferCall = {
    id: 'infer',
    instructionNodeIds: [],
    dataNodeIds: [],
  };
  assert.throws(
    () =>
      evaluateUntrustedDataContainment({
        nodes: [],
        inferCalls: [inferCall, { ...inferCall }],
      }),
    (error) =>
      error instanceof ContainmentGraphError &&
      /duplicate INFER call id: infer/.test(error.message),
  );
});

test('unknown provenance and provenance cycles fail closed', () => {
  assert.throws(
    () =>
      evaluateUntrustedDataContainment({
        nodes: [{ id: 'derived', kind: 'derived', derivedFrom: ['missing'] }],
        inferCalls: [
          {
            id: 'infer',
            instructionNodeIds: ['derived'],
            dataNodeIds: [],
          },
        ],
      }),
    (error) =>
      error instanceof ContainmentGraphError &&
      error.code === 'SCOPA_CONTAINMENT_GRAPH_INVALID',
  );

  assert.throws(
    () =>
      evaluateUntrustedDataContainment({
        nodes: [
          { id: 'left', kind: 'derived', derivedFrom: ['right'] },
          { id: 'right', kind: 'derived', derivedFrom: ['left'] },
        ],
        inferCalls: [
          {
            id: 'infer',
            instructionNodeIds: ['left'],
            dataNodeIds: [],
          },
        ],
      }),
    /provenance cycle/,
  );
});
