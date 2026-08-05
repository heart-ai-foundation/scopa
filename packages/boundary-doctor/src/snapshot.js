import {
  validateBoundaryDiagnostic,
} from './diagnostic.js';

const AUTHORITY_INDICATORS = Object.freeze([
  ['authority.credential-markers', 'credential-related'],
  ['authority.deployment-markers', 'deployment-related'],
  ['authority.publication-markers', 'publication-related'],
]);

function byId(diagnostic, id) {
  return diagnostic.indicators.find((item) => item.id === id);
}

function detectedAuthorityLabels(diagnostic) {
  return AUTHORITY_INDICATORS
    .filter(([id]) => byId(diagnostic, id)?.status === 'detected')
    .map(([, label]) => label);
}

function boundaryFinding(diagnostic) {
  if (diagnostic.inventory.truncated) {
    return 'The repository scan reached its limit, so some absences remain unknown.';
  }
  if (diagnostic.subject.scopaInitialized) {
    return 'SCOPA control state is present in this repository.';
  }
  return 'No SCOPA task boundary is locked in this repository yet.';
}

function repositoryFinding(diagnostic) {
  const authorityLabels = detectedAuthorityLabels(diagnostic);
  if (authorityLabels.length > 0) {
    return `The repository contains ${authorityLabels.join(', ')} workflow files.`;
  }
  const candidate = diagnostic.completionCandidates[0];
  if (candidate) {
    return `A possible completion check is available: ${candidate.invocation.join(' ')}.`;
  }
  const configuration = byId(diagnostic, 'agent.configuration-markers');
  if (configuration?.status === 'detected') {
    return 'Coding-agent configuration is present in this repository.';
  }
  return 'No completion command was identified from the bounded manifest scan.';
}

function authorityFinding(diagnostic) {
  const unknown = diagnostic.indicators.filter((item) =>
    item.status === 'unknown'
  ).length;
  if (unknown === 0) {
    return 'This repository scan does not establish the tools or permissions available to an agent.';
  }
  return `Agent tools and permissions were not measured; ${unknown} workflow signals remain unknown.`;
}

export function createBoundarySnapshot(diagnostic) {
  validateBoundaryDiagnostic(diagnostic);
  return Object.freeze({
    observed: Object.freeze([
      boundaryFinding(diagnostic),
      repositoryFinding(diagnostic),
    ]),
    unknown: authorityFinding(diagnostic),
    next: diagnostic.subject.scopaInitialized
      ? 'Run scopa status to inspect the active task boundary.'
      : 'Run scopa assistant install --dry-run to preview the reversible project-local agent setup.',
  });
}

export function renderBoundarySnapshot(diagnostic) {
  const snapshot = createBoundarySnapshot(diagnostic);
  return [
    'SCOPA boundary snapshot',
    '',
    'Observed',
    ...snapshot.observed.map((finding) => `- ${finding}`),
    '',
    'Unknown',
    `- ${snapshot.unknown}`,
    '',
    'Next',
    snapshot.next,
    '',
  ].join('\n');
}
