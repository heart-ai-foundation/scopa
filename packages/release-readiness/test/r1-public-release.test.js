import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { auditReleasePolicies, createConsumerPackageJson } from '../src/index.js';
import { validateBundledExactCandidateMatrix } from '../src/exact-candidate-probe.js';
import { runS28Eligibility } from '../../../fixtures/S28/s28-r1-decision.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

test('current package and lock carry the supported public stable identity', async () => {
  const packageJson = await json('package.json');
  const lock = await json('package-lock.json');
  assert.equal(packageJson.name, '@heart-ai-foundation/scopa');
  assert.equal(packageJson.version, '0.3.0');
  assert.equal(packageJson.private, false);
  assert.deepEqual(packageJson.publishConfig, { access: 'public', tag: 'latest' });
  assert.equal(packageJson.files.includes('RELEASE_NOTES.md'), true);
  assert.equal(lock.name, packageJson.name);
  assert.equal(lock.version, packageJson.version);
  assert.equal(lock.packages[''].name, packageJson.name);
  assert.equal(lock.packages[''].version, packageJson.version);
  const consumer = createConsumerPackageJson(packageJson);
  assert.equal(consumer.private, false);
  assert.deepEqual(consumer.publishConfig, packageJson.publishConfig);
});

test('current posture names exact public channels but not hosted production', async () => {
  const posture = await json('docs/release-posture.json');
  assert.equal(posture.version, '0.3.0');
  assert.deepEqual(posture.publication, {
    repositoryVisibility: 'public',
    artifactChannel: 'npm-and-github-release',
    npm: true,
    githubRelease: true,
    publicRelease: true,
    production: false,
    requiresSeparatePrincipalApproval: true,
  });
  assert.equal((await auditReleasePolicies({ root: ROOT })).ok, true);
});

test('R1 approval authorizes finalization and zero public actions', async () => {
  const approval = await json('evidence/R1/finalization-approval.json');
  assert.equal(approval.target.version, '0.2.0');
  assert.equal(approval.target.gitTag, 'v0.2.0');
  assert.equal(approval.target.npmDistTag, 'latest');
  assert.equal(approval.target.githubPrerelease, false);
  assert.equal(approval.providerCallsAuthorized, 0);
  assert.equal(approval.experimentUseAllowed, false);
  assert.equal(approval.publicationActionsAuthorized, 0);
  assert.equal(approval.releaseExecutionAuthorized, false);
});

test('stable migration preserves the exact approved S28 decision', async () => {
  const lockBytes = await readFile(
    path.join(ROOT, 'evidence/S28/frozen-inputs/package-lock.json'));
  const postureBytes = await readFile(
    path.join(ROOT, 'evidence/S28/frozen-inputs/release-posture.json'));
  assert.equal(sha256(lockBytes),
    '51c70cc1ef0e1411d48d57669fdc25699bd9ece65a934e54d2e1e3acadd1b95b');
  assert.equal(sha256(postureBytes),
    '6e3dc6f70b6d00d23916bb029abeb1e7f006ef0a0b8e55f2efd217b117baa3b2');
  const eligibility = await runS28Eligibility();
  assert.equal(eligibility.receiptSha256,
    'a3124152c3d5ea239ebfb9040300de0ce4ed34ebd80eb5654bfe88f68f299e17');
  const decision = await json('evidence/S28/principal-decision.json');
  assert.equal(decision.decisionSha256,
    'cb24c054a23594a8ea5d4608275b01c1bab6a3117b51f51c5dcc20736597464d');
});

test('release notes state install surface and bounded non-claims', async () => {
  const notes = await readFile(path.join(ROOT, 'RELEASE_NOTES.md'), 'utf8');
  assert.match(notes, /@heart-ai-foundation\/scopa@0\.3\.0/);
  assert.match(notes, /Apache-2\.0/);
  assert.match(notes, /not an operating-system sandbox/);
  assert.match(notes, /no install lifecycle scripts/);
});

test('R1 exact-candidate matrix is current, provider-off, and input-complete', async () => {
  const matrix = validateBundledExactCandidateMatrix(
    await json('fixtures/R1/deterministic-candidate-matrix.json'));
  assert.equal(matrix.providerTrafficAllowed, false);
  assert.equal(matrix.inputs.includes(
    'next-prompt-protocols/active/2026-08-03-R1F-public-release-finalization.md'),
  true);
  assert.equal(matrix.inputs.includes('evidence/R1/finalization-approval.json'), true);
  for (const relativePath of matrix.inputs) {
    assert.equal((await readFile(path.join(ROOT, relativePath))).length > 0, true);
  }
});
