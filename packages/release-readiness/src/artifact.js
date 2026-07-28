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
