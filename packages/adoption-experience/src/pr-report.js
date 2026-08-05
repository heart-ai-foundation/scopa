import { constants as fsConstants } from 'node:fs';
import {
  lstat,
  open,
  realpath,
} from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJsonPretty,
  deepFreeze,
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  validateBoundaryCard,
} from './boundary-card.js';

export const PR_REPORT_SCHEMA = 'scopa.pr-report.v1';
export const PR_CARD_MAX_BYTES = 256 * 1024;

export class PullRequestReportError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'PullRequestReportError';
    this.code = 'SCOPA_PR_REPORT_INVALID';
    this.details = details;
  }
}

function requestPath(value) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    path.posix.isAbsolute(value) ||
    value === '..' ||
    value.startsWith('../') ||
    value.includes('/../') ||
    value.includes('\\') ||
    value.includes('*') ||
    path.posix.normalize(value) !== value
  ) {
    throw new PullRequestReportError(
      'card path must be a normalized workspace-relative path',
    );
  }
  return value;
}

async function readBoundedRegular(target, label, {
  optional = false,
  maximum = PR_CARD_MAX_BYTES,
} = {}) {
  let metadata;
  try {
    metadata = await lstat(target);
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    throw new PullRequestReportError(`${label} is unavailable`);
  }
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1 ||
    metadata.size > maximum
  ) {
    throw new PullRequestReportError(`${label} must be an unaliased bounded regular file`);
  }
  let handle;
  try {
    handle = await open(target, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (
      !opened.isFile() ||
      opened.nlink !== 1 ||
      opened.dev !== metadata.dev ||
      opened.ino !== metadata.ino ||
      opened.size > maximum
    ) {
      throw new PullRequestReportError(`${label} changed while opening`);
    }
    return await handle.readFile({ encoding: 'utf8' });
  } catch (error) {
    if (error instanceof PullRequestReportError) throw error;
    throw new PullRequestReportError(`${label} changed while opening`);
  } finally {
    await handle?.close().catch(() => {});
  }
}

export async function loadPullRequestBoundaryCard({ workspace, cardPath }) {
  const root = await realpath(workspace);
  const relative = requestPath(cardPath);
  const candidate = path.resolve(root, relative);
  const lexical = path.relative(root, candidate);
  if (
    lexical === '..' ||
    lexical.startsWith(`..${path.sep}`) ||
    path.isAbsolute(lexical)
  ) {
    throw new PullRequestReportError('card path escapes workspace');
  }
  const text = await readBoundedRegular(candidate, 'Boundary Card', {
    optional: true,
  });
  if (text === null) return null;
  try {
    return validateBoundaryCard(JSON.parse(text));
  } catch (error) {
    throw new PullRequestReportError(`Boundary Card is invalid: ${error.message}`);
  }
}

function availableSummary(card) {
  const hasUnverifiedChanges = card.completion.canStop && card.observed && (
    card.observed.outsideAllowedPaths > 0 ||
    card.observed.declaredNonGoalContacts > 0
  );
  const status = card.completion.canStop
    ? hasUnverifiedChanges
      ? 'SATISFIED — WITH UNVERIFIED CHANGES'
      : 'SATISFIED'
    : 'BLOCKED';
  const assurance = card.assurance.level.toUpperCase();
  const lines = [
    '## SCOPA Boundary Check',
    '',
    '> Caller-supplied validated Boundary Card; this is not independent attestation.',
    '',
    `- Completion: **${status}**`,
    `- Gates: ${card.completion.gates.passed} passed, ${card.completion.gates.failed} failed, ${card.completion.gates.timedOut} timed out`,
    `- Assurance: **${assurance}** — ${card.assurance.basis}`,
    `- Surfaces: ${card.surfaces.controlled} controlled, ${card.surfaces.uncontrolled} uncontrolled, ${card.surfaces.unknown} unknown, ${card.surfaces.authorityRequired} authority-required, ${card.surfaces.disabled} disabled`,
    `- Scope counts: ${card.scope.allowedPathRules} allowed-path rules, ${card.scope.nonGoals} non-goals`,
    `- Source map SHA-256: \`${card.sourceMapSha256}\``,
  ];
  if (card.observed) {
    const untracked = Object.hasOwn(card.observed, 'untrackedChanges')
      ? `${card.observed.untrackedChanges} untracked`
      : 'untracked files not assessed';
    lines.push(
      `- Observed Git working-tree changes: ${card.observed.versionControlledChanges} tracked, ${untracked}, ${card.observed.outsideAllowedPaths} outside allowed paths, ${card.observed.declaredNonGoalContacts} recognized non-goal contacts`,
      '',
      'Observation is reporting only. It does not mean a change was prevented, controlled, attributed, or unauthorized.',
    );
  }
  lines.push(
    '',
    'No paths, prompts, gate output, capability evidence, or secret values are included. This report is not approval, certification, or a safe-to-merge claim.',
    '',
  );
  return lines.join('\n');
}

function missingSummary() {
  return [
    '## SCOPA Boundary Check',
    '',
    '> No validated Boundary Card was supplied. The action observed only that the configured card file is absent.',
    '',
    '- Completion: **UNKNOWN — no Boundary Card supplied**',
    '- Assurance: **UNKNOWN — no capability evidence supplied**',
    '- Scope: **UNKNOWN — no validated scope counts supplied**',
    '',
    '### Add reviewable evidence',
    '',
    'After establishing a SCOPA task boundary, create the privacy-minimized artifact:',
    '',
    '```sh',
    'scopa view --format json --output scopa-boundary.json',
    '```',
    '',
    'Add `scopa-boundary.json` to the pull request. This action can then validate and report declared-gate completion, assurance basis, control and scope counts, source-map identity, and aggregate observed Git working-tree counts when present.',
    '',
    'No gate or project command was executed by this check. No pull-request text or card-supplied command was executed. Missing evidence is not a pass, approval, certification, or safe-to-merge result.',
    '',
  ].join('\n');
}

export function createPullRequestReport(cardValue) {
  const card = cardValue === null ? null : validateBoundaryCard(cardValue);
  const summary = card === null ? missingSummary() : availableSummary(card);
  return deepFreeze({
    schema: PR_REPORT_SCHEMA,
    evidence: card === null ? 'unavailable' : 'validated-card',
    cardSha256: card === null ? null : jsonHash(card),
    summary,
    comment: summary,
  });
}

async function appendTrustedFile(file, content, label) {
  if (
    typeof file !== 'string' ||
    file.length === 0 ||
    /[\0\r\n]/u.test(file)
  ) {
    throw new PullRequestReportError(`${label} path is invalid`);
  }
  let handle;
  try {
    handle = await open(
      path.resolve(file),
      fsConstants.O_APPEND | fsConstants.O_CREAT | fsConstants.O_WRONLY |
        fsConstants.O_NOFOLLOW,
      0o600,
    );
    const metadata = await handle.stat();
    if (!metadata.isFile() || metadata.nlink !== 1) {
      throw new PullRequestReportError(`${label} is not a regular single-link file`);
    }
    await handle.writeFile(content, 'utf8');
  } catch (error) {
    if (error instanceof PullRequestReportError) throw error;
    throw new PullRequestReportError(`${label} is unavailable`);
  } finally {
    await handle?.close().catch(() => {});
  }
}

function booleanInput(value, label) {
  if (!['false', 'true'].includes(value)) {
    throw new PullRequestReportError(`${label} must be true or false`);
  }
  return value === 'true';
}

async function validateCommentContext(environment) {
  if (environment.GITHUB_EVENT_NAME !== 'pull_request') {
    throw new PullRequestReportError(
      'comment opt-in is available only for a pull_request event',
    );
  }
  if (
    typeof environment.INPUT_GITHUB_TOKEN !== 'string' ||
    environment.INPUT_GITHUB_TOKEN.length === 0
  ) {
    throw new PullRequestReportError(
      'comment opt-in requires an explicit github-token input',
    );
  }
  const eventText = await readBoundedRegular(
    path.resolve(environment.GITHUB_EVENT_PATH ?? ''),
    'GitHub event',
    { maximum: PR_CARD_MAX_BYTES },
  );
  let event;
  try {
    event = JSON.parse(eventText);
  } catch {
    throw new PullRequestReportError('GitHub event is invalid JSON');
  }
  if (
    !event ||
    typeof event !== 'object' ||
    !event.pull_request ||
    !Number.isSafeInteger(event.pull_request.number) ||
    event.pull_request.number < 1
  ) {
    throw new PullRequestReportError('GitHub event has no valid pull request');
  }
  const fullName = event.repository?.full_name;
  if (
    typeof fullName !== 'string' ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(fullName)
  ) {
    throw new PullRequestReportError('GitHub event has no valid repository identity');
  }
  return {
    repository: fullName,
    pullRequestNumber: event.pull_request.number,
  };
}

export async function runPullRequestReport(
  environment = process.env,
  { fetchImpl = globalThis.fetch } = {},
) {
  const commentEnabled = booleanInput(
    environment.INPUT_COMMENT ?? 'false',
    'comment input',
  );
  const commentContext = commentEnabled
    ? await validateCommentContext(environment)
    : null;
  const card = await loadPullRequestBoundaryCard({
    workspace: environment.GITHUB_WORKSPACE,
    cardPath: environment.INPUT_CARD_PATH ?? 'scopa-boundary.json',
  });
  const report = createPullRequestReport(card);
  await appendTrustedFile(
    environment.GITHUB_STEP_SUMMARY,
    report.summary,
    'GitHub step summary',
  );
  if (commentEnabled) {
    if (typeof fetchImpl !== 'function') {
      throw new PullRequestReportError('comment transport is unavailable');
    }
    const [owner, repository] = commentContext.repository.split('/');
    const response = await fetchImpl(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${commentContext.pullRequestNumber}/comments`,
      {
        method: 'POST',
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${environment.INPUT_GITHUB_TOKEN}`,
          'content-type': 'application/json',
          'user-agent': 'scopa-boundary-check',
          'x-github-api-version': '2022-11-28',
        },
        body: JSON.stringify({ body: report.comment }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response?.ok) {
      throw new PullRequestReportError(
        `GitHub comment request failed with status ${response?.status ?? 'unknown'}`,
      );
    }
  }
  return report;
}
