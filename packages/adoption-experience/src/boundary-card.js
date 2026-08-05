import { createHash } from 'node:crypto';
import {
  open,
  realpath,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJsonPretty,
  deepFreeze,
  jsonHash,
  validateChangeObservation,
} from '../../enforcement/src/index.js';
import {
  validateWorkflowBoundaryMap,
} from '../../workflow-boundary-map/src/index.js';

export const BOUNDARY_CARD_SCHEMA = 'scopa.boundary-card.v1';
export const BOUNDARY_VIEW_RESULT_SCHEMA = 'scopa.boundary-view-result.v1';

const CARD_KEYS = new Set([
  'assurance',
  'completion',
  'schema',
  'scope',
  'sourceMapSha256',
  'surfaces',
]);
const CARD_KEYS_WITH_OBSERVED = new Set([...CARD_KEYS, 'observed']);
const ASSURANCE_KEYS = new Set(['basis', 'level']);
const COMPLETION_KEYS = new Set(['canStop', 'gates', 'status']);
const GATES_KEYS = new Set(['failed', 'passed', 'timedOut', 'total']);
const SCOPE_KEYS = new Set(['allowedPathRules', 'nonGoals']);
const SURFACES_KEYS = new Set([
  'authorityRequired',
  'controlled',
  'disabled',
  'total',
  'uncontrolled',
  'unknown',
]);
const OBSERVED_KEYS = new Set([
  'basis',
  'declaredNonGoalContacts',
  'outsideAllowedPaths',
  'versionControlledChanges',
]);

export class BoundaryCardError extends Error {
  constructor(message, {
    code = 'SCOPA_BOUNDARY_CARD_INVALID',
    details = null,
  } = {}) {
    super(message);
    this.name = 'BoundaryCardError';
    this.code = code;
    this.details = details;
  }
}

function exactObject(value, keys, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new BoundaryCardError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value);
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !keys.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new BoundaryCardError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function count(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new BoundaryCardError(`${label} must be a non-negative integer`);
  }
  return value;
}

function expectedAssurance(surfaces) {
  if (surfaces.unknown > 0) {
    return { level: 'unknown', basis: 'incomplete-capability-evidence' };
  }
  if (surfaces.uncontrolled > 0) {
    return { level: 'partial', basis: 'active-uncontrolled-route' };
  }
  return { level: 'full', basis: 'complete-known-surface' };
}

export function validateBoundaryCard(value) {
  exactObject(
    value,
    Object.hasOwn(value ?? {}, 'observed') ? CARD_KEYS_WITH_OBSERVED : CARD_KEYS,
    'boundary card',
  );
  if (value.schema !== BOUNDARY_CARD_SCHEMA) {
    throw new BoundaryCardError('unsupported boundary card schema');
  }
  if (
    typeof value.sourceMapSha256 !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(value.sourceMapSha256)
  ) {
    throw new BoundaryCardError('sourceMapSha256 must be a SHA-256 digest');
  }

  exactObject(value.completion, COMPLETION_KEYS, 'boundary card completion');
  if (!['blocked', 'satisfied'].includes(value.completion.status)) {
    throw new BoundaryCardError('completion status is unsupported');
  }
  if (typeof value.completion.canStop !== 'boolean') {
    throw new BoundaryCardError('completion canStop must be boolean');
  }
  if (value.completion.canStop !== (value.completion.status === 'satisfied')) {
    throw new BoundaryCardError('completion status and canStop disagree');
  }
  exactObject(value.completion.gates, GATES_KEYS, 'boundary card gates');
  for (const key of GATES_KEYS) count(value.completion.gates[key], `gates.${key}`);
  const gateParts = value.completion.gates.passed +
    value.completion.gates.failed + value.completion.gates.timedOut;
  if (gateParts !== value.completion.gates.total || value.completion.gates.total < 1) {
    throw new BoundaryCardError('gate counts are inconsistent');
  }
  if (value.completion.canStop !== (value.completion.gates.passed === value.completion.gates.total)) {
    throw new BoundaryCardError('gate counts and completion disagree');
  }

  exactObject(value.surfaces, SURFACES_KEYS, 'boundary card surfaces');
  for (const key of SURFACES_KEYS) count(value.surfaces[key], `surfaces.${key}`);
  const surfaceParts = value.surfaces.controlled +
    value.surfaces.uncontrolled + value.surfaces.unknown +
    value.surfaces.authorityRequired + value.surfaces.disabled;
  if (surfaceParts !== value.surfaces.total || value.surfaces.total < 1) {
    throw new BoundaryCardError('surface counts are inconsistent');
  }

  exactObject(value.assurance, ASSURANCE_KEYS, 'boundary card assurance');
  const assurance = expectedAssurance(value.surfaces);
  if (
    value.assurance.level !== assurance.level ||
    value.assurance.basis !== assurance.basis
  ) {
    throw new BoundaryCardError('assurance is inconsistent with surface counts');
  }

  exactObject(value.scope, SCOPE_KEYS, 'boundary card scope');
  count(value.scope.allowedPathRules, 'scope.allowedPathRules');
  count(value.scope.nonGoals, 'scope.nonGoals');
  if (value.scope.allowedPathRules < 1) {
    throw new BoundaryCardError('scope must contain an allowed path rule');
  }
  if (Object.hasOwn(value, 'observed')) {
    exactObject(value.observed, OBSERVED_KEYS, 'boundary card observed changes');
    if (
      value.observed.basis !==
      'git-tracked-working-tree-observation-not-enforcement'
    ) throw new BoundaryCardError('observed change basis is unsupported');
    for (const key of [
      'versionControlledChanges',
      'outsideAllowedPaths',
      'declaredNonGoalContacts',
    ]) count(value.observed[key], `observed.${key}`);
    if (
      value.observed.outsideAllowedPaths >
        value.observed.versionControlledChanges ||
      value.observed.declaredNonGoalContacts >
        value.observed.versionControlledChanges
    ) throw new BoundaryCardError('observed change counts are inconsistent');
  }
  return deepFreeze(JSON.parse(canonicalJsonPretty(value)));
}

export function createBoundaryCard(mapValue, { observation = null } = {}) {
  const map = validateWorkflowBoundaryMap(mapValue);
  const gates = {
    total: map.completion.gates.length,
    passed: map.completion.gates.filter((gate) => gate.status === 'passed').length,
    failed: map.completion.gates.filter((gate) => gate.status === 'failed').length,
    timedOut: map.completion.gates.filter((gate) => gate.status === 'timed-out').length,
  };
  const card = {
    schema: BOUNDARY_CARD_SCHEMA,
    sourceMapSha256: jsonHash(map),
    completion: {
      status: map.completion.status,
      canStop: map.completion.canStop,
      gates,
    },
    assurance: { ...map.assurance },
    surfaces: { ...map.summary },
    scope: {
      allowedPathRules: map.scope.allowedPaths.length,
      nonGoals: map.scope.nonGoals.length,
    },
  };
  if (observation !== null) {
    const observed = validateChangeObservation(observation);
    card.observed = {
      basis: observed.basis,
      ...observed.summary,
    };
  }
  return validateBoundaryCard(card);
}

function completionText(card) {
  if (!card.completion.canStop) {
    return 'BLOCKED — at least one declared gate did not pass';
  }
  if (
    card.observed &&
    (card.observed.outsideAllowedPaths > 0 ||
      card.observed.declaredNonGoalContacts > 0)
  ) return 'SATISFIED — WITH UNVERIFIED CHANGES';
  return 'SATISFIED — all declared gates passed';
}

function assuranceText(card) {
  if (card.assurance.level === 'unknown') {
    return 'UNKNOWN — capability evidence is incomplete';
  }
  if (card.assurance.level === 'partial') {
    return 'PARTIAL — an active route can bypass SCOPA';
  }
  return 'FULL FOR THE ENUMERATED SURFACE — not a safety or sandbox claim';
}

export function renderBoundaryCardTerminal(cardValue) {
  const card = validateBoundaryCard(cardValue);
  const lines = [
    'SCOPA BOUNDARY CARD',
    `Completion  ${completionText(card)}`,
    `Gates       ${card.completion.gates.passed} passed / ${card.completion.gates.failed} failed / ${card.completion.gates.timedOut} timed out`,
    `Assurance   ${assuranceText(card)}`,
    '',
    'CONTROL SURFACES',
    `Controlled ${card.surfaces.controlled} | Uncontrolled ${card.surfaces.uncontrolled} | Unknown ${card.surfaces.unknown}`,
    `Authority required ${card.surfaces.authorityRequired} | Disabled ${card.surfaces.disabled} | Total ${card.surfaces.total}`,
    '',
    'SCOPE COUNTS (details withheld)',
    `Allowed path rules ${card.scope.allowedPathRules} | Non-goals ${card.scope.nonGoals}`,
  ];
  if (card.observed) {
    lines.push(
      '',
      'OBSERVED TRACKED CHANGES (reporting only)',
      `Tracked ${card.observed.versionControlledChanges} | Outside allowed paths ${card.observed.outsideAllowedPaths} | Recognized non-goal contacts ${card.observed.declaredNonGoalContacts}`,
      'Observed does not mean prevented, controlled, attributed, or unauthorized.',
    );
  }
  lines.push(
    '',
    `Source map SHA-256 ${card.sourceMapSha256}`,
    'No paths, prompts, gate output, capability evidence, or secret values are included.',
    '',
  );
  return lines.join('\n');
}

function htmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderBoundaryCardHtml(cardValue) {
  const card = validateBoundaryCard(cardValue);
  const completionLabel = completionText(card);
  const assuranceLabel = assuranceText(card);
  const value = (number) => htmlEscape(number);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>SCOPA Boundary Card</title>
<style>
:root { color-scheme: light dark; --bg: #f5f2ea; --panel: #fffdf7; --ink: #18201d; --muted: #52605a; --line: #18201d; --warn: #9b341d; --ok: #1f6b45; }
@media (prefers-color-scheme: dark) { :root { --bg: #111614; --panel: #19201d; --ink: #f4f1e8; --muted: #bac4be; --line: #d8ded9; --warn: #ff9b7d; --ok: #78d8a4; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 ui-sans-serif, system-ui, sans-serif; }
main { width: min(880px, calc(100% - 2rem)); margin: 2rem auto; }
article { background: var(--panel); border: 2px solid var(--line); border-radius: 18px; box-shadow: 8px 8px 0 var(--line); overflow: hidden; }
header, section, footer { padding: 1.25rem 1.5rem; }
header { border-bottom: 2px solid var(--line); }
h1, h2, p { margin-top: 0; }
h1 { margin-bottom: .35rem; font-size: clamp(1.65rem, 5vw, 2.6rem); letter-spacing: -.03em; }
h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: .08em; }
.status { font-size: 1.15rem; font-weight: 750; }
.blocked, .unknown, .partial { color: var(--warn); }
.satisfied, .full { color: var(--ok); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: .75rem; }
dl { margin: 0; padding: .8rem; border: 1px solid var(--line); border-radius: 10px; }
dt { color: var(--muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; }
dd { margin: .2rem 0 0; font-size: 1.4rem; font-weight: 750; }
code { overflow-wrap: anywhere; }
.muted { color: var(--muted); }
@media print { article { box-shadow: none; } }
</style>
</head>
<body>
<main data-source-map-sha256="${htmlEscape(card.sourceMapSha256)}" data-completion="${htmlEscape(card.completion.status)}" data-assurance="${htmlEscape(card.assurance.level)}">
<article aria-labelledby="card-title">
<header>
<p class="muted">Local, privacy-minimized workflow evidence</p>
<h1 id="card-title">SCOPA Boundary Card</h1>
<p class="status ${htmlEscape(card.completion.status)}">Completion: ${htmlEscape(completionLabel)}</p>
<p class="status ${htmlEscape(card.assurance.level)}">Assurance: ${htmlEscape(assuranceLabel)}</p>
</header>
<section aria-labelledby="gate-heading">
<h2 id="gate-heading">Declared gates</h2>
<div class="grid">
<dl><dt>Total</dt><dd>${value(card.completion.gates.total)}</dd></dl>
<dl><dt>Passed</dt><dd>${value(card.completion.gates.passed)}</dd></dl>
<dl><dt>Failed</dt><dd>${value(card.completion.gates.failed)}</dd></dl>
<dl><dt>Timed out</dt><dd>${value(card.completion.gates.timedOut)}</dd></dl>
</div>
</section>
<section aria-labelledby="surface-heading">
<h2 id="surface-heading">Control surfaces</h2>
<div class="grid">
<dl><dt>Total</dt><dd>${value(card.surfaces.total)}</dd></dl>
<dl><dt>Controlled</dt><dd>${value(card.surfaces.controlled)}</dd></dl>
<dl><dt>Uncontrolled</dt><dd>${value(card.surfaces.uncontrolled)}</dd></dl>
<dl><dt>Unknown</dt><dd>${value(card.surfaces.unknown)}</dd></dl>
<dl><dt>Authority required</dt><dd>${value(card.surfaces.authorityRequired)}</dd></dl>
<dl><dt>Disabled</dt><dd>${value(card.surfaces.disabled)}</dd></dl>
</div>
</section>
<section aria-labelledby="scope-heading">
<h2 id="scope-heading">Scope counts — details withheld</h2>
<div class="grid">
<dl><dt>Allowed path rules</dt><dd>${value(card.scope.allowedPathRules)}</dd></dl>
<dl><dt>Non-goals</dt><dd>${value(card.scope.nonGoals)}</dd></dl>
</div>
</section>
${card.observed ? `<section aria-labelledby="observed-heading">
<h2 id="observed-heading">Observed tracked changes — reporting only</h2>
<div class="grid">
<dl><dt>Tracked</dt><dd>${value(card.observed.versionControlledChanges)}</dd></dl>
<dl><dt>Outside allowed paths</dt><dd>${value(card.observed.outsideAllowedPaths)}</dd></dl>
<dl><dt>Recognized non-goal contacts</dt><dd>${value(card.observed.declaredNonGoalContacts)}</dd></dl>
</div>
<p class="muted">Observed does not mean prevented, controlled, attributed, or unauthorized.</p>
</section>` : ''}
<footer>
<p><strong>Source map SHA-256</strong><br><code>${htmlEscape(card.sourceMapSha256)}</code></p>
<p class="muted">No paths, prompts, gate output, capability evidence, or secret values are included. This card is not a safety, security, compliance, readiness, certification, or sandbox claim.</p>
</footer>
</article>
</main>
</body>
</html>
`;
}

function badgeAssurance(card) {
  if (card.assurance.level === 'unknown') {
    return 'UNKNOWN · INCOMPLETE CAPABILITY EVIDENCE';
  }
  if (card.assurance.level === 'partial') {
    return 'PARTIAL · ACTIVE UNCONTROLLED ROUTE';
  }
  return 'FULL · ENUMERATED SURFACE ONLY';
}

function badgeObservation(card) {
  if (!card.observed) return 'TRACKED CHANGE OBSERVATION UNAVAILABLE';
  return `${card.observed.outsideAllowedPaths} OUTSIDE · ${card.observed.declaredNonGoalContacts} NON-GOAL CONTACTS OBSERVED`;
}

export function renderBoundaryBadgeSvg(cardValue) {
  const card = validateBoundaryCard(cardValue);
  const assurance = badgeAssurance(card);
  const observation = badgeObservation(card);
  const title = `SCOPA boundary evidence. ${assurance}. ${observation}.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="scopa-badge-title scopa-badge-description" viewBox="0 0 760 76" width="760" height="76" data-source-map-sha256="${card.sourceMapSha256}">
<title id="scopa-badge-title">${title}</title>
<desc id="scopa-badge-description">Local fact-only projection of a validated SCOPA Boundary Card.</desc>
<metadata>source-map-sha256:${card.sourceMapSha256}</metadata>
<rect width="760" height="76" rx="10" fill="#18201d"/>
<rect x="2" y="2" width="756" height="72" rx="8" fill="#fffdf7" stroke="#18201d" stroke-width="2"/>
<rect x="2" y="2" width="224" height="72" rx="8" fill="#18201d"/>
<text x="18" y="33" fill="#fffdf7" font-family="ui-sans-serif,system-ui,sans-serif" font-size="15" font-weight="700" letter-spacing="1">SCOPA BOUNDARY</text>
<text x="18" y="54" fill="#fffdf7" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13" letter-spacing="1">EVIDENCE</text>
<text x="244" y="31" fill="#18201d" font-family="ui-sans-serif,system-ui,sans-serif" font-size="15" font-weight="700">${assurance}</text>
<text x="244" y="54" fill="#52605a" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13">${observation}</text>
</svg>
`;
}

function exportPath(value) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    path.posix.isAbsolute(value) ||
    value === '..' ||
    value.startsWith('../') ||
    value.includes('/../') ||
    value.includes('\\') ||
    value.includes('*') ||
    path.posix.normalize(value) !== value ||
    value === '.scopa' ||
    value.startsWith('.scopa/')
  ) {
    throw new BoundaryCardError(
      'output must be a normalized repository-relative path outside .scopa',
    );
  }
  return value;
}

export async function writeBoundaryCardExport({ repoRoot, output, content }) {
  if (typeof content !== 'string' || Buffer.byteLength(content) > 1024 * 1024) {
    throw new BoundaryCardError('boundary card export content is invalid');
  }
  const root = await realpath(repoRoot);
  const relative = exportPath(output);
  const target = path.resolve(root, relative);
  const parent = path.dirname(target);
  let resolvedParent;
  try {
    resolvedParent = await realpath(parent);
  } catch {
    throw new BoundaryCardError('boundary card export parent must already exist');
  }
  const parentRelative = path.relative(root, resolvedParent);
  if (
    resolvedParent !== parent ||
    parentRelative === '..' ||
    parentRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(parentRelative)
  ) {
    throw new BoundaryCardError('boundary card export parent escapes or aliases repository');
  }
  let handle;
  let completed = false;
  try {
    handle = await open(target, 'wx', 0o600);
    await handle.writeFile(content, 'utf8');
    await handle.sync();
    completed = true;
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new BoundaryCardError('refusing to overwrite an existing boundary card export', {
        code: 'SCOPA_BOUNDARY_CARD_CONFLICT',
        details: { path: relative },
      });
    }
    throw error;
  } finally {
    await handle?.close().catch(() => {});
    if (handle && !completed) await unlink(target).catch(() => {});
  }
  return deepFreeze({
    path: relative,
    sha256: createHash('sha256').update(content, 'utf8').digest('hex'),
    bytes: Buffer.byteLength(content),
  });
}
