import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import {
  link,
  lstat,
  mkdir,
  open,
  realpath,
  rmdir,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJson,
  canonicalJsonPretty,
  deepFreeze,
  jsonHash,
} from '../../enforcement/src/index.js';

export const ASSISTANT_INSTALL_PLAN_SCHEMA = 'scopa.assistant-install-plan.v1';
export const ASSISTANT_INSTALL_RECEIPT_SCHEMA = 'scopa.assistant-install-receipt.v1';
export const ASSISTANT_INSTALL_RESULT_SCHEMA = 'scopa.assistant-install-result.v1';
export const ASSISTANT_DETECTION_SCHEMA = 'scopa.assistant-detection.v1';
export const ASSISTANT_CLIENTS = Object.freeze([
  'claude-code',
  'codex',
  'generic',
]);
export const ASSISTANT_RECEIPT_PATH = '.scopa/assistant-install.json';

const DETECTION_MARKERS = Object.freeze({
  'claude-code': Object.freeze(['.claude', '.mcp.json', 'CLAUDE.md']),
  codex: Object.freeze(['.codex']),
  generic: Object.freeze(['.agents', 'AGENTS.md']),
});
const SKILL_PATHS = Object.freeze({
  'claude-code': '.claude/skills/scopa/SKILL.md',
  codex: '.agents/skills/scopa/SKILL.md',
  generic: '.agents/skills/scopa/SKILL.md',
});
const PLAN_KEYS = new Set(['client', 'receiptPath', 'schema', 'targets']);
const TARGET_KEYS = new Set(['path', 'sha256']);
const RECEIPT_KEYS = new Set([
  'client',
  'createdDirectories',
  'planSha256',
  'schema',
  'targets',
]);
const MAX_CONTROL_BYTES = 256 * 1024;
let temporarySequence = 0;

export class AssistantInstallError extends Error {
  constructor(message, {
    code = 'SCOPA_ASSISTANT_INSTALL_INVALID',
    details = null,
  } = {}) {
    super(message);
    this.name = 'AssistantInstallError';
    this.code = code;
    this.details = details;
  }
}

function plainObject(value, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new AssistantInstallError(`${label} must be a plain object`);
  }
}

function exactObject(value, keys, label) {
  plainObject(value, label);
  const actual = Object.keys(value);
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !keys.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new AssistantInstallError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

function sha256Bytes(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function digest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/u.test(value)) {
    throw new AssistantInstallError(`${label} must be a SHA-256 digest`);
  }
  return value;
}

function relativePath(value, label) {
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
    throw new AssistantInstallError(
      `${label} must be a normalized repository-relative path`,
    );
  }
  return value;
}

function skillContent(client) {
  const clientLine = {
    'claude-code': 'This is the project-local SCOPA skill for Claude Code.',
    codex: 'This is the project-local SCOPA skill for Codex.',
    generic: 'This is a portable Agent Skills entry for compatible coding assistants.',
  }[client];
  return `---
name: scopa
description: Use for repository changes that need explicit scope, real completion gates, and truthful control-boundary reporting.
---

# SCOPA governed task

${clientLine}

1. Inspect the repository and preserve unrelated work.
2. Convert the developer's task into one explicit \`scopa.begin-request.v1\`:
   outcome, smallest allowed paths, direct argv gates, non-goals, and the
   matching client profile. Do not ask the developer to author policy JSON.
3. Run \`scopa begin --format json --request-json '<request>'\`. An initially blocked task
   gate is evidence, not a setup failure.
4. Keep every change inside the locked paths. A native editor or shell remains
   an uncontrolled bypass, so do not claim full assurance.
5. Run \`scopa check --format json\`, then \`scopa view --format json\`. Finish only
   when \`canStop\` is true. Do not report a clean boundary when
   \`outsideAllowedPaths\` or \`declaredNonGoalContacts\` is nonzero; report the
   aggregate tracked and untracked counts, or disclose unavailable observation.
   Report any authority-required or uncontrolled route.

SCOPA does not grant permission to publish, deploy, use credentials, call a
provider, browse, or change an external system.
`;
}

function targetFor(client) {
  if (!ASSISTANT_CLIENTS.includes(client)) {
    throw new AssistantInstallError(
      `client must be one of: ${ASSISTANT_CLIENTS.join(', ')}`,
    );
  }
  const content = skillContent(client);
  return { path: SKILL_PATHS[client], content, sha256: sha256Bytes(content) };
}

function createPlan(client) {
  const target = targetFor(client);
  return deepFreeze({
    schema: ASSISTANT_INSTALL_PLAN_SCHEMA,
    client,
    receiptPath: ASSISTANT_RECEIPT_PATH,
    targets: [{ path: target.path, sha256: target.sha256 }],
  });
}

export function validateAssistantInstallPlan(value) {
  exactObject(value, PLAN_KEYS, 'assistant install plan');
  if (value.schema !== ASSISTANT_INSTALL_PLAN_SCHEMA) {
    throw new AssistantInstallError('unsupported assistant install plan schema');
  }
  if (!ASSISTANT_CLIENTS.includes(value.client)) {
    throw new AssistantInstallError('assistant install plan client is unsupported');
  }
  if (value.receiptPath !== ASSISTANT_RECEIPT_PATH) {
    throw new AssistantInstallError('assistant install receipt path is unsupported');
  }
  if (!Array.isArray(value.targets) || value.targets.length !== 1) {
    throw new AssistantInstallError('assistant install plan must contain one target');
  }
  const target = value.targets[0];
  exactObject(target, TARGET_KEYS, 'assistant install target');
  relativePath(target.path, 'assistant install target path');
  digest(target.sha256, 'assistant install target digest');
  const expected = createPlan(value.client);
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new AssistantInstallError('assistant install plan does not match client bytes');
  }
  return expected;
}

function validateReceipt(value) {
  exactObject(value, RECEIPT_KEYS, 'assistant install receipt');
  if (value.schema !== ASSISTANT_INSTALL_RECEIPT_SCHEMA) {
    throw new AssistantInstallError('unsupported assistant install receipt schema');
  }
  const plan = validateAssistantInstallPlan({
    schema: ASSISTANT_INSTALL_PLAN_SCHEMA,
    client: value.client,
    receiptPath: ASSISTANT_RECEIPT_PATH,
    targets: value.targets,
  });
  if (value.planSha256 !== jsonHash(plan)) {
    throw new AssistantInstallError('assistant install receipt plan binding is invalid');
  }
  if (
    !Array.isArray(value.createdDirectories) ||
    value.createdDirectories.some((entry) => typeof entry !== 'string') ||
    new Set(value.createdDirectories).size !== value.createdDirectories.length
  ) {
    throw new AssistantInstallError('assistant install receipt directories are invalid');
  }
  for (const [index, directory] of value.createdDirectories.entries()) {
    relativePath(directory, `createdDirectories[${index}]`);
  }
  const allowedDirectories = new Set();
  for (const file of [plan.targets[0].path, ASSISTANT_RECEIPT_PATH]) {
    let directory = path.posix.dirname(file);
    while (directory !== '.') {
      allowedDirectories.add(directory);
      directory = path.posix.dirname(directory);
    }
  }
  const unexpectedDirectories = value.createdDirectories.filter(
    (directory) => !allowedDirectories.has(directory),
  );
  if (unexpectedDirectories.length > 0) {
    throw new AssistantInstallError(
      'assistant install receipt contains an unrelated directory',
    );
  }
  return deepFreeze({
    schema: ASSISTANT_INSTALL_RECEIPT_SCHEMA,
    client: value.client,
    planSha256: value.planSha256,
    targets: plan.targets,
    createdDirectories: [...value.createdDirectories],
  });
}

function contained(root, relative, label) {
  relativePath(relative, label);
  const resolved = path.resolve(root, relative);
  const lexical = path.relative(root, resolved);
  if (
    lexical === '..' ||
    lexical.startsWith(`..${path.sep}`) ||
    path.isAbsolute(lexical)
  ) {
    throw new AssistantInstallError(`${label} escapes repository`);
  }
  return resolved;
}

async function metadataOrNull(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function assertDirectoryChain(root, relativeDirectory) {
  const parts = relativeDirectory.split('/');
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    const metadata = await metadataOrNull(current);
    if (metadata === null) continue;
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new AssistantInstallError('assistant install parent path is aliased or not a directory', {
        code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
        details: { path: path.relative(root, current).split(path.sep).join('/') },
      });
    }
  }
}

async function regularFileContent(target, relative, { optional = false } = {}) {
  const metadata = await metadataOrNull(target);
  if (metadata === null) {
    if (optional) return null;
    throw new AssistantInstallError('assistant install control file is unavailable', {
      code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
      details: { path: relative },
    });
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1) {
    throw new AssistantInstallError('assistant install control file is aliased or invalid', {
      code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
      details: { path: relative },
    });
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
      opened.size > MAX_CONTROL_BYTES
    ) {
      throw new AssistantInstallError('assistant install control file changed while opening', {
        code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
        details: { path: relative },
      });
    }
    return await handle.readFile({ encoding: 'utf8' });
  } catch (error) {
    if (error instanceof AssistantInstallError) throw error;
    throw new AssistantInstallError('assistant install control file changed while opening', {
      code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
      details: { path: relative },
    });
  } finally {
    await handle?.close().catch(() => {});
  }
}

async function publishExclusive(target, content) {
  const directory = path.dirname(target);
  let resolvedDirectory;
  try {
    resolvedDirectory = await realpath(directory);
  } catch {
    throw new AssistantInstallError('assistant install target directory is unavailable', {
      code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
    });
  }
  if (resolvedDirectory !== directory) {
    throw new AssistantInstallError('assistant install target directory is aliased', {
      code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
    });
  }
  const temporary = path.join(
    directory,
    `.scopa-assistant-${process.pid}-${temporarySequence += 1}.tmp`,
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

async function createDirectories(root, relativeDirectory) {
  const created = [];
  const parts = relativeDirectory.split('/');
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    const relative = path.relative(root, current).split(path.sep).join('/');
    const metadata = await metadataOrNull(current);
    if (metadata !== null) {
      if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
        throw new AssistantInstallError('assistant install parent path changed', {
          code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
          details: { path: relative },
        });
      }
      continue;
    }
    try {
      await mkdir(current, { mode: 0o700 });
      created.push(relative);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const winner = await lstat(current);
      if (!winner.isDirectory() || winner.isSymbolicLink()) {
        throw new AssistantInstallError('assistant install parent path changed', {
          code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
          details: { path: relative },
        });
      }
    }
  }
  return created;
}

async function readReceipt(root, { optional = false } = {}) {
  const target = contained(root, ASSISTANT_RECEIPT_PATH, 'assistant receipt path');
  const text = await regularFileContent(target, ASSISTANT_RECEIPT_PATH, { optional });
  if (text === null) return null;
  try {
    return validateReceipt(JSON.parse(text));
  } catch (error) {
    if (error instanceof AssistantInstallError) throw error;
    throw new AssistantInstallError('assistant install receipt contains invalid JSON', {
      code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
      details: { path: ASSISTANT_RECEIPT_PATH },
    });
  }
}

async function markerState(root, relative) {
  const target = contained(root, relative, 'assistant detection marker');
  const metadata = await metadataOrNull(target);
  if (metadata === null) return null;
  return {
    path: relative,
    kind: metadata.isSymbolicLink()
      ? 'symlink'
      : metadata.isDirectory()
        ? 'directory'
        : metadata.isFile()
          ? 'file'
          : 'other',
  };
}

export async function detectAssistantSurfaces(repoRoot) {
  const root = await realpath(repoRoot);
  const evidence = [];
  const candidates = [];
  for (const client of ASSISTANT_CLIENTS) {
    const markers = [];
    for (const marker of DETECTION_MARKERS[client]) {
      const state = await markerState(root, marker);
      if (state !== null) markers.push(state);
    }
    if (markers.length > 0) {
      candidates.push(client);
      evidence.push({ client, markers });
    }
  }
  const status = candidates.length === 0
    ? 'unknown'
    : candidates.length === 1
      ? 'detected'
      : 'ambiguous';
  return deepFreeze({
    schema: ASSISTANT_DETECTION_SCHEMA,
    status,
    client: status === 'detected' ? candidates[0] : null,
    candidates,
    evidence,
  });
}

async function selectClient(root, requested) {
  if (requested !== 'auto') {
    if (!ASSISTANT_CLIENTS.includes(requested)) {
      throw new AssistantInstallError(
        `client must be auto or one of: ${ASSISTANT_CLIENTS.join(', ')}`,
      );
    }
    return requested;
  }
  const detection = await detectAssistantSurfaces(root);
  if (detection.status === 'unknown') return 'generic';
  if (detection.status !== 'detected') {
    throw new AssistantInstallError(
      `assistant auto-detection is ${detection.status}; choose --client ${ASSISTANT_CLIENTS.join(', ')}`,
      { details: detection },
    );
  }
  return detection.client;
}

async function validateInstalledTargets(root, receipt) {
  for (const target of receipt.targets) {
    const absolute = contained(root, target.path, 'assistant target path');
    const content = await regularFileContent(absolute, target.path);
    if (sha256Bytes(content) !== target.sha256) {
      throw new AssistantInstallError('assistant target changed after installation', {
        code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
        details: { path: target.path },
      });
    }
  }
}

export async function planAssistantInstall({ repoRoot, client = 'auto' }) {
  const root = await realpath(repoRoot);
  const selected = await selectClient(root, client);
  const plan = createPlan(selected);
  const receipt = await readReceipt(root, { optional: true });
  if (receipt !== null) {
    if (receipt.planSha256 !== jsonHash(plan)) {
      throw new AssistantInstallError('a different assistant installation already exists', {
        code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
      });
    }
    await validateInstalledTargets(root, receipt);
    return { root, plan, receipt, state: 'installed' };
  }
  for (const target of plan.targets) {
    await assertDirectoryChain(root, path.posix.dirname(target.path));
    const existing = await regularFileContent(
      contained(root, target.path, 'assistant target path'),
      target.path,
      { optional: true },
    );
    if (existing !== null) {
      throw new AssistantInstallError('refusing an unowned assistant target', {
        code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
        details: { path: target.path },
      });
    }
  }
  await assertDirectoryChain(root, path.posix.dirname(ASSISTANT_RECEIPT_PATH));
  return { root, plan, receipt: null, state: 'absent' };
}

export async function installAssistant({
  repoRoot,
  client = 'auto',
  dryRun = false,
}) {
  const prepared = await planAssistantInstall({ repoRoot, client });
  if (dryRun || prepared.state === 'installed') {
    return deepFreeze({
      schema: ASSISTANT_INSTALL_RESULT_SCHEMA,
      action: dryRun ? 'preview' : 'install',
      status: prepared.state,
      plan: prepared.plan,
      created: [],
      unchanged: prepared.state === 'installed'
        ? [...prepared.plan.targets.map((target) => target.path), ASSISTANT_RECEIPT_PATH]
        : [],
    });
  }

  const targetData = targetFor(prepared.plan.client);
  const createdDirectories = [];
  const createdFiles = [];
  try {
    for (const relativeDirectory of [
      path.posix.dirname(targetData.path),
      path.posix.dirname(ASSISTANT_RECEIPT_PATH),
    ]) {
      for (const created of await createDirectories(prepared.root, relativeDirectory)) {
        if (!createdDirectories.includes(created)) createdDirectories.push(created);
      }
    }
    await publishExclusive(
      contained(prepared.root, targetData.path, 'assistant target path'),
      targetData.content,
    );
    createdFiles.push(targetData.path);
    const receipt = validateReceipt({
      schema: ASSISTANT_INSTALL_RECEIPT_SCHEMA,
      client: prepared.plan.client,
      planSha256: jsonHash(prepared.plan),
      targets: prepared.plan.targets,
      createdDirectories,
    });
    await publishExclusive(
      contained(prepared.root, ASSISTANT_RECEIPT_PATH, 'assistant receipt path'),
      canonicalJsonPretty(receipt),
    );
    createdFiles.push(ASSISTANT_RECEIPT_PATH);
  } catch (error) {
    for (const relative of [...createdFiles].reverse()) {
      await unlink(contained(prepared.root, relative, 'rollback path')).catch(() => {});
    }
    for (const relative of [...createdDirectories].reverse()) {
      await rmdir(contained(prepared.root, relative, 'rollback directory')).catch(() => {});
    }
    if (error.code === 'EEXIST') {
      throw new AssistantInstallError('assistant install target changed during publication', {
        code: 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
      });
    }
    throw error;
  }
  return deepFreeze({
    schema: ASSISTANT_INSTALL_RESULT_SCHEMA,
    action: 'install',
    status: 'installed',
    plan: prepared.plan,
    created: createdFiles,
    unchanged: [],
  });
}

export async function uninstallAssistant({ repoRoot, dryRun = false }) {
  const root = await realpath(repoRoot);
  const receipt = await readReceipt(root);
  await validateInstalledTargets(root, receipt);
  const plan = createPlan(receipt.client);
  if (dryRun) {
    return deepFreeze({
      schema: ASSISTANT_INSTALL_RESULT_SCHEMA,
      action: 'preview-uninstall',
      status: 'installed',
      plan,
      created: [],
      unchanged: [...plan.targets.map((target) => target.path), ASSISTANT_RECEIPT_PATH],
    });
  }
  const removed = [];
  for (const target of plan.targets) {
    await unlink(contained(root, target.path, 'assistant target path'));
    removed.push(target.path);
  }
  // The receipt is removed last so interrupted cleanup stays diagnosable.
  await unlink(contained(root, ASSISTANT_RECEIPT_PATH, 'assistant receipt path'));
  removed.push(ASSISTANT_RECEIPT_PATH);
  const removedDirectories = [];
  for (const directory of [...receipt.createdDirectories].reverse()) {
    try {
      await rmdir(contained(root, directory, 'assistant directory'));
      removedDirectories.push(directory);
    } catch (error) {
      if (!['ENOTEMPTY', 'EEXIST', 'ENOENT'].includes(error.code)) throw error;
    }
  }
  return deepFreeze({
    schema: ASSISTANT_INSTALL_RESULT_SCHEMA,
    action: 'uninstall',
    status: 'removed',
    plan,
    removed,
    removedDirectories,
  });
}
