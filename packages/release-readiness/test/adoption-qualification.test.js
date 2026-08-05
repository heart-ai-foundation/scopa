import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INSTALLED_ADOPTION_QUALIFICATION_SCHEMA,
  qualifyInstalledAdoption,
  renderInstalledAdoptionQualification,
} from '../src/adoption-qualification.js';

test('packed bytes reproduce the complete provider-off adoption journey', async () => {
  const receipt = await qualifyInstalledAdoption();
  assert.equal(receipt.schema, INSTALLED_ADOPTION_QUALIFICATION_SCHEMA);
  assert.equal(receipt.firstInsight.underLimit, true);
  assert.equal(receipt.firstInsight.targetUnchanged, true);
  assert.equal(receipt.taskBootstrap.manualControlFiles, 0);
  assert.equal(receipt.taskBootstrap.terminalCanStop, true);
  assert.equal(receipt.taskBootstrap.assurance, 'partial');
  assert.deepEqual(
    receipt.assistants.map((entry) => entry.client),
    ['claude-code', 'codex'],
  );
  assert.equal(receipt.assistants.every((entry) =>
    entry.cleanInstalled && entry.coldIdempotent && entry.uninstalled), true);
  assert.equal(receipt.demo.exactS42Output, true);
  assert.equal(receipt.boundaryCard.accessibleStandaloneHtml, true);
  assert.equal(receipt.pullRequestReport.validEvidence, 'validated-card');
  assert.equal(receipt.pullRequestReport.missingEvidence, 'unavailable');
  assert.equal(receipt.pullRequestReport.networkCalled, false);
  assert.equal(receipt.privacy.installedFirstPartyFindings, 0);
  assert.equal(receipt.network.attempts, 0);
  assert.equal(receipt.cleanup.temporaryRootRemoved, true);
  assert.deepEqual(
    JSON.parse(renderInstalledAdoptionQualification(receipt)),
    receipt,
  );
});
