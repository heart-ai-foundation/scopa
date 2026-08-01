#!/usr/bin/env node

import { readFile, writeFile, access, rename, readdir, copyFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const README_PATH = path.join(ROOT, 'README.md');
const LOCK_PATH = path.join(ROOT, '.slice-lock.json');
const ROLE_CONTEXT_PATH = path.join(ROOT, 'role-context.md');
const ROLE_CONTEXT_TEMPLATE_PATH = path.join(ROOT, 'role-context.template.md');
const DEFAULT_MACRO_DELTA_REL = 'macro-deltas/template.md';
const PHASES_README_PATH = path.join(ROOT, 'phases', 'README.md');

function phaseTitleFromId(phaseId) {
  return phaseId
    .split('-')
    .map((part) => (Number.isFinite(Number(part)) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

function phaseDirFromId(phaseId) {
  const parts = phaseId.split('-');
  return parts.length >= 2 ? parts.slice(0, 2).join('-') : phaseId;
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function extractSection(markdown, sectionTitles) {
  const lines = markdown.split(/\r?\n/);
  let capture = false;
  const collected = [];
  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      if (capture) {
        break;
      }
      if (sectionTitles.includes(heading)) {
        capture = true;
        continue;
      }
    }
    if (capture) {
      collected.push(line);
    }
  }
  return collected.join('\n').trim();
}

function listBlock(items) {
  return items.map((item) => `- \`${item}\``).join('\n');
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function macroDeltaRel(manifest) {
  return manifest.macro_delta || DEFAULT_MACRO_DELTA_REL;
}

function macroDeltaPath(manifest) {
  const rel = macroDeltaRel(manifest);
  return path.isAbsolute(rel) ? rel : path.resolve(ROOT, rel);
}

async function roleContextPath() {
  return (await fileExists(ROLE_CONTEXT_PATH)) ? ROLE_CONTEXT_PATH : ROLE_CONTEXT_TEMPLATE_PATH;
}

const VALID_CLASSES = new Set(['arc', 'spike', 'hotfix']);
const COMPOUND_PATTERNS = new Set(['paired-diff', 'shared-gate', 'refactor-then-use']);
const CONTRACT_STATUSES = new Set(['open', 'advanced', 'satisfied', 'blocked', 'discovered']);
const OBJECTIVE_HEADINGS = ['Next objective', 'Active objective', 'Objective'];
const ACCEPTANCE_HEADINGS = ['Acceptance', 'Verification'];
const SECTION_REQUIREMENTS = {
  arc: ['Descriptor rung check', 'Anti-ceremony gate', 'Productivity mix', 'Evidence', 'Non-goals', 'Acceptance'],
  spike: ['Descriptor rung check', 'Anti-ceremony gate', 'Evidence', 'Non-goals', 'Acceptance'],
  hotfix: ['Evidence', 'Acceptance'],
};

function protocolClassFromText(markdown) {
  const match = markdown.match(/^\*\*Class:\*\*\s*`?(arc|spike|hotfix)`?/m);
  return match ? match[1] : null;
}

function protocolCompoundFromText(markdown) {
  const match = markdown.match(/^\*\*Compound:\*\*\s*(true|false)(?:\s*[—-]\s*([a-z-]+))?/m);
  if (!match) return { present: false, enabled: false, pattern: null };
  return { present: true, enabled: match[1] === 'true', pattern: match[2] || null };
}

function parseScalarHeader(markdown, name) {
  const match = markdown.match(new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.+?)\\s*$`, 'm'));
  if (!match) return null;
  return match[1].trim().replace(/^`|`$/g, '');
}

function parseListHeader(markdown, name) {
  const raw = parseScalarHeader(markdown, name);
  if (!raw) return null;
  const bracketMatch = raw.match(/^\[(.*)\]$/);
  if (!bracketMatch) return [raw.replace(/^`|`$/g, '')].filter(Boolean);
  const inner = bracketMatch[1].trim();
  if (!inner) return [];
  return inner
    .split(',')
    .map((item) => item.trim().replace(/^['"`]|['"`]$/g, ''))
    .filter(Boolean);
}

function hasSection(markdown, heading) {
  return new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(markdown);
}

function moduleRootList(moduleConfig) {
  const roots = Array.isArray(moduleConfig.root) ? moduleConfig.root : [moduleConfig.root];
  return roots.filter(Boolean).map((root) => root.replace(/^\.\//, '').replace(/\\/g, '/'));
}

function fileIsInsideModule(filePath, moduleConfig) {
  const normalized = filePath.replace(/^\.\//, '').replace(/\\/g, '/');
  return moduleRootList(moduleConfig).some((root) => {
    const cleanRoot = root.replace(/\/+$/, '');
    return normalized === cleanRoot || normalized.startsWith(`${cleanRoot}/`);
  });
}

function exitContractsFor(moduleConfig) {
  return Array.isArray(moduleConfig.exit_contracts) ? moduleConfig.exit_contracts : [];
}

function moduleProgressSummary(manifest) {
  if (!manifest.modules || Object.keys(manifest.modules).length === 0) return '';
  const lines = ['Module progress:'];
  let satisfiedTotal = 0;
  let contractTotal = 0;
  for (const [moduleName, moduleConfig] of Object.entries(manifest.modules)) {
    const contracts = exitContractsFor(moduleConfig);
    const satisfied = contracts.filter((contract) => contract.status === 'satisfied').length;
    satisfiedTotal += satisfied;
    contractTotal += contracts.length;
    const percent = contracts.length === 0 ? 'n/a' : `${Math.round((satisfied / contracts.length) * 100)}%`;
    lines.push(`- ${moduleName}: ${satisfied}/${contracts.length} (${percent})`);
  }
  const totalPercent = contractTotal === 0 ? 'n/a' : `${Math.round((satisfiedTotal / contractTotal) * 100)}%`;
  lines.push(`Arc total: ${satisfiedTotal}/${contractTotal} (${totalPercent})`);
  return lines.join('\n');
}

function validateModules(manifest, activeProtocolText) {
  const errors = [];
  if (!manifest.modules || typeof manifest.modules !== 'object') {
    errors.push('manifest.modules is required for module-tagged protocols');
    return errors;
  }

  const moduleName = parseScalarHeader(activeProtocolText, 'Module');
  const crosses = parseListHeader(activeProtocolText, 'Crosses');
  const advances = parseListHeader(activeProtocolText, 'Advances contracts');

  if (!moduleName) errors.push('active protocol is missing module header: **Module:** `module-id`');
  if (crosses === null) errors.push('active protocol is missing crosses header: **Crosses:** []');
  if (advances === null) errors.push('active protocol is missing contract header: **Advances contracts:** []');
  if (!moduleName || crosses === null || advances === null) return errors;

  const moduleNames = new Set(Object.keys(manifest.modules));
  if (!moduleNames.has(moduleName)) {
    errors.push(`active protocol Module (${moduleName}) is not defined in manifest.modules`);
  }
  for (const crossed of crosses) {
    if (!moduleNames.has(crossed)) {
      errors.push(`active protocol Crosses module (${crossed}) is not defined in manifest.modules`);
    }
  }

  const allowedModules = [moduleName, ...crosses].filter((name) => moduleNames.has(name));
  const allowedContractIds = new Set();
  for (const name of allowedModules) {
    for (const contract of exitContractsFor(manifest.modules[name])) {
      if (!contract.id) {
        errors.push(`manifest.modules.${name}.exit_contracts contains a contract without id`);
        continue;
      }
      allowedContractIds.add(contract.id);
      if (!CONTRACT_STATUSES.has(contract.status)) {
        errors.push(`contract ${contract.id} has invalid status ${JSON.stringify(contract.status)}`);
      }
      if (!contract.statement) {
        errors.push(`contract ${contract.id} is missing statement`);
      }
      if (!contract.verifies_via) {
        errors.push(`contract ${contract.id} is missing verifies_via`);
      }
    }
  }

  for (const contractId of advances) {
    if (!allowedContractIds.has(contractId)) {
      errors.push(`Advances contracts references ${contractId}, which is not in Module or Crosses exit_contracts`);
    }
  }

  return errors;
}

function changedFilesForDiff(manifest) {
  if (!manifest.repo_root || !manifest.diff_base || !manifest.diff_head) return [];
  const repoRoot = path.resolve(manifest.repo_root);
  const output = execFileSync('git', ['diff', '--name-only', manifest.diff_base, manifest.diff_head], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function validateDiffScope(manifest, activeProtocolText) {
  const errors = [];
  if (!manifest.repo_root || !manifest.diff_base || !manifest.diff_head) return errors;
  if (!manifest.modules || typeof manifest.modules !== 'object') return errors;
  const moduleName = parseScalarHeader(activeProtocolText, 'Module');
  const crosses = parseListHeader(activeProtocolText, 'Crosses') || [];
  if (!moduleName || !manifest.modules[moduleName]) return errors;
  const allowedModules = [moduleName, ...crosses].map((name) => manifest.modules[name]).filter(Boolean);
  const changedFiles = changedFilesForDiff(manifest);
  for (const file of changedFiles) {
    if (!allowedModules.some((moduleConfig) => fileIsInsideModule(file, moduleConfig))) {
      errors.push(`diff-scope violation: ${file} is outside Module (${moduleName}) and Crosses (${crosses.join(', ') || 'none'})`);
    }
  }
  return errors;
}

async function resolveGitDirectory(repoRoot) {
  const dotGit = path.join(repoRoot, '.git');
  const content = await readFile(dotGit, 'utf8').catch(() => null);
  if (content === null) return dotGit;
  const match = content.trim().match(/^gitdir:\s*(.+)$/);
  if (!match) {
    throw new Error(`invalid gitdir file: ${dotGit}`);
  }
  return path.resolve(repoRoot, match[1]);
}

async function readHeadCommit(repoRoot) {
  const gitDirectory = await resolveGitDirectory(repoRoot);
  const head = (await readFile(path.join(gitDirectory, 'HEAD'), 'utf8')).trim();
  if (!head.startsWith('ref: ')) return head;

  const ref = head.slice(5);
  const looseRef = await readFile(path.join(gitDirectory, ref), 'utf8').catch(
    () => null,
  );
  if (looseRef !== null) return looseRef.trim();

  const packedRefs = await readFile(
    path.join(gitDirectory, 'packed-refs'),
    'utf8',
  ).catch(() => '');
  const match = packedRefs
    .split(/\r?\n/)
    .find((line) => line.endsWith(` ${ref}`));
  if (!match) {
    throw new Error(`could not resolve HEAD ref: ${ref}`);
  }
  return match.split(' ', 1)[0];
}

async function validateCurrentCommit(manifest) {
  if (!manifest.repo_root || !manifest.current_commit) return [];
  if (!/^[0-9a-f]{7,40}$/i.test(manifest.current_commit)) {
    return [`manifest.current_commit is not a git commit: ${manifest.current_commit}`];
  }

  const repoRoot = path.resolve(manifest.repo_root);
  const gitDirectory = await resolveGitDirectory(repoRoot);
  const head = await readHeadCommit(repoRoot);
  if (head.startsWith(manifest.current_commit)) return [];

  // Rotation metadata is committed after the executable slice it activates.
  // Accept that single activation commit while rejecting a lock that has
  // drifted across additional commits.
  const reflog = await readFile(path.join(gitDirectory, 'logs', 'HEAD'), 'utf8').catch(
    () => '',
  );
  const lastTransition = reflog.trim().split(/\r?\n/).at(-1)?.match(
    /^([0-9a-f]{40}) ([0-9a-f]{40}) /i,
  );
  const activationCommit =
    lastTransition &&
    lastTransition[2] === head &&
    lastTransition[1].startsWith(manifest.current_commit);
  // Hosted shallow checkouts may omit the parent-to-HEAD reflog transition.
  // The commit object still binds its exact first parent, so accept that same
  // single activation edge without widening to an older ancestor.
  const firstParent = execFileSync(
    'git',
    ['show', '-s', '--format=%P', head],
    { cwd: repoRoot, encoding: 'utf8' },
  ).trim().split(/\s+/)[0] || null;
  const parentActivation =
    firstParent && firstParent.startsWith(manifest.current_commit);
  return activationCommit || parentActivation
    ? []
    : [
        `manifest.current_commit (${manifest.current_commit}) matches neither HEAD (${head.slice(0, 8)}) nor its single activation parent`,
      ];
}

function validateProtocolShape(manifest, activeProtocolText) {
  const errors = [];
  const activeClass = manifest.active_class;
  if (!VALID_CLASSES.has(activeClass)) {
    errors.push(`manifest.active_class must be one of arc, spike, hotfix; got ${JSON.stringify(activeClass)}`);
    return errors;
  }

  const protocolClass = protocolClassFromText(activeProtocolText);
  if (!protocolClass) {
    errors.push('active protocol is missing a class header: **Class:** `arc|spike|hotfix`');
  } else if (protocolClass !== activeClass) {
    errors.push(`active protocol class (${protocolClass}) does not match manifest.active_class (${activeClass})`);
  }

  for (const section of SECTION_REQUIREMENTS[activeClass]) {
    if (!hasSection(activeProtocolText, section)) {
      errors.push(`active class ${activeClass} requires section: ## ${section}`);
    }
  }

  const compound = protocolCompoundFromText(activeProtocolText);
  const manifestCompound = Boolean(manifest.active_compound);
  if (manifestCompound !== compound.enabled) {
    errors.push(`manifest.active_compound (${manifestCompound}) does not match active protocol Compound header (${compound.enabled})`);
  }
  if (compound.enabled) {
    if (!compound.pattern || !COMPOUND_PATTERNS.has(compound.pattern)) {
      errors.push('compound slices must name one approved pattern: paired-diff, shared-gate, or refactor-then-use');
    }
    if (!hasSection(activeProtocolText, 'Sub-slices')) {
      errors.push('compound slices require section: ## Sub-slices');
    }
    const subSliceRows = activeProtocolText
      .split(/\r?\n/)
      .filter((line) => /^\|\s*\d+[a-z]\s*\|/.test(line)).length;
    if (subSliceRows === 0) {
      errors.push('compound slices require at least one numbered sub-slice row');
    }
    if (subSliceRows > 3) {
      errors.push(`compound slices are capped at three sub-slices; found ${subSliceRows}`);
    }
  }

  if ((activeClass === 'spike' || activeClass === 'hotfix') && hasSection(activeProtocolText, 'Evidence')) {
    const evidence = extractSection(activeProtocolText, ['Evidence']);
    if (!/runs\//.test(evidence)) {
      errors.push(`active class ${activeClass} evidence must include the runs/ minimum`);
    }
  }

  return errors;
}

async function directoryHasEntries(dirPath) {
  try {
    const entries = await readdir(dirPath);
    return entries.length > 0;
  } catch {
    return false;
  }
}

async function validateCloseoutEvidence(manifest) {
  if (manifest.active_class !== 'arc' || !manifest.closeout_evidence_path) {
    return [];
  }
  const errors = [];
  const root = path.isAbsolute(manifest.closeout_evidence_path)
    ? manifest.closeout_evidence_path
    : path.resolve(ROOT, manifest.closeout_evidence_path);
  for (const subdir of ['notes', 'runs', 'evidence']) {
    const target = path.join(root, subdir);
    if (!(await directoryHasEntries(target))) {
      errors.push(`arc closeout evidence folder must exist and be non-empty: ${path.relative(ROOT, target)}`);
    }
  }
  return errors;
}

function generateLockfile(manifest, activeProtocolText) {
  const activeObjective = extractSection(activeProtocolText, OBJECTIVE_HEADINGS) || 'See the active protocol for the current objective.';
  return {
    lock_version: 1,
    project: manifest.project,
    current_commit: manifest.current_commit,
    current_phase: manifest.current_phase,
    active_protocol: manifest.active_protocol,
    active_class: manifest.active_class,
    active_compound: Boolean(manifest.active_compound),
    active_module: parseScalarHeader(activeProtocolText, 'Module'),
    crosses: parseListHeader(activeProtocolText, 'Crosses') || [],
    advances_contracts: parseListHeader(activeProtocolText, 'Advances contracts') || [],
    active_protocol_sha256: `sha256:${sha256(activeProtocolText)}`,
    active_objective: activeObjective,
    allowed_files: manifest.allowed_files,
    verification: manifest.verification,
    stop_condition: manifest.stop_condition,
  };
}

function generateNoActiveLockfile(manifest) {
  return {
    lock_version: 1,
    project: manifest.project,
    current_commit: manifest.current_commit,
    current_phase: manifest.current_phase,
    active_protocol: null,
    active_class: manifest.active_class || null,
    active_compound: Boolean(manifest.active_compound),
    active_module: null,
    crosses: [],
    advances_contracts: [],
    active_protocol_sha256: null,
    active_objective: manifest.active_objective || 'No active protocol.',
    allowed_files: manifest.allowed_files || [],
    verification: manifest.verification || [],
    stop_condition: manifest.stop_condition || 'No active protocol is currently assigned.',
  };
}

function generateNoActiveReadme(manifest) {
  const phaseTitle = phaseTitleFromId(manifest.current_phase || 'phase-unset');
  return `# Next Prompt Protocols

This is the canonical handoff target for project work. The manifest currently has no active protocol.

Current commit reference: \`${manifest.current_commit || 'unset'}\`

Active protocol: \`none\`
Active protocol class: \`${manifest.active_class || 'unset'}\`
Active protocol compound: \`${Boolean(manifest.active_compound)}\`

## Current State

${manifest.active_objective || 'No active objective is set.'}

${moduleProgressSummary(manifest)}

## Queued Work

Use \`queued/\` for protocol queues that are not active yet. A queued protocol should become active only when the remaining work is executable and locally verifiable.

## Handoff Workflow

When a new active protocol is selected:

1. Move it into \`active/\`.
2. Set \`manifest.active_protocol\` to the active-relative path.
3. Run \`node tools/sync-protocols.mjs --commit <sha>\`.
4. Run \`node tools/sync-protocols.mjs --check\`.

## Current Phase

- \`${phaseTitle}\`

## Scope Boundaries

${listBlock(manifest.allowed_files || []) || '- No active scope boundaries are declared.'}
`;
}

function generateNoActivePhaseReadme(manifest) {
  const phaseTitle = phaseTitleFromId(manifest.current_phase || 'phase-unset');
  return `# ${phaseTitle}

Current commit reference: \`${manifest.current_commit || 'unset'}\`
Current active protocol: \`none\`

## Active Objective

${manifest.active_objective || 'No active objective is set.'}

## Verification

- \`node tools/sync-protocols.mjs --check\`

## Stop Condition

No active protocol is currently assigned. Do not infer implementation scope from this phase file alone; select or draft a concrete active protocol first.
`;
}

function generateReadme(manifest, activeProtocolText) {
  const phaseTitle = phaseTitleFromId(manifest.current_phase);
  const phaseDir = phaseDirFromId(manifest.current_phase);
  const activeObjective = extractSection(activeProtocolText, OBJECTIVE_HEADINGS) || 'See the active protocol for the current objective.';
  return `# Next Prompt Protocols

This is the canonical handoff target for project work. Use this folder to make future agents behave the same way, apply context in the same order, and stay within the same scope boundaries.

Current commit reference: \`${manifest.current_commit}\`

Active protocol class: \`${manifest.active_class || 'unset'}\`
Active protocol compound: \`${Boolean(manifest.active_compound)}\`
Active protocol module: \`${parseScalarHeader(activeProtocolText, 'Module') || 'unset'}\`
Advances contracts: \`${(parseListHeader(activeProtocolText, 'Advances contracts') || []).join(', ') || 'none'}\`

## Slice Class

Every active protocol declares one class:

- \`arc\`: planned multi-slice work. Requires descriptor rung check, productivity mix, evidence, non-goals, acceptance, and a slice queue when multiple slices are visible.
- \`spike\`: exploratory work. Requires descriptor rung check, non-goals, acceptance, and evidence with \`runs/\` minimum.
- \`hotfix\`: concrete bug or unblock with a known fix. Requires acceptance and evidence with \`runs/\` minimum.

Class adjusts the thinking ceremony only. Worktree isolation and commit-after-each-slice rules still apply.

## Compound Slice Rule

Compound slices are allowed only when \`**Compound:** true\` names one approved pattern: \`paired-diff\`, \`shared-gate\`, or \`refactor-then-use\`.

Compound slices use one acceptance gate, one evidence set, and one closeout, but each sub-slice keeps its own non-goals row. Hard cap: three sub-slices. Combining only for speed is not a valid reason.

## Module Tags

Every active protocol declares:

- \`**Module:**\` — the owning module for the slice.
- \`**Crosses:**\` — other modules intentionally touched by the slice.
- \`**Advances contracts:**\` — module exit contracts advanced or satisfied by the slice.

Module tags are structural metadata, not a folder hierarchy. They let the protocol check module ownership, boundary slices, and contract progress without creating another required nesting level.

${moduleProgressSummary(manifest)}

## Descriptor Rung Stop Rule

Descriptor rungs are complete when they restate blockers that are already named by an earlier descriptor instead of unlocking a new executable test or runtime decision.

A descriptor-only slice is allowed only when it directly enables one of these:

- a helper or validator that runtime or test code can call,
- a test-controlled probe,
- a packet or command handoff attempt,
- a replay activation path,
- a runtime consumer boundary,
- a production-off invariant that must be proven before runtime code changes.

Do not draft or rotate approval/review/inspection/archive/summary/closeout descriptor rungs as standalone progress. If a proposed slice cannot name the executable test, probe, handoff, activation path, or runtime boundary it unlocks, choose a runtime seam instead.

Each active protocol should state its expected mix of runtime behavior, contract/test code, and metadata/docs. If the expected runtime behavior is \`0%\` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action rather than another metadata-only descriptor rung.

## Slice Queue Canon

Use a slice queue when an active protocol contains several follow-on slices. The queue is canonical for repeated multi-slice loops because it makes continuation an explicit decision after each slice.

A slice queue should include:

- the ordered candidate slices,
- the purpose of each slice,
- the value gate that justifies doing it now,
- the focused validation gate,
- the current status: \`queued\`, \`active\`, \`done\`, \`blocked\`, \`dropped\`, or \`deferred\`.

Queue discipline:

- Commit and push after each completed queue slot when the active protocol requires slice commits.
- Before starting the next slot, verify the previous slot changed runtime behavior, test coverage, production guardrails, or decision clarity. If it only added ceremony, stop and report.
- Reorder, split, collapse, defer, or drop queued slots when evidence shows a smaller or clearer path.
- Stop and ask before continuing if the queue becomes mostly descriptor-only, if validation cost is not proportional to the change, or if the next slot does not unlock a concrete executable step.
- Draft the next protocol from the remaining queue only after closeout states what changed, what did not move, and what evidence justifies continuing.

## How an agent must apply context

Read in this order:

1. \`.slice-lock.json\`
2. \`manifest.json\`
3. \`${macroDeltaRel(manifest)}\`
4. \`role-context.md\`
5. \`phases/${phaseDir}/README.md\`
6. \`${manifest.active_protocol}\`
${manifest.completed_protocols.map((item, index) => `${index + 7}. \`${item}\``).join('\n')}

If a fact is not in those files or the code, verify it locally before acting.

## Folder layout

- \`active/\` contains the single protocol that should be used for the next implementation slice.
- \`completed/\` contains protocols that have already been consumed or superseded.
- \`slice-queue.md\`, when present, records candidate future slices without making them active.
- \`phases/\` contains phase-specific readme files and constraints.
- \`manifest.json\` is the machine-readable source of truth for the current handoff state.
- \`.slice-lock.json\` is the slice lockfile that must match the manifest and active protocol.
- \`role-context.md\` is the distilled behavior summary taken from the role bibles.

## Handoff workflow

When a slice is complete, write the companion artifacts under \`${manifest.evidence_root || '..'}\`:

- a note in \`notes/\` describing the change and the non-goals that stayed intact,
- a run record in \`runs/\` capturing the exact commands, working directory, result status, and source commit,
- an evidence JSON in \`evidence/\` summarizing the slice, modified files, ABI additions, and verification results.

After the artifacts are written, update the protocol state from the repo tip:

- run \`node tools/sync-protocols.mjs --commit $(git rev-parse --short=8 HEAD)\`,
- run \`node tools/sync-protocols.mjs --check\`,
- do not hand off until \`README.md\`, \`phases/${phaseDir}/README.md\`, \`manifest.json\`, and \`.slice-lock.json\` are in sync.

## Current phase

- \`${phaseTitle}\`

## Current active objective

${activeObjective.split('\n').map((line) => line.length > 0 ? `> ${line}` : '>').join('\n')}

## Behavior rules

- Be specific. Do not infer broader work from a narrow prompt.
- Do not spin on assumptions when the next step is explicit.
- If the active protocol and the code disagree, stop and report the mismatch.
- If \`.slice-lock.json\`, \`manifest.json\`, or the active protocol disagree, stop and report the mismatch.
- New active protocols must include \`**Class:**\` and \`**Compound:**\` headers.
- New active protocols must include \`**Module:**\`, \`**Crosses:**\`, and \`**Advances contracts:**\` headers.
- Keep the current scope narrow until the current slice is verified and documented.
- Use the exact verification commands listed in the active protocol.
- Run this folder's sync check before handing off: \`node tools/sync-protocols.mjs --check\` or \`npm run protocol:check\`

## Scope boundaries

These protocols are specific to:

${listBlock(manifest.allowed_files)}

Treat every manifest non-goal as closed unless principal direction or a ratified Macro Delta amendment changes it.

## Where to start for the current slice

Start with:

- \`phases/${phaseDir}/README.md\`
- \`${manifest.active_protocol}\`
`;
}

function generatePhaseReadme(manifest, activeProtocolText) {
  const phaseTitle = phaseTitleFromId(manifest.current_phase);
  const phaseDir = phaseDirFromId(manifest.current_phase);
  const activeObjective = extractSection(activeProtocolText, OBJECTIVE_HEADINGS) || 'See the active protocol for the current objective.';
  const acceptance = extractSection(activeProtocolText, ACCEPTANCE_HEADINGS) || [
    `- \`node --test\` command defined in \`${manifest.active_protocol}\``,
    '- `npm run typecheck`',
    '- `npm run build`',
  ].join('\n');
  const nonGoals = manifest.non_goals.map((item) => `- ${item}`).join('\n');
  const allowedFiles = manifest.allowed_files.map((item) => `- \`${item}\``).join('\n');
  return `# ${phaseTitle}

Current commit reference: \`${manifest.current_commit}\`
Current active protocol: \`${manifest.active_protocol}\`

## Scope

${manifest.phase_scope || `Phase ${phaseTitle.replace(/^Phase\s+/, '')} is the current governed work boundary.`}

## Active objective

${activeObjective.split('\n').map((line) => line.length > 0 ? `> ${line}` : '>').join('\n')}

## Files in play

${allowedFiles}

## Non-goals

${nonGoals}

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains \`0%\` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

${acceptance.split('\n').map((line) => line.trimEnd()).join('\n')}

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under \`${manifest.evidence_root || '..'}\`, then run the sync script with the current HEAD commit and confirm \`--check\` passes.

## Slice lock

- \`.slice-lock.json\`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
`;
}

function parseArgs(argv) {
  const args = { check: false, rotate: false, newActive: null, commit: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--rotate') args.rotate = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--new-active') args.newActive = argv[++i];
    else if (a === '--commit') args.commit = argv[++i];
  }
  return args;
}

async function safeMove(src, dest) {
  try {
    await rename(src, dest);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err;
    // Cross-device move: copy then unlink.
    await copyFile(src, dest);
    await unlink(src);
  }
}

function resolveHeadCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

async function rotateSlice({ newActiveArg, commitArg, dryRun }) {
  if (!newActiveArg) {
    throw new Error('--rotate requires --new-active <path-to-new-protocol.md>');
  }
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));

  // Validate prior active state.
  const priorActiveRel = manifest.active_protocol;
  const priorActiveAbs = path.join(ROOT, priorActiveRel);
  if (!(await fileExists(priorActiveAbs))) {
    throw new Error(`manifest.active_protocol does not exist on disk: ${priorActiveRel}`);
  }
  const activeDir = path.join(ROOT, 'active');
  const activeListing = (await readdir(activeDir)).filter((f) => f.endsWith('.md'));
  const priorActiveBase = path.basename(priorActiveRel);
  if (!activeListing.includes(priorActiveBase)) {
    throw new Error(`active/ does not contain manifest.active_protocol (${priorActiveBase}); cannot rotate cleanly`);
  }

  // Resolve new active source path.
  const newActiveSrc = path.isAbsolute(newActiveArg) ? newActiveArg : path.resolve(process.cwd(), newActiveArg);
  if (!(await fileExists(newActiveSrc))) {
    throw new Error(`--new-active path does not exist: ${newActiveSrc}`);
  }
  if (!newActiveSrc.endsWith('.md')) {
    throw new Error(`--new-active must be a .md file: ${newActiveSrc}`);
  }
  const newActiveBase = path.basename(newActiveSrc);
  if (newActiveBase === priorActiveBase) {
    throw new Error(`--new-active basename collides with prior active: ${newActiveBase}`);
  }
  const newActiveDest = path.join(activeDir, newActiveBase);
  if (await fileExists(newActiveDest) && path.resolve(newActiveSrc) !== path.resolve(newActiveDest)) {
    throw new Error(`active/${newActiveBase} already exists; refusing to overwrite`);
  }
  const completedDest = path.join(ROOT, 'completed', priorActiveBase);
  if (await fileExists(completedDest)) {
    throw new Error(`completed/${priorActiveBase} already exists; refusing to overwrite`);
  }

  // Resolve commit.
  const commit = commitArg || resolveHeadCommit();
  if (!commit) {
    throw new Error('--commit not provided and could not resolve HEAD via git rev-parse');
  }
  if (!/^[0-9a-f]{7,40}$/i.test(commit)) {
    throw new Error(`--commit does not look like a git sha: ${commit}`);
  }

  const plan = {
    move_prior_active_to_completed: `${priorActiveRel} -> completed/${priorActiveBase}`,
    move_new_active_into_active: `${newActiveSrc} -> active/${newActiveBase}`,
    manifest_active_protocol: `${priorActiveRel} -> active/${newActiveBase}`,
    manifest_current_commit: `${manifest.current_commit} -> ${commit}`,
    completed_protocols_prepend: `completed/${priorActiveBase}`,
    regenerate_derived_files: ['README.md', `phases/${manifest.current_phase}/README.md`, '.slice-lock.json'],
  };

  if (dryRun) {
    console.log('DRY RUN — rotation plan:');
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  // Execute in fail-safe order: stage the new active first (does not touch
  // tracked state on failure), then demote the prior active. This means a
  // failure during the new-active move leaves the manifest+active/ untouched.
  if (path.resolve(newActiveSrc) !== path.resolve(newActiveDest)) {
    await safeMove(newActiveSrc, newActiveDest);
  }
  await safeMove(priorActiveAbs, completedDest);
  // Update manifest.
  const completedRel = `completed/${priorActiveBase}`;
  const next = {
    ...manifest,
    active_protocol: `active/${newActiveBase}`,
    current_commit: commit,
    completed_protocols: [completedRel, ...(manifest.completed_protocols || []).filter((p) => p !== completedRel)],
  };
  await writeFile(MANIFEST_PATH, stableJson(next));

  // Regenerate derived files using the same path as default mode.
  await regenerateDerivedFiles(next);

  console.log(`Rotated ${priorActiveBase} -> ${newActiveBase} at commit ${commit}.`);
}

async function regenerateDerivedFiles(manifest) {
  if (!manifest.active_protocol) {
    const nextReadme = generateNoActiveReadme(manifest);
    const nextPhaseReadme = generateNoActivePhaseReadme(manifest);
    const nextLock = generateNoActiveLockfile(manifest);
    const phaseReadmePath = path.join(ROOT, 'phases', phaseDirFromId(manifest.current_phase || 'phase-unset'), 'README.md');
    if (!(await fileExists(phaseReadmePath))) {
      throw new Error(`No-active protocol phase README does not exist: ${path.relative(ROOT, phaseReadmePath)}`);
    }
    await writeFile(README_PATH, nextReadme);
    await writeFile(phaseReadmePath, nextPhaseReadme);
    await writeFile(LOCK_PATH, stableJson(nextLock));
    return;
  }
  const phaseReadmePath = path.join(ROOT, 'phases', phaseDirFromId(manifest.current_phase || 'phase-unset'), 'README.md');
  if (!(await fileExists(phaseReadmePath))) {
    throw new Error(`Active protocol phase README does not exist: ${path.relative(ROOT, phaseReadmePath)}`);
  }
  const activePath = path.join(ROOT, manifest.active_protocol);
  const activeProtocolText = await readFile(activePath, 'utf8');
  const nextReadme = generateReadme(manifest, activeProtocolText);
  const nextPhaseReadme = generatePhaseReadme(manifest, activeProtocolText);
  const nextLock = generateLockfile(manifest, activeProtocolText);
  await writeFile(README_PATH, nextReadme);
  await writeFile(phaseReadmePath, nextPhaseReadme);
  await writeFile(LOCK_PATH, stableJson(nextLock));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.rotate) {
    await rotateSlice({ newActiveArg: args.newActive, commitArg: args.commit, dryRun: args.dryRun });
    return;
  }
  const checkOnly = args.check;
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));

  for (const required of [await roleContextPath(), macroDeltaPath(manifest), PHASES_README_PATH]) {
    if (!(await fileExists(required))) {
      throw new Error(`Missing required protocol file: ${required}`);
    }
  }

  for (const completedRel of manifest.completed_protocols) {
    const completedPath = path.join(ROOT, completedRel);
    if (!(await fileExists(completedPath))) {
      throw new Error(`Completed protocol does not exist: ${completedRel}`);
    }
  }

  if (!manifest.active_protocol) {
    const nextReadme = generateNoActiveReadme(manifest);
    const nextPhaseReadme = generateNoActivePhaseReadme(manifest);
    const nextLock = generateNoActiveLockfile(manifest);
    const phaseReadmePath = path.join(ROOT, 'phases', phaseDirFromId(manifest.current_phase || 'phase-unset'), 'README.md');
    if (!(await fileExists(phaseReadmePath))) {
      throw new Error(`No-active protocol phase README does not exist: ${path.relative(ROOT, phaseReadmePath)}`);
    }
    if (checkOnly) {
      const [currentReadme, currentPhaseReadme, currentLock] = await Promise.all([
        readFile(README_PATH, 'utf8'),
        readFile(phaseReadmePath, 'utf8'),
        readFile(LOCK_PATH, 'utf8'),
      ]);
      const mismatches = [];
      if (currentReadme !== nextReadme) {
        mismatches.push('README.md is out of sync with manifest.json');
      }
      if (currentPhaseReadme !== nextPhaseReadme) {
        mismatches.push(`phases/${phaseDirFromId(manifest.current_phase || 'phase-unset')}/README.md is out of sync with manifest.json`);
      }
      if (currentLock !== stableJson(nextLock)) {
        mismatches.push('.slice-lock.json is out of sync with manifest.json');
      }
      if (mismatches.length > 0) {
        throw new Error(`${mismatches.length} drift mismatch(es):\n  - ${mismatches.join('\n  - ')}\nRun \`npm run protocol:sync\` to regenerate.`);
      }
      console.log('[protocol:sync] no active protocol; derived files are in sync.');
      return;
    }
    await writeFile(README_PATH, nextReadme);
    await writeFile(phaseReadmePath, nextPhaseReadme);
    await writeFile(LOCK_PATH, stableJson(nextLock));
    console.log('[protocol:sync] no active protocol; regenerated no-active README, phase README, and lockfile.');
    return;
  }

  const activePath = path.join(ROOT, manifest.active_protocol);
  if (!(await fileExists(activePath))) {
    throw new Error(`Active protocol does not exist: ${manifest.active_protocol}`);
  }
  const activeProtocolText = await readFile(activePath, 'utf8');
  const nextReadme = generateReadme(manifest, activeProtocolText);
  const nextPhaseReadme = generatePhaseReadme(manifest, activeProtocolText);
  const nextLock = generateLockfile(manifest, activeProtocolText);
  const protocolShapeErrors = validateProtocolShape(manifest, activeProtocolText);
  const moduleErrors = validateModules(manifest, activeProtocolText);
  const diffScopeErrors = validateDiffScope(manifest, activeProtocolText);
  const currentCommitErrors = await validateCurrentCommit(manifest);
  const closeoutEvidenceErrors = await validateCloseoutEvidence(manifest);

  if (checkOnly) {
    const [currentReadme, currentPhaseReadme, currentLock] = await Promise.all([
      readFile(README_PATH, 'utf8'),
      readFile(path.join(ROOT, 'phases', phaseDirFromId(manifest.current_phase), 'README.md'), 'utf8'),
      readFile(LOCK_PATH, 'utf8'),
    ]);
    const mismatches = [];
    if (currentReadme !== nextReadme) {
      mismatches.push('README.md is out of sync with manifest.json');
    }
    if (currentPhaseReadme !== nextPhaseReadme) {
      mismatches.push(`phases/${manifest.current_phase}/README.md is out of sync with manifest.json`);
    }
    if (currentLock !== stableJson(nextLock)) {
      mismatches.push('.slice-lock.json is out of sync with manifest.json');
    }
    mismatches.push(
      ...protocolShapeErrors,
      ...moduleErrors,
      ...diffScopeErrors,
      ...currentCommitErrors,
      ...closeoutEvidenceErrors,
    );
    if (mismatches.length > 0) {
      throw new Error(`${mismatches.length} drift mismatch(es):\n  - ${mismatches.join('\n  - ')}\nRun \`npm run protocol:sync\` to regenerate.`);
    }
    const progress = moduleProgressSummary(manifest);
    if (progress) {
      console.log(progress);
    }
    return;
  }

  await writeFile(README_PATH, nextReadme);
  await writeFile(path.join(ROOT, 'phases', phaseDirFromId(manifest.current_phase), 'README.md'), nextPhaseReadme);
  await writeFile(LOCK_PATH, stableJson(nextLock));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
