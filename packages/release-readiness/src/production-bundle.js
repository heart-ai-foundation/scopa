import { createHash } from 'node:crypto';
import {
  lstat,
  readFile,
  readdir,
} from 'node:fs/promises';
import path from 'node:path';
import { jsonHash } from '../../enforcement/src/index.js';
import { candidatePathIsCanonical } from './candidate-path.js';
import {
  RELEASE_PACKAGE_NAME,
  RELEASE_SCHEMAS,
  RELEASE_VERSION,
} from './constants.js';
import { validatePublishedContract } from './published-contracts.js';
import { scanPrivateText } from './package-privacy.js';

const DIGEST = /^[0-9a-f]{64}$/u;
const INTEGRITY = /^sha512-[A-Za-z0-9+/]+={0,2}$/u;
const REGISTRY = /^https:\/\/registry\.npmjs\.org\//u;
const INSTALL_SCRIPTS = Object.freeze(['preinstall', 'install', 'postinstall']);
const LICENSE_FILE = /^(?:licen[cs]e|copying|notice)(?:[._-].*)?$/iu;
const OMITTED_ROOT_PATHS = new Set([
  'node_modules/.package-lock.json',
]);

function fail(message) {
  throw new TypeError(message);
}

function exactKeys(value, expected, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${name} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    fail(`${name} has an open or incomplete shape`);
  }
}

function sortedUnique(values, name, key = (value) => value) {
  const keys = values.map(key);
  if (
    new Set(keys).size !== keys.length ||
    JSON.stringify(keys) !== JSON.stringify([...keys].sort())
  ) {
    fail(`${name} must be unique and sorted`);
  }
}

function canonicalMode(mode) {
  return (mode & 0o111) === 0 ? 0o644 : 0o755;
}

function packageNameFromLockPath(packagePath) {
  const parts = packagePath.split('/');
  const nodeModules = parts.lastIndexOf('node_modules');
  const first = parts[nodeModules + 1];
  if (!first) fail(`invalid lock package path ${packagePath}`);
  return first.startsWith('@') ? `${first}/${parts[nodeModules + 2]}` : first;
}

function parentPackagePath(packagePath) {
  const marker = packagePath.lastIndexOf('/node_modules/');
  return marker === -1 ? '' : packagePath.slice(0, marker);
}

function resolveLockDependency(packages, fromPath, dependencyName) {
  let current = fromPath;
  while (true) {
    const candidate = current === ''
      ? `node_modules/${dependencyName}`
      : `${current}/node_modules/${dependencyName}`;
    if (Object.hasOwn(packages, candidate)) return candidate;
    if (current === '') break;
    current = parentPackagePath(current);
  }
  fail(`${fromPath || '<root>'} cannot resolve ${dependencyName} in reviewed lock`);
}

function dependencyNames(entry) {
  const required = Object.keys(entry.dependencies ?? {});
  const optional = Object.keys(entry.optionalDependencies ?? {});
  return [...new Set([...required, ...optional])].sort();
}

export function closureFromLock({ sourcePackage, lock }) {
  exactKeys(
    { name: sourcePackage?.name, version: sourcePackage?.version },
    ['name', 'version'],
    'source package identity',
  );
  if (
    sourcePackage.name !== RELEASE_PACKAGE_NAME ||
    sourcePackage.version !== RELEASE_VERSION ||
    lock?.lockfileVersion !== 3 ||
    lock?.packages === null ||
    typeof lock?.packages !== 'object' ||
    Array.isArray(lock.packages)
  ) {
    fail('source package and lock identity must match the supported release');
  }
  const root = lock.packages[''];
  if (
    root?.name !== sourcePackage.name ||
    root?.version !== sourcePackage.version ||
    JSON.stringify(root.dependencies) !== JSON.stringify(sourcePackage.dependencies)
  ) {
    fail('reviewed lock root must exactly match production dependencies');
  }
  if (
    sourcePackage.dependencies === null ||
    typeof sourcePackage.dependencies !== 'object' ||
    Array.isArray(sourcePackage.dependencies) ||
    Object.keys(sourcePackage.dependencies).length === 0
  ) {
    fail('source package must declare production dependencies');
  }
  const bundledDependencies = [...(sourcePackage.bundledDependencies ?? [])];
  const directDependencies = Object.keys(sourcePackage.dependencies ?? {}).sort();
  sortedUnique(bundledDependencies, 'bundledDependencies');
  if (JSON.stringify(bundledDependencies) !== JSON.stringify(directDependencies)) {
    fail('bundledDependencies must exactly name direct production dependencies');
  }
  if (
    JSON.stringify(lock.packages[''].bundleDependencies) !==
    JSON.stringify(bundledDependencies)
  ) {
    fail('reviewed lock must bind the exact bundled dependency set');
  }
  for (const [name, specifier] of Object.entries(sourcePackage.dependencies)) {
    const target = lock.packages[`node_modules/${name}`];
    if (!target || specifier !== target.version) {
      fail(`direct dependency ${name} must be pinned to reviewed lock version`);
    }
  }

  const queue = dependencyNames(root).map((name) =>
    resolveLockDependency(lock.packages, '', name));
  const reachable = new Set();
  while (queue.length !== 0) {
    const packagePath = queue.shift();
    if (reachable.has(packagePath)) continue;
    const entry = lock.packages[packagePath];
    if (
      !entry ||
      entry.dev === true ||
      entry.link === true ||
      entry.inBundle !== true
    ) {
      fail(`production closure contains invalid node ${packagePath}`);
    }
    if (
      typeof entry.version !== 'string' ||
      !REGISTRY.test(entry.resolved ?? '') ||
      !INTEGRITY.test(entry.integrity ?? '') ||
      entry.hasInstallScript === true ||
      entry.peerDependencies !== undefined
    ) {
      fail(`production closure contains unsafe metadata at ${packagePath}`);
    }
    reachable.add(packagePath);
    for (const name of dependencyNames(entry)) {
      queue.push(resolveLockDependency(lock.packages, packagePath, name));
    }
  }

  const declaredBundled = Object.entries(lock.packages)
    .filter(([, entry]) => entry.inBundle === true)
    .map(([packagePath]) => packagePath)
    .sort();
  if (JSON.stringify(declaredBundled) !== JSON.stringify([...reachable].sort())) {
    fail('reviewed lock contains missing or extra bundled nodes');
  }

  const packages = [...reachable].sort().map((packagePath) => {
    const entry = lock.packages[packagePath];
    const dependencies = dependencyNames(entry).map((name) => ({
      name,
      path: resolveLockDependency(lock.packages, packagePath, name),
      specifier: entry.dependencies?.[name] ?? entry.optionalDependencies[name],
    }));
    return {
      path: packagePath,
      name: packageNameFromLockPath(packagePath),
      version: entry.version,
      resolved: entry.resolved,
      integrity: entry.integrity,
      dependencies,
    };
  });
  return {
    root: {
      name: sourcePackage.name,
      version: sourcePackage.version,
      bundledDependencies,
    },
    packages,
  };
}

async function walkRegularFiles(root, relative = '') {
  const directory = path.join(root, ...relative.split('/').filter(Boolean));
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0)) {
    const child = relative === '' ? entry.name : `${relative}/${entry.name}`;
    if (OMITTED_ROOT_PATHS.has(child) || child.startsWith('node_modules/.bin/')) {
      continue;
    }
    if (!candidatePathIsCanonical(child)) fail(`bundle contains unsafe path ${child}`);
    const status = await lstat(path.join(root, ...child.split('/')));
    if (status.isSymbolicLink()) fail(`bundle contains symlink ${child}`);
    if (status.isDirectory()) {
      files.push(...await walkRegularFiles(root, child));
      continue;
    }
    if (!status.isFile()) fail(`bundle contains special file ${child}`);
    if (child.endsWith('.node') || child.endsWith('/binding.gyp')) {
      fail(`bundle contains native addon surface ${child}`);
    }
    const bytes = await readFile(path.join(root, ...child.split('/')));
    files.push({
      path: child,
      size: bytes.length,
      mode: canonicalMode(status.mode),
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
  return files;
}

async function inventoryIncludedFiles(root, includedPaths) {
  const paths = [...includedPaths]
    .filter((filePath) => filePath.startsWith('node_modules/'))
    .filter((filePath) => !OMITTED_ROOT_PATHS.has(filePath))
    .filter((filePath) => !filePath.startsWith('node_modules/.bin/'))
    .sort();
  sortedUnique(paths, 'packed bundle paths');
  const files = [];
  for (const filePath of paths) {
    if (!candidatePathIsCanonical(filePath)) fail(`bundle contains unsafe path ${filePath}`);
    const filename = path.join(root, ...filePath.split('/'));
    const status = await lstat(filename);
    if (status.isSymbolicLink()) fail(`bundle contains symlink ${filePath}`);
    if (!status.isFile()) fail(`bundle contains non-regular entry ${filePath}`);
    if (filePath.endsWith('.node') || filePath.endsWith('/binding.gyp')) {
      fail(`bundle contains native addon surface ${filePath}`);
    }
    const bytes = await readFile(filename);
    files.push({
      path: filePath,
      size: bytes.length,
      mode: canonicalMode(status.mode),
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
  return files;
}

async function inspectPackages(root, closurePackages, files) {
  const licenses = [];
  const roots = closurePackages.map(({ path: packagePath }) => packagePath)
    .sort((left, right) => right.length - left.length);
  for (const file of files) {
    if (!roots.some((packagePath) => file.path.startsWith(`${packagePath}/`))) {
      fail(`bundled file is outside reviewed closure: ${file.path}`);
    }
  }
  for (const expected of closurePackages) {
    const packageRoot = path.join(root, ...expected.path.split('/'));
    const metadata = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
    if (metadata.name !== expected.name || metadata.version !== expected.version) {
      fail(`bundled package identity drifted at ${expected.path}`);
    }
    const metadataDependencies = [...new Set([
      ...Object.keys(metadata.dependencies ?? {}),
      ...Object.keys(metadata.optionalDependencies ?? {}),
    ])].sort().map((name) => ({
      name,
      specifier: metadata.dependencies?.[name] ?? metadata.optionalDependencies[name],
    }));
    const expectedDependencies = expected.dependencies.map(({ name, specifier }) => ({
      name,
      specifier,
    }));
    if (JSON.stringify(metadataDependencies) !== JSON.stringify(expectedDependencies)) {
      fail(`bundled dependency edges drifted at ${expected.path}`);
    }
    if (INSTALL_SCRIPTS.some((script) => Object.hasOwn(metadata.scripts ?? {}, script))) {
      fail(`bundled package declares install lifecycle at ${expected.path}`);
    }
    if (typeof metadata.license !== 'string' || metadata.license.length === 0) {
      fail(`bundled package is missing a license identifier at ${expected.path}`);
    }
    const noticeFiles = files
      .filter(({ path: filePath }) => {
        if (!filePath.startsWith(`${expected.path}/`)) return false;
        const relative = filePath.slice(expected.path.length + 1);
        return !relative.includes('/') && LICENSE_FILE.test(relative);
      })
      .map(({ path: filePath, sha256 }) => ({ path: filePath, sha256 }));
    if (noticeFiles.length === 0) {
      fail(`bundled package is missing license or notice bytes at ${expected.path}`);
    }
    licenses.push({
      path: expected.path,
      name: expected.name,
      version: expected.version,
      license: metadata.license,
      noticeFiles,
    });
  }
  return licenses;
}

function bundleHashes({ root, packages, files, licenses }) {
  return {
    closureSha256: jsonHash({ root, packages }),
    bundledPayloadSha256: jsonHash(files),
    licenseInventorySha256: jsonHash(licenses),
  };
}

export async function createProductionBundle({
  stageRoot,
  sourcePackage,
  lock,
  includedPaths = null,
}) {
  const closure = closureFromLock({ sourcePackage, lock });
  const files = includedPaths === null
    ? await walkRegularFiles(stageRoot, 'node_modules')
    : await inventoryIncludedFiles(stageRoot, includedPaths);
  files.sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  sortedUnique(files, 'bundle files', (entry) => entry.path);
  const licenses = await inspectPackages(stageRoot, closure.packages, files);
  const hashes = bundleHashes({ ...closure, files, licenses });
  const body = {
    schema: RELEASE_SCHEMAS.productionBundle,
    ...closure,
    files,
    licenses,
    ...hashes,
  };
  return validateProductionBundle({
    ...body,
    manifestSha256: jsonHash(body),
  });
}

export function validateProductionBundle(value) {
  validatePublishedContract(RELEASE_SCHEMAS.productionBundle, value);
  sortedUnique(value.root.bundledDependencies, 'bundledDependencies');
  sortedUnique(value.packages, 'bundle packages', (entry) => entry.path);
  sortedUnique(value.files, 'bundle files', (entry) => entry.path);
  sortedUnique(value.licenses, 'bundle licenses', (entry) => entry.path);
  const packages = new Map(value.packages.map((entry) => [entry.path, entry]));
  const files = new Map(value.files.map((entry) => [entry.path, entry]));
  const expectedDirect = Object.keys(
    Object.fromEntries(value.root.bundledDependencies.map((name) => [name, true])),
  ).sort();
  if (JSON.stringify(value.root.bundledDependencies) !== JSON.stringify(expectedDirect)) {
    fail('bundledDependencies are not canonical');
  }
  const queue = value.root.bundledDependencies.map((name) => `node_modules/${name}`);
  const reachable = new Set();
  while (queue.length !== 0) {
    const packagePath = queue.shift();
    const entry = packages.get(packagePath);
    if (!entry) fail(`bundle graph is missing ${packagePath}`);
    if (reachable.has(packagePath)) continue;
    reachable.add(packagePath);
    sortedUnique(entry.dependencies, `${packagePath} dependencies`, (edge) => edge.name);
    for (const edge of entry.dependencies) {
      const target = packages.get(edge.path);
      if (!target || target.name !== edge.name) {
        fail(`bundle graph contains invalid edge from ${packagePath}`);
      }
      queue.push(edge.path);
    }
  }
  if (reachable.size !== value.packages.length) {
    fail('bundle graph contains unreachable packages');
  }
  for (const file of value.files) {
    if (!candidatePathIsCanonical(file.path) || !DIGEST.test(file.sha256)) {
      fail('bundle file identity is not canonical');
    }
    if (!value.packages.some(({ path: packagePath }) =>
      file.path.startsWith(`${packagePath}/`))) {
      fail(`bundle file is outside the package graph: ${file.path}`);
    }
  }
  for (const entry of value.packages) {
    if (!files.has(`${entry.path}/package.json`)) {
      fail(`bundle graph package lacks metadata bytes: ${entry.path}`);
    }
  }
  for (const license of value.licenses) {
    const entry = packages.get(license.path);
    if (
      !entry ||
      entry.name !== license.name ||
      entry.version !== license.version
    ) {
      fail('license inventory does not map to package graph');
    }
    for (const notice of license.noticeFiles) {
      if (files.get(notice.path)?.sha256 !== notice.sha256) {
        fail('license inventory does not bind notice bytes');
      }
    }
  }
  const hashes = bundleHashes(value);
  if (
    value.closureSha256 !== hashes.closureSha256 ||
    value.bundledPayloadSha256 !== hashes.bundledPayloadSha256 ||
    value.licenseInventorySha256 !== hashes.licenseInventorySha256
  ) {
    fail('production bundle component digest mismatch');
  }
  const { manifestSha256, ...body } = value;
  if (manifestSha256 !== jsonHash(body)) {
    fail('production bundle manifest digest mismatch');
  }
  return structuredClone(value);
}

export async function verifyProductionBundleRoot({ root, manifest }) {
  const expected = validateProductionBundle(manifest);
  const files = await walkRegularFiles(root, 'node_modules');
  files.sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  sortedUnique(files, 'installed bundle files', (entry) => entry.path);
  if (JSON.stringify(files) !== JSON.stringify(expected.files)) {
    fail('installed bundled payload does not match approved bytes');
  }
  const licenses = await inspectPackages(root, expected.packages, files);
  if (JSON.stringify(licenses) !== JSON.stringify(expected.licenses)) {
    fail('installed license inventory does not match approved bytes');
  }
  return {
    schema: 'scopa.production-bundle-verification.v1',
    closureSha256: expected.closureSha256,
    bundledPayloadSha256: expected.bundledPayloadSha256,
    installedPayloadSha256: jsonHash(files),
    licenseInventorySha256: expected.licenseInventorySha256,
    packageCount: expected.packages.length,
    fileCount: files.length,
    ok: true,
  };
}

export async function scanProductionBundlePrivacy({
  root,
  manifest,
  forbiddenValues = [],
}) {
  const expected = validateProductionBundle(manifest);
  const findings = [];
  const upstreamStructuralReferences = [];
  for (const entry of expected.files) {
    const bytes = await readFile(path.join(root, ...entry.path.split('/')));
    if (bytes.includes(0)) continue;
    for (const kind of scanPrivateText(bytes.toString('utf8'), { forbiddenValues })) {
      const finding = { kind, path: entry.path };
      if (kind === 'absolute-user-home' || kind === 'local-file-url') {
        upstreamStructuralReferences.push(finding);
      } else {
        findings.push(finding);
      }
    }
  }
  return {
    findings,
    upstreamStructuralReferences,
  };
}
