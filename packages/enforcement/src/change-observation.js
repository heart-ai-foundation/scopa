import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJsonPretty,
  deepFreeze,
} from './canonical-json.js';
import { matchesPathRule } from './path-boundary.js';

const execFileAsync = promisify(execFile);

export const CHANGE_OBSERVATION_SCHEMA = 'scopa.change-observation.v1';
const LEGACY_OBSERVATION_BASIS =
  'git-tracked-working-tree-observation-not-enforcement';
const WORKING_TREE_OBSERVATION_BASIS =
  'git-working-tree-observation-not-enforcement';
const MAX_OUTPUT_BYTES = 1024 * 1024;
const MAX_CHANGED_PATHS = 4096;
const DEPENDENCY_FILES = new Set([
  'bun.lock',
  'bun.lockb',
  'composer.json',
  'composer.lock',
  'deno.json',
  'deno.lock',
  'gemfile',
  'gemfile.lock',
  'go.mod',
  'go.sum',
  'package-lock.json',
  'package.json',
  'pnpm-lock.yaml',
  'poetry.lock',
  'pyproject.toml',
  'requirements.txt',
  'uv.lock',
  'yarn.lock',
]);

function stringArray(value, label, { minimum = 0 } = {}) {
  if (!Array.isArray(value) || value.length < minimum) {
    throw new TypeError(`${label} must be an array`);
  }
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0) {
      throw new TypeError(`${label} must contain non-empty strings`);
    }
  }
  return value;
}

function normalizedGitPath(value) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.includes('\0') ||
    value.includes('\\') ||
    path.posix.isAbsolute(value) ||
    value === '..' ||
    value.startsWith('../') ||
    value.includes('/../') ||
    path.posix.normalize(value) !== value
  ) return null;
  return value;
}

function dependencyNonGoal(nonGoal) {
  return /\b(?:dependenc(?:y|ies)|lockfile|package manifest)\b/iu.test(nonGoal);
}

function declaredNonGoalContact(relativePath, nonGoals) {
  const normalizedPath = relativePath.toLowerCase();
  const basename = path.posix.basename(normalizedPath);
  return nonGoals.some((nonGoal) => {
    const normalizedGoal = nonGoal.toLowerCase();
    if (
      normalizedGoal.includes(normalizedPath) ||
      (basename.length >= 4 && normalizedGoal.includes(basename))
    ) return true;
    return dependencyNonGoal(normalizedGoal) && DEPENDENCY_FILES.has(basename);
  });
}

export function validateChangeObservation(value) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) throw new TypeError('change observation must be a plain object');
  const keys = ['basis', 'changes', 'schema', 'summary'];
  if (Object.keys(value).sort().join('\0') !== keys.join('\0')) {
    throw new TypeError('change observation schema mismatch');
  }
  if (value.schema !== CHANGE_OBSERVATION_SCHEMA) {
    throw new TypeError('unsupported change observation schema');
  }
  if (![LEGACY_OBSERVATION_BASIS, WORKING_TREE_OBSERVATION_BASIS].includes(
    value.basis,
  )) {
    throw new TypeError('unsupported change observation basis');
  }
  const includesUntracked = value.basis === WORKING_TREE_OBSERVATION_BASIS;
  if (!Array.isArray(value.changes) || value.changes.length > MAX_CHANGED_PATHS) {
    throw new TypeError('change observation paths are invalid');
  }
  for (const [index, change] of value.changes.entries()) {
    if (
      !change ||
      Array.isArray(change) ||
      typeof change !== 'object' ||
      Object.keys(change).sort().join('\0') !== (includesUntracked
        ? ['declaredNonGoalContact', 'outsideAllowedPaths', 'path', 'tracked']
        : ['declaredNonGoalContact', 'outsideAllowedPaths', 'path']
      ).join('\0') ||
      normalizedGitPath(change.path) === null ||
      typeof change.outsideAllowedPaths !== 'boolean' ||
      typeof change.declaredNonGoalContact !== 'boolean' ||
      (includesUntracked && typeof change.tracked !== 'boolean')
    ) throw new TypeError(`change observation entry ${index} is invalid`);
  }
  const sorted = [...value.changes].sort((left, right) =>
    left.path.localeCompare(right.path)
  );
  if (canonicalJsonPretty(sorted) !== canonicalJsonPretty(value.changes)) {
    throw new TypeError('change observation paths must be unique and sorted');
  }
  const unique = new Set(value.changes.map((change) => change.path));
  if (unique.size !== value.changes.length) {
    throw new TypeError('change observation paths must be unique and sorted');
  }
  const expected = {
    versionControlledChanges: includesUntracked
      ? value.changes.filter((item) => item.tracked).length
      : value.changes.length,
    ...(includesUntracked
      ? { untrackedChanges: value.changes.filter((item) => !item.tracked).length }
      : {}),
    outsideAllowedPaths: value.changes.filter((item) =>
      item.outsideAllowedPaths
    ).length,
    declaredNonGoalContacts: value.changes.filter((item) =>
      item.declaredNonGoalContact
    ).length,
  };
  if (canonicalJsonPretty(value.summary) !== canonicalJsonPretty(expected)) {
    throw new TypeError('change observation summary is inconsistent');
  }
  return deepFreeze(JSON.parse(canonicalJsonPretty(value)));
}

export async function observeVersionControlledChanges({
  repoRoot,
  allowedPaths,
  nonGoals,
}) {
  stringArray(allowedPaths, 'allowedPaths', { minimum: 1 });
  stringArray(nonGoals, 'nonGoals');
  const root = await realpath(repoRoot);
  let trackedUnstaged;
  let trackedStaged;
  let untracked;
  try {
    const git = (args) => execFileAsync('git', [
      '-c', 'core.quotepath=false', ...args,
    ], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: MAX_OUTPUT_BYTES,
        timeout: 5000,
        windowsHide: true,
      });
    [
      { stdout: trackedUnstaged },
      { stdout: trackedStaged },
      { stdout: untracked },
    ] = await Promise.all([
      git(['diff', '--name-only', '-z', '--no-ext-diff', '--']),
      git(['diff', '--cached', '--name-only', '-z', '--no-ext-diff', '--']),
      git(['ls-files', '--others', '--exclude-standard', '-z', '--']),
    ]);
  } catch {
    return null;
  }
  const parsePaths = (stdout) => stdout
    .split('\0')
    .filter(Boolean)
    .map(normalizedGitPath);
  const trackedPaths = new Set([
    ...parsePaths(trackedUnstaged),
    ...parsePaths(trackedStaged),
  ]);
  const untrackedPaths = new Set(parsePaths(untracked).filter((relativePath) =>
    relativePath !== '.scopa' && !relativePath?.startsWith('.scopa/')
  ));
  const paths = [...new Set([...trackedPaths, ...untrackedPaths])];
  if (
    paths.includes(null) ||
    trackedPaths.has(null) ||
    untrackedPaths.has(null) ||
    paths.length > MAX_CHANGED_PATHS
  ) return null;
  paths.sort((left, right) => left.localeCompare(right));
  const changes = paths.map((relativePath) => ({
    path: relativePath,
    tracked: trackedPaths.has(relativePath),
    outsideAllowedPaths: !allowedPaths.some((rule) =>
      matchesPathRule(relativePath, rule)
    ),
    declaredNonGoalContact: declaredNonGoalContact(relativePath, nonGoals),
  }));
  return validateChangeObservation({
    schema: CHANGE_OBSERVATION_SCHEMA,
    basis: WORKING_TREE_OBSERVATION_BASIS,
    changes,
    summary: {
      versionControlledChanges: changes.filter((item) => item.tracked).length,
      untrackedChanges: changes.filter((item) => !item.tracked).length,
      outsideAllowedPaths: changes.filter((item) => item.outsideAllowedPaths).length,
      declaredNonGoalContacts: changes.filter((item) =>
        item.declaredNonGoalContact
      ).length,
    },
  });
}
