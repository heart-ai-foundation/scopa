import {
  access,
  constants,
  lstat,
  readdir,
  readFile,
  realpath,
} from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJsonPretty,
  deepFreeze,
} from '../../enforcement/src/index.js';

export const BOUNDARY_DIAGNOSTIC_SCHEMA = 'scopa.boundary-diagnostic.v1';

const DEFAULT_LIMITS = Object.freeze({
  maxEntries: 20_000,
  maxDepth: 32,
  maxPathBytes: 4_096,
  maxStructuredBytes: 262_144,
  maxPathsPerIndicator: 32,
  excludedDirectories: Object.freeze([
    '.git',
    '.next',
    'coverage',
    'dist',
    'node_modules',
    'target',
    'vendor',
  ]),
});

const TOP_LEVEL_KEYS = new Set([
  'claims',
  'completionCandidates',
  'indicators',
  'inventory',
  'limits',
  'posture',
  'schema',
  'subject',
  'summary',
]);
const CLAIM_KEYS = new Set([
  'agentAuthorityMeasured',
  'environmentInspected',
  'fileContentsIndexed',
  'networkProbed',
  'repositoryMutated',
]);
const LIMIT_KEYS = new Set([
  'excludedDirectories',
  'maxDepth',
  'maxEntries',
  'maxPathBytes',
  'maxPathsPerIndicator',
  'maxStructuredBytes',
]);
const INVENTORY_KEYS = new Set([
  'directories',
  'entriesObserved',
  'excludedDirectories',
  'other',
  'regularFiles',
  'symlinks',
  'truncated',
  'unreadable',
]);
const SUBJECT_KEYS = new Set([
  'kind',
  'repositoryKind',
  'scopaInitialized',
]);
const INDICATOR_KEYS = new Set([
  'category',
  'count',
  'evidence',
  'id',
  'paths',
  'pathsTruncated',
  'status',
]);
const CANDIDATE_KEYS = new Set(['id', 'invocation', 'source']);
const SUMMARY_KEYS = new Set([
  'completionCandidates',
  'detected',
  'notDetected',
  'totalIndicators',
  'unknown',
]);
const POSTURE_KEYS = new Set(['basis', 'level']);

const STATUSES = new Set(['detected', 'not-detected', 'unknown']);
const CATEGORIES = new Set([
  'agent-config',
  'browser',
  'completion',
  'credentials',
  'deployment',
  'external-system',
  'host-process',
  'instructions',
  'network',
  'provider',
  'publication',
  'repository',
  'scopa-control',
  'tool-extension',
]);
const EVIDENCE = new Set([
  'bounded-marker-scan',
  'bounded-package-manifest',
  'doctor-process-running',
  'host-process-access-check',
  'marker-not-observed',
  'not-probed',
  'scan-truncated',
]);

const INSTRUCTION_MATCHERS = Object.freeze([
  /(?:^|\/)AGENTS\.md$/u,
  /(?:^|\/)CLAUDE\.md$/u,
  /(?:^|\/)GEMINI\.md$/u,
  /^\.github\/copilot-instructions\.md$/u,
  /^\.github\/instructions\/[^/]+\.instructions\.md$/u,
]);
const AGENT_CONFIG_MATCHERS = Object.freeze([
  /^\.claude\/settings(?:\.local)?\.json$/u,
  /^\.codex\/config\.toml$/u,
  /^\.github\/agents\/[^/]+\.agent\.md$/u,
]);
const HOOK_MATCHERS = Object.freeze([
  /^\.claude\/hooks\//u,
  /^\.github\/hooks\/[^/]+\.json$/u,
]);
const MCP_MATCHERS = Object.freeze([
  /(?:^|\/)\.mcp\.json$/u,
  /^\.vscode\/mcp\.json$/u,
]);
const CREDENTIAL_MARKER_MATCHERS = Object.freeze([
  /(?:^|\/)\.env(?:\.[A-Za-z0-9_-]+)?$/u,
  /(?:^|\/)\.npmrc$/u,
  /(?:^|\/)\.pypirc$/u,
]);
const DEPLOYMENT_MATCHERS = Object.freeze([
  /(?:^|\/)Dockerfile(?:\.[A-Za-z0-9_-]+)?$/u,
  /(?:^|\/)docker-compose(?:\.[A-Za-z0-9_-]+)?\.ya?ml$/u,
  /^\.github\/workflows\/[^/]*(?:deploy|production)[^/]*\.ya?ml$/iu,
  /(?:^|\/)(?:terraform|k8s|kubernetes)\//u,
  /(?:^|\/)(?:netlify\.toml|vercel\.json)$/u,
]);
const PUBLICATION_MATCHERS = Object.freeze([
  /^\.github\/workflows\/[^/]*(?:publish|release)[^/]*\.ya?ml$/iu,
  /(?:^|\/)CHANGELOG\.md$/u,
]);
const CI_MATCHERS = Object.freeze([
  /^\.github\/workflows\/[^/]+\.ya?ml$/u,
  /^\.gitlab-ci\.ya?ml$/u,
]);

export class BoundaryDiagnosticError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BoundaryDiagnosticError';
    this.code = 'SCOPA_BOUNDARY_DIAGNOSTIC_INVALID';
  }
}

function exactObject(value, keys, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new BoundaryDiagnosticError(`${label} must be a plain object`);
  }
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  const unknown = Object.keys(value).filter((key) => !keys.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new BoundaryDiagnosticError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new BoundaryDiagnosticError(`${label} must be a positive integer`);
  }
}

function count(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new BoundaryDiagnosticError(`${label} must be a non-negative integer`);
  }
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new BoundaryDiagnosticError(`${label} must be a non-empty string`);
  }
}

function repositoryRelative(value, label) {
  nonEmptyString(value, label);
  if (
    path.posix.isAbsolute(value) ||
    value === '..' ||
    value.startsWith('../') ||
    value.includes('/../') ||
    value.includes('\\') ||
    path.posix.normalize(value) !== value
  ) {
    throw new BoundaryDiagnosticError(`${label} must be repository-relative`);
  }
}

function normalizeLimits(options = {}) {
  const limits = {
    maxEntries: options.maxEntries ?? DEFAULT_LIMITS.maxEntries,
    maxDepth: options.maxDepth ?? DEFAULT_LIMITS.maxDepth,
    maxPathBytes: options.maxPathBytes ?? DEFAULT_LIMITS.maxPathBytes,
    maxStructuredBytes:
      options.maxStructuredBytes ?? DEFAULT_LIMITS.maxStructuredBytes,
    maxPathsPerIndicator:
      options.maxPathsPerIndicator ?? DEFAULT_LIMITS.maxPathsPerIndicator,
    excludedDirectories: [...DEFAULT_LIMITS.excludedDirectories],
  };
  for (const key of [
    'maxEntries',
    'maxDepth',
    'maxPathBytes',
    'maxStructuredBytes',
    'maxPathsPerIndicator',
  ]) positiveInteger(limits[key], key);
  return limits;
}

function pathMatches(paths, matchers) {
  return paths.filter((relativePath) =>
    matchers.some((matcher) => matcher.test(relativePath))
  );
}

function indicator({
  id,
  category,
  matches = [],
  unknown = false,
  evidence = 'bounded-marker-scan',
  limits,
}) {
  const sorted = [...new Set(matches)].sort();
  const visible = sorted.slice(0, limits.maxPathsPerIndicator);
  const unresolved = unknown && sorted.length === 0;
  return {
    id,
    category,
    status: unresolved ? 'unknown' : sorted.length > 0 ? 'detected' : 'not-detected',
    evidence: unresolved
      ? evidence
      : sorted.length > 0
        ? evidence
        : 'marker-not-observed',
    count: sorted.length,
    paths: visible,
    pathsTruncated: visible.length !== sorted.length,
  };
}

async function inventoryRepository(root, limits) {
  const inventory = {
    entriesObserved: 0,
    regularFiles: 0,
    directories: 0,
    symlinks: 0,
    other: 0,
    unreadable: 0,
    excludedDirectories: 0,
    truncated: false,
  };
  const paths = [];
  const excluded = new Set(limits.excludedDirectories);

  async function visit(relativeDirectory, depth) {
    if (inventory.truncated) return;
    if (depth > limits.maxDepth) {
      inventory.truncated = true;
      return;
    }
    let entries;
    try {
      entries = await readdir(
        relativeDirectory === '' ? root : path.join(root, relativeDirectory),
        { withFileTypes: true },
      );
    } catch {
      inventory.unreadable += 1;
      return;
    }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (inventory.entriesObserved >= limits.maxEntries) {
        inventory.truncated = true;
        return;
      }
      const relativePath = relativeDirectory === ''
        ? entry.name
        : `${relativeDirectory}/${entry.name}`;
      if (Buffer.byteLength(relativePath, 'utf8') > limits.maxPathBytes) {
        inventory.truncated = true;
        continue;
      }
      inventory.entriesObserved += 1;
      paths.push(relativePath);
      if (entry.isSymbolicLink()) {
        inventory.symlinks += 1;
        continue;
      }
      if (entry.isDirectory()) {
        inventory.directories += 1;
        if (excluded.has(entry.name)) {
          inventory.excludedDirectories += 1;
          continue;
        }
        await visit(relativePath, depth + 1);
        continue;
      }
      if (entry.isFile()) inventory.regularFiles += 1;
      else inventory.other += 1;
    }
  }

  await visit('', 0);
  return { inventory, paths: paths.sort() };
}

async function readPackageMetadata(root, paths, limits) {
  if (!paths.includes('package.json')) {
    return { status: 'absent', scripts: [], publication: false };
  }
  const target = path.join(root, 'package.json');
  let metadata;
  try {
    metadata = await lstat(target);
  } catch {
    return { status: 'unreadable', scripts: [], publication: false };
  }
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.size > limits.maxStructuredBytes
  ) {
    return { status: 'unreadable', scripts: [], publication: false };
  }
  try {
    const parsed = JSON.parse(await readFile(target, 'utf8'));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return { status: 'invalid', scripts: [], publication: false };
    }
    const scripts = parsed.scripts &&
      !Array.isArray(parsed.scripts) &&
      typeof parsed.scripts === 'object'
      ? Object.keys(parsed.scripts).filter((name) =>
        ['build', 'check', 'lint', 'test', 'typecheck', 'verify'].includes(name)
      ).sort()
      : [];
    return {
      status: 'parsed',
      scripts,
      publication: Boolean(parsed.publishConfig) ||
        Boolean(parsed.scripts && Object.hasOwn(parsed.scripts, 'publish')),
    };
  } catch {
    return { status: 'invalid', scripts: [], publication: false };
  }
}

function completionCandidates(packageMetadata) {
  if (packageMetadata.status !== 'parsed') return [];
  return packageMetadata.scripts.map((name) => ({
    id: `package-script:${name}`,
    source: 'package.json',
    invocation: ['npm', name === 'test' ? 'test' : 'run', ...(name === 'test' ? [] : [name])],
  }));
}

function summaryFor(indicators, candidates) {
  const summary = {
    totalIndicators: indicators.length,
    detected: 0,
    notDetected: 0,
    unknown: 0,
    completionCandidates: candidates.length,
  };
  for (const item of indicators) {
    if (item.status === 'not-detected') summary.notDetected += 1;
    else summary[item.status] += 1;
  }
  return summary;
}

export async function createBoundaryDiagnostic({ repoRoot, limits: requestedLimits }) {
  let root;
  try {
    root = await realpath(repoRoot);
  } catch {
    throw new BoundaryDiagnosticError('repository root must be an existing directory');
  }
  const rootMetadata = await lstat(root);
  if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
    throw new BoundaryDiagnosticError('repository root must resolve to a directory');
  }
  const limits = normalizeLimits(requestedLimits);
  const { inventory, paths } = await inventoryRepository(root, limits);
  const packageMetadata = await readPackageMetadata(root, paths, limits);
  const candidates = completionCandidates(packageMetadata);
  const missingIsUnknown = inventory.truncated;
  const packageUnknown = ['invalid', 'unreadable'].includes(packageMetadata.status);
  const scopaPaths = paths.filter((item) =>
    item === '.scopa/config.json' || item === '.scopa/slice-lock.json'
  );
  const scopaInitialized = scopaPaths.length === 2;
  let hostWritable = false;
  try {
    await access(root, constants.W_OK);
    hostWritable = true;
  } catch {
    // An unavailable host-process write route is not proof of an agent state.
  }

  const detectedPublication = pathMatches(paths, PUBLICATION_MATCHERS);
  if (packageMetadata.publication) detectedPublication.push('package.json');
  const packageScriptPaths = packageMetadata.scripts.length > 0 ? ['package.json'] : [];
  const scanEvidence = inventory.truncated ? 'scan-truncated' : 'not-probed';
  const indicators = [
    indicator({
      id: 'agent.configuration-markers', category: 'agent-config',
      matches: pathMatches(paths, AGENT_CONFIG_MATCHERS),
      unknown: missingIsUnknown, limits,
    }),
    indicator({
      id: 'agent.hook-markers', category: 'tool-extension',
      matches: pathMatches(paths, HOOK_MATCHERS),
      unknown: missingIsUnknown, limits,
    }),
    indicator({
      id: 'agent.mcp-markers', category: 'tool-extension',
      matches: pathMatches(paths, MCP_MATCHERS),
      unknown: missingIsUnknown, limits,
    }),
    indicator({
      id: 'agent.tool-authority', category: 'tool-extension', unknown: true,
      evidence: 'not-probed', limits,
    }),
    indicator({
      id: 'authority.browser', category: 'browser', unknown: true,
      evidence: 'not-probed', limits,
    }),
    indicator({
      id: 'authority.credential-markers', category: 'credentials',
      matches: pathMatches(paths, CREDENTIAL_MARKER_MATCHERS),
      unknown: missingIsUnknown, limits,
    }),
    indicator({
      id: 'authority.deployment-markers', category: 'deployment',
      matches: pathMatches(paths, DEPLOYMENT_MATCHERS),
      unknown: missingIsUnknown, limits,
    }),
    indicator({
      id: 'authority.external-systems', category: 'external-system',
      unknown: true, evidence: 'not-probed', limits,
    }),
    indicator({
      id: 'authority.network', category: 'network', unknown: true,
      evidence: 'not-probed', limits,
    }),
    indicator({
      id: 'authority.provider', category: 'provider', unknown: true,
      evidence: 'not-probed', limits,
    }),
    indicator({
      id: 'authority.publication-markers', category: 'publication',
      matches: detectedPublication, unknown: missingIsUnknown, limits,
    }),
    indicator({
      id: 'completion.ci-markers', category: 'completion',
      matches: pathMatches(paths, CI_MATCHERS),
      unknown: missingIsUnknown, limits,
    }),
    indicator({
      id: 'completion.package-script-candidates', category: 'completion',
      matches: packageScriptPaths,
      unknown: packageUnknown || (missingIsUnknown && packageMetadata.status === 'absent'),
      evidence: packageUnknown ? 'not-probed' : 'bounded-package-manifest',
      limits,
    }),
    indicator({
      id: 'host.filesystem-write', category: 'host-process',
      matches: hostWritable ? ['.'] : [], unknown: !hostWritable,
      evidence: 'host-process-access-check', limits,
    }),
    indicator({
      id: 'host.process-execution', category: 'host-process',
      matches: ['.'], evidence: 'doctor-process-running', limits,
    }),
    indicator({
      id: 'repository.instructions', category: 'instructions',
      matches: pathMatches(paths, INSTRUCTION_MATCHERS),
      unknown: missingIsUnknown, limits,
    }),
    indicator({
      id: 'repository.scan-completeness', category: 'repository',
      matches: inventory.truncated ? [] : ['.'], unknown: inventory.truncated,
      evidence: inventory.truncated ? scanEvidence : 'bounded-marker-scan', limits,
    }),
    indicator({
      id: 'scopa.control-markers', category: 'scopa-control',
      matches: scopaPaths,
      unknown: missingIsUnknown, limits,
    }),
  ].sort((left, right) => left.id.localeCompare(right.id));

  return validateBoundaryDiagnostic({
    schema: BOUNDARY_DIAGNOSTIC_SCHEMA,
    subject: {
      kind: 'host-process-observation',
      repositoryKind: paths.includes('.git') ? 'git' : 'directory',
      scopaInitialized,
    },
    limits,
    inventory,
    indicators,
    completionCandidates: candidates,
    summary: summaryFor(indicators, candidates),
    posture: {
      level: 'review-required',
      basis: 'zero-state-observation-does-not-measure-agent-authority',
    },
    claims: {
      agentAuthorityMeasured: false,
      environmentInspected: false,
      fileContentsIndexed: false,
      networkProbed: false,
      repositoryMutated: false,
    },
  });
}

export function validateBoundaryDiagnostic(value) {
  exactObject(value, TOP_LEVEL_KEYS, 'boundary diagnostic');
  if (value.schema !== BOUNDARY_DIAGNOSTIC_SCHEMA) {
    throw new BoundaryDiagnosticError('unsupported boundary diagnostic schema');
  }
  exactObject(value.subject, SUBJECT_KEYS, 'subject');
  if (value.subject.kind !== 'host-process-observation') {
    throw new BoundaryDiagnosticError('subject.kind is unsupported');
  }
  if (!['directory', 'git'].includes(value.subject.repositoryKind)) {
    throw new BoundaryDiagnosticError('subject.repositoryKind is unsupported');
  }
  if (typeof value.subject.scopaInitialized !== 'boolean') {
    throw new BoundaryDiagnosticError('subject.scopaInitialized must be boolean');
  }

  exactObject(value.limits, LIMIT_KEYS, 'limits');
  for (const key of [
    'maxEntries', 'maxDepth', 'maxPathBytes', 'maxStructuredBytes',
    'maxPathsPerIndicator',
  ]) positiveInteger(value.limits[key], `limits.${key}`);
  if (
    !Array.isArray(value.limits.excludedDirectories) ||
    value.limits.excludedDirectories.join('\0') !==
      [...value.limits.excludedDirectories].sort().join('\0') ||
    new Set(value.limits.excludedDirectories).size !==
      value.limits.excludedDirectories.length
  ) {
    throw new BoundaryDiagnosticError('limits.excludedDirectories must be unique and sorted');
  }

  exactObject(value.inventory, INVENTORY_KEYS, 'inventory');
  for (const key of [
    'entriesObserved', 'regularFiles', 'directories', 'symlinks', 'other',
    'unreadable', 'excludedDirectories',
  ]) count(value.inventory[key], `inventory.${key}`);
  if (typeof value.inventory.truncated !== 'boolean') {
    throw new BoundaryDiagnosticError('inventory.truncated must be boolean');
  }
  if (value.inventory.entriesObserved > value.limits.maxEntries) {
    throw new BoundaryDiagnosticError('inventory exceeds maxEntries');
  }
  const typedEntries = value.inventory.regularFiles +
    value.inventory.directories + value.inventory.symlinks + value.inventory.other;
  if (typedEntries !== value.inventory.entriesObserved) {
    throw new BoundaryDiagnosticError('inventory entry counts are inconsistent');
  }

  if (!Array.isArray(value.indicators) || value.indicators.length === 0) {
    throw new BoundaryDiagnosticError('indicators must be a non-empty array');
  }
  let previousId = null;
  for (const [index, item] of value.indicators.entries()) {
    exactObject(item, INDICATOR_KEYS, `indicators[${index}]`);
    nonEmptyString(item.id, `indicators[${index}].id`);
    if (previousId !== null && previousId.localeCompare(item.id) >= 0) {
      throw new BoundaryDiagnosticError('indicators must use unique sorted ids');
    }
    previousId = item.id;
    if (!CATEGORIES.has(item.category)) {
      throw new BoundaryDiagnosticError(`indicators[${index}].category is unsupported`);
    }
    if (!STATUSES.has(item.status)) {
      throw new BoundaryDiagnosticError(`indicators[${index}].status is unsupported`);
    }
    if (!EVIDENCE.has(item.evidence)) {
      throw new BoundaryDiagnosticError(`indicators[${index}].evidence is unsupported`);
    }
    count(item.count, `indicators[${index}].count`);
    if (!Array.isArray(item.paths) || item.paths.length > value.limits.maxPathsPerIndicator) {
      throw new BoundaryDiagnosticError(`indicators[${index}].paths is invalid`);
    }
    for (const [pathIndex, relativePath] of item.paths.entries()) {
      repositoryRelative(relativePath, `indicators[${index}].paths[${pathIndex}]`);
    }
    if (
      item.paths.join('\0') !== [...item.paths].sort().join('\0') ||
      new Set(item.paths).size !== item.paths.length ||
      typeof item.pathsTruncated !== 'boolean' ||
      item.pathsTruncated !== (item.count > item.paths.length)
    ) {
      throw new BoundaryDiagnosticError(`indicators[${index}] path projection is inconsistent`);
    }
    if (
      (item.status === 'unknown' && item.count !== 0) ||
      (item.status === 'not-detected' && item.count !== 0) ||
      (item.status === 'detected' && item.count === 0)
    ) {
      throw new BoundaryDiagnosticError(`indicators[${index}] status and count disagree`);
    }
  }

  if (!Array.isArray(value.completionCandidates)) {
    throw new BoundaryDiagnosticError('completionCandidates must be an array');
  }
  let previousCandidate = null;
  for (const [index, candidate] of value.completionCandidates.entries()) {
    exactObject(candidate, CANDIDATE_KEYS, `completionCandidates[${index}]`);
    nonEmptyString(candidate.id, `completionCandidates[${index}].id`);
    if (previousCandidate !== null && previousCandidate.localeCompare(candidate.id) >= 0) {
      throw new BoundaryDiagnosticError('completionCandidates must use unique sorted ids');
    }
    previousCandidate = candidate.id;
    if (candidate.source !== 'package.json') {
      throw new BoundaryDiagnosticError(`completionCandidates[${index}].source is unsupported`);
    }
    if (
      !Array.isArray(candidate.invocation) || candidate.invocation.length < 2 ||
      candidate.invocation.some((part) => typeof part !== 'string' || part.length === 0)
    ) {
      throw new BoundaryDiagnosticError(`completionCandidates[${index}].invocation is invalid`);
    }
  }

  exactObject(value.summary, SUMMARY_KEYS, 'summary');
  const expectedSummary = summaryFor(value.indicators, value.completionCandidates);
  for (const [key, expected] of Object.entries(expectedSummary)) {
    if (value.summary[key] !== expected) {
      throw new BoundaryDiagnosticError(`summary.${key} is inconsistent`);
    }
  }
  exactObject(value.posture, POSTURE_KEYS, 'posture');
  if (
    value.posture.level !== 'review-required' ||
    value.posture.basis !== 'zero-state-observation-does-not-measure-agent-authority'
  ) {
    throw new BoundaryDiagnosticError('posture overstates zero-state evidence');
  }
  exactObject(value.claims, CLAIM_KEYS, 'claims');
  for (const key of CLAIM_KEYS) {
    if (value.claims[key] !== false) {
      throw new BoundaryDiagnosticError(`claims.${key} must remain false`);
    }
  }
  const scan = value.indicators.find((item) => item.id === 'repository.scan-completeness');
  if (
    !scan ||
    value.inventory.truncated !== (scan.status === 'unknown')
  ) {
    throw new BoundaryDiagnosticError('scan completeness contradicts inventory');
  }
  const scopa = value.indicators.find((item) => item.id === 'scopa.control-markers');
  if (
    !scopa ||
    value.subject.scopaInitialized !== (scopa.count === 2)
  ) {
    throw new BoundaryDiagnosticError('SCOPA initialization marker is inconsistent');
  }
  return deepFreeze(JSON.parse(canonicalJsonPretty(value)));
}
