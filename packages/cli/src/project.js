import {
  link,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJsonPretty,
  createSliceLock,
  loadSliceLock,
} from '../../enforcement/src/index.js';

export const PROJECT_CONFIG_SCHEMA = 'scopa.project-config.v1';
export const PROJECT_CONFIG_PATH = '.scopa/config.json';
export const PROJECT_BEGIN_STATE_PATH = '.scopa/begin-state.json';
export const PROJECT_LOCK_PATH = '.scopa/slice-lock.json';
export const PROJECT_ROTATION_PATH = '.scopa/rotation.json';

const CONFIG_KEYS = new Set([
  'lockFile',
  'rotationFile',
  'schema',
]);

let temporarySequence = 0;

export class ProjectConfigurationError extends Error {
  constructor(message, {
    code = 'SCOPA_PROJECT_CONFIG_INVALID',
    details = null,
  } = {}) {
    super(message);
    this.name = 'ProjectConfigurationError';
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
    throw new ProjectConfigurationError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value);
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !keys.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new ProjectConfigurationError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function validateRepositoryRelativePath(value, label) {
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
    throw new ProjectConfigurationError(
      `${label} must be a normalized repository-relative path`,
    );
  }
}

export function validateProjectConfig(config) {
  exactObject(config, CONFIG_KEYS, 'project config');
  if (config.schema !== PROJECT_CONFIG_SCHEMA) {
    throw new ProjectConfigurationError('unsupported project config schema');
  }
  validateRepositoryRelativePath(config.lockFile, 'lockFile');
  validateRepositoryRelativePath(config.rotationFile, 'rotationFile');
  if (config.lockFile === config.rotationFile) {
    throw new ProjectConfigurationError(
      'lockFile and rotationFile must be different',
    );
  }
  return Object.freeze({
    schema: config.schema,
    lockFile: config.lockFile,
    rotationFile: config.rotationFile,
  });
}

export function defaultProjectConfig() {
  return validateProjectConfig({
    schema: PROJECT_CONFIG_SCHEMA,
    lockFile: PROJECT_LOCK_PATH,
    rotationFile: PROJECT_ROTATION_PATH,
  });
}

function resolveInside(root, relativePath, label) {
  validateRepositoryRelativePath(relativePath, label);
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new ProjectConfigurationError(`${label} escapes repository`);
  }
  return resolved;
}

async function existingContent(target) {
  let metadata;
  try {
    metadata = await lstat(target);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1
  ) {
    throw new ProjectConfigurationError(
      'refusing an aliased or non-regular SCOPA control file',
      {
        code: 'SCOPA_INIT_CONFLICT',
        details: { path: target },
      },
    );
  }
  return readFile(target, 'utf8');
}

async function assertSafeControlDirectory(root, { create = false } = {}) {
  const directory = path.join(root, '.scopa');
  let metadata;
  try {
    metadata = await lstat(directory);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if (!create) {
      throw new ProjectConfigurationError(
        'SCOPA has not been initialized in this repository',
        { details: { path: '.scopa' } },
      );
    }
    await mkdir(directory, { recursive: false, mode: 0o700 });
    metadata = await lstat(directory);
  }
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new ProjectConfigurationError(
      'refusing an aliased or non-directory .scopa control path',
      {
        code: 'SCOPA_INIT_CONFLICT',
        details: { path: '.scopa' },
      },
    );
  }
  const resolved = await realpath(directory);
  if (resolved !== directory) {
    throw new ProjectConfigurationError(
      'refusing a .scopa control path with changed topology',
      {
        code: 'SCOPA_INIT_CONFLICT',
        details: { path: '.scopa' },
      },
    );
  }
  return directory;
}

async function publishExclusive(target, content) {
  const directory = path.dirname(target);
  const temporary = path.join(
    directory,
    `.scopa-${process.pid}-${temporarySequence += 1}.tmp`,
  );
  const handle = await open(temporary, 'wx', 0o600);
  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await link(temporary, target);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

async function initializeFiles(entries) {
  const state = [];
  for (const entry of entries) {
    const existing = await existingContent(entry.target);
    if (existing !== null && existing !== entry.content) {
      throw new ProjectConfigurationError(
        `refusing to overwrite existing ${entry.label}`,
        {
          code: 'SCOPA_INIT_CONFLICT',
          details: { path: entry.relativePath },
        },
      );
    }
    state.push({ ...entry, existing });
  }

  const created = [];
  const unchanged = [];
  for (const entry of state) {
    if (entry.existing !== null) {
      unchanged.push(entry.relativePath);
      continue;
    }
    try {
      await publishExclusive(entry.target, entry.content);
      created.push(entry.relativePath);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const winner = await existingContent(entry.target);
      if (winner !== entry.content) {
        throw new ProjectConfigurationError(
          `refusing to overwrite concurrently created ${entry.label}`,
          {
            code: 'SCOPA_INIT_CONFLICT',
            details: { path: entry.relativePath },
          },
        );
      }
      unchanged.push(entry.relativePath);
    }
  }
  return { created, unchanged };
}

async function initializeValidatedProject({
  root,
  definition,
  definitionRelative,
  beginState = null,
}) {
  const definitionCandidate = resolveInside(
    root,
    definitionRelative,
    'definition path',
  );
  const definitionResolvedRelative = path.relative(root, definitionCandidate)
    .split(path.sep)
    .join('/');
  if (definitionResolvedRelative !== definitionRelative) {
    throw new ProjectConfigurationError(
      'definition path must be a normalized repository-relative path',
      { details: { path: definitionRelative } },
    );
  }
  const lock = createSliceLock(definition);
  const config = defaultProjectConfig();
  await assertSafeControlDirectory(root, { create: true });
  const entries = [
    {
      label: 'slice lock',
      relativePath: config.lockFile,
      target: resolveInside(root, config.lockFile, 'lockFile'),
      content: canonicalJsonPretty(lock),
    },
    {
      label: 'project config',
      relativePath: PROJECT_CONFIG_PATH,
      target: resolveInside(root, PROJECT_CONFIG_PATH, 'config path'),
      content: canonicalJsonPretty(config),
    },
  ];
  if (beginState !== null) {
    entries.push({
      label: 'begin state',
      relativePath: PROJECT_BEGIN_STATE_PATH,
      target: resolveInside(root, PROJECT_BEGIN_STATE_PATH, 'begin state path'),
      content: canonicalJsonPretty(beginState),
    });
  }
  const result = await initializeFiles(entries);
  const initialization = {
    schema: 'scopa.init-result.v1',
    definitionPath: definitionRelative,
    lockHash: lock.definitionHash,
    configPath: PROJECT_CONFIG_PATH,
    lockPath: PROJECT_LOCK_PATH,
    created: result.created,
    unchanged: result.unchanged,
  };
  if (beginState !== null) {
    initialization.beginStatePath = PROJECT_BEGIN_STATE_PATH;
  }
  return initialization;
}

export async function initializeProjectFromBeginDefinition({
  repoRoot,
  definition,
  beginState,
}) {
  const root = await realpath(repoRoot);
  return initializeValidatedProject({
    root,
    definition,
    definitionRelative: PROJECT_BEGIN_STATE_PATH,
    beginState,
  });
}

export async function initializeProjectFromDefinition({
  repoRoot,
  definition,
  definitionPath,
}) {
  const root = await realpath(repoRoot);
  return initializeValidatedProject({
    root,
    definition,
    definitionRelative: definitionPath,
  });
}

export async function initializeProject({
  repoRoot,
  definitionPath,
}) {
  const root = await realpath(repoRoot);
  const definitionRelative = path.relative(
    root,
    path.resolve(root, definitionPath),
  ).split(path.sep).join('/');
  const definitionCandidate = resolveInside(
    root,
    definitionRelative,
    'definition path',
  );
  let definitionFile;
  try {
    definitionFile = await realpath(definitionCandidate);
  } catch (error) {
    throw new ProjectConfigurationError(
      `cannot resolve slice definition: ${error.message}`,
      { details: { path: definitionRelative } },
    );
  }
  const resolvedDefinitionRelative = path.relative(root, definitionFile);
  if (
    resolvedDefinitionRelative === '..' ||
    resolvedDefinitionRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(resolvedDefinitionRelative)
  ) {
    throw new ProjectConfigurationError(
      'slice definition resolves outside repository',
      { details: { path: definitionRelative } },
    );
  }
  let definition;
  try {
    definition = JSON.parse(await readFile(definitionFile, 'utf8'));
  } catch (error) {
    throw new ProjectConfigurationError(
      `cannot load slice definition: ${error.message}`,
      { details: { path: definitionRelative } },
    );
  }
  return initializeValidatedProject({
    root,
    definition,
    definitionRelative,
  });
}

export async function loadProject(repoRoot) {
  const root = await realpath(repoRoot);
  await assertSafeControlDirectory(root);
  const configPath = resolveInside(root, PROJECT_CONFIG_PATH, 'config path');
  let parsed;
  try {
    parsed = JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    throw new ProjectConfigurationError(
      `cannot load project config: ${error.message}`,
      { details: { path: PROJECT_CONFIG_PATH } },
    );
  }
  const config = validateProjectConfig(parsed);
  const lockPath = resolveInside(root, config.lockFile, 'lockFile');
  return Object.freeze({
    repoRoot: root,
    config,
    configPath,
    lockPath,
    rotationPath: resolveInside(root, config.rotationFile, 'rotationFile'),
    lock: await loadSliceLock(lockPath),
  });
}
