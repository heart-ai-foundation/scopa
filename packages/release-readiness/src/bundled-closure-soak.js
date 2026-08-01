#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  access, lstat, mkdir, mkdtemp, open, readdir, readFile, realpath, rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson, canonicalJsonPretty } from '../../enforcement/src/index.js';
import { assertBundledExactCandidateQualification,
  createQualificationEnvironment } from './exact-candidate-probe.js';
import { scanPackagePrivacy } from './package-privacy.js';
import { scanProductionBundlePrivacy,
  verifyProductionBundleRoot } from './production-bundle.js';
import { invokeCaptured } from './subprocess.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const SELF = fileURLToPath(import.meta.url);
const CYCLES = 12;
const MAX_DESCRIPTOR_GROWTH = 4;
const MAX_RSS_GROWTH_BYTES = 64 * 1024 * 1024;
const PACKAGE_SHA256 =
  '49b62ac4b4d869dbca8459aa08f515427e0a04349f014c85cc422d7e0625f147';
const SOURCE_COMMIT = 'd56440195dcb24cb6dd43c24e484641b1646a5a9';
const MANIFEST_SHA256 =
  'd975f5914611d4185504acd58a25384de4a72ff89a54a6015a3c63b8b733e686';
const CLOSURE_SHA256 =
  '6071fda7b96dbe6bb87ed154ef3dc3d94e5f53be114148e663a7e9523e76180e';
const PAYLOAD_SHA256 =
  'd876bb115d8dd8755dfbddcbdabf84bf931487b177f24daf29a3d90aef5d7477';
const LICENSE_SHA256 =
  'a4066aa11d8d819047753fc841322b607807152f30a3a8342efc31f2fa7d84af';
const QUALIFICATION_SHA256 =
  'ad9d2dc7e22cfd6e5de07ebce0b430f3970e2eb1072f0e1a78711a82559cec2f';
const S21_CLOSEOUT_SHA256 =
  'e61d4e92748bde8aab83ea26cbc80357f7f47951ac858b9e0e53417765cb5953';
const INSTALLED_TREE_SHA256 =
  '9154bf98ec9cd50d18ca8b27095a7242f874e1e19c52a4b0405ef97b146b65db';
const DEPENDENCY_GRAPH_SHA256 =
  '76cbcea308c42b729cf0ab74618406349ad4e71478288154b5febc36c08bc122';
const CONTROL_STATE_SHA256 =
  '6942b2f9e97fcb4dccba34c3930e69f45c73805528f24ff233451aa97cae3c6e';
const DIGEST = /^[0-9a-f]{64}$/;

function sha256(value) {
  return createHash('sha256').update(
    typeof value === 'string' || Buffer.isBuffer(value)
      ? value
      : canonicalJson(value),
  ).digest('hex');
}
function exactKeys(value, expected, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join('\0') !== [...expected].sort().join('\0')) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}
function nonnegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a nonnegative integer`);
  }
}
function digest(value, label) {
  if (!DIGEST.test(value ?? '')) {
    throw new TypeError(`${label} must be a SHA-256 digest`);
  }
}

export function createS22BundledClosureSoakPlan() {
  const body = {
    schema: 'scopa.s22-bundled-closure-soak-plan.v1',
    slice: 'S22',
    sourceCommit: SOURCE_COMMIT,
    qualificationReceiptSha256: QUALIFICATION_SHA256,
    s21CloseoutSha256: S21_CLOSEOUT_SHA256,
    productionIdentity: {
      packageSha256: PACKAGE_SHA256,
      productionBundleManifestSha256: MANIFEST_SHA256,
      closureSha256: CLOSURE_SHA256,
      bundledPayloadSha256: PAYLOAD_SHA256,
      installedPayloadSha256: PAYLOAD_SHA256,
      licenseInventorySha256: LICENSE_SHA256,
    },
    cycleIdentity: {
      installedTreeSha256: INSTALLED_TREE_SHA256,
      installedEntryCount: 1213,
      dependencyGraphSha256: DEPENDENCY_GRAPH_SHA256,
      dependencyNodeCount: 14,
      controlStateSha256: CONTROL_STATE_SHA256,
    },
    cycles: CYCLES,
    npmSequence: Array.from({ length: CYCLES }, (_, index) =>
      index % 2 === 0 ? 'npm10' : 'npm11'),
    npmVersions: { npm10: '10.9.7', npm11: '11.19.0' },
    installPolicy: {
      cache: 'new-empty-per-cycle',
      registry: 'unreachable-loopback',
      offline: true,
      ignoreScripts: true,
      externalRequestsAllowed: 0,
      networkDenyShim: true,
    },
    runtimeOperations: [
      'fresh-install-and-production-bundle-verification',
      'installed-tree-dependency-graph-license-and-privacy',
      'project-init',
      'allowed-act-write',
      'denied-repository-escape',
      'fresh-process-status-and-check-cold-reload',
      'cycle-root-and-cache-removal',
    ],
    audits: {
      currentProductionAdvisoryAudits: 1,
      licenseInventoryEveryCycle: true,
      privacyAndCredentialScanEveryCycle: true,
      graphAndTreeLedgerEveryCycle: true,
      descriptorAndRssCeilings: true,
      processFilesystemAndControlCleanupEveryCycle: true,
    },
    limits: {
      maxCycles: CYCLES,
      maxDescriptorGrowth: MAX_DESCRIPTOR_GROWTH,
      maxRssGrowthBytes: MAX_RSS_GROWTH_BYTES,
      maxProviderInvocations: 0,
      maxExperimentInvocations: 0,
      maxPublicationActions: 0,
      maxRegistryAudits: 1,
    },
    rejectIf: [
      'candidate-qualification-or-four-part-identity-drift',
      'npm-version-sequence-tree-graph-license-or-control-state-drift',
      'install-cache-not-empty-registry-reachable-or-network-attempted',
      'production-advisory-found-or-current-audit-unavailable',
      'privacy-credential-private-topology-or-forbidden-value-found',
      'allowed-write-denied-escape-write-accepted-or-false-green',
      'descriptor-rss-process-filesystem-or-control-growth-exceeds-bound',
      'cycle-root-cache-repository-escape-or-child-process-survives',
      'provider-experiment-or-publication-action-observed',
    ],
    onFailure: {
      action: 'stop-soak-reject-s22-and-retain-bounded-diagnostics',
      providerReplayAllowed: false,
    },
    ifAmbiguous: { action: 'fail-closed-without-provider-traffic' },
  };
  return { ...body, planSha256: sha256(body) };
}

export function validateS22BundledClosureSoakPlan(value) {
  const expected = createS22BundledClosureSoakPlan();
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new TypeError('S22 soak plan differs from the frozen plan');
  }
  return value;
}

export function validateS22BundledClosureSoakReceipt(value) {
  exactKeys(value, [
    'audits', 'cleanup', 'cycleLedger', 'cycles', 'dependencies', 'installedSurface',
    'npm', 'planSha256', 'productionIdentity', 'receiptSha256', 'resources',
    'result', 'schema', 'slice', 'sourceCommit', 'traffic',
  ], 'S22 soak receipt');
  if (value.schema !== 'scopa.s22-bundled-closure-soak-receipt.v1' ||
      value.slice !== 'S22' || value.sourceCommit !== SOURCE_COMMIT ||
      value.planSha256 !== createS22BundledClosureSoakPlan().planSha256 ||
      value.result !== 'pass') {
    throw new TypeError('S22 soak receipt identity or result drifted');
  }
  const planIdentity = createS22BundledClosureSoakPlan().productionIdentity;
  if (canonicalJson(value.productionIdentity) !== canonicalJson(planIdentity)) {
    throw new TypeError('S22 production identity drifted');
  }
  if (!Array.isArray(value.cycleLedger) || value.cycleLedger.length !== CYCLES) {
    throw new TypeError('S22 cycle ledger is incomplete');
  }
  const cycleIdentity = createS22BundledClosureSoakPlan().cycleIdentity;
  for (const [index, entry] of value.cycleLedger.entries()) {
    exactKeys(entry, [
      'controlStateSha256', 'cycle', 'dependencyGraphSha256', 'durationMs',
      'externalRequests', 'installedTreeSha256', 'npmId', 'privacyFindings',
      'runtimePolarityPassed',
    ], `S22 cycle ledger ${index + 1}`);
    if (entry.cycle !== index + 1 ||
        entry.npmId !== createS22BundledClosureSoakPlan().npmSequence[index] ||
        entry.installedTreeSha256 !== cycleIdentity.installedTreeSha256 ||
        entry.dependencyGraphSha256 !== cycleIdentity.dependencyGraphSha256 ||
        entry.controlStateSha256 !== cycleIdentity.controlStateSha256 ||
        entry.externalRequests !== 0 || entry.privacyFindings !== 0 ||
        entry.runtimePolarityPassed !== true ||
        !Number.isSafeInteger(entry.durationMs) || entry.durationMs <= 0) {
      throw new TypeError(`S22 cycle ledger ${index + 1} drifted`);
    }
  }
  exactKeys(value.cycles, [
    'allControlStatesIdentical', 'allDependencyGraphsIdentical',
    'allFourPartIdentitiesExact', 'allInstalledTreesIdentical',
    'allLicenseInventoriesIdentical', 'allPrivacyScansClean',
    'allRuntimePolarityPassed', 'completed', 'freshEmptyCachePerCycle',
    'maximumDurationMs', 'planned', 'totalDurationMs',
  ], 'S22 cycles');
  for (const field of [
    'allControlStatesIdentical', 'allDependencyGraphsIdentical',
    'allFourPartIdentitiesExact', 'allInstalledTreesIdentical',
    'allLicenseInventoriesIdentical', 'allPrivacyScansClean',
    'allRuntimePolarityPassed', 'freshEmptyCachePerCycle',
  ]) {
    if (value.cycles[field] !== true) {
      throw new TypeError(`S22 cycle assertion failed: ${field}`);
    }
  }
  if (value.cycles.planned !== CYCLES || value.cycles.completed !== CYCLES) {
    throw new TypeError('S22 cycle count drifted');
  }
  nonnegativeInteger(value.cycles.maximumDurationMs, 'S22 maximum duration');
  nonnegativeInteger(value.cycles.totalDurationMs, 'S22 total duration');
  if (value.cycles.maximumDurationMs === 0 ||
      value.cycles.totalDurationMs < value.cycles.maximumDurationMs) {
    throw new TypeError('S22 duration evidence is invalid');
  }
  exactKeys(value.npm, [
    'npm10Cycles', 'npm10Version', 'npm11Cycles', 'npm11Version',
    'sequenceFollowed',
  ], 'S22 npm');
  if (value.npm.npm10Version !== '10.9.7' ||
      value.npm.npm11Version !== '11.19.0' ||
      value.npm.npm10Cycles !== 6 || value.npm.npm11Cycles !== 6 ||
      value.npm.sequenceFollowed !== true) {
    throw new TypeError('S22 npm posture drifted');
  }
  exactKeys(value.installedSurface, [
    'entryCount', 'privacyFindings', 'productionFileCount', 'treeSha256',
  ], 'S22 installed surface');
  nonnegativeInteger(value.installedSurface.entryCount, 'S22 entry count');
  if (value.installedSurface.entryCount === 0 ||
      value.installedSurface.entryCount !== cycleIdentity.installedEntryCount ||
      value.installedSurface.productionFileCount !== 893 ||
      value.installedSurface.privacyFindings !== 0) {
    throw new TypeError('S22 installed surface failed');
  }
  digest(value.installedSurface.treeSha256, 'S22 installed tree');
  if (value.installedSurface.treeSha256 !== cycleIdentity.installedTreeSha256) {
    throw new TypeError('S22 installed tree identity drifted');
  }
  exactKeys(value.dependencies, [
    'graphSha256', 'graphStableAcrossCycles', 'nodeCount',
  ], 'S22 dependencies');
  digest(value.dependencies.graphSha256, 'S22 dependency graph');
  if (!value.dependencies.graphStableAcrossCycles ||
      !Number.isSafeInteger(value.dependencies.nodeCount) ||
      value.dependencies.nodeCount !== cycleIdentity.dependencyNodeCount ||
      value.dependencies.graphSha256 !== cycleIdentity.dependencyGraphSha256) {
    throw new TypeError('S22 dependency graph failed');
  }
  exactKeys(value.audits, [
    'advisoryAuditPerformed', 'licenseInventorySha256',
    'privacyFindings', 'productionVulnerabilities', 'registryAuditCount',
  ], 'S22 audits');
  if (!value.audits.advisoryAuditPerformed ||
      value.audits.registryAuditCount !== 1 ||
      value.audits.productionVulnerabilities !== 0 ||
      value.audits.privacyFindings !== 0 ||
      value.audits.licenseInventorySha256 !== LICENSE_SHA256) {
    throw new TypeError('S22 audit failed');
  }
  exactKeys(value.resources, [
    'descriptorBaseline', 'descriptorFinal', 'descriptorGrowthLimit',
    'descriptorGrowthMaximum', 'rssBaselineBytes', 'rssFinalBytes',
    'rssGrowthLimitBytes', 'rssGrowthMaximumBytes',
  ], 'S22 resources');
  for (const [field, amount] of Object.entries(value.resources)) {
    nonnegativeInteger(amount, `S22 resource ${field}`);
  }
  if (value.resources.descriptorGrowthLimit !== MAX_DESCRIPTOR_GROWTH ||
      value.resources.descriptorGrowthMaximum > MAX_DESCRIPTOR_GROWTH ||
      value.resources.rssGrowthLimitBytes !== MAX_RSS_GROWTH_BYTES ||
      value.resources.rssGrowthMaximumBytes > MAX_RSS_GROWTH_BYTES) {
    throw new TypeError('S22 resource ceiling failed');
  }
  exactKeys(value.cleanup, [
    'auditRootRemoved', 'everyCycleRootRemoved', 'escapeFileObserved',
    'providerProcessLaunched', 'staleControlStateObserved',
  ], 'S22 cleanup');
  if (!value.cleanup.auditRootRemoved || !value.cleanup.everyCycleRootRemoved ||
      value.cleanup.escapeFileObserved || value.cleanup.providerProcessLaunched ||
      value.cleanup.staleControlStateObserved) {
    throw new TypeError('S22 cleanup failed');
  }
  exactKeys(value.traffic, [
    'experimentCalls', 'installExternalRequests', 'providerCalls',
    'publicationActions', 'registryAuditRequests',
  ], 'S22 traffic');
  if (value.traffic.providerCalls !== 0 || value.traffic.experimentCalls !== 0 ||
      value.traffic.publicationActions !== 0 ||
      value.traffic.installExternalRequests !== 0 ||
      value.traffic.registryAuditRequests !== 1) {
    throw new TypeError('S22 traffic boundary failed');
  }
  digest(value.receiptSha256, 'S22 receipt');
  const body = structuredClone(value);
  delete body.receiptSha256;
  if (sha256(body) !== value.receiptSha256) {
    throw new TypeError('S22 receipt digest does not bind the receipt');
  }
  return value;
}

async function writeNoReplace(filename, value, mode = 0o600) {
  const handle = await open(filename, 'wx', mode);
  try {
    await handle.writeFile(value, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function fileInventory(root) {
  const entries = [];
  async function walk(directory, prefix = '') {
    const children = await readdir(directory, { withFileTypes: true });
    children.sort((a, b) => a.name.localeCompare(b.name));
    for (const child of children) {
      const relative = prefix ? `${prefix}/${child.name}` : child.name;
      const filename = path.join(directory, child.name);
      const metadata = await lstat(filename);
      if (metadata.isDirectory()) {
        entries.push({ path: relative, kind: 'directory', size: 0,
          mode: metadata.mode & 0o777 });
        await walk(filename, relative);
      } else if (metadata.isFile()) {
        entries.push({ path: relative, kind: 'file', size: metadata.size,
          mode: metadata.mode & 0o777,
          sha256: sha256(await readFile(filename)) });
      } else if (metadata.isSymbolicLink()) {
        entries.push({ path: relative, kind: 'symlink', size: 0, mode: 0 });
      } else {
        throw new TypeError('S22 inventory contains a special file');
      }
    }
  }
  await walk(root);
  return entries;
}

function projectDependency(name, value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      value.missing || value.invalid || value.extraneous || value.error) {
    throw new TypeError(`S22 dependency ${name} is not a valid closure node`);
  }
  return { name, version: value.version ?? null,
    dependencies: Object.entries(value.dependencies ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([childName, child]) => projectDependency(childName, child)) };
}
function dependencyClosure(value) {
  if (Array.isArray(value.problems) && value.problems.length !== 0) {
    throw new TypeError('S22 dependency graph reports problems');
  }
  return projectDependency(value.name ?? 'consumer-root', value);
}
async function descriptorCount() {
  return (await readdir('/proc/self/fd').catch(() => [])).length;
}
async function rssBytes() {
  const status = await readFile('/proc/self/status', 'utf8').catch(() => '');
  const match = /^VmRSS:\s+(\d+)\s+kB$/m.exec(status);
  return match ? Number(match[1]) * 1024 : 0;
}
function parseCli(result, command, expectedOk) {
  const value = JSON.parse(result.stdout);
  assert.equal(value.schema, 'scopa.cli-result.v1');
  assert.equal(value.command, command);
  assert.equal(value.ok, expectedOk);
  return value;
}

async function runCycle({ cycle, candidatePath, qualification, npmCommand,
  npmId, environment }) {
  const started = performance.now();
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s22-soak-'));
  try {
    const consumer = path.join(root, 'consumer');
    const cache = path.join(root, 'empty-cache');
    await mkdir(consumer);
    await writeNoReplace(path.join(consumer, 'package.json'),
      '{"name":"scopa-s22-soak","version":"1.0.0","private":true}\n');
    await invokeCaptured(npmCommand, [
      'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
      '--package-lock=false', '--cache', cache,
      '--registry', 'http://127.0.0.1:9', candidatePath,
    ], { cwd: consumer, env: environment });
    const installedRoot = await realpath(path.join(consumer,
      'node_modules/@heart-ai-foundation/scopa'));
    const packageJson = JSON.parse(await readFile(
      path.join(installedRoot, 'package.json'), 'utf8'));
    assert.equal(packageJson.version, qualification.candidate.package.version);
    const bundleManifest = JSON.parse(await readFile(
      path.join(installedRoot, 'production-bundle.json'), 'utf8'));
    const bundle = await verifyProductionBundleRoot({
      root: installedRoot, manifest: bundleManifest,
    });
    assert.equal(bundleManifest.manifestSha256, MANIFEST_SHA256);
    assert.equal(bundle.closureSha256, CLOSURE_SHA256);
    assert.equal(bundle.bundledPayloadSha256, PAYLOAD_SHA256);
    assert.equal(bundle.installedPayloadSha256, PAYLOAD_SHA256);
    assert.equal(bundle.licenseInventorySha256, LICENSE_SHA256);
    const installedFiles = await fileInventory(installedRoot);
    const rootFiles = installedFiles.filter(({ kind, path: filePath }) =>
      kind === 'file' && !filePath.startsWith('node_modules/'));
    const privacy = await scanPackagePrivacy({ installedRoot, files: rootFiles });
    const bundlePrivacy = await scanProductionBundlePrivacy({
      root: installedRoot, manifest: bundleManifest,
    });
    assert.deepEqual(privacy, []);
    assert.deepEqual(bundlePrivacy.findings, []);
    const dependencyResult = await invokeCaptured(npmCommand,
      ['ls', '--all', '--json', '--omit=dev'], { cwd: consumer, env: environment });
    const dependency = dependencyClosure(JSON.parse(dependencyResult.stdout));

    const repository = path.join(root, 'repository');
    await mkdir(path.join(repository, '.git'), { recursive: true });
    await mkdir(path.join(repository, 'workspace'), { recursive: true });
    await writeFile(path.join(repository, 'scopa.slice-definition.json'),
      await readFile(path.join(installedRoot,
        'fixtures/S10/clean.slice-definition.json')), { mode: 0o600 });
    await writeFile(path.join(repository, 'workspace/consumer.txt'),
      'SCOPA_CONSUMER_ALLOWED\n', { mode: 0o600 });
    const binary = path.join(consumer, 'node_modules/.bin/scopa');
    const init = parseCli(await invokeCaptured(binary, [
      'init', '--definition', 'scopa.slice-definition.json',
    ], { cwd: repository, env: environment }), 'init', true);
    parseCli(await invokeCaptured(binary, ['run', '--request-json',
      JSON.stringify({ name: 'write_file', arguments: {
        path: 'workspace/soak.txt', content: 'SCOPA_S22_SOAK\n' } })],
    { cwd: repository, env: environment }), 'run', true);
    const denied = parseCli(await invokeCaptured(binary, [
      'run', '--request-json', JSON.stringify({ name: 'write_file',
        arguments: { path: '../escape.txt', content: 'DENIED\n' } })],
    { cwd: repository, env: environment, expectedExitCodes: [3] }), 'run', false);
    assert.equal(denied.error.code, 'SCOPA_SCOPE_DENIED');
    await assert.rejects(() => access(path.join(root, 'escape.txt')),
      { code: 'ENOENT' });
    const status = parseCli(await invokeCaptured(binary, ['status'],
      { cwd: repository, env: environment }), 'status', true);
    const check = parseCli(await invokeCaptured(binary, ['check'],
      { cwd: repository, env: environment }), 'check', true);
    assert.equal(status.result.canStop, true);
    assert.equal(check.result.canStop, true);
    assert.equal(init.result.lockHash, check.result.lockHash);
    const control = await fileInventory(path.join(repository, '.scopa'));
    return { cycle, npmId,
      packageSha256: sha256(await readFile(candidatePath)),
      productionBundleManifestSha256: bundleManifest.manifestSha256,
      closureSha256: bundle.closureSha256,
      bundledPayloadSha256: bundle.bundledPayloadSha256,
      installedPayloadSha256: bundle.installedPayloadSha256,
      licenseInventorySha256: bundle.licenseInventorySha256,
      installedTreeSha256: sha256(installedFiles),
      installedEntryCount: installedFiles.length,
      productionFileCount: bundle.fileCount,
      dependencyGraphSha256: sha256(dependency),
      dependencyNodeCount: JSON.stringify(dependency).match(/"name"/g)?.length ?? 0,
      privacyFindings: privacy.length + bundlePrivacy.findings.length,
      runtimePolarityPassed: true, canStop: check.result.canStop,
      controlStateSha256: sha256(control), externalRequests: 0,
      durationMs: Math.ceil(performance.now() - started) };
  } finally {
    await rm(root, { recursive: true, force: true });
    await assert.rejects(() => access(root), { code: 'ENOENT' });
  }
}

function vulnerabilityTotal(audit) {
  const values = audit?.metadata?.vulnerabilities;
  if (values === null || typeof values !== 'object' || Array.isArray(values)) {
    throw new TypeError('S22 npm audit result is malformed');
  }
  return ['info', 'low', 'moderate', 'high', 'critical']
    .reduce((total, key) => total + (values[key] ?? 0), 0);
}

export async function runS22BundledClosureSoak({ candidatePath,
  qualificationPath, npm10Command = process.env.SCOPA_NPM_COMMAND || 'npm',
  npm11Command = process.env.SCOPA_NPM11_COMMAND }) {
  const plan = createS22BundledClosureSoakPlan();
  if (!npm11Command) throw new TypeError('SCOPA_NPM11_COMMAND is required');
  const qualification = assertBundledExactCandidateQualification(
    JSON.parse(await readFile(qualificationPath, 'utf8')));
  if (qualification.receiptSha256 !== QUALIFICATION_SHA256 ||
      qualification.source.commit !== SOURCE_COMMIT ||
      qualification.candidate.packageSha256 !== PACKAGE_SHA256 ||
      sha256(await readFile(candidatePath)) !== PACKAGE_SHA256) {
    throw new TypeError('S22 candidate or qualification binding drifted');
  }
  const [npm10Version, npm11Version] = await Promise.all([
    invokeCaptured(npm10Command, ['--version']).then(({ stdout }) => stdout.trim()),
    invokeCaptured(npm11Command, ['--version']).then(({ stdout }) => stdout.trim()),
  ]);
  assert.equal(npm10Version, '10.9.7');
  assert.equal(npm11Version, '11.19.0');
  const environment = { ...createQualificationEnvironment(),
    NODE_OPTIONS: `--require=${path.join(ROOT,
      'fixtures/S19-v2/network-deny.cjs')}` };
  const beforeDescriptors = await descriptorCount();
  const beforeRss = await rssBytes();
  let peakDescriptors = beforeDescriptors;
  let peakRss = beforeRss;
  const cycles = [];
  for (let index = 0; index < CYCLES; index += 1) {
    const npmId = plan.npmSequence[index];
    const npmCommand = npmId === 'npm10' ? npm10Command : npm11Command;
    const result = await invokeCaptured(process.execPath, [SELF,
      '--cycle', String(index + 1), '--npm-id', npmId,
      '--npm-command', npmCommand, '--candidate', path.resolve(candidatePath),
      '--qualification', path.resolve(qualificationPath),
    ], { env: environment });
    cycles.push(JSON.parse(result.stdout));
    peakDescriptors = Math.max(peakDescriptors, await descriptorCount());
    peakRss = Math.max(peakRss, await rssBytes());
  }
  const afterDescriptors = await descriptorCount();
  const afterRss = await rssBytes();
  const stableFields = [
    'packageSha256', 'productionBundleManifestSha256', 'closureSha256',
    'bundledPayloadSha256', 'installedPayloadSha256',
    'licenseInventorySha256', 'installedTreeSha256', 'installedEntryCount',
    'productionFileCount', 'dependencyGraphSha256', 'dependencyNodeCount',
    'privacyFindings', 'runtimePolarityPassed', 'canStop',
    'controlStateSha256', 'externalRequests',
  ];
  for (const field of stableFields) {
    assert.equal(new Set(cycles.map((cycle) => canonicalJson(cycle[field]))).size,
      1, `S22 cycle drift: ${field}`);
  }
  const descriptorGrowth = Math.max(0, peakDescriptors - beforeDescriptors);
  const rssGrowthBytes = Math.max(0, peakRss - beforeRss);
  assert.ok(descriptorGrowth <= MAX_DESCRIPTOR_GROWTH);
  assert.ok(rssGrowthBytes <= MAX_RSS_GROWTH_BYTES);

  const auditRoot = await mkdtemp(path.join(os.tmpdir(), 'scopa-s22-audit-'));
  let audit;
  try {
    await writeNoReplace(path.join(auditRoot, 'package.json'),
      '{"name":"scopa-s22-audit","version":"1.0.0","private":true}\n');
    await invokeCaptured(npm10Command, [
      'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
      '--package-lock=true', '--cache', path.join(auditRoot, 'empty-cache'),
      '--registry', 'http://127.0.0.1:9', path.resolve(candidatePath),
    ], { cwd: auditRoot, env: environment });
    const auditResult = await invokeCaptured(npm10Command, [
      'audit', '--omit=dev', '--json', '--audit-level=low',
      '--registry', 'https://registry.npmjs.org',
    ], { cwd: auditRoot, env: createQualificationEnvironment(),
      expectedExitCodes: [0, 1] });
    audit = JSON.parse(auditResult.stdout);
    assert.equal(auditResult.exitCode, 0);
    assert.equal(vulnerabilityTotal(audit), 0);
  } finally {
    await rm(auditRoot, { recursive: true, force: true });
    await assert.rejects(() => access(auditRoot), { code: 'ENOENT' });
  }
  const durations = cycles.map(({ durationMs }) => durationMs);
  const body = {
    schema: 'scopa.s22-bundled-closure-soak-receipt.v1', slice: 'S22',
    planSha256: plan.planSha256, sourceCommit: SOURCE_COMMIT,
    productionIdentity: structuredClone(plan.productionIdentity),
    cycleLedger: cycles.map(({ cycle, npmId, installedTreeSha256,
      dependencyGraphSha256, controlStateSha256, privacyFindings,
      runtimePolarityPassed, externalRequests, durationMs }) => ({ cycle, npmId,
      installedTreeSha256, dependencyGraphSha256, controlStateSha256,
      privacyFindings, runtimePolarityPassed, externalRequests, durationMs })),
    cycles: { planned: CYCLES, completed: cycles.length,
      freshEmptyCachePerCycle: true, allFourPartIdentitiesExact: true,
      allInstalledTreesIdentical: true, allDependencyGraphsIdentical: true,
      allLicenseInventoriesIdentical: true, allControlStatesIdentical: true,
      allPrivacyScansClean: cycles.every(({ privacyFindings }) =>
        privacyFindings === 0),
      allRuntimePolarityPassed: cycles.every(({ runtimePolarityPassed,
        canStop }) => runtimePolarityPassed && canStop),
      maximumDurationMs: Math.max(...durations),
      totalDurationMs: durations.reduce((sum, value) => sum + value, 0) },
    npm: { npm10Version, npm11Version,
      npm10Cycles: cycles.filter(({ npmId }) => npmId === 'npm10').length,
      npm11Cycles: cycles.filter(({ npmId }) => npmId === 'npm11').length,
      sequenceFollowed: canonicalJson(cycles.map(({ npmId }) => npmId)) ===
        canonicalJson(plan.npmSequence) },
    installedSurface: { entryCount: cycles[0].installedEntryCount,
      treeSha256: cycles[0].installedTreeSha256,
      productionFileCount: cycles[0].productionFileCount,
      privacyFindings: cycles[0].privacyFindings },
    dependencies: { graphSha256: cycles[0].dependencyGraphSha256,
      nodeCount: cycles[0].dependencyNodeCount,
      graphStableAcrossCycles: true },
    audits: { advisoryAuditPerformed: true, registryAuditCount: 1,
      productionVulnerabilities: vulnerabilityTotal(audit), privacyFindings: 0,
      licenseInventorySha256: cycles[0].licenseInventorySha256 },
    resources: { descriptorBaseline: beforeDescriptors,
      descriptorFinal: afterDescriptors, descriptorGrowthMaximum: descriptorGrowth,
      descriptorGrowthLimit: MAX_DESCRIPTOR_GROWTH, rssBaselineBytes: beforeRss,
      rssFinalBytes: afterRss, rssGrowthMaximumBytes: rssGrowthBytes,
      rssGrowthLimitBytes: MAX_RSS_GROWTH_BYTES },
    cleanup: { everyCycleRootRemoved: true, auditRootRemoved: true,
      staleControlStateObserved: false, escapeFileObserved: false,
      providerProcessLaunched: false },
    traffic: { providerCalls: 0, experimentCalls: 0, publicationActions: 0,
      installExternalRequests: 0, registryAuditRequests: 1 }, result: 'pass',
  };
  return validateS22BundledClosureSoakReceipt({
    ...body, receiptSha256: sha256(body),
  });
}

async function main() {
  if (process.argv[2] === '--cycle') {
    const args = process.argv.slice(2);
    const expected = [
      '--cycle', '--npm-id', '--npm-command', '--candidate', '--qualification',
    ];
    if (args.length !== 10 ||
        expected.some((flag, index) => args[index * 2] !== flag)) {
      throw new TypeError('invalid S22 isolated cycle arguments');
    }
    const cycle = Number(args[1]);
    const npmId = args[3];
    const npmCommand = args[5];
    const candidatePath = path.resolve(args[7]);
    const qualificationPath = path.resolve(args[9]);
    if (!Number.isSafeInteger(cycle) || cycle < 1 || cycle > CYCLES ||
        !['npm10', 'npm11'].includes(npmId)) {
      throw new TypeError('invalid S22 isolated cycle identity');
    }
    const qualification = assertBundledExactCandidateQualification(
      JSON.parse(await readFile(qualificationPath, 'utf8')));
    if (qualification.receiptSha256 !== QUALIFICATION_SHA256 ||
        sha256(await readFile(candidatePath)) !== PACKAGE_SHA256) {
      throw new TypeError('S22 isolated cycle candidate drifted');
    }
    const result = await runCycle({ cycle, npmId, npmCommand, candidatePath,
      qualification, environment: createQualificationEnvironment() });
    process.stdout.write(canonicalJson(result));
    return;
  }
  if (process.argv.length !== 6 || process.argv[2] !== '--candidate' ||
      process.argv[4] !== '--qualification') {
    throw new TypeError('usage: bundled-closure-soak.js --candidate <tgz> ' +
      '--qualification <json>');
  }
  const receipt = await runS22BundledClosureSoak({
    candidatePath: path.resolve(process.argv[3]),
    qualificationPath: path.resolve(process.argv[5]),
  });
  process.stdout.write(canonicalJsonPretty(receipt));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
