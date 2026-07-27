export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function integer(random, minimum, maximum) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

export function generateReplayCases({ seed, count }) {
  const random = seededRandom(seed);
  return Array.from({ length: count }, (_, caseIndex) => {
    const observationCount = integer(random, 1, 8);
    const observations = {};
    const steps = [];

    for (let index = 0; index < observationCount; index += 1) {
      const key = `case-${caseIndex}-effect-${index}`;
      observations[key] = integer(random, -20, 20);
      steps.push({
        type: 'observe',
        category: ['CLOCK', 'ENTROPY', 'TOOL.QUERY'][integer(random, 0, 2)],
        key,
        operator: random() < 0.5 ? 'add' : 'subtract',
      });
    }
    steps.push({ type: 'emit', label: `case-${caseIndex}` });

    return {
      plan: {
        initial: integer(random, -100, 100),
        steps,
      },
      observations,
    };
  });
}

export function generateContainmentCases({ seed, count }) {
  const random = seededRandom(seed);
  return Array.from({ length: count }, (_, caseIndex) => {
    const nodes = [
      { id: `trusted-${caseIndex}`, kind: 'trusted' },
      { id: `source-${caseIndex}`, kind: 'untrusted' },
    ];
    const derivedCount = integer(random, 1, 8);
    for (let index = 0; index < derivedCount; index += 1) {
      const possibleParents = nodes.slice();
      const parentCount = integer(random, 1, Math.min(3, possibleParents.length));
      const parents = [];
      while (parents.length < parentCount) {
        const candidate =
          possibleParents[integer(random, 0, possibleParents.length - 1)];
        if (!parents.includes(candidate)) parents.push(candidate);
      }
      nodes.push({
        id: `derived-${caseIndex}-${index}`,
        kind: 'derived',
        derivedFrom: parents.map((parent) => parent.id),
      });
    }

    const instructionNodeIds = [];
    const dataNodeIds = [];
    for (const node of nodes) {
      (random() < 0.35 ? instructionNodeIds : dataNodeIds).push(node.id);
    }
    return {
      graph: {
        nodes,
        inferCalls: [
          {
            id: `infer-${caseIndex}`,
            instructionNodeIds,
            dataNodeIds,
          },
        ],
      },
    };
  });
}
