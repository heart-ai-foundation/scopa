import {
  createHash,
} from 'node:crypto';
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  candidatePathIsCanonical,
} from './candidate-path.js';
import {
  FORBIDDEN_PACKED_PREFIXES,
  RELEASE_PACKAGE_NAME,
  RELEASE_SCHEMAS,
  RELEASE_VERSION,
  REQUIRED_PACKED_PREFIXES,
} from './constants.js';
import {
  validateCandidateManifest,
} from './schema.js';
import {
  invokeCaptured,
} from './subprocess.js';

const CONSUMER_PACKAGE_FIELDS = Object.freeze([
  'name',
  'version',
  'private',
  'license',
  'description',
  'type',
  'bin',
  'exports',
  'files',
  'repository',
  'engines',
  'dependencies',
]);

async function invoke(command, args, options = {}) {
  const result = await invokeCaptured(command, args, options);
  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function hash(bytes, algorithm, encoding = 'hex') {
  return createHash(algorithm).update(bytes).digest(encoding);
}

function assertPackedSurface(files) {
  const paths = files.map((entry) => entry.path);
  for (const prefix of REQUIRED_PACKED_PREFIXES) {
    if (
      !paths.some((filePath) =>
        prefix.endsWith('/')
          ? filePath.startsWith(prefix)
          : filePath === prefix
      )
    ) {
      throw new Error(`candidate package is missing required surface ${prefix}`);
    }
  }
  for (const filePath of paths) {
    if (!candidatePathIsCanonical(filePath)) {
      throw new Error(`candidate package contains unsafe path ${filePath}`);
    }
    const forbidden = FORBIDDEN_PACKED_PREFIXES.find(
      (prefix) => filePath === prefix || filePath.startsWith(prefix),
    );
    if (forbidden) {
      throw new Error(
        `candidate package contains private/build surface ${filePath}`,
      );
    }
  }
}

const EXTERNAL_URI =
  /\b[A-Za-z][A-Za-z0-9+.-]*:(?:\/\/)?[^\s)\]}>]+/g;
const PACKED_DOCUMENT_REFERENCE =
  /\b(?:(?:docs|fixtures|packages|schemas|spec)\/[A-Za-z0-9@._/*?-]+|[A-Z*?][A-Z0-9_*?-]*\.[A-Za-z0-9._*?-]+|LICENSE|package\.json)(?=$|[\s`'"),.;:#\]}>])/g;
const CONTRIBUTOR_NPM_COMMAND = /\bnpm\s+(?:audit\b|run\b|test\b)/ig;
const SOURCE_CHECKOUT_QUALIFICATION = /\bsource[- ]checkout\b/i;
const INSTALLED_CONSUMER_QUALIFICATION =
  /\b(?:installed\s+(?:users?|consumers?)|source-free|tarball-only)\b/i;
const NPM_QUALIFICATION_WINDOW = 1024;

function globPattern(reference) {
  let source = '^';
  for (let index = 0; index < reference.length; index += 1) {
    const character = reference[index];
    if (character === '*') {
      if (reference[index + 1] === '*') {
        source += '.*';
        index += 1;
      } else {
        source += '[^/]*';
      }
    } else if (character === '?') {
      source += '[^/]';
    } else {
      source += character.replace(/[\\^$+.()|[\]{}]/g, '\\$&');
    }
  }
  return new RegExp(`${source}(?:/.*)?$`, 'u');
}

function packedReferenceExists(reference, packedPaths, packed) {
  const normalized = reference.replace(/\/+$/g, '');
  if (
    packed.has(normalized) ||
    packedPaths.some((filePath) => filePath.startsWith(`${normalized}/`))
  ) {
    return true;
  }
  if (!normalized.includes('*') && !normalized.includes('?')) return false;
  const pattern = globPattern(normalized);
  return packedPaths.some((filePath) => pattern.test(filePath));
}

export function findMissingPackedDocumentationReferences({
  documents,
  packedPaths,
}) {
  if (
    !Array.isArray(documents) ||
    !Array.isArray(packedPaths) ||
    documents.some(
      (entry) =>
        typeof entry?.path !== 'string' ||
        typeof entry?.text !== 'string',
    ) ||
    packedPaths.some((entry) => typeof entry !== 'string')
  ) {
    throw new TypeError(
      'documentation reference audit requires documents and packed paths',
    );
  }
  const packed = new Set(packedPaths);
  const missing = [];
  const seenMissing = new Set();
  for (const document of documents) {
    const localText = document.text.replace(EXTERNAL_URI, '');
    for (const match of localText.matchAll(PACKED_DOCUMENT_REFERENCE)) {
      const reference = match[0].replace(/[.,;:]+$/g, '');
      if (packedReferenceExists(reference, packedPaths, packed)) continue;
      const key = `${document.path}\0${reference}`;
      if (seenMissing.has(key)) continue;
      seenMissing.add(key);
      missing.push({
        document: document.path,
        reference,
      });
    }
  }
  return missing.sort((left, right) => {
    const leftKey = `${left.document}\0${left.reference}`;
    const rightKey = `${right.document}\0${right.reference}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
}

export function findUnqualifiedPackedNpmScriptDocuments(documents) {
  if (
    !Array.isArray(documents) ||
    documents.some(
      (entry) =>
        typeof entry?.path !== 'string' ||
        typeof entry?.text !== 'string',
    )
  ) {
    throw new TypeError('npm documentation audit requires documents');
  }
  const unqualified = [];
  for (const { path: documentPath, text } of documents) {
    let failed = false;
    for (const match of text.matchAll(CONTRIBUTOR_NPM_COMMAND)) {
      const start = Math.max(0, match.index - NPM_QUALIFICATION_WINDOW);
      const prefix = text.slice(start, match.index);
      const sourceMatches = [...prefix.matchAll(
        new RegExp(SOURCE_CHECKOUT_QUALIFICATION.source, 'ig'),
      )];
      const lastSource = sourceMatches.at(-1)?.index ?? -1;
      const sentenceStart = Math.max(
        prefix.lastIndexOf('.'),
        prefix.lastIndexOf('!'),
        prefix.lastIndexOf('?'),
        prefix.lastIndexOf('\n|'),
        prefix.lastIndexOf('\n\n'),
      ) + 1;
      const commandSentencePrefix = prefix.slice(sentenceStart);
      if (
        lastSource === -1 ||
        INSTALLED_CONSUMER_QUALIFICATION.test(commandSentencePrefix)
      ) {
        failed = true;
        break;
      }
    }
    if (failed) unqualified.push(documentPath);
  }
  return unqualified.sort();
}

async function assertPackedDocumentationReferences(root, files) {
  const packedPaths = files.map(({ path: filePath }) => filePath);
  const documents = await Promise.all(
    packedPaths
      .filter((filePath) => filePath.endsWith('.md'))
      .map(async (filePath) => ({
        path: filePath,
        text: await readFile(path.join(root, ...filePath.split('/')), 'utf8'),
      })),
  );
  const missing = findMissingPackedDocumentationReferences({
    documents,
    packedPaths,
  });
  if (missing.length !== 0) {
    const [{ document, reference }] = missing;
    throw new Error(
      `packed documentation ${document} references absent ${reference}`,
    );
  }
  const unqualifiedNpm = findUnqualifiedPackedNpmScriptDocuments(documents);
  if (unqualifiedNpm.length !== 0) {
    throw new Error(
      `packed documentation ${unqualifiedNpm[0]} prescribes contributor npm commands without source-checkout qualification`,
    );
  }
}

export function createConsumerPackageJson(sourcePackage) {
  if (
    sourcePackage === null ||
    typeof sourcePackage !== 'object' ||
    Array.isArray(sourcePackage)
  ) {
    throw new TypeError('source package metadata must be an object');
  }
  const consumerPackage = {};
  for (const field of CONSUMER_PACKAGE_FIELDS) {
    if (!Object.hasOwn(sourcePackage, field)) {
      throw new TypeError(
        `source package metadata is missing consumer field ${field}`,
      );
    }
    consumerPackage[field] = structuredClone(sourcePackage[field]);
  }
  if (
    consumerPackage.name !== RELEASE_PACKAGE_NAME ||
    consumerPackage.version !== RELEASE_VERSION
  ) {
    throw new TypeError('consumer package identity does not match release');
  }
  return consumerPackage;
}

async function createConsumerStage(root) {
  const dryRun = await invoke('npm', [
    'pack',
    '--dry-run',
    '--ignore-scripts',
    '--json',
  ], { cwd: root });
  const records = JSON.parse(dryRun.stdout);
  if (!Array.isArray(records) || records.length !== 1) {
    throw new Error('npm pack dry run must return exactly one record');
  }
  await assertPackedDocumentationReferences(root, records[0].files);
  const stageRoot = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-consumer-stage-'),
  );
  try {
    for (const entry of records[0].files) {
      if (entry.path === 'package.json') continue;
      if (!candidatePathIsCanonical(entry.path)) {
        throw new Error('npm pack inventory contains a non-canonical path');
      }
      const parts = entry.path.split('/');
      const source = path.join(root, ...parts);
      const destination = path.join(stageRoot, ...parts);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(source, destination);
      if (Number.isSafeInteger(entry.mode)) {
        await chmod(destination, entry.mode);
      }
    }
    const sourcePackage = JSON.parse(
      await readFile(path.join(root, 'package.json'), 'utf8'),
    );
    const consumerPackage = createConsumerPackageJson(sourcePackage);
    await writeFile(
      path.join(stageRoot, 'package.json'),
      `${JSON.stringify(consumerPackage, null, 2)}\n`,
      { mode: 0o644 },
    );
    return {
      consumerPackage,
      stageRoot,
    };
  } catch (error) {
    await rm(stageRoot, { recursive: true, force: true });
    throw error;
  }
}

export async function packCandidate({
  sourceRoot,
  outputDirectory,
  requireClean = true,
}) {
  const root = path.resolve(sourceRoot);
  const gitStatus = (
    await invoke('git', ['status', '--porcelain'], { cwd: root })
  ).stdout.trim();
  if (requireClean && gitStatus !== '') {
    throw new Error('candidate source must be a clean Git worktree');
  }
  const commit = (
    await invoke('git', ['rev-parse', 'HEAD'], { cwd: root })
  ).stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error('candidate source commit could not be resolved');
  }
  const destination = path.resolve(outputDirectory);
  await mkdir(destination, { recursive: true });
  const {
    consumerPackage,
    stageRoot,
  } = await createConsumerStage(root);
  let packResult;
  try {
    packResult = await invoke('npm', [
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      destination,
    ], { cwd: stageRoot });
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
  const records = JSON.parse(packResult.stdout);
  if (!Array.isArray(records) || records.length !== 1) {
    throw new Error('npm pack must return exactly one candidate record');
  }
  const record = records[0];
  if (
    record.name !== RELEASE_PACKAGE_NAME ||
    record.version !== RELEASE_VERSION
  ) {
    throw new Error('npm pack returned an unexpected package identity');
  }
  const files = record.files
    .map(({ path: filePath, size, mode }) => ({
      path: filePath,
      size,
      mode,
    }))
    .sort((left, right) => {
      if (left.path === right.path) return 0;
      return left.path < right.path ? -1 : 1;
    });
  assertPackedSurface(files);

  const artifactPath = path.join(
    destination,
    record.filename,
  );
  const bytes = await readFile(artifactPath);
  const shasum = hash(bytes, 'sha1');
  const integrity = `sha512-${hash(bytes, 'sha512', 'base64')}`;
  if (record.shasum !== shasum || record.integrity !== integrity) {
    throw new Error('npm pack integrity metadata does not match artifact bytes');
  }
  const manifest = validateCandidateManifest({
    schema: RELEASE_SCHEMAS.candidateManifest,
    source: {
      commit,
      dirty: false,
    },
    package: {
      name: record.name,
      version: record.version,
      filename: record.filename,
      entryCount: files.length,
      packedBytes: record.size,
      unpackedBytes: record.unpackedSize,
      shasum,
      integrity,
      sha256: hash(bytes, 'sha256'),
    },
    files,
  });
  return {
    artifactPath,
    consumerPackage,
    manifest,
  };
}
