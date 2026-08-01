import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { jsonHash } from '../../enforcement/src/index.js';
import {
  createS22BundledClosureSoakPlan,
  validateS22BundledClosureSoakPlan,
  validateS22BundledClosureSoakReceipt,
} from '../src/bundled-closure-soak.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const PLAN_PATH = path.join(ROOT, 'fixtures/S22/bundled-closure-soak-plan.json');

function receipt() {
  const plan = createS22BundledClosureSoakPlan();
  const body = {
    schema: 'scopa.s22-bundled-closure-soak-receipt.v1',
    slice: 'S22', planSha256: plan.planSha256,
    sourceCommit: plan.sourceCommit,
    productionIdentity: structuredClone(plan.productionIdentity),
    cycleLedger: plan.npmSequence.map((npmId, index) => ({
      cycle: index + 1,
      npmId,
      installedTreeSha256: plan.cycleIdentity.installedTreeSha256,
      dependencyGraphSha256: plan.cycleIdentity.dependencyGraphSha256,
      controlStateSha256: plan.cycleIdentity.controlStateSha256,
      privacyFindings: 0,
      runtimePolarityPassed: true,
      externalRequests: 0,
      durationMs: 1000,
    })),
    cycles: { planned: 12, completed: 12, freshEmptyCachePerCycle: true,
      allFourPartIdentitiesExact: true, allInstalledTreesIdentical: true,
      allDependencyGraphsIdentical: true,
      allLicenseInventoriesIdentical: true, allControlStatesIdentical: true,
      allPrivacyScansClean: true, allRuntimePolarityPassed: true,
      maximumDurationMs: 1000, totalDurationMs: 12000 },
    npm: { npm10Version: '10.9.7', npm11Version: '11.19.0',
      npm10Cycles: 6, npm11Cycles: 6, sequenceFollowed: true },
    installedSurface: { entryCount: plan.cycleIdentity.installedEntryCount,
      treeSha256: plan.cycleIdentity.installedTreeSha256,
      productionFileCount: 893, privacyFindings: 0 },
    dependencies: { graphSha256: plan.cycleIdentity.dependencyGraphSha256,
      nodeCount: plan.cycleIdentity.dependencyNodeCount,
      graphStableAcrossCycles: true },
    audits: { advisoryAuditPerformed: true, registryAuditCount: 1,
      productionVulnerabilities: 0, privacyFindings: 0,
      licenseInventorySha256:
        'a4066aa11d8d819047753fc841322b607807152f30a3a8342efc31f2fa7d84af' },
    resources: { descriptorBaseline: 20, descriptorFinal: 20,
      descriptorGrowthMaximum: 0, descriptorGrowthLimit: 4,
      rssBaselineBytes: 80000000, rssFinalBytes: 81000000,
      rssGrowthMaximumBytes: 1000000, rssGrowthLimitBytes: 67108864 },
    cleanup: { everyCycleRootRemoved: true, auditRootRemoved: true,
      staleControlStateObserved: false, escapeFileObserved: false,
      providerProcessLaunched: false },
    traffic: { providerCalls: 0, experimentCalls: 0, publicationActions: 0,
      installExternalRequests: 0, registryAuditRequests: 1 },
    result: 'pass',
  };
  return { ...body, receiptSha256: jsonHash(body) };
}

function rehash(value) {
  const copy = structuredClone(value);
  delete copy.receiptSha256;
  return { ...copy, receiptSha256: jsonHash(copy) };
}

test('committed S22 plan is exact-candidate-bound and provider-off', async () => {
  const committed = JSON.parse(await readFile(PLAN_PATH, 'utf8'));
  assert.deepEqual(committed, createS22BundledClosureSoakPlan());
  assert.equal(validateS22BundledClosureSoakPlan(committed), committed);
  assert.equal(committed.cycles, 12);
  assert.deepEqual(committed.npmSequence, [
    'npm10', 'npm11', 'npm10', 'npm11', 'npm10', 'npm11',
    'npm10', 'npm11', 'npm10', 'npm11', 'npm10', 'npm11',
  ]);
  assert.equal(committed.installPolicy.externalRequestsAllowed, 0);
  assert.equal(committed.limits.maxProviderInvocations, 0);
  assert.equal(committed.limits.maxExperimentInvocations, 0);
  assert.equal(committed.limits.maxPublicationActions, 0);
});

test('S22 plan rejects identity, network, audit, resource, and traffic drift', () => {
  for (const mutate of [
    (plan) => { plan.cycles = 11; },
    (plan) => { plan.npmSequence.reverse(); },
    (plan) => { plan.productionIdentity.packageSha256 = '0'.repeat(64); },
    (plan) => { plan.cycleIdentity.installedTreeSha256 = '0'.repeat(64); },
    (plan) => { plan.installPolicy.offline = false; },
    (plan) => { plan.installPolicy.externalRequestsAllowed = 1; },
    (plan) => { plan.audits.currentProductionAdvisoryAudits = 0; },
    (plan) => { plan.limits.maxProviderInvocations = 1; },
    (plan) => { plan.rejectIf.pop(); },
  ]) {
    const hostile = structuredClone(createS22BundledClosureSoakPlan());
    mutate(hostile);
    assert.throws(() => validateS22BundledClosureSoakPlan(hostile));
  }
});

test('S22 receipt accepts only complete bounded provider-off evidence', () => {
  const valid = receipt();
  assert.equal(validateS22BundledClosureSoakReceipt(valid), valid);
  for (const mutate of [
    (value) => { value.cycles.completed = 11; },
    (value) => { value.cycleLedger[5].npmId = 'npm10'; },
    (value) => { value.cycleLedger[2].installedTreeSha256 = '0'.repeat(64); },
    (value) => { value.cycles.allInstalledTreesIdentical = false; },
    (value) => { value.npm.npm11Version = '11.18.0'; },
    (value) => { value.installedSurface.privacyFindings = 1; },
    (value) => { value.audits.productionVulnerabilities = 1; },
    (value) => { value.resources.descriptorGrowthMaximum = 5; },
    (value) => { value.cleanup.escapeFileObserved = true; },
    (value) => { value.traffic.installExternalRequests = 1; },
    (value) => { value.traffic.providerCalls = 1; },
    (value) => { value.extra = true; },
  ]) {
    const hostile = structuredClone(valid);
    mutate(hostile);
    assert.throws(() => validateS22BundledClosureSoakReceipt(rehash(hostile)));
  }
});
