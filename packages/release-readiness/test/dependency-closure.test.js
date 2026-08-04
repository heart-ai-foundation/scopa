import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { jsonHash } from '../../enforcement/src/index.js';
import {
  closureFromLock,
  packCandidate,
  scanProductionBundlePrivacy,
  validateProductionBundle,
  verifyProductionBundleRoot,
} from '../src/index.js';

const invoke = promisify(execFile);
const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const PACKAGE = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const LOCK = JSON.parse(await readFile(path.join(ROOT, 'package-lock.json'), 'utf8'));
const NPM_COMMAND = process.env.SCOPA_NPM_COMMAND || 'npm';
const NPM11_COMMAND = process.env.SCOPA_NPM11_COMMAND || null;

function clone(value) {
  return structuredClone(value);
}

function rehashManifest(value) {
  value.closureSha256 = jsonHash({ root: value.root, packages: value.packages });
  value.bundledPayloadSha256 = jsonHash(value.files);
  value.licenseInventorySha256 = jsonHash(value.licenses);
  const { manifestSha256: ignored, ...body } = value;
  value.manifestSha256 = jsonHash(body);
  return value;
}

async function installOffline({ artifactPath, root }) {
  const consumer = path.join(root, 'consumer');
  const cache = path.join(root, 'empty-cache');
  await mkdir(consumer);
  await mkdir(cache);
  await writeFile(
    path.join(consumer, 'package.json'),
    '{"name":"scopa-s19-v2-consumer","version":"1.0.0","private":true}\n',
  );
  const denyNetwork = path.join(ROOT, 'fixtures', 'S19-v2', 'network-deny.cjs');
  await invoke(NPM_COMMAND, [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
    '--offline',
    '--cache', cache,
    '--registry', 'http://127.0.0.1:9',
    artifactPath,
  ], {
    cwd: consumer,
    env: {
      ...process.env,
      NODE_OPTIONS: `--require=${denyNetwork}`,
    },
    maxBuffer: 4 * 1024 * 1024,
  });
  return {
    consumer,
    installedRoot: path.join(
      consumer,
      'node_modules',
      '@heart-ai-foundation',
      'scopa',
    ),
    networkPolicy: 'offline-empty-cache-unreachable-registry-deny-shim',
  };
}

test('reviewed lock yields one exact production-only bundled closure', () => {
  const closure = closureFromLock({ sourcePackage: PACKAGE, lock: LOCK });
  assert.deepEqual(closure.root.bundledDependencies, [
    '@endo/lockdown',
    '@noble/hashes',
    'ajv',
    'cborg',
  ]);
  assert.equal(closure.packages.length, 12);
  assert.equal(closure.packages.some(({ name }) => name === 'deno'), false);
  assert.equal(
    closure.packages.find(({ name }) => name === 'fast-uri').version,
    '3.1.5',
  );

  const range = clone(PACKAGE);
  range.dependencies.ajv = '^8.20.0';
  assert.throws(
    () => closureFromLock({ sourcePackage: range, lock: LOCK }),
    /exactly match|pinned/,
  );
  const missingBundle = clone(PACKAGE);
  missingBundle.bundledDependencies.pop();
  assert.throws(
    () => closureFromLock({ sourcePackage: missingBundle, lock: LOCK }),
    /exactly name direct/,
  );
  const lifecycle = clone(LOCK);
  lifecycle.packages['node_modules/ajv'].hasInstallScript = true;
  assert.throws(
    () => closureFromLock({ sourcePackage: PACKAGE, lock: lifecycle }),
    /unsafe metadata/,
  );
  const dev = clone(LOCK);
  dev.packages['node_modules/fast-uri'].dev = true;
  assert.throws(
    () => closureFromLock({ sourcePackage: PACKAGE, lock: dev }),
    /invalid node/,
  );
  const source = clone(LOCK);
  source.packages['node_modules/fast-uri'].resolved = 'git+https://example.invalid/repo';
  assert.throws(
    () => closureFromLock({ sourcePackage: PACKAGE, lock: source }),
    /unsafe metadata/,
  );
});

test('candidate packs deterministically with a byte-bound licensed bundle', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s19-v2-pack-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const first = await packCandidate({
    sourceRoot: ROOT,
    outputDirectory: path.join(root, 'first'),
    requireClean: false,
  });
  const second = await packCandidate({
    sourceRoot: ROOT,
    outputDirectory: path.join(root, 'second'),
    requireClean: false,
  });
  assert.equal(first.manifest.package.sha256, second.manifest.package.sha256);
  assert.deepEqual(first.bundle, second.bundle);
  assert.equal(first.bundle.verification.ok, true);
  assert.equal(first.bundle.verification.packageCount, 12);
  assert.ok(first.bundle.verification.fileCount > 100);
  assert.equal(
    first.bundle.verification.bundledPayloadSha256,
    first.bundle.verification.installedPayloadSha256,
  );
  assert.equal(first.bundle.manifest.licenses.length, 12);
  assert.ok(first.manifest.files.some(({ path: filePath }) =>
    filePath === 'node_modules/fast-uri/package.json'));
});

test('npm 10 and npm 11 produce the same candidate and bundle identities', {
  skip: NPM11_COMMAND === null ? 'SCOPA_NPM11_COMMAND is not configured' : false,
}, async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s19-v2-cross-npm-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const npm10 = await packCandidate({
    sourceRoot: ROOT,
    outputDirectory: path.join(root, 'npm10'),
    requireClean: false,
    npmCommand: NPM_COMMAND,
  });
  const npm11 = await packCandidate({
    sourceRoot: ROOT,
    outputDirectory: path.join(root, 'npm11'),
    requireClean: false,
    npmCommand: NPM11_COMMAND,
  });
  assert.equal(npm10.manifest.package.sha256, npm11.manifest.package.sha256);
  assert.deepEqual(npm10.bundle, npm11.bundle);
});

test('empty-cache unreachable-registry install preserves exact bytes and rejects hostility', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s19-v2-install-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const packed = await packCandidate({
    sourceRoot: ROOT,
    outputDirectory: path.join(root, 'artifact'),
    requireClean: false,
  });
  const installed = await installOffline({ artifactPath: packed.artifactPath, root });
  const manifest = JSON.parse(await readFile(
    path.join(installed.installedRoot, 'production-bundle.json'),
    'utf8',
  ));
  const verified = await verifyProductionBundleRoot({
    root: installed.installedRoot,
    manifest,
  });
  assert.equal(
    installed.networkPolicy,
    'offline-empty-cache-unreachable-registry-deny-shim',
  );
  assert.equal(verified.installedPayloadSha256, manifest.bundledPayloadSha256);
  const privacy = await scanProductionBundlePrivacy({
    root: installed.installedRoot,
    manifest,
    forbiddenValues: [ROOT, root],
  });
  assert.deepEqual(privacy.findings, []);
  assert.ok(privacy.upstreamStructuralReferences.length > 0);
  const forbidden = await scanProductionBundlePrivacy({
    root: installed.installedRoot,
    manifest,
    forbiddenValues: ['file:///Users/'],
  });
  assert.ok(forbidden.findings.some(({ kind }) =>
    kind === 'forbidden-runtime-value'));

  const executable = manifest.files.find(({ path: filePath }) => filePath.endsWith('.js'));
  assert.ok(executable);
  const relative = executable.path.slice('node_modules/'.length);

  const mutated = path.join(root, 'mutated');
  await cp(installed.installedRoot, mutated, { recursive: true });
  await writeFile(path.join(mutated, 'node_modules', ...relative.split('/')), 'mutated\n');
  await assert.rejects(
    () => verifyProductionBundleRoot({ root: mutated, manifest }),
    /does not match approved bytes/,
  );

  const missing = path.join(root, 'missing');
  await cp(installed.installedRoot, missing, { recursive: true });
  await unlink(path.join(missing, 'node_modules', ...relative.split('/')));
  await assert.rejects(
    () => verifyProductionBundleRoot({ root: missing, manifest }),
    /does not match approved bytes/,
  );

  const extra = path.join(root, 'extra');
  await cp(installed.installedRoot, extra, { recursive: true });
  await writeFile(path.join(extra, 'node_modules', 'ajv', 'SCOPA_EXTRA'), 'extra\n');
  await assert.rejects(
    () => verifyProductionBundleRoot({ root: extra, manifest }),
    /does not match approved bytes/,
  );

  const permission = path.join(root, 'permission');
  await cp(installed.installedRoot, permission, { recursive: true });
  await chmod(
    path.join(permission, 'node_modules', ...relative.split('/')),
    executable.mode === 0o755 ? 0o644 : 0o755,
  );
  await assert.rejects(
    () => verifyProductionBundleRoot({ root: permission, manifest }),
    /does not match approved bytes/,
  );

  const falseGreen = rehashManifest(clone(manifest));
  falseGreen.files.find(({ path: filePath }) => filePath.endsWith('.js')).sha256 =
    '0'.repeat(64);
  rehashManifest(falseGreen);
  assert.doesNotThrow(() => validateProductionBundle(falseGreen));
  await assert.rejects(
    () => verifyProductionBundleRoot({ root: installed.installedRoot, manifest: falseGreen }),
    /does not match approved bytes/,
  );

  const edgeTransplant = clone(manifest);
  const ajv = edgeTransplant.packages.find(({ name }) => name === 'ajv');
  ajv.dependencies.find(({ name }) => name === 'fast-uri').path =
    'node_modules/fast-deep-equal';
  rehashManifest(edgeTransplant);
  assert.throws(
    () => validateProductionBundle(edgeTransplant),
    /invalid edge/,
  );

  const noticeTransplant = clone(manifest);
  noticeTransplant.licenses[0].noticeFiles[0].sha256 = 'f'.repeat(64);
  rehashManifest(noticeTransplant);
  assert.throws(
    () => validateProductionBundle(noticeTransplant),
    /notice bytes/,
  );
});
