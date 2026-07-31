#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  access, copyFile, lstat, mkdir, mkdtemp, open, readdir, readFile,
  realpath, rm, writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalJson,
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  assertExactCandidateQualification,
  createQualificationEnvironment,
} from './exact-candidate-probe.js';
import { scanPackagePrivacy } from './package-privacy.js';
import { invokeCaptured } from './subprocess.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const CYCLES = 12;
const EXPECTED_CANDIDATE =
  'e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498';
const EXPECTED_SOURCE = '43fbb969f32c711d1a68b05ad73fb33717c90d8c';
const MAX_RSS_GROWTH_BYTES = 64 * 1024 * 1024;
const MAX_DESCRIPTOR_GROWTH = 4;
const EXPECTED_INSTALLED_TREE_SHA256 =
  '0e6cb8891aefbd7c38acc825ba05f991e27a9fea9659d54ff724ae22efde32a2';
const EXPECTED_DEPENDENCY_GRAPH_SHA256 =
  '814737ae775f21742667343da6887e4c2e92f7b3552161825cfd6dfc9f829c85';

function sha256(value) {
  return createHash('sha256').update(
    typeof value === 'string' || Buffer.isBuffer(value)
      ? value
      : canonicalJson(value),
  ).digest('hex');
}

export function createS18CandidateSoakPlan() {
  const body = {
    schema: 'scopa.s18-exact-candidate-soak-plan.v1',
    slice: 'S18.3',
    candidateSha256: EXPECTED_CANDIDATE,
    sourceCommit: EXPECTED_SOURCE,
    cycles: CYCLES,
    providerTrafficAllowed: false,
    registryTrafficAllowed: true,
    repositoryClass: 'fresh-disposable-synthetic-per-cycle',
    operations: [
      'fresh-ignore-scripts-install',
      'installed-file-tree-and-dependency-closure',
      'project-init',
      'allowed-act-write',
      'denied-repository-escape',
      'status-and-completion-check',
      'fresh-process-cold-reload',
      'cycle-root-removal',
    ],
    audits: [
      'current-npm-production-advisories',
      'installed-package-privacy-and-credential-patterns',
      'dependency-graph-stability',
      'filesystem-inventory-stability',
      'descriptor-and-controller-rss-growth',
      'process-repository-and-temporary-root-cleanup',
      'stale-control-state-and-false-green-refusal',
    ],
    limits: {
      maxCycles: CYCLES,
      maxRssGrowthBytes: MAX_RSS_GROWTH_BYTES,
      maxDescriptorGrowth: MAX_DESCRIPTOR_GROWTH,
      maxProviderInvocations: 0,
      maxRegistryAudits: 1,
    },
    rejectIf: [
      'candidate-source-qualification-or-installed-tree-drift',
      'dependency-missing-invalid-extraneous-or-cycle-drift',
      'current-production-advisory-found-or-audit-unavailable',
      'credential-private-topology-or-forbidden-value-found',
      'allowed-write-denied-or-escape-write-accepted',
      'status-check-lock-or-stop-polarity-drift',
      'descriptor-rss-filesystem-or-process-growth-exceeds-bound',
      'temporary-root-repository-state-or-child-process-survives',
    ],
    onFailure: {
      action: 'stop-soak-reject-s18.3-and-retain-bounded-diagnostics',
      providerReplayAllowed: false,
    },
    ifAmbiguous: {
      action: 'fail-closed-without-provider-traffic',
    },
  };
  return { ...body, planSha256: sha256(body) };
}

export function validateS18CandidateSoakPlan(value) {
  const expected = createS18CandidateSoakPlan();
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new TypeError('S18.3 soak plan differs from the frozen plan');
  }
  return value;
}

function keys(value, expected, label) {
  if (
    value === null || typeof value !== 'object' || Array.isArray(value) ||
    Object.keys(value).sort().join('\0') !== [...expected].sort().join('\0')
  ) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function nonnegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a nonnegative integer`);
  }
}

export function validateS18CandidateSoakReceipt(value) {
  keys(value, [
    'candidateSha256', 'cleanup', 'cycles', 'dependencies',
    'installedSurface', 'planSha256', 'providerTrafficConsumed',
    'receiptSha256', 'resources', 'result', 'schema', 'slice', 'sourceCommit',
  ], 'S18.3 soak receipt');
  if (
    value.schema !== 'scopa.s18-exact-candidate-soak-receipt.v1' ||
    value.slice !== 'S18.3' || value.candidateSha256 !== EXPECTED_CANDIDATE ||
    value.sourceCommit !== EXPECTED_SOURCE || value.providerTrafficConsumed !== 0 ||
    value.planSha256 !== createS18CandidateSoakPlan().planSha256 ||
    value.result !== 'pass' || !/^[0-9a-f]{64}$/.test(value.receiptSha256)
  ) {
    throw new TypeError('S18.3 soak receipt identity or result drifted');
  }
  keys(value.cycles, [
    'allAllowedActsPassed', 'allCanStop', 'allCandidateDigestsIdentical',
    'allControlStatesIdentical', 'allDeniedEscapesObserved',
    'allDependencyGraphsIdentical', 'allInstalledTreesIdentical', 'completed',
    'freshInstallPerCycle', 'maximumDurationMs', 'planned', 'totalDurationMs',
  ], 'S18.3 cycles');
  for (const field of [
    'allAllowedActsPassed', 'allCanStop', 'allCandidateDigestsIdentical',
    'allControlStatesIdentical', 'allDeniedEscapesObserved',
    'allDependencyGraphsIdentical', 'allInstalledTreesIdentical',
    'freshInstallPerCycle',
  ]) {
    if (value.cycles[field] !== true) {
      throw new TypeError(`S18.3 cycle assertion failed: ${field}`);
    }
  }
  if (value.cycles.planned !== CYCLES || value.cycles.completed !== CYCLES) {
    throw new TypeError('S18.3 cycle count drifted');
  }
  nonnegativeInteger(value.cycles.maximumDurationMs, 'maximum cycle duration');
  nonnegativeInteger(value.cycles.totalDurationMs, 'total cycle duration');
  if (
    value.cycles.maximumDurationMs === 0 ||
    value.cycles.totalDurationMs < value.cycles.maximumDurationMs
  ) {
    throw new TypeError('S18.3 cycle duration evidence is invalid');
  }
  keys(value.installedSurface, [
    'declaredBinModePromotions', 'entryCount', 'privacyFindings', 'treeSha256',
  ], 'S18.3 installed surface');
  if (
    value.installedSurface.declaredBinModePromotions !== 2 ||
    value.installedSurface.entryCount !== 215 ||
    value.installedSurface.privacyFindings !== 0 ||
    value.installedSurface.treeSha256 !== EXPECTED_INSTALLED_TREE_SHA256
  ) {
    throw new TypeError('S18.3 installed surface drifted');
  }
  keys(value.dependencies, [
    'graphSha256', 'graphStableAcrossCycles', 'nodeCount',
    'productionVulnerabilities', 'registryAuditPerformed',
  ], 'S18.3 dependencies');
  if (
    value.dependencies.graphSha256 !== EXPECTED_DEPENDENCY_GRAPH_SHA256 ||
    value.dependencies.graphStableAcrossCycles !== true ||
    value.dependencies.nodeCount !== 14 ||
    value.dependencies.productionVulnerabilities !== 0 ||
    value.dependencies.registryAuditPerformed !== true
  ) {
    throw new TypeError('S18.3 dependency audit drifted');
  }
  keys(value.resources, [
    'descriptorBaseline', 'descriptorFinal', 'descriptorGrowthLimit',
    'descriptorGrowthMaximum', 'rssBaselineBytes', 'rssFinalBytes',
    'rssGrowthLimitBytes', 'rssGrowthMaximumBytes',
  ], 'S18.3 resources');
  for (const [field, number] of Object.entries(value.resources)) {
    nonnegativeInteger(number, `S18.3 resource ${field}`);
  }
  if (
    value.resources.descriptorGrowthLimit !== MAX_DESCRIPTOR_GROWTH ||
    value.resources.descriptorGrowthMaximum > MAX_DESCRIPTOR_GROWTH ||
    value.resources.rssGrowthLimitBytes !== MAX_RSS_GROWTH_BYTES ||
    value.resources.rssGrowthMaximumBytes > MAX_RSS_GROWTH_BYTES
  ) {
    throw new TypeError('S18.3 resource ceiling failed');
  }
  keys(value.cleanup, [
    'auditRootRemoved', 'escapeFileObserved', 'everyCycleRootRemoved',
    'providerProcessLaunched', 'staleControlStateObserved',
  ], 'S18.3 cleanup');
  if (
    value.cleanup.auditRootRemoved !== true ||
    value.cleanup.everyCycleRootRemoved !== true ||
    value.cleanup.escapeFileObserved !== false ||
    value.cleanup.providerProcessLaunched !== false ||
    value.cleanup.staleControlStateObserved !== false
  ) {
    throw new TypeError('S18.3 cleanup failed');
  }
  const body = structuredClone(value);
  delete body.receiptSha256;
  if (sha256(body) !== value.receiptSha256) {
    throw new TypeError('S18.3 receipt digest does not bind the receipt');
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
    children.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const child of children) {
      const relative = prefix ? `${prefix}/${child.name}` : child.name;
      const filename = path.join(directory, child.name);
      const metadata = await lstat(filename);
      if (metadata.isSymbolicLink()) {
        entries.push({ path: relative, kind: 'symlink', size: 0, mode: 0 });
      } else if (metadata.isDirectory()) {
        entries.push({ path: relative, kind: 'directory', size: 0,
          mode: metadata.mode & 0o777 });
        await walk(filename, relative);
      } else if (metadata.isFile()) {
        entries.push({
          path: relative,
          kind: 'file',
          size: metadata.size,
          mode: metadata.mode & 0o777,
          sha256: sha256(await readFile(filename)),
        });
      } else {
        throw new TypeError('S18.3 inventory contains a special file');
      }
    }
  }
  await walk(root);
  return entries;
}

function projectDependency(name, value) {
  if (
    value === null || typeof value !== 'object' || Array.isArray(value) ||
    value.missing || value.invalid || value.extraneous || value.error
  ) {
    throw new TypeError(`S18.3 dependency ${name} is not a valid closure node`);
  }
  const dependencies = Object.entries(value.dependencies ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([childName, child]) => projectDependency(childName, child));
  return {
    name,
    version: value.version ?? null,
    dependencies,
  };
}

function dependencyClosure(value) {
  if (Array.isArray(value.problems) && value.problems.length !== 0) {
    throw new TypeError('S18.3 dependency graph reports problems');
  }
  return projectDependency(value.name ?? 'consumer-root', value);
}

async function descriptorCount() {
  return (await readdir('/proc/self/fd').catch(() => [])).length;
}

async function rssBytes() {
  const statusText = await readFile('/proc/self/status', 'utf8').catch(() => '');
  const match = /^VmRSS:\s+(\d+)\s+kB$/m.exec(statusText);
  return match ? Number(match[1]) * 1024 : 0;
}

function parseCli(result, command, expectedOk) {
  const value = JSON.parse(result.stdout);
  assert.equal(value.schema, 'scopa.cli-result.v1');
  assert.equal(value.command, command);
  assert.equal(value.ok, expectedOk);
  return value;
}

async function runCycle({ cycle, candidatePath, qualification, environment }) {
  const started = performance.now();
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s18-soak-'));
  try {
    const consumer = path.join(root, 'consumer');
    await mkdir(consumer);
    await writeNoReplace(path.join(consumer, 'package.json'),
      '{"name":"scopa-s18-soak","version":"1.0.0","private":true}\n');
    await invokeCaptured('npm', [
      'install', '--ignore-scripts', '--no-audit', '--no-fund',
      '--package-lock=true', candidatePath,
    ], { cwd: consumer, env: environment });
    const installedRoot = await realpath(path.join(
      consumer, 'node_modules/@heart-ai-foundation/scopa'));
    const packageJson = JSON.parse(await readFile(
      path.join(installedRoot, 'package.json'), 'utf8'));
    assert.equal(packageJson.name, '@heart-ai-foundation/scopa');
    assert.equal(packageJson.version, qualification.candidate.manifest.package.version);
    const manifest = qualification.candidate.manifest;
    const installedFiles = await fileInventory(installedRoot);
    const regularFiles = installedFiles.filter(({ kind }) => kind === 'file');
    const binTargets = new Set(Object.values(packageJson.bin).map(
      (target) => target.replace(/^\.\//, ''),
    ));
    assert.equal(regularFiles.length, manifest.files.length);
    for (const [index, expected] of manifest.files.entries()) {
      const actual = regularFiles[index];
      assert.equal(actual.path, expected.path);
      assert.equal(actual.size, expected.size);
      assert.equal(actual.mode, binTargets.has(expected.path) ? 0o755 : expected.mode);
    }
    const privacy = await scanPackagePrivacy({
      installedRoot,
      files: manifest.files,
    });
    assert.deepEqual(privacy, []);
    const dependencyResult = await invokeCaptured('npm', [
      'ls', '--all', '--json', '--omit=dev',
    ], { cwd: consumer, env: environment });
    const dependency = dependencyClosure(JSON.parse(dependencyResult.stdout));

    const repository = path.join(root, 'repository');
    await mkdir(path.join(repository, '.git'), { recursive: true });
    await mkdir(path.join(repository, 'workspace'), { recursive: true });
    await copyFile(path.join(installedRoot,
      'fixtures/S10/clean.slice-definition.json'),
    path.join(repository, 'scopa.slice-definition.json'));
    await writeFile(path.join(repository, 'workspace/consumer.txt'),
      'SCOPA_CONSUMER_ALLOWED\n', { mode: 0o600 });
    const binary = path.join(consumer, 'node_modules/.bin/scopa');
    const init = parseCli(await invokeCaptured(binary, [
      'init', '--definition', 'scopa.slice-definition.json',
    ], { cwd: repository, env: environment }), 'init', true);
    const write = parseCli(await invokeCaptured(binary, [
      'run', '--request-json', JSON.stringify({
        name: 'write_file',
        arguments: {
          path: 'workspace/soak.txt',
          content: 'SCOPA_S18_SOAK\n',
        },
      }),
    ], { cwd: repository, env: environment }), 'run', true);
    const denied = parseCli(await invokeCaptured(binary, [
      'run', '--request-json', JSON.stringify({
        name: 'write_file',
        arguments: { path: '../escape.txt', content: 'DENIED\n' },
      }),
    ], { cwd: repository, env: environment, expectedExitCodes: [3] }),
    'run', false);
    assert.equal(denied.error.code, 'SCOPA_SCOPE_DENIED');
    await assert.rejects(() => access(path.join(root, 'escape.txt')),
      { code: 'ENOENT' });
    const statusResult = parseCli(await invokeCaptured(binary, ['status'], {
      cwd: repository, env: environment,
    }), 'status', true);
    const checkResult = parseCli(await invokeCaptured(binary, ['check'], {
      cwd: repository, env: environment,
    }), 'check', true);
    assert.equal(statusResult.result.canStop, true);
    assert.equal(checkResult.result.canStop, true);
    assert.equal(init.result.lockHash, checkResult.result.lockHash);
    assert.equal(await readFile(path.join(repository, 'workspace/soak.txt'),
      'utf8'), 'SCOPA_S18_SOAK\n');
    const control = await fileInventory(path.join(repository, '.scopa'));
    const durationMs = Math.ceil(performance.now() - started);
    return {
      cycle,
      candidateSha256: sha256(await readFile(candidatePath)),
      installedTreeSha256: sha256(installedFiles),
      installedEntryCount: installedFiles.length,
      installedBinModePromotions: binTargets.size,
      dependencyGraphSha256: sha256(dependency),
      dependencyNodeCount: JSON.stringify(dependency).match(/"name"/g)?.length ?? 0,
      privacyFindings: privacy.length,
      allowedActPassed: write.result?.ok !== false,
      deniedEscapeObserved: true,
      canStop: checkResult.result.canStop,
      lockHash: checkResult.result.lockHash,
      controlStateSha256: sha256(control),
      durationMs,
    };
  } finally {
    await rm(root, { recursive: true, force: true });
    await assert.rejects(() => access(root), { code: 'ENOENT' });
  }
}

function vulnerabilityTotal(audit) {
  const values = audit?.metadata?.vulnerabilities;
  if (values === null || typeof values !== 'object' || Array.isArray(values)) {
    throw new TypeError('S18.3 npm audit result is malformed');
  }
  return ['info', 'low', 'moderate', 'high', 'critical']
    .reduce((total, key) => total + (values[key] ?? 0), 0);
}

export async function runS18CandidateSoak({ candidatePath, qualificationPath }) {
  const plan = createS18CandidateSoakPlan();
  const qualification = assertExactCandidateQualification(
    JSON.parse(await readFile(qualificationPath, 'utf8')),
  );
  if (
    qualification.candidate.packageSha256 !== EXPECTED_CANDIDATE ||
    qualification.source.commit !== EXPECTED_SOURCE ||
    sha256(await readFile(candidatePath)) !== EXPECTED_CANDIDATE
  ) {
    throw new TypeError('S18.3 exact candidate binding drifted');
  }
  const environment = createQualificationEnvironment();
  const beforeDescriptors = await descriptorCount();
  const beforeRss = await rssBytes();
  const cycles = [];
  let peakDescriptors = beforeDescriptors;
  let peakRss = beforeRss;
  for (let cycle = 1; cycle <= CYCLES; cycle += 1) {
    cycles.push(await runCycle({
      cycle, candidatePath: path.resolve(candidatePath), qualification,
      environment,
    }));
    peakDescriptors = Math.max(peakDescriptors, await descriptorCount());
    peakRss = Math.max(peakRss, await rssBytes());
  }
  const afterDescriptors = await descriptorCount();
  const afterRss = await rssBytes();
  const stableFields = [
    'candidateSha256', 'installedTreeSha256', 'installedEntryCount',
    'installedBinModePromotions',
    'dependencyGraphSha256', 'dependencyNodeCount', 'privacyFindings',
    'allowedActPassed', 'deniedEscapeObserved', 'canStop', 'lockHash',
    'controlStateSha256',
  ];
  for (const field of stableFields) {
    assert.equal(new Set(cycles.map((entry) => canonicalJson(entry[field]))).size,
      1, `S18.3 cycle drift: ${field}`);
  }
  const descriptorGrowth = Math.max(0, peakDescriptors - beforeDescriptors);
  const rssGrowthBytes = Math.max(0, peakRss - beforeRss);
  assert.ok(descriptorGrowth <= MAX_DESCRIPTOR_GROWTH);
  assert.ok(rssGrowthBytes <= MAX_RSS_GROWTH_BYTES);

  const auditRoot = await mkdtemp(path.join(os.tmpdir(), 'scopa-s18-audit-'));
  let audit;
  try {
    await writeNoReplace(path.join(auditRoot, 'package.json'),
      '{"name":"scopa-s18-audit","version":"1.0.0","private":true}\n');
    await invokeCaptured('npm', [
      'install', '--ignore-scripts', '--no-audit', '--no-fund',
      '--package-lock=true', path.resolve(candidatePath),
    ], { cwd: auditRoot, env: environment });
    const result = await invokeCaptured('npm', [
      'audit', '--omit=dev', '--json', '--audit-level=low',
    ], { cwd: auditRoot, env: environment, expectedExitCodes: [0, 1] });
    audit = JSON.parse(result.stdout);
    assert.equal(result.exitCode, 0);
    assert.equal(vulnerabilityTotal(audit), 0);
  } finally {
    await rm(auditRoot, { recursive: true, force: true });
    await assert.rejects(() => access(auditRoot), { code: 'ENOENT' });
  }
  const durations = cycles.map(({ durationMs }) => durationMs);
  const body = {
    schema: 'scopa.s18-exact-candidate-soak-receipt.v1',
    slice: 'S18.3',
    planSha256: plan.planSha256,
    candidateSha256: EXPECTED_CANDIDATE,
    sourceCommit: EXPECTED_SOURCE,
    providerTrafficConsumed: 0,
    cycles: {
      planned: CYCLES,
      completed: cycles.length,
      freshInstallPerCycle: true,
      allCandidateDigestsIdentical: true,
      allInstalledTreesIdentical: true,
      allDependencyGraphsIdentical: true,
      allControlStatesIdentical: true,
      allAllowedActsPassed: cycles.every(({ allowedActPassed }) => allowedActPassed),
      allDeniedEscapesObserved: cycles.every(({ deniedEscapeObserved }) => deniedEscapeObserved),
      allCanStop: cycles.every(({ canStop }) => canStop),
      maximumDurationMs: Math.max(...durations),
      totalDurationMs: durations.reduce((sum, value) => sum + value, 0),
    },
    installedSurface: {
      entryCount: cycles[0].installedEntryCount,
      treeSha256: cycles[0].installedTreeSha256,
      declaredBinModePromotions: cycles[0].installedBinModePromotions,
      privacyFindings: cycles[0].privacyFindings,
    },
    dependencies: {
      graphSha256: cycles[0].dependencyGraphSha256,
      nodeCount: cycles[0].dependencyNodeCount,
      graphStableAcrossCycles: true,
      registryAuditPerformed: true,
      productionVulnerabilities: vulnerabilityTotal(audit),
    },
    resources: {
      descriptorBaseline: beforeDescriptors,
      descriptorFinal: afterDescriptors,
      descriptorGrowthMaximum: descriptorGrowth,
      descriptorGrowthLimit: MAX_DESCRIPTOR_GROWTH,
      rssBaselineBytes: beforeRss,
      rssFinalBytes: afterRss,
      rssGrowthMaximumBytes: rssGrowthBytes,
      rssGrowthLimitBytes: MAX_RSS_GROWTH_BYTES,
    },
    cleanup: {
      everyCycleRootRemoved: true,
      auditRootRemoved: true,
      staleControlStateObserved: false,
      escapeFileObserved: false,
      providerProcessLaunched: false,
    },
    result: 'pass',
  };
  return validateS18CandidateSoakReceipt({
    ...body, receiptSha256: sha256(body),
  });
}

async function main() {
  if (
    process.argv.length !== 6 || process.argv[2] !== '--candidate' ||
    process.argv[4] !== '--qualification'
  ) {
    throw new TypeError(
      'usage: exact-candidate-soak.js --candidate <tgz> ' +
      '--qualification <json>',
    );
  }
  const receipt = await runS18CandidateSoak({
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
