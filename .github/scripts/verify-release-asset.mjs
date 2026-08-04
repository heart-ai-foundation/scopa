#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const PACKAGE_NAME = '@heart-ai-foundation/scopa';
const REPOSITORY_URL = 'https://github.com/heart-ai-foundation/scopa.git';
const FORBIDDEN_LIFECYCLE_SCRIPTS = [
  'preinstall',
  'install',
  'postinstall',
  'prepack',
  'prepare',
  'postpack',
  'prepublish',
  'prepublishOnly',
  'publish',
  'postpublish',
];

function fail(message) {
  throw new Error(`release asset verification failed: ${message}`);
}

function repositoryUrl(packageJson) {
  return typeof packageJson.repository === 'string'
    ? packageJson.repository
    : packageJson.repository?.url;
}

async function hashFile(filename, algorithm) {
  const hash = createHash(algorithm);
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest();
}

async function packageMetadata(archive) {
  let stdout;
  try {
    ({ stdout } = await execFileAsync(
      'tar',
      ['-xOf', archive, 'package/package.json'],
      { encoding: 'utf8', maxBuffer: 1024 * 1024 },
    ));
  } catch {
    fail('archive does not contain a readable package/package.json');
  }
  try {
    return JSON.parse(stdout);
  } catch {
    fail('archive package/package.json is not valid JSON');
  }
}

function assertPackageIdentity(packageJson, version, label) {
  if (packageJson.name !== PACKAGE_NAME) fail(`${label} package name differs`);
  if (packageJson.version !== version) fail(`${label} version differs from tag`);
  if (packageJson.private !== false) fail(`${label} is not explicitly public`);
  if (packageJson.publishConfig?.access !== 'public') {
    fail(`${label} does not require public access`);
  }
  if (packageJson.publishConfig?.tag !== 'latest') {
    fail(`${label} does not require the latest dist-tag`);
  }
  if (repositoryUrl(packageJson) !== REPOSITORY_URL) {
    fail(`${label} repository identity differs`);
  }
  const lifecycle = FORBIDDEN_LIFECYCLE_SCRIPTS.filter(
    (name) => Object.hasOwn(packageJson.scripts ?? {}, name),
  );
  if (lifecycle.length !== 0) {
    fail(`${label} contains lifecycle scripts: ${lifecycle.join(', ')}`);
  }
}

export async function verifyReleaseAsset({
  archive,
  checksum,
  sourcePackage,
  tag,
  expectedSha256,
}) {
  const tagMatch = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.exec(tag);
  if (tagMatch === null) fail('tag must be a stable vMAJOR.MINOR.PATCH value');
  if (!/^[0-9a-f]{64}$/.test(expectedSha256)) {
    fail('expected SHA-256 must be 64 lowercase hexadecimal characters');
  }
  const version = tag.slice(1);
  const expectedFilename = `heart-ai-foundation-scopa-${version}.tgz`;
  if (path.basename(archive) !== expectedFilename) {
    fail('archive filename differs from tag-derived identity');
  }

  const checksumLines = (await readFile(checksum, 'utf8'))
    .split('\n')
    .filter((line) => line.length !== 0);
  const expectedChecksumLine = `${expectedSha256}  ${expectedFilename}`;
  if (checksumLines.length !== 1 || checksumLines[0] !== expectedChecksumLine) {
    fail('SHA256SUMS is not the exact single-file checksum contract');
  }

  const archiveSha256 = (await hashFile(archive, 'sha256')).toString('hex');
  if (archiveSha256 !== expectedSha256) fail('archive SHA-256 differs');

  const archivePackage = await packageMetadata(archive);
  assertPackageIdentity(archivePackage, version, 'archive');

  let sourceMetadata;
  try {
    sourceMetadata = JSON.parse(await readFile(sourcePackage, 'utf8'));
  } catch {
    fail('release source package.json is not valid JSON');
  }
  assertPackageIdentity(sourceMetadata, version, 'release source');

  const archiveStat = await stat(archive);
  const sha512 = (await hashFile(archive, 'sha512')).toString('base64');
  return {
    schema: 'scopa.npm-release-asset-verification.v1',
    package: PACKAGE_NAME,
    version,
    tag,
    filename: expectedFilename,
    packedBytes: archiveStat.size,
    sha256: archiveSha256,
    integrity: `sha512-${sha512}`,
    repository: REPOSITORY_URL,
    lifecycleScripts: [],
    ok: true,
  };
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith('--') || value === undefined) {
      throw new TypeError('arguments must be --name value pairs');
    }
    options[flag.slice(2)] = value;
  }
  const required = ['archive', 'checksum', 'source-package', 'tag', 'sha256'];
  for (const name of required) {
    if (options[name] === undefined) throw new TypeError(`missing --${name}`);
  }
  if (Object.keys(options).some((name) => !required.includes(name))) {
    throw new TypeError('unknown argument');
  }
  return {
    archive: path.resolve(options.archive),
    checksum: path.resolve(options.checksum),
    sourcePackage: path.resolve(options['source-package']),
    tag: options.tag,
    expectedSha256: options.sha256,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await verifyReleaseAsset(parseArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
