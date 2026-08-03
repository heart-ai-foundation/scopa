import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  evaluateS27Review,
  loadS27ReviewInputs,
  runS27Review,
} from '../../../fixtures/S27/s27-release-consistency.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function mutate(inputs, callback) {
  const copy = structuredClone(inputs);
  callback(copy);
  return evaluateS27Review(copy);
}

function findingIds(receipt) {
  return receipt.findings.map(({ id }) => id);
}

test('committed compressed S27 review is exact, provider-off, and ACCEPT', async () => {
  const generated = await runS27Review();
  const committed = JSON.parse(await readFile(
    path.join(ROOT, 'evidence/S27/release-consistency-review.json'),
    'utf8',
  ));
  assert.deepEqual(committed, generated);
  assert.equal(generated.verdict, 'ACCEPT');
  assert.deepEqual(generated.findings, []);
  assert.deepEqual(generated.boundaries.map(({ result }) => result),
    ['PASS', 'PASS', 'PASS', 'PASS']);
  assert.deepEqual(generated.traffic, {
    providerCalls: 0,
    experimentCalls: 0,
    publicationActions: 0,
    releaseActions: 0,
  });
});

test('R1 migration preserves the exact S27 release-posture input', async () => {
  const inputs = await loadS27ReviewInputs();
  assert.equal(inputs.fileHashes.releasePosture,
    '6e3dc6f70b6d00d23916bb029abeb1e7f006ef0a0b8e55f2efd217b117baa3b2');
  assert.equal(inputs.documents.releasePosture.publication.repositoryVisibility, 'private');
});

test('principal approval binds the compressed protocol and authorizes zero traffic', async () => {
  const approval = JSON.parse(await readFile(
    path.join(ROOT, 'evidence/S27/macro-delta-approval.json'),
    'utf8',
  ));
  assert.equal(approval.providerCallsAuthorized, 0);
  assert.equal(approval.candidateChangeAllowed, false);
  assert.equal(approval.releaseAllowed, false);
  assert.equal(approval.s28Activated, false);
  assert.equal(
    sha256(await readFile(path.join(ROOT, approval.macroDeltaPath))),
    approval.macroDeltaFileSha256,
  );
  assert.equal(
    sha256(await readFile(path.join(
      ROOT,
      approval.protocolPath.replace(/^next-prompt-protocols\/active\//,
        'next-prompt-protocols/completed/'),
    ))),
    approval.protocolFileSha256,
  );
});

test('input byte drift rejects the compressed review', async () => {
  const inputs = await loadS27ReviewInputs();
  const receipt = mutate(inputs, (copy) => {
    copy.fileHashes.s26r3Campaign = '0'.repeat(64);
  });
  assert.equal(receipt.verdict, 'REJECT');
  assert.ok(findingIds(receipt).includes('byte-binding-s26r3Campaign'));
});

test('candidate and installed identity drift reject', async () => {
  const inputs = await loadS27ReviewInputs();
  const receipt = mutate(inputs, (copy) => {
    copy.documents.s26r3Matrix.goal.installedPayloadSha256 = '0'.repeat(64);
  });
  assert.equal(receipt.verdict, 'REJECT');
  assert.ok(findingIds(receipt).includes('four-part-production-identity'));
});

test('approval reuse or missing consumption rejects', async () => {
  const inputs = await loadS27ReviewInputs();
  const receipt = mutate(inputs, (copy) => {
    copy.documents.s26r3Consumption.approvals.push(
      structuredClone(copy.documents.s26r3Consumption.approvals[0]),
    );
  });
  assert.equal(receipt.verdict, 'REJECT');
  assert.ok(findingIds(receipt).includes('single-use-consumption'));
});

test('cleanup and resource-bound drift reject', async () => {
  const inputs = await loadS27ReviewInputs();
  const cleanup = mutate(inputs, (copy) => {
    copy.documents.s26r3Campaign.runs[0].cleanup.groupGone = false;
  });
  assert.ok(findingIds(cleanup).includes('campaign-outcomes'));
  const budget = mutate(inputs, (copy) => {
    copy.documents.s26r3Campaign.runs[0].costUsd = '0.21';
  });
  assert.ok(findingIds(budget).includes('campaign-bounds'));
});

test('privacy topology in a public derivative rejects', async () => {
  const inputs = await loadS27ReviewInputs();
  const receipt = mutate(inputs, (copy) => {
    copy.texts.s26r3Campaign += '\n/home/example/private\n';
  });
  assert.equal(receipt.verdict, 'REJECT');
  assert.ok(findingIds(receipt).includes('privacy-s26r3Campaign'));
});

test('assurance or release overclaim rejects', async () => {
  const inputs = await loadS27ReviewInputs();
  const assurance = mutate(inputs, (copy) => {
    copy.documents.s26r3Matrix.providers.claude.assurance = 'full';
  });
  assert.ok(findingIds(assurance).includes('assurance-boundary'));
  const release = mutate(inputs, (copy) => {
    copy.documents.releasePosture.publication.npm = true;
  });
  assert.ok(findingIds(release).includes('release-posture-closed'));
});
