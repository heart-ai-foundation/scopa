import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertBundledExactCandidateQualification,
  buildBundledExactCandidateQualification,
  validateBundledExactCandidateMatrix,
} from '../src/exact-candidate-probe.js';

const DIGESTS = {
  package: 'a'.repeat(64),
  manifest: 'b'.repeat(64),
  closure: 'c'.repeat(64),
  bundle: 'd'.repeat(64),
  license: 'e'.repeat(64),
};

function candidateManifest() {
  return {
    schema: 'scopa.candidate-manifest.v1',
    source: { commit: '1'.repeat(40), dirty: false },
    package: {
      name: '@heart-ai-foundation/scopa',
      version: '0.2.0-dev.1',
      filename: 'heart-ai-foundation-scopa-0.2.0-dev.1.tgz',
      entryCount: 1,
      packedBytes: 1,
      unpackedBytes: 1,
      shasum: '2'.repeat(40),
      integrity: `sha512-${Buffer.alloc(64).toString('base64')}`,
      sha256: DIGESTS.package,
    },
    files: [{ path: 'README.md', size: 1, mode: 420 }],
  };
}

function bundle() {
  return {
    manifest: {
      schema: 'scopa.production-bundle.v1',
      root: { bundledDependencies: ['ajv'] },
      packages: [{ path: 'node_modules/ajv' }],
      files: [{ path: 'node_modules/ajv/package.json' }],
      licenses: [],
      manifestSha256: DIGESTS.manifest,
      closureSha256: DIGESTS.closure,
      bundledPayloadSha256: DIGESTS.bundle,
      licenseInventorySha256: DIGESTS.license,
    },
    verification: {
      schema: 'scopa.production-bundle-verification.v1',
      closureSha256: DIGESTS.closure,
      bundledPayloadSha256: DIGESTS.bundle,
      installedPayloadSha256: DIGESTS.bundle,
      licenseInventorySha256: DIGESTS.license,
      packageCount: 1,
      fileCount: 1,
      ok: true,
    },
  };
}

function pack() {
  return { manifest: candidateManifest(), bundle: bundle() };
}

function installedProof() {
  const manifest = candidateManifest();
  return {
    schema: 'scopa.installed-surface-proof.v1',
    candidate: {
      manifest,
      repeatSha256: manifest.package.sha256,
      deterministic: true,
    },
    consumerPackage: {},
    productionBundle: bundle().verification,
    matrix: {
      bins: [{ name: 'scopa', outcome: 'initialized-and-satisfied' }],
      exports: [{ specifier: '@heart-ai-foundation/scopa' }],
      scripts: [],
    },
    launcher: {},
    privacy: {
      scannedFiles: 1,
      findings: [],
      bundledFindings: [],
      upstreamStructuralReferences: 0,
    },
  };
}

function sources() {
  const matrix = {
    schema: 'scopa.s20-deterministic-candidate-matrix.v1',
    providerTrafficAllowed: false,
    inputs: ['package-lock.json', 'package.json'],
    cases: [{ id: 'accumulated-gate', command: ['npm', 'test'] }],
  };
  return {
    npm10Pack: pack(),
    npm11Pack: pack(),
    npm10InstalledProof: installedProof(),
    npm11InstalledProof: installedProof(),
    npmVersions: { npm10: '10.9.7', npm11: '11.19.0' },
    policyAudit: {
      schema: 'scopa.release-policy-audit.v1',
      ok: true,
      checks: [{ id: 'closed', passed: true, evidence: 'closed' }],
    },
    matrix,
    matrixResults: [{
      id: 'accumulated-gate',
      command: ['npm', 'test'],
      exitCode: 0,
      passed: true,
    }],
    inputBindings: {
      'package-lock.json': 'f'.repeat(64),
      'package.json': '0'.repeat(64),
    },
  };
}

test('S20 receipt binds package, closure, bundle, install, npm parity, and matrix', () => {
  const inputs = sources();
  const receipt = buildBundledExactCandidateQualification(inputs);
  assert.equal(assertBundledExactCandidateQualification(receipt, inputs), receipt);
  assert.equal(receipt.productionIdentity.closureSha256, DIGESTS.closure);
  assert.equal(receipt.productionIdentity.bundledPayloadSha256, DIGESTS.bundle);
  assert.equal(receipt.productionIdentity.installedPayloadSha256, DIGESTS.bundle);
  assert.equal(receipt.installedByNpm.npm10.productionBundle.ok, true);
  assert.equal(receipt.installedByNpm.npm11.productionBundle.ok, true);
  assert.equal(receipt.networkPolicy.externalRequests, 0);
  assert.equal(Object.hasOwn(receipt.candidate, 'manifest'), false);
  assert.deepEqual(receipt.candidate.package, inputs.npm10Pack.manifest.package);
});

test('S20 matrix remains closed, sorted, unique, npm-only, and provider-off', () => {
  const valid = sources().matrix;
  assert.deepEqual(validateBundledExactCandidateMatrix(valid), valid);
  for (const mutate of [
    (matrix) => { matrix.providerTrafficAllowed = true; },
    (matrix) => { matrix.inputs.reverse(); },
    (matrix) => { matrix.inputs.push(matrix.inputs[0]); },
    (matrix) => { matrix.cases[0].command[0] = 'curl'; },
  ]) {
    const hostile = structuredClone(valid);
    mutate(hostile);
    assert.throws(() => validateBundledExactCandidateMatrix(hostile));
  }
});

test('S20 rejects npm drift and package, graph, installed, privacy, or matrix divergence', () => {
  for (const mutate of [
    (input) => { input.npmVersions.npm11 = '11.19.1'; },
    (input) => { input.npm11Pack.manifest.package.sha256 = '9'.repeat(64); },
    (input) => {
      input.npm11Pack.bundle.verification.closureSha256 = '8'.repeat(64);
    },
    (input) => {
      input.npm11InstalledProof.productionBundle.installedPayloadSha256 =
        '7'.repeat(64);
    },
    (input) => {
      input.npm10InstalledProof.privacy.bundledFindings.push('private-path');
    },
    (input) => { input.matrixResults[0].passed = false; },
  ]) {
    const hostile = sources();
    mutate(hostile);
    assert.throws(() => buildBundledExactCandidateQualification(hostile));
  }
});

test('S20 receipt tamper and recomputed source transplantation fail closed', () => {
  const original = sources();
  const receipt = buildBundledExactCandidateQualification(original);
  const tampered = structuredClone(receipt);
  tampered.productionIdentity.packageCount += 1;
  assert.throws(
    () => assertBundledExactCandidateQualification(tampered),
    /digest failed/,
  );

  const transplantedSources = sources();
  transplantedSources.npm10Pack.manifest.source.commit = '3'.repeat(40);
  transplantedSources.npm11Pack.manifest.source.commit = '3'.repeat(40);
  transplantedSources.npm10InstalledProof.candidate.manifest.source.commit =
    '3'.repeat(40);
  transplantedSources.npm11InstalledProof.candidate.manifest.source.commit =
    '3'.repeat(40);
  const transplanted = buildBundledExactCandidateQualification(
    transplantedSources,
  );
  assert.doesNotThrow(
    () => assertBundledExactCandidateQualification(transplanted),
  );
  assert.throws(
    () => assertBundledExactCandidateQualification(transplanted, original),
    /source binding failed/,
  );
});
