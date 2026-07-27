export class ContainmentGraphError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ContainmentGraphError';
    this.code = 'SCOPA_CONTAINMENT_GRAPH_INVALID';
  }
}

export class UntrustedInstructionFlowError extends Error {
  constructor(report) {
    const first = report.violations[0];
    super(
      first
        ? `untrusted data reached INFER instruction channel at ${first.inferCallId}:${first.nodeId}`
        : 'untrusted data reached an INFER instruction channel',
    );
    this.name = 'UntrustedInstructionFlowError';
    this.code = 'SCOPA_UNTRUSTED_INSTRUCTION_FLOW';
    this.report = report;
  }
}

function stringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new ContainmentGraphError(`${label} must be an array of node ids`);
  }
  return value;
}

function assertClosedRecord(value, allowedKeys, label) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new ContainmentGraphError(`${label} must be a plain object`);
  }
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new ContainmentGraphError(
      `${label} contains unknown field${unknownKeys.length === 1 ? '' : 's'}: ${unknownKeys.sort().join(', ')}`,
    );
  }
}

function indexNodes(nodes) {
  if (!Array.isArray(nodes)) {
    throw new ContainmentGraphError('nodes must be an array');
  }
  const index = new Map();
  for (const node of nodes) {
    assertClosedRecord(node, new Set(['id', 'kind', 'derivedFrom']), 'node');
    if (!node || typeof node.id !== 'string' || node.id.length === 0) {
      throw new ContainmentGraphError('every node must have a non-empty id');
    }
    if (index.has(node.id)) {
      throw new ContainmentGraphError(`duplicate node id: ${node.id}`);
    }
    if (!['trusted', 'untrusted', 'derived'].includes(node.kind)) {
      throw new ContainmentGraphError(`invalid node kind for ${node.id}: ${node.kind}`);
    }
    if (
      (node.kind === 'trusted' || node.kind === 'untrusted') &&
      Object.hasOwn(node, 'derivedFrom')
    ) {
      throw new ContainmentGraphError(
        `${node.kind} source node cannot declare derivedFrom: ${node.id}`,
      );
    }
    index.set(node.id, node);
  }
  return index;
}

function provenanceResolver(index) {
  const memo = new Map();
  const visiting = new Set();

  function resolve(nodeId) {
    if (memo.has(nodeId)) return memo.get(nodeId);
    const node = index.get(nodeId);
    if (!node) {
      throw new ContainmentGraphError(`unknown node id: ${nodeId}`);
    }
    if (visiting.has(nodeId)) {
      throw new ContainmentGraphError(`provenance cycle at node: ${nodeId}`);
    }
    visiting.add(nodeId);

    let origins;
    if (node.kind === 'trusted') {
      origins = [];
    } else if (node.kind === 'untrusted') {
      origins = [node.id];
    } else {
      const parents = stringArray(node.derivedFrom, `${node.id}.derivedFrom`);
      if (parents.length === 0) {
        throw new ContainmentGraphError(`derived node has no provenance: ${node.id}`);
      }
      origins = [...new Set(parents.flatMap(resolve))].sort();
    }

    visiting.delete(nodeId);
    memo.set(nodeId, origins);
    return origins;
  }

  return resolve;
}

export function evaluateUntrustedDataContainment({ nodes, inferCalls }) {
  const index = indexNodes(nodes);
  if (!Array.isArray(inferCalls)) {
    throw new ContainmentGraphError('inferCalls must be an array');
  }
  const resolve = provenanceResolver(index);
  for (const nodeId of index.keys()) {
    resolve(nodeId);
  }
  const violations = [];
  let taintedDataSegments = 0;
  const inferCallIds = new Set();

  for (const call of inferCalls) {
    assertClosedRecord(
      call,
      new Set(['id', 'instructionNodeIds', 'dataNodeIds']),
      'INFER call',
    );
    if (!call || typeof call.id !== 'string' || call.id.length === 0) {
      throw new ContainmentGraphError('every INFER call must have a non-empty id');
    }
    if (inferCallIds.has(call.id)) {
      throw new ContainmentGraphError(`duplicate INFER call id: ${call.id}`);
    }
    inferCallIds.add(call.id);
    const instructionNodeIds = stringArray(
      call.instructionNodeIds,
      `${call.id}.instructionNodeIds`,
    );
    const dataNodeIds = stringArray(call.dataNodeIds, `${call.id}.dataNodeIds`);

    for (const nodeId of instructionNodeIds) {
      const origins = resolve(nodeId);
      if (origins.length > 0) {
        violations.push({ inferCallId: call.id, nodeId, origins });
      }
    }
    for (const nodeId of dataNodeIds) {
      if (resolve(nodeId).length > 0) {
        taintedDataSegments += 1;
      }
    }
  }

  violations.sort((left, right) => {
    const callOrder = left.inferCallId.localeCompare(right.inferCallId);
    return callOrder || left.nodeId.localeCompare(right.nodeId);
  });

  return {
    schema: 'scopa.conformance.untrusted-data-containment.v1',
    ok: violations.length === 0,
    checkedInferCalls: inferCalls.length,
    trackedNodes: index.size,
    taintedDataSegments,
    violations,
  };
}

export function assertUntrustedDataContained(graph) {
  const report = evaluateUntrustedDataContainment(graph);
  if (!report.ok) {
    throw new UntrustedInstructionFlowError(report);
  }
  return report;
}
