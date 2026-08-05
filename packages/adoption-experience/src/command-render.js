const ASSURANCE_TEXT = Object.freeze({
  unknown: 'UNKNOWN — capability evidence is incomplete',
  partial: 'PARTIAL — an active route can bypass SCOPA',
  full: 'FULL FOR THE ENUMERATED SURFACE — not a safety or sandbox claim',
});

function assuranceText(assurance) {
  return ASSURANCE_TEXT[assurance?.level] ?? ASSURANCE_TEXT.unknown;
}

function completionText(canStop) {
  return canStop
    ? 'SATISFIED — all declared gates passed'
    : 'BLOCKED — at least one declared gate did not pass';
}

// Boundary-map gates carry a status string; canonical gate results carry
// passed/timedOut booleans. Both shapes reach these renderers.
function gateOutcome(gate) {
  if (gate.status !== undefined) return gate.status;
  if (gate.timedOut === true) return 'timed-out';
  return gate.passed === true ? 'passed' : 'failed';
}

function gateCounts(gates) {
  const outcomes = gates.map(gateOutcome);
  return {
    passed: outcomes.filter((outcome) => outcome === 'passed').length,
    failed: outcomes.filter((outcome) => outcome === 'failed').length,
    timedOut: outcomes.filter((outcome) => outcome === 'timed-out').length,
  };
}

function joinLines(lines) {
  return `${lines.join('\n')}\n`;
}

export function renderBeginHuman(result) {
  const map = result.boundaryMap;
  const counts = gateCounts(map.completion.gates);
  const lines = [
    'SCOPA TASK BOUNDARY ESTABLISHED',
    `Slice       ${map.scope.sliceId}`,
    `Outcome     ${result.outcome}`,
    `Completion  ${completionText(map.completion.canStop)}`,
    `Gates       ${counts.passed} passed / ${counts.failed} failed / ${counts.timedOut} timed out`,
    `Assurance   ${assuranceText(map.assurance)}`,
    '',
    'SCOPE',
    `Allowed paths  ${map.scope.allowedPaths.join(', ')}`,
    `Non-goals      ${map.scope.nonGoals.join(', ')}`,
    '',
    'CONTROL SURFACES',
    `Controlled ${map.summary.controlled} | Uncontrolled ${map.summary.uncontrolled} | Unknown ${map.summary.unknown}`,
    `Authority required ${map.summary.authorityRequired} | Disabled ${map.summary.disabled} | Total ${map.summary.total}`,
  ];
  if (!map.completion.canStop) {
    lines.push(
      '',
      `A failing gate here is a truthful baseline for work not yet done: ${map.completion.failedGates.join(', ')}.`,
    );
  }
  lines.push('', 'Next  Work inside the allowed paths, then run scopa check.');
  return joinLines(lines);
}

export function renderCheckHuman(result) {
  const counts = gateCounts(result.gates);
  const lines = [
    'SCOPA COMPLETION CHECK',
    `Slice       ${result.sliceId}`,
    `Completion  ${completionText(result.canStop)}`,
    `Gates       ${counts.passed} passed / ${counts.failed} failed / ${counts.timedOut} timed out`,
    '',
    'DECLARED GATES',
  ];
  for (const gate of result.gates) {
    const outcome = gateOutcome(gate);
    const detail = outcome === 'passed'
      ? 'pass'
      : outcome === 'timed-out'
        ? 'timed out'
        : `fail (exit ${gate.exitCode})`;
    const label = outcome === 'passed' ? 'PASS' : 'FAIL';
    lines.push(`${label}  ${gate.id} — ${detail}, ${gate.durationMs}ms`);
  }
  if (result.canStop) {
    lines.push('', 'Next  Completion is satisfied. Run scopa view for a shareable Boundary Card.');
  } else {
    lines.push(
      '',
      `Next  Fix the failing gate, then run scopa check again: ${result.failedGates.join(', ')}.`,
      'Model prose cannot override a blocked gate.',
    );
  }
  return joinLines(lines);
}

export function renderStatusHuman(result) {
  const lines = [
    'SCOPA TASK STATUS',
    `Slice       ${result.slice}`,
    `Completion  ${completionText(result.canStop)}`,
    `Condition   ${result.stopCondition}`,
    '',
    'SCOPE',
    `Allowed paths  ${result.allowedPaths.join(', ')}`,
    `Non-goals      ${result.nonGoals.join(', ')}`,
  ];
  if (result.failedGates.length > 0) {
    lines.push('', `Failing gates  ${result.failedGates.join(', ')}`);
  }
  lines.push(
    '',
    result.canStop
      ? 'Next  Completion is satisfied. Run scopa view for a shareable Boundary Card.'
      : 'Next  Run scopa check to execute the declared gates.',
  );
  lines.push('This is an observation of recorded state; it does not run the gates.');
  return joinLines(lines);
}
