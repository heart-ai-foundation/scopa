import {
  validateBoundaryDiagnostic,
} from './diagnostic.js';

function displayPaths(indicator) {
  if (indicator.status === 'unknown') {
    return indicator.evidence.replaceAll('-', ' ');
  }
  const paths = indicator.paths.map((item) =>
    item === '.' ? '(repository root)' : item
  );
  const hidden = indicator.count - indicator.paths.length;
  if (hidden > 0) paths.push(`+${hidden} more`);
  return paths.join(', ');
}

function indicatorLine(indicator) {
  const state = indicator.status === 'detected' ? 'DETECTED' : 'UNKNOWN ';
  return `${state}  ${indicator.id} [${indicator.category}] count ${indicator.count} — ${displayPaths(indicator)}`;
}

function candidateLine(diagnostic) {
  if (diagnostic.completionCandidates.length > 0) {
    const commands = diagnostic.completionCandidates
      .map((candidate) => candidate.invocation.join(' '));
    return `CANDIDATES  ${commands.join('; ')}`;
  }
  const indicator = diagnostic.indicators.find((item) =>
    item.id === 'completion.package-script-candidates'
  );
  return indicator?.status === 'unknown'
    ? 'CANDIDATES  Unknown — package completion evidence was not readable.'
    : 'CANDIDATES  None identified by the bounded package-manifest scan.';
}

export function renderBoundaryDoctorLocal(diagnostic) {
  validateBoundaryDiagnostic(diagnostic);
  const visible = diagnostic.indicators.filter((indicator) =>
    indicator.status !== 'not-detected'
  );
  const scan = diagnostic.inventory.truncated
    ? 'scan incomplete; missing markers remain unknown'
    : 'scan complete; not-detected means marker not observed';
  const lines = [
    'SCOPA LOCAL BOUNDARY DIAGNOSTIC',
    `Detected ${diagnostic.summary.detected} | Unknown ${diagnostic.summary.unknown} | Not detected ${diagnostic.summary.notDetected} | ${scan}`,
    ...visible.map(indicatorLine),
    candidateLine(diagnostic),
    diagnostic.subject.scopaInitialized
      ? 'NEXT  Run scopa status to inspect the active task boundary.'
      : 'NEXT  Give SCOPA_AGENT.md and your task to your coding agent.',
  ];
  return `${lines.join('\n')}\n`;
}
