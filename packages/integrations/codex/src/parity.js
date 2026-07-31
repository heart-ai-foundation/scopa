import { createHash } from 'node:crypto';
import { canonicalJson } from '../../../conformance/src/canonical-json.js';

function plainObject(value) {
  return Boolean(
    value &&
    !Array.isArray(value) &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype,
  );
}

function sha256(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function exactKeys(value, keys) {
  return (
    plainObject(value) &&
    Object.keys(value).sort().join('\0') === [...keys].sort().join('\0')
  );
}

function digestValue(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}

function stringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function validAssuranceBinding(value) {
  return (
    exactKeys(value, new Set([
      'assurance', 'matrixSha256', 'subject', 'subjectMatchesClient',
    ])) &&
    ['none', 'partial', 'full'].includes(value.assurance) &&
    digestValue(value.matrixSha256) &&
    exactKeys(value.subject, new Set(['adapter', 'client', 'transport'])) &&
    Object.values(value.subject).every((item) =>
      typeof item === 'string' && item.length > 0) &&
    value.subjectMatchesClient === true
  );
}

function requireProof(value, schema, label) {
  if (!plainObject(value) || value.schema !== schema) {
    throw new Error(`${label} is not ${schema}`);
  }
  for (const scenario of [
    'clean',
    'denied',
    'falseGreen',
    'coldRestart',
  ]) {
    if (!plainObject(value.scenarios?.[scenario]?.normalized)) {
      throw new Error(`${label} omits normalized ${scenario} evidence`);
    }
  }
  return value;
}

function findCall(proof, scenario, tool, occurrence = 0) {
  return proof.scenarios[scenario].normalized.toolCalls.filter(
    (call) =>
      call.tool === tool ||
      call.name === `mcp__scopa__${tool}`,
  )[occurrence];
}

function behavior(proof) {
  const denied = findCall(proof, 'denied', 'scopa_write_file', 0);
  const allowed = findCall(proof, 'clean', 'scopa_write_file', 0);
  const blockedCheck = findCall(proof, 'falseGreen', 'scopa_check', 0);
  return {
    allowedWork:
      allowed?.isError === false &&
      proof.scenarios.clean.normalized.final.canStop === true,
    blockedScope:
      denied?.isError === true &&
      denied?.result?.code === 'SCOPA_SCOPE_DENIED',
    falseGreenRefused:
      blockedCheck?.result?.state?.canStop === false &&
      proof.scenarios.falseGreen.normalized.final.canStop === false,
    coldRestartRecovered:
      proof.scenarios.coldRestart.normalized.final.canStop === true &&
      findCall(proof, 'coldRestart', 'scopa_read_file', 0)?.isError === false,
  };
}

function uncontrolledIds(matrix) {
  return matrix.capabilities
    .filter(
      (capability) =>
        capability.exposure !== 'disabled' &&
        capability.mediation === 'uncontrolled',
    )
    .map((capability) => capability.id)
    .sort();
}

function toolNames(proof, provider) {
  if (provider === 'claude') {
    return proof.scenarios.clean.normalized.initialization.tools
      .map((tool) => tool.replace(/^mcp__scopa__/, ''))
      .sort();
  }
  return [
    ...proof.scenarios.clean.normalized.initialization.enabledTools,
  ].sort();
}

export function compareAgentProofs({
  claudeProof,
  codexProof,
  sources = {},
  format = 'legacy-v1',
}) {
  const claude = requireProof(
    claudeProof,
    'scopa.claude-live-proof.v1',
    'Claude proof',
  );
  const codex = requireProof(
    codexProof,
    'scopa.codex-live-proof.v1',
    'Codex proof',
  );
  const outcomes = {
    claude: behavior(claude),
    codex: behavior(codex),
  };
  const behaviors = Object.keys(outcomes.claude);
  const comparisons = Object.fromEntries(
    behaviors.map((name) => {
      const claudeValue = outcomes.claude[name];
      const codexValue = outcomes.codex[name];
      return [
        name,
        {
          claude: claudeValue,
          codex: codexValue,
          expected: true,
          parity:
            claudeValue === codexValue &&
            claudeValue === true,
        },
      ];
    }),
  );
  const gaps = Object.entries(comparisons)
    .filter(([, result]) => !result.parity)
    .map(([name, result]) => ({
      behavior: name,
      claude: result.claude,
      codex: result.codex,
      expected: true,
    }));
  const claudeTools = toolNames(claude, 'claude');
  const codexTools = toolNames(codex, 'codex');
  const sameScopaTools =
    claudeTools.join('\0') === codexTools.join('\0');
  if (!sameScopaTools) {
    gaps.push({
      behavior: 'scopaToolSurface',
      claude: claudeTools,
      codex: codexTools,
      expected: claudeTools,
    });
  }
  const legacy = {
    schema: 'scopa.agent-parity-report.v1',
    sources: {
      claude: sources.claude ?? null,
      codex: sources.codex ?? null,
    },
    outcomes,
    comparisons,
    providerDifferences: {
      models: {
        claude:
          claude.summary.observedModel ??
          claude.summary.requestedModel,
        codex: codex.summary.requestedModel,
      },
      mcpClients: {
        claude: 'claude-code',
        codex:
          codex.scenarios.clean.normalized.initialization.mcpClient.name,
      },
      assurance: {
        claude: claude.capabilityMatrix.assurance,
        codex: codex.capabilityMatrix.assurance,
      },
      uncontrolledCapabilityIds: {
        claude: uncontrolledIds(claude.capabilityMatrix),
        codex: uncontrolledIds(codex.capabilityMatrix),
      },
      toolNames: {
        claude: claudeTools,
        codex: codexTools,
        sameScopaTools,
      },
    },
    gaps,
    parity: gaps.length === 0 ? 'pass' : 'gap',
    claim:
      gaps.length === 0
        ? 'behavior-parity-with-provider-specific-partial-assurance'
        : 'explicit-behavior-parity-gap',
  };
  if (format === 'legacy-v1') return legacy;
  if (format !== 'operational-v2') {
    throw new TypeError(`unsupported agent parity format: ${format}`);
  }

  const assuranceBindings = {
    claude: {
      assurance: claude.capabilityMatrix.assurance,
      matrixSha256: sha256(claude.capabilityMatrix),
      subject: structuredClone(claude.capabilityMatrix.subject),
      subjectMatchesClient:
        claude.capabilityMatrix.subject?.client?.startsWith('claude-code@') ===
        true,
    },
    codex: {
      assurance: codex.capabilityMatrix.assurance,
      matrixSha256: sha256(codex.capabilityMatrix),
      subject: structuredClone(codex.capabilityMatrix.subject),
      subjectMatchesClient:
        codex.capabilityMatrix.subject?.client?.startsWith(
          'codex-mcp-client@',
        ) === true,
    },
  };
  const operationalGaps = structuredClone(gaps);
  for (const provider of ['claude', 'codex']) {
    if (!assuranceBindings[provider].subjectMatchesClient) {
      operationalGaps.push({
        behavior: 'assuranceBinding',
        provider,
        expectedClientPrefix:
          provider === 'claude' ? 'claude-code@' : 'codex-mcp-client@',
        observedClient: assuranceBindings[provider].subject?.client ?? null,
      });
    }
  }
  const sharedOutcomes = Object.entries(comparisons).map(([id, comparison]) => ({
    id,
    expected: comparison.expected,
    claude: comparison.claude,
    codex: comparison.codex,
    parity: comparison.parity,
  }));
  const body = {
    schema: 'scopa.agent-operational-parity-report.v2',
    sources: {
      claude: sources.claude ?? null,
      codex: sources.codex ?? null,
    },
    sourceProofSha256: {
      claude: sha256(claude),
      codex: sha256(codex),
    },
    sharedOutcomes,
    sharedToolSurface: {
      claude: claudeTools,
      codex: codexTools,
      parity: sameScopaTools,
    },
    providerDifferences: [
      {
        id: 'model',
        classification: 'provider-specific',
        claude: legacy.providerDifferences.models.claude,
        codex: legacy.providerDifferences.models.codex,
      },
      {
        id: 'mcpClient',
        classification: 'provider-specific',
        claude: legacy.providerDifferences.mcpClients.claude,
        codex: legacy.providerDifferences.mcpClients.codex,
      },
      {
        id: 'assurance',
        classification: 'client-bound-nontransferable',
        claude: legacy.providerDifferences.assurance.claude,
        codex: legacy.providerDifferences.assurance.codex,
      },
      {
        id: 'uncontrolledCapabilityIds',
        classification: 'client-bound-nontransferable',
        claude: legacy.providerDifferences.uncontrolledCapabilityIds.claude,
        codex: legacy.providerDifferences.uncontrolledCapabilityIds.codex,
      },
    ],
    assuranceIsolation: {
      transferable: false,
      basis: 'client-specific-capability-matrix',
      subjectsDistinct:
        assuranceBindings.claude.subject.client !==
        assuranceBindings.codex.subject.client,
      bindings: assuranceBindings,
    },
    gaps: operationalGaps,
    parity: operationalGaps.length === 0 ? 'pass' : 'gap',
    claim:
      operationalGaps.length === 0
        ? 'shared-behavior-parity-with-client-bound-assurance'
        : 'explicit-operational-parity-gap',
  };
  return {
    ...body,
    reportSha256: sha256(body),
  };
}

export function assertAgentParity(report, proofs = null) {
  if (report?.schema === 'scopa.agent-operational-parity-report.v2') {
    const reportKeys = new Set([
      'assuranceIsolation',
      'claim',
      'gaps',
      'parity',
      'providerDifferences',
      'reportSha256',
      'schema',
      'sharedOutcomes',
      'sharedToolSurface',
      'sourceProofSha256',
      'sources',
    ]);
    const digest = report.reportSha256;
    const body = structuredClone(report);
    delete body.reportSha256;
    const bindings = report.assuranceIsolation?.bindings;
    const expectedOutcomeIds = [
      'allowedWork',
      'blockedScope',
      'falseGreenRefused',
      'coldRestartRecovered',
    ];
    const expectedDifferenceIds = [
      'model',
      'mcpClient',
      'assurance',
      'uncontrolledCapabilityIds',
    ];
    const differenceClassifications = [
      'provider-specific',
      'provider-specific',
      'client-bound-nontransferable',
      'client-bound-nontransferable',
    ];
    if (
      !exactKeys(report, reportKeys) ||
      typeof digest !== 'string' ||
      digest !== sha256(body) ||
      !exactKeys(report.sources, new Set(['claude', 'codex'])) ||
      Object.values(report.sources).some((source) =>
        source !== null && typeof source !== 'string') ||
      !exactKeys(report.sourceProofSha256, new Set(['claude', 'codex'])) ||
      !digestValue(report.sourceProofSha256.claude) ||
      !digestValue(report.sourceProofSha256.codex) ||
      report.parity !== 'pass' ||
      report.claim !== 'shared-behavior-parity-with-client-bound-assurance' ||
      !Array.isArray(report.gaps) ||
      report.gaps.length !== 0 ||
      !Array.isArray(report.sharedOutcomes) ||
      report.sharedOutcomes.length !== 4 ||
      report.sharedOutcomes.map(({ id }) => id).join('\0') !==
        expectedOutcomeIds.join('\0') ||
      report.sharedOutcomes.some((outcome) =>
        !exactKeys(outcome, new Set([
          'claude', 'codex', 'expected', 'id', 'parity',
        ])) ||
        outcome.parity !== true ||
        outcome.expected !== true ||
        outcome.claude !== true ||
        outcome.codex !== true) ||
      !exactKeys(report.sharedToolSurface, new Set([
        'claude', 'codex', 'parity',
      ])) ||
      report.sharedToolSurface.parity !== true ||
      !stringArray(report.sharedToolSurface.claude) ||
      !stringArray(report.sharedToolSurface.codex) ||
      report.sharedToolSurface.claude.join('\0') !==
        report.sharedToolSurface.codex.join('\0') ||
      report.assuranceIsolation?.transferable !== false ||
      !exactKeys(report.assuranceIsolation, new Set([
        'basis', 'bindings', 'subjectsDistinct', 'transferable',
      ])) ||
      report.assuranceIsolation?.basis !==
        'client-specific-capability-matrix' ||
      report.assuranceIsolation?.subjectsDistinct !== true ||
      !exactKeys(bindings, new Set(['claude', 'codex'])) ||
      !validAssuranceBinding(bindings.claude) ||
      !validAssuranceBinding(bindings.codex) ||
      !Array.isArray(report.providerDifferences) ||
      report.providerDifferences.map(({ id }) => id).join('\0') !==
        expectedDifferenceIds.join('\0') ||
      report.providerDifferences.some((difference, index) =>
        !exactKeys(difference, new Set([
          'claude', 'classification', 'codex', 'id',
        ])) ||
        difference.classification !== differenceClassifications[index])
    ) {
      throw new Error('Claude/Codex operational parity report is invalid');
    }
    if (proofs !== null) {
      const expected = compareAgentProofs({
        claudeProof: proofs.claudeProof,
        codexProof: proofs.codexProof,
        sources: report.sources,
        format: 'operational-v2',
      });
      if (canonicalJson(expected) !== canonicalJson(report)) {
        throw new Error('Claude/Codex operational parity source binding failed');
      }
    }
    return report;
  }
  if (
    !plainObject(report) ||
    report.schema !== 'scopa.agent-parity-report.v1' ||
    report.parity !== 'pass' ||
    !Array.isArray(report.gaps) ||
    report.gaps.length !== 0
  ) {
    throw new Error('Claude/Codex behavior parity has an explicit gap');
  }
  return report;
}
