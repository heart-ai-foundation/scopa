import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertExactCandidateQualification,
  buildExactCandidateQualification,
  validateExactCandidateMatrix,
} from '../src/exact-candidate-probe.js';

function sources() {
  const manifest = {
    schema: 'scopa.candidate-manifest.v1',
    source: { commit: 'a'.repeat(40), dirty: false },
    package: {
      name: '@heart-ai-foundation/scopa',
      version: '0.2.0-dev.1',
      filename: 'heart-ai-foundation-scopa-0.2.0-dev.1.tgz',
      entryCount: 1,
      packedBytes: 1,
      unpackedBytes: 1,
      shasum: 'b'.repeat(40),
      integrity: `sha512-${Buffer.alloc(64).toString('base64')}`,
      sha256: 'c'.repeat(64),
    },
    files: [{ path: 'README.md', size: 1, mode: 420 }],
  };
  const installedProof = {
    schema: 'scopa.installed-surface-proof.v1',
    candidate: {
      manifest: structuredClone(manifest),
      repeatSha256: manifest.package.sha256,
      deterministic: true,
    },
    consumerPackage: {},
    matrix: {
      bins: [
        { name: 'scopa', outcome: 'initialized-and-satisfied' },
        { name: 'scopa-mcp', outcome: 'closed-launcher-rejection' },
      ],
      exports: [{ specifier: '@heart-ai-foundation/scopa/codex' }],
      scripts: [],
    },
    launcher: {},
    privacy: { scannedFiles: 1, findings: [] },
  };
  const policyAudit = {
    schema: 'scopa.release-policy-audit.v1',
    ok: true,
    checks: [{ id: 'closed', passed: true, evidence: 'closed' }],
  };
  const matrix = {
    schema: 'scopa.s18-deterministic-candidate-matrix.v1',
    providerTrafficAllowed: false,
    inputs: ['package-lock.json', 'package.json'],
    cases: [{ id: 'accumulated-gate', command: ['npm', 'test'] }],
  };
  return {
    manifest,
    installedProof,
    policyAudit,
    matrix,
    matrixResults: [{
      id: 'accumulated-gate',
      command: ['npm', 'test'],
      exitCode: 0,
      passed: true,
    }],
    inputBindings: {
      'package-lock.json': 'd'.repeat(64),
      'package.json': 'e'.repeat(64),
    },
  };
}

test('exact candidate receipt binds clean package, installed surface, policies, and matrix', () => {
  const inputs = sources();
  const receipt = buildExactCandidateQualification(inputs);
  assert.equal(
    assertExactCandidateQualification(receipt, inputs),
    receipt,
  );
  assert.equal(receipt.qualification, 'pass');
  assert.equal(receipt.providerTrafficAuthorized, false);
  assert.equal(receipt.publicationAuthorized, false);
  assert.deepEqual(receipt.assurance, {
    claude: 'partial',
    codex: 'partial',
    transferable: false,
  });
});

test('tamper and recomputed source transplantation both fail', () => {
  const original = sources();
  const receipt = buildExactCandidateQualification(original);
  const tampered = structuredClone(receipt);
  tampered.candidate.manifest.package.packedBytes += 1;
  assert.throws(
    () => assertExactCandidateQualification(tampered),
    /digest failed/,
  );

  const transplantedSources = sources();
  transplantedSources.manifest.package.sha256 = 'f'.repeat(64);
  transplantedSources.installedProof.candidate.manifest = structuredClone(
    transplantedSources.manifest,
  );
  transplantedSources.installedProof.candidate.repeatSha256 = 'f'.repeat(64);
  const transplanted = buildExactCandidateQualification(transplantedSources);
  assert.doesNotThrow(
    () => assertExactCandidateQualification(transplanted),
  );
  assert.throws(
    () => assertExactCandidateQualification(transplanted, original),
    /source binding failed/,
  );
});

test('matrix is closed, provider-off, sorted, unique, and npm-only', () => {
  const valid = sources().matrix;
  assert.deepEqual(validateExactCandidateMatrix(valid), valid);
  for (const mutate of [
    (matrix) => { matrix.providerTrafficAllowed = true; },
    (matrix) => { matrix.extra = true; },
    (matrix) => { matrix.inputs.reverse(); },
    (matrix) => { matrix.inputs.push(matrix.inputs[0]); },
    (matrix) => { matrix.cases[0].command[0] = 'curl'; },
    (matrix) => { matrix.cases.push(structuredClone(matrix.cases[0])); },
  ]) {
    const hostile = structuredClone(valid);
    mutate(hostile);
    assert.throws(() => validateExactCandidateMatrix(hostile));
  }
});

test('false green, dirty source, privacy finding, and assurance drift fail closed', () => {
  for (const mutate of [
    (input) => { input.manifest.source.dirty = true; },
    (input) => { input.matrixResults[0].passed = false; },
    (input) => { input.matrixResults[0].exitCode = 1; },
    (input) => { input.installedProof.privacy.findings.push('private-path'); },
    (input) => { input.policyAudit.ok = false; },
    (input) => { input.inputBindings['package.json'] = 'short'; },
  ]) {
    const hostile = sources();
    mutate(hostile);
    assert.throws(() => buildExactCandidateQualification(hostile));
  }
  const receipt = buildExactCandidateQualification(sources());
  receipt.assurance.claude = 'full';
  assert.throws(() => assertExactCandidateQualification(receipt));
});
