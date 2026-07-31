import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { canonicalJson } from '../../../conformance/src/canonical-json.js';
import {
  assertAgentParity,
  compareAgentProofs,
} from '../src/parity.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../../..', import.meta.url)));
const CLAUDE_PROOF = JSON.parse(await readFile(
  path.join(ROOT, 'evidence/S8/claude-live-proof.public.json'),
  'utf8',
));
const CODEX_PROOF = JSON.parse(await readFile(
  path.join(ROOT, 'evidence/S9/codex-live-proof.public.json'),
  'utf8',
));
const SOURCES = Object.freeze({
  claude: 'evidence/S8/claude-live-proof.public.json',
  codex: 'evidence/S9/codex-live-proof.public.json',
});

function digest(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function operational(claudeProof = CLAUDE_PROOF, codexProof = CODEX_PROOF) {
  return compareAgentProofs({
    claudeProof,
    codexProof,
    sources: SOURCES,
    format: 'operational-v2',
  });
}

test('operational parity keeps shared outcomes and assurance client-bound', () => {
  const report = assertAgentParity(operational(), {
    claudeProof: CLAUDE_PROOF,
    codexProof: CODEX_PROOF,
  });
  assert.equal(report.schema, 'scopa.agent-operational-parity-report.v2');
  assert.equal(report.parity, 'pass');
  assert.deepEqual(
    report.sharedOutcomes.map(({ id, parity }) => [id, parity]),
    [
      ['allowedWork', true],
      ['blockedScope', true],
      ['falseGreenRefused', true],
      ['coldRestartRecovered', true],
    ],
  );
  assert.equal(report.sharedToolSurface.parity, true);
  assert.equal(report.assuranceIsolation.transferable, false);
  assert.equal(report.assuranceIsolation.subjectsDistinct, true);
  assert.notEqual(
    report.assuranceIsolation.bindings.claude.matrixSha256,
    report.assuranceIsolation.bindings.codex.matrixSha256,
  );
  assert.deepEqual(
    report.providerDifferences.map(({ id, classification }) => [
      id,
      classification,
    ]),
    [
      ['model', 'provider-specific'],
      ['mcpClient', 'provider-specific'],
      ['assurance', 'client-bound-nontransferable'],
      ['uncontrolledCapabilityIds', 'client-bound-nontransferable'],
    ],
  );
});

test('operational report rejects tamper even after a digest is recomputed', () => {
  const report = operational();
  const tampered = structuredClone(report);
  tampered.providerDifferences[0].codex = 'substituted-model';
  assert.throws(() => assertAgentParity(tampered), /report is invalid/);

  const rebound = structuredClone(tampered);
  const body = structuredClone(rebound);
  delete body.reportSha256;
  rebound.reportSha256 = digest(body);
  assert.throws(
    () => assertAgentParity(rebound, {
      claudeProof: CLAUDE_PROOF,
      codexProof: CODEX_PROOF,
    }),
    /source binding failed/,
  );
});

test('behavior and tool-surface divergence remain explicit gaps', () => {
  const behaviorGap = structuredClone(CODEX_PROOF);
  behaviorGap.scenarios.falseGreen.normalized.final.canStop = true;
  const behaviorReport = operational(CLAUDE_PROOF, behaviorGap);
  assert.equal(behaviorReport.parity, 'gap');
  assert.deepEqual(
    behaviorReport.gaps.map(({ behavior }) => behavior),
    ['falseGreenRefused'],
  );
  assert.throws(() => assertAgentParity(behaviorReport));

  const surfaceGap = structuredClone(CODEX_PROOF);
  surfaceGap.scenarios.clean.normalized.initialization.enabledTools.pop();
  const surfaceReport = operational(CLAUDE_PROOF, surfaceGap);
  assert.equal(surfaceReport.parity, 'gap');
  assert.deepEqual(
    surfaceReport.gaps.map(({ behavior }) => behavior),
    ['scopaToolSurface'],
  );
});

test('a capability matrix cannot transfer assurance between clients', () => {
  const transferred = structuredClone(CODEX_PROOF);
  transferred.capabilityMatrix = structuredClone(CLAUDE_PROOF.capabilityMatrix);
  const report = operational(CLAUDE_PROOF, transferred);
  assert.equal(report.parity, 'gap');
  assert.deepEqual(report.gaps, [{
    behavior: 'assuranceBinding',
    provider: 'codex',
    expectedClientPrefix: 'codex-mcp-client@',
    observedClient: CLAUDE_PROOF.capabilityMatrix.subject.client,
  }]);
  assert.equal(
    report.assuranceIsolation.bindings.codex.subjectMatchesClient,
    false,
  );
  assert.throws(() => assertAgentParity(report));
});

test('legacy parity remains byte-compatible by default', () => {
  const report = compareAgentProofs({
    claudeProof: CLAUDE_PROOF,
    codexProof: CODEX_PROOF,
    sources: SOURCES,
  });
  assert.equal(report.schema, 'scopa.agent-parity-report.v1');
  assert.equal('reportSha256' in report, false);
  assert.throws(
    () => compareAgentProofs({
      claudeProof: CLAUDE_PROOF,
      codexProof: CODEX_PROOF,
      format: 'unknown',
    }),
    /unsupported agent parity format/,
  );
});
