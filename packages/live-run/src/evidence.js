import {
  constants as fsConstants,
} from 'node:fs';
import {
  createHash,
  randomUUID,
} from 'node:crypto';
import {
  link,
  lstat,
  open,
  realpath,
  stat,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  scanPrivateText,
} from '../../release-readiness/src/package-privacy.js';
import {
  LIVE_RECEIPT_SCHEMA,
  validateLiveReceipt,
} from './receipt.js';
import {
  validateTerminalEnvelope,
} from './schema.js';

export const LIVE_EVIDENCE_SCHEMA = 'scopa.live-evidence.v1';
export const PUBLIC_LIVE_EVIDENCE_SCHEMA = 'scopa.live-evidence.public.v1';
export const LIVE_EVIDENCE_WRITE_RECEIPT_SCHEMA =
  'scopa.live-evidence-write-receipt.v1';

const REDACTIONS = Object.freeze([
  Object.freeze({
    field: '/private/controlRoot',
    replacement: '[SCOPA_CONTROL_ROOT]',
  }),
  Object.freeze({
    field: '/private/raw',
    replacement: '[SCOPA_RAW_STREAM_REDACTED]',
  }),
  Object.freeze({
    field: '/private/repositoryRoot',
    replacement: '[SCOPA_REPOSITORY_ROOT]',
  }),
  Object.freeze({
    field: '/private/stderr',
    replacement: '[SCOPA_STDERR_REDACTED]',
  }),
  Object.freeze({
    field: '/private/stdout',
    replacement: '[SCOPA_STDOUT_REDACTED]',
  }),
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function plainObject(value, label) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError(`${label} must be a plain object`);
  }
}

function exactKeys(value, keys, label) {
  plainObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function visitStrings(value, pointer = '', entries = []) {
  if (typeof value === 'string') {
    entries.push({
      pointer: pointer || '/',
      value,
    });
    return entries;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      visitStrings(item, `${pointer}/${index}`, entries);
    });
    return entries;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      const escaped = key.replaceAll('~', '~0').replaceAll('/', '~1');
      visitStrings(item, `${pointer}/${escaped}`, entries);
    }
  }
  return entries;
}

export function createPrivateLiveEvidence({
  receipt,
  terminal,
  summary,
  repositoryRoot,
  controlRoot,
  stdout,
  stderr,
  raw,
}) {
  validateLiveReceipt(receipt);
  validateTerminalEnvelope(terminal);
  plainObject(summary, 'live evidence summary');
  for (const [value, label] of [
    [repositoryRoot, 'repositoryRoot'],
    [controlRoot, 'controlRoot'],
    [stdout, 'stdout'],
    [stderr, 'stderr'],
  ]) {
    if (typeof value !== 'string') {
      throw new TypeError(`live evidence ${label} must be a string`);
    }
  }
  return {
    schema: LIVE_EVIDENCE_SCHEMA,
    receipt: structuredClone(receipt),
    terminal: structuredClone(terminal),
    summary: structuredClone(summary),
    private: {
      repositoryRoot,
      controlRoot,
      stdout,
      stderr,
      raw: structuredClone(raw),
    },
  };
}

function validatePrivateLiveEvidence(value) {
  exactKeys(
    value,
    [
      'private',
      'receipt',
      'schema',
      'summary',
      'terminal',
    ],
    'private live evidence',
  );
  if (value.schema !== LIVE_EVIDENCE_SCHEMA) {
    throw new TypeError('private live evidence schema is invalid');
  }
  if (value.receipt?.schema !== LIVE_RECEIPT_SCHEMA) {
    throw new TypeError('private live evidence receipt schema is invalid');
  }
  validateLiveReceipt(value.receipt);
  validateTerminalEnvelope(value.terminal);
  plainObject(value.summary, 'private live evidence summary');
  exactKeys(
    value.private,
    [
      'controlRoot',
      'raw',
      'repositoryRoot',
      'stderr',
      'stdout',
    ],
    'private live evidence payload',
  );
  for (const key of [
    'controlRoot',
    'repositoryRoot',
    'stderr',
    'stdout',
  ]) {
    if (typeof value.private[key] !== 'string') {
      throw new TypeError(`private live evidence ${key} must be a string`);
    }
  }
  return value;
}

export function createPublicLiveEvidence(privateText, {
  protectedValues = [],
} = {}) {
  if (typeof privateText !== 'string') {
    throw new TypeError('private live evidence bytes must be text');
  }
  const raw = validatePrivateLiveEvidence(JSON.parse(privateText));
  if (canonicalJsonPretty(raw) !== privateText) {
    throw new TypeError('private live evidence must use canonical JSON bytes');
  }
  const entries = visitStrings(raw);
  for (const { pointer, value } of entries) {
    if (
      REDACTIONS.some(({ replacement }) => value.includes(replacement))
    ) {
      throw new TypeError(
        `private evidence contains reserved placeholder at ${pointer}`,
      );
    }
  }

  const designated = new Set(REDACTIONS.map(({ field }) => field));
  for (const rootField of [
    '/private/controlRoot',
    '/private/repositoryRoot',
  ]) {
    const root = entries.find(({ pointer }) => pointer === rootField)?.value;
    if (typeof root !== 'string' || root.length === 0) {
      throw new TypeError(`private evidence omits ${rootField}`);
    }
    for (const entry of entries) {
      if (!designated.has(entry.pointer) && entry.value.includes(root)) {
        throw new TypeError(
          `private-root semantic collision outside ${rootField}`,
        );
      }
    }
  }

  const publicEvidence = structuredClone(raw);
  publicEvidence.schema = PUBLIC_LIVE_EVIDENCE_SCHEMA;
  for (const { field, replacement } of REDACTIONS) {
    const key = field.split('/').at(-1);
    publicEvidence.private[key] = replacement;
  }
  const beforeProjection = {
    receipt: raw.receipt,
    summary: raw.summary,
    terminal: raw.terminal,
  };
  const afterProjection = {
    receipt: publicEvidence.receipt,
    summary: publicEvidence.summary,
    terminal: publicEvidence.terminal,
  };
  const semanticFieldsChanged =
    canonicalJsonPretty(beforeProjection) !==
    canonicalJsonPretty(afterProjection);
  if (semanticFieldsChanged) {
    throw new TypeError('public live evidence changed semantic fields');
  }
  publicEvidence.publicationReceipt = {
    schema: 'scopa.live-evidence-publication-receipt.v1',
    sourceSha256: sha256(privateText),
    redactions: REDACTIONS.map(({ field, replacement }) => ({
      field,
      replacement,
      occurrences: 1,
    })),
    semanticFieldsChanged,
  };
  const text = canonicalJsonPretty(publicEvidence);
  const findings = scanPrivateText(text, {
    forbiddenValues: [
      raw.private.controlRoot,
      raw.private.repositoryRoot,
      ...protectedValues,
    ],
  });
  if (findings.length !== 0) {
    throw new TypeError(
      `public live evidence failed privacy scan: ${findings.join(', ')}`,
    );
  }
  return {
    evidence: publicEvidence,
    text,
  };
}

function withinRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function resolvedTarget(root, destination) {
  if (!path.isAbsolute(root) || !path.isAbsolute(destination)) {
    throw new TypeError('evidence roots and destinations must be absolute');
  }
  const declaredRoot = path.resolve(root);
  const resolvedRoot = await realpath(declaredRoot);
  if (resolvedRoot !== declaredRoot) {
    throw new TypeError('evidence root must be a canonical path');
  }
  const declaredParent = path.resolve(path.dirname(destination));
  const parent = await realpath(declaredParent);
  if (parent !== declaredParent) {
    throw new TypeError('evidence parent aliases are not allowed');
  }
  if (!withinRoot(resolvedRoot, parent)) {
    throw new TypeError('evidence destination escapes its declared root');
  }
  const basename = path.basename(destination);
  if (basename === '.' || basename === '..' || basename.length === 0) {
    throw new TypeError('evidence destination basename is invalid');
  }
  return {
    parent,
    target: path.join(parent, basename),
  };
}

async function writeAtomicNoReplace({
  root,
  destination,
  text,
  mode,
}) {
  if (typeof text !== 'string') {
    throw new TypeError('evidence content must be text');
  }
  const resolved = await resolvedTarget(root, destination);
  let parentHandle;
  let temporaryHandle;
  let temporaryPath;
  try {
    parentHandle = await open(
      resolved.parent,
      fsConstants.O_RDONLY |
        fsConstants.O_DIRECTORY |
        fsConstants.O_NOFOLLOW,
    );
    const descriptorParent = await realpath(
      `/proc/self/fd/${parentHandle.fd}`,
    );
    if (descriptorParent !== resolved.parent) {
      throw new TypeError('evidence parent topology changed');
    }
    const descriptorTarget = path.join(
      descriptorParent,
      path.basename(resolved.target),
    );
    try {
      await lstat(descriptorTarget);
      throw new TypeError('evidence destination already exists');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }

    temporaryPath = path.join(
      descriptorParent,
      `.scopa-evidence-${process.pid}-${randomUUID()}`,
    );
    temporaryHandle = await open(
      temporaryPath,
      fsConstants.O_WRONLY |
        fsConstants.O_CREAT |
        fsConstants.O_EXCL |
        fsConstants.O_NOFOLLOW,
      0o600,
    );
    await temporaryHandle.writeFile(text, 'utf8');
    await temporaryHandle.sync();
    await temporaryHandle.chmod(mode);
    await temporaryHandle.close();
    temporaryHandle = null;
    await link(temporaryPath, descriptorTarget);
    await unlink(temporaryPath);
    temporaryPath = null;
    await parentHandle.sync();
    const metadata = await stat(descriptorTarget);
    if (
      !metadata.isFile() ||
      metadata.nlink !== 1 ||
      (metadata.mode & 0o777) !== mode
    ) {
      throw new TypeError('committed evidence metadata is invalid');
    }
    return {
      destination: resolved.target,
      bytes: Buffer.byteLength(text, 'utf8'),
      sha256: sha256(text),
      mode,
    };
  } finally {
    await temporaryHandle?.close().catch(() => {});
    if (typeof temporaryPath === 'string') {
      await unlink(temporaryPath).catch(() => {});
    }
    await parentHandle?.close().catch(() => {});
  }
}

export async function persistLiveEvidence({
  privateRoot,
  privatePath,
  publicRoot,
  publicPath,
  evidence,
  protectedValues = [],
}) {
  const privateTarget = await resolvedTarget(privateRoot, privatePath);
  const publicTarget = await resolvedTarget(publicRoot, publicPath);
  if (privateTarget.target === publicTarget.target) {
    throw new TypeError('private and public evidence destinations alias');
  }
  const privateText = canonicalJsonPretty(
    validatePrivateLiveEvidence(evidence),
  );
  const publication = createPublicLiveEvidence(privateText, {
    protectedValues,
  });
  const privateWrite = await writeAtomicNoReplace({
    root: privateRoot,
    destination: privatePath,
    text: privateText,
    mode: 0o600,
  });
  const publicWrite = await writeAtomicNoReplace({
    root: publicRoot,
    destination: publicPath,
    text: publication.text,
    mode: 0o644,
  });
  return {
    schema: LIVE_EVIDENCE_WRITE_RECEIPT_SCHEMA,
    privateSha256: privateWrite.sha256,
    publicSha256: publicWrite.sha256,
    privateBytes: privateWrite.bytes,
    publicBytes: publicWrite.bytes,
    privateMode: privateWrite.mode,
    publicMode: publicWrite.mode,
  };
}
