import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createS18CandidateSoakPlan,
  validateS18CandidateSoakPlan,
  validateS18CandidateSoakReceipt,
} from '../src/exact-candidate-soak.js';
import { jsonHash } from '../../enforcement/src/index.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));

test('committed S18.3 plan is exact-candidate-bound and provider-closed', async () => {
  const committed = JSON.parse(await readFile(path.join(
    ROOT, 'fixtures/S18/exact-candidate-soak-plan.json'), 'utf8'));
  assert.deepEqual(committed, createS18CandidateSoakPlan());
  assert.equal(validateS18CandidateSoakPlan(committed), committed);
  assert.equal(committed.cycles, 12);
  assert.equal(committed.providerTrafficAllowed, false);
  assert.equal(committed.limits.maxProviderInvocations, 0);
  assert.equal(committed.rejectIf.length, 8);
});

test('S18.3 plan rejects cycle, traffic, audit, resource, and failure drift', () => {
  const plan = createS18CandidateSoakPlan();
  for (const mutate of [
    (x) => { x.cycles = 11; },
    (x) => { x.providerTrafficAllowed = true; },
    (x) => { x.registryTrafficAllowed = false; },
    (x) => { x.limits.maxProviderInvocations = 1; },
    (x) => { x.limits.maxRssGrowthBytes += 1; },
    (x) => { x.operations.pop(); },
    (x) => { x.audits.pop(); },
    (x) => { x.rejectIf.pop(); },
    (x) => { x.onFailure.providerReplayAllowed = true; },
    (x) => { x.ifAmbiguous.action = 'continue'; },
  ]) {
    const hostile = structuredClone(plan);
    mutate(hostile);
    assert.throws(() => validateS18CandidateSoakPlan(hostile));
  }
});

test('committed S18.3 receipt binds the completed exact-candidate soak', async () => {
  const receipt = JSON.parse(await readFile(path.join(
    ROOT, 'evidence/S18/exact-candidate-soak.json'), 'utf8'));
  assert.equal(validateS18CandidateSoakReceipt(receipt), receipt);
  assert.equal(receipt.cycles.completed, 12);
  assert.equal(receipt.dependencies.productionVulnerabilities, 0);
  assert.equal(receipt.installedSurface.privacyFindings, 0);
  assert.equal(receipt.resources.descriptorGrowthMaximum, 0);
  assert.equal(receipt.providerTrafficConsumed, 0);
});

test('self-rehashed S18.3 false greens remain rejected', async () => {
  const receipt = JSON.parse(await readFile(path.join(
    ROOT, 'evidence/S18/exact-candidate-soak.json'), 'utf8'));
  for (const mutate of [
    (x) => { x.cycles.completed = 11; },
    (x) => { x.cycles.allDeniedEscapesObserved = false; },
    (x) => { x.dependencies.productionVulnerabilities = 1; },
    (x) => { x.dependencies.registryAuditPerformed = false; },
    (x) => { x.installedSurface.privacyFindings = 1; },
    (x) => { x.installedSurface.treeSha256 = '0'.repeat(64); },
    (x) => { x.resources.descriptorGrowthMaximum = 5; },
    (x) => { x.cleanup.everyCycleRootRemoved = false; },
    (x) => { x.providerTrafficConsumed = 1; },
  ]) {
    const hostile = structuredClone(receipt);
    mutate(hostile);
    delete hostile.receiptSha256;
    hostile.receiptSha256 = jsonHash(hostile);
    assert.throws(() => validateS18CandidateSoakReceipt(hostile));
  }
});
