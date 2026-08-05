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

export function renderCheckHuman(result, { observation = undefined } = {}) {
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
    lines.push('');
    if (observation === undefined || observation === null) {
      lines.push('Observation  Git working-tree observation unavailable.');
    } else {
      const untracked = Object.hasOwn(observation, 'untrackedChanges')
        ? observation.untrackedChanges
        : 'not assessed';
      lines.push(
        `Observation  ${observation.versionControlledChanges} tracked / ${untracked} untracked / ${observation.outsideAllowedPaths} outside / ${observation.declaredNonGoalContacts} non-goal contacts`,
      );
    }
    if (
      observation &&
      (observation.outsideAllowedPaths > 0 ||
        observation.declaredNonGoalContacts > 0)
    ) {
      lines.push(
        'Warning  SATISFIED — WITH UNVERIFIED CHANGES.',
        'Next  Run scopa view and report the aggregate boundary warning.',
      );
    } else {
      lines.push('Next  Run scopa view for the complete Boundary Card.');
    }
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

function assistantTarget(result) {
  return result.plan?.targets?.[0]?.path ?? null;
}

export function renderAssistantHuman(result) {
  if (result.schema === 'scopa.assistant-detection.v1') {
    const lines = ['SCOPA ASSISTANT DETECTION'];
    if (result.status === 'detected') {
      lines.push(`Detected  ${result.client}`);
    } else if (result.status === 'ambiguous') {
      lines.push(`Detected  ambiguous (${result.candidates.join(', ')})`);
    } else {
      lines.push('Detected  no recognized assistant marker');
    }
    lines.push(
      '',
      result.status === 'ambiguous'
        ? 'Next  Choose scopa assistant install --client generic, claude-code, or codex.'
        : 'Next  Run scopa assistant install --dry-run to preview the project-local setup.',
    );
    return joinLines(lines);
  }

  const target = assistantTarget(result);
  const lines = [
    result.action === 'preview'
      ? 'SCOPA ASSISTANT SETUP PREVIEW'
      : result.action === 'preview-uninstall'
        ? 'SCOPA ASSISTANT REMOVAL PREVIEW'
        : result.action === 'uninstall'
          ? 'SCOPA ASSISTANT SETUP REMOVED'
          : 'SCOPA ASSISTANT SETUP INSTALLED',
    `Client    ${result.plan.client}`,
    `Skill     ${target}`,
    `Receipt   ${result.plan.receiptPath}`,
  ];
  if (result.action === 'preview') {
    lines.push('', 'No files changed.', 'Next  Run scopa assistant install to apply this exact plan.');
  } else if (result.action === 'preview-uninstall') {
    lines.push('', 'No files changed.', 'Next  Run scopa assistant uninstall to remove only receipt-bound files.');
  } else if (result.action === 'uninstall') {
    lines.push('', `Removed   ${result.removed.join(', ')}`, 'Next  No SCOPA assistant files remain from this receipt.');
  } else if (result.created.length === 0) {
    lines.push('', 'No files changed; this exact setup is already installed.', 'Next  Give your coding agent the repository task.');
  } else {
    lines.push('', `Created   ${result.created.join(', ')}`, 'Next  Give your coding agent the repository task.');
  }
  return joinLines(lines);
}

export function renderCliFailureHuman(command, error) {
  const title = command === 'begin'
    ? 'SCOPA COULD NOT BEGIN THIS TASK'
    : command === 'assistant'
      ? 'SCOPA COULD NOT CHANGE ASSISTANT SETUP'
      : 'SCOPA COMMAND COULD NOT RUN';
  const next = command === 'begin'
    ? 'Correct the boundary request and run scopa begin again.'
    : command === 'assistant'
      ? 'Review the reason, then retry with an explicit client or corrected local state.'
      : 'Review the reason and run scopa --help for the supported command shape.';
  return joinLines([
    title,
    `Reason  ${error.message}`,
    '',
    `Next  ${next}`,
    'Use --format json for the canonical structured error.',
  ]);
}
