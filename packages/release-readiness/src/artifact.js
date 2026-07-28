import {
  createHash,
} from 'node:crypto';
import {
  execFile,
} from 'node:child_process';
import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  promisify,
} from 'node:util';
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

const execFileAsync = promisify(execFile);

async function invoke(command, args, options = {}) {
  const result = await execFileAsync(command, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
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
    if (
      filePath.startsWith('/') ||
      filePath.includes('\\') ||
      filePath.split('/').includes('..')
    ) {
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
  const packResult = await invoke('npm', [
    'pack',
    '--json',
    '--pack-destination',
    path.resolve(outputDirectory),
  ], { cwd: root });
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
    .sort((left, right) => left.path.localeCompare(right.path));
  assertPackedSurface(files);

  const artifactPath = path.join(
    path.resolve(outputDirectory),
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
    manifest,
  };
}
