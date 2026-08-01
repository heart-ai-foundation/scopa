import { createHash } from 'node:crypto';
import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalJson,
} from '../../enforcement/src/index.js';
import { packCandidate } from './artifact.js';
import { probeInstalledSurface } from './installed-surface-probe.js';
import { auditReleasePolicies } from './policy.js';
import { invokeCaptured } from './subprocess.js';

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const DEFAULT_MATRIX = path.join(
  ROOT,
  'fixtures/S18/deterministic-candidate-matrix.json',
);
const DIGEST = /^[0-9a-f]{64}$/;
const CREDENTIAL_ENVIRONMENT_NAME =
  /(?:TOKEN|KEY|SECRET|WEBHOOK|PASSWORD|AUTH)/i;

function sha256(value) {
  const bytes = Buffer.isBuffer(value) || typeof value === 'string'
    ? value
    : canonicalJson(value);
  return createHash('sha256').update(bytes).digest('hex');
}

function plainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function exactKeys(value, keys) {
  return plainObject(value) &&
    Object.keys(value).sort().join('\0') === [...keys].sort().join('\0');
}

function matrixFailureSummary(error, root) {
  const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
  const marker = output.lastIndexOf('\nnot ok ');
  const next = marker === -1
    ? -1
    : output.indexOf('\n# Subtest:', marker + 1);
  const selected = marker === -1
    ? output.slice(-4096)
    : output.slice(marker + 1, next === -1 ? undefined : next);
  return selected
    .slice(0, 4096)
    .replaceAll(root, '[SCOPA_SOURCE_ROOT]')
    .trim();
}

export function createQualificationEnvironment(provided = process.env) {
  const environment = {};
  for (const [name, value] of Object.entries(provided)) {
    if (
      name === 'INIT_CWD' ||
      name === 'NODE' ||
      name.startsWith('npm_') ||
      CREDENTIAL_ENVIRONMENT_NAME.test(name)
    ) {
      continue;
    }
    environment[name] = value;
  }
  return environment;
}

function assertRelativePath(value) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.startsWith('/') ||
    value.includes('\\') ||
    value.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new TypeError('S18 matrix input must be a canonical relative path');
  }
  return value;
}

export function validateExactCandidateMatrix(value) {
  return validateCandidateMatrix(value, {
    schema: 'scopa.s18-deterministic-candidate-matrix.v1',
    label: 'S18',
  });
}

function validateCandidateMatrix(value, { schema, label }) {
  if (
    !exactKeys(value, new Set([
      'cases', 'inputs', 'providerTrafficAllowed', 'schema',
    ])) ||
    value.schema !== schema ||
    value.providerTrafficAllowed !== false ||
    !Array.isArray(value.inputs) ||
    value.inputs.length === 0 ||
    !Array.isArray(value.cases) ||
    value.cases.length === 0
  ) {
    throw new TypeError(`${label} deterministic candidate matrix is invalid`);
  }
  const inputs = value.inputs.map(assertRelativePath);
  if ([...new Set(inputs)].length !== inputs.length ||
      inputs.join('\0') !== [...inputs].sort().join('\0')) {
    throw new TypeError(`${label} matrix inputs must be unique and sorted`);
  }
  const ids = [];
  for (const entry of value.cases) {
    if (
      !exactKeys(entry, new Set(['command', 'id'])) ||
      typeof entry.id !== 'string' ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) ||
      !Array.isArray(entry.command) ||
      entry.command.length < 2 ||
      entry.command.some((part) => typeof part !== 'string' || !part) ||
      entry.command[0] !== 'npm'
    ) {
      throw new TypeError(`${label} matrix case is invalid`);
    }
    ids.push(entry.id);
  }
  if ([...new Set(ids)].length !== ids.length) {
    throw new TypeError(`${label} matrix case ids must be unique`);
  }
  return structuredClone(value);
}

export function validateBundledExactCandidateMatrix(value) {
  const contract = bundledQualificationContract(value?.schema);
  return validateCandidateMatrix(value, {
    schema: contract.matrixSchema,
    label: contract.label,
  });
}

function bundledQualificationContract(matrixSchema) {
  if (matrixSchema === 'scopa.s20-deterministic-candidate-matrix.v1') {
    return {
      label: 'S20',
      matrixSchema,
      receiptSchema: 'scopa.s20-bundled-exact-candidate-qualification.v1',
    };
  }
  if (matrixSchema === 'scopa.s25-deterministic-candidate-matrix.v1') {
    return {
      label: 'S25',
      matrixSchema,
      receiptSchema: 'scopa.s25-bundled-exact-candidate-qualification.v1',
    };
  }
  throw new TypeError('bundled exact-candidate matrix schema is unsupported');
}

function summarizeInstalledSurface(installedProof) {
  if (
    installedProof?.schema !== 'scopa.installed-surface-proof.v1' ||
    installedProof.candidate?.deterministic !== true ||
    installedProof.privacy?.findings?.length !== 0
  ) {
    throw new Error('installed candidate surface did not qualify');
  }
  return {
    proofSha256: sha256(installedProof),
    candidateSha256: installedProof.candidate.manifest.package.sha256,
    repeatSha256: installedProof.candidate.repeatSha256,
    deterministic: true,
    exportCount: installedProof.matrix.exports.length,
    bins: installedProof.matrix.bins.map(({ name, outcome }) => ({
      name,
      outcome,
    })),
    privacyFindings: 0,
  };
}

function summarizePolicy(policyAudit) {
  if (policyAudit?.schema !== 'scopa.release-policy-audit.v1' ||
      policyAudit.ok !== true ||
      !Array.isArray(policyAudit.checks) ||
      policyAudit.checks.some(({ passed }) => passed !== true)) {
    throw new Error('release policy audit did not qualify');
  }
  return {
    auditSha256: sha256(policyAudit),
    passed: policyAudit.checks.length,
    total: policyAudit.checks.length,
    ok: true,
  };
}

export function buildExactCandidateQualification({
  manifest,
  installedProof,
  policyAudit,
  matrix,
  matrixResults,
  inputBindings,
}) {
  const definition = validateExactCandidateMatrix(matrix);
  if (
    manifest?.schema !== 'scopa.candidate-manifest.v1' ||
    manifest.source?.dirty !== false ||
    !/^[0-9a-f]{40}$/.test(manifest.source?.commit ?? '') ||
    !Array.isArray(matrixResults) ||
    matrixResults.length !== definition.cases.length ||
    matrixResults.some((result, index) =>
      !exactKeys(result, new Set(['command', 'exitCode', 'id', 'passed'])) ||
      result.id !== definition.cases[index].id ||
      canonicalJson(result.command) !==
        canonicalJson(definition.cases[index].command) ||
      result.exitCode !== 0 ||
      result.passed !== true) ||
    !plainObject(inputBindings) ||
    Object.keys(inputBindings).join('\0') !== definition.inputs.join('\0') ||
    Object.values(inputBindings).some((digest) => !DIGEST.test(digest))
  ) {
    throw new Error('exact candidate qualification inputs are invalid');
  }
  const installed = summarizeInstalledSurface(installedProof);
  if (
    installed.candidateSha256 !== manifest.package.sha256 ||
    installed.repeatSha256 !== manifest.package.sha256 ||
    canonicalJson(installedProof.candidate.manifest) !== canonicalJson(manifest)
  ) {
    throw new Error('exact candidate and installed surface diverged');
  }
  const body = {
    schema: 'scopa.s18-exact-candidate-qualification.v1',
    source: structuredClone(manifest.source),
    candidate: {
      manifest: structuredClone(manifest),
      manifestSha256: sha256(manifest),
      packageSha256: manifest.package.sha256,
      repeatedPackingByteIdentical: true,
    },
    inputBindings: structuredClone(inputBindings),
    installedSurface: installed,
    policyAudit: summarizePolicy(policyAudit),
    deterministicMatrix: {
      definitionSha256: sha256(definition),
      providerTrafficAllowed: false,
      cases: structuredClone(matrixResults),
      passed: matrixResults.length,
      total: matrixResults.length,
      ok: true,
    },
    assurance: {
      claude: 'partial',
      codex: 'partial',
      transferable: false,
    },
    providerTrafficAuthorized: false,
    publicationAuthorized: false,
    qualification: 'pass',
  };
  return {
    ...body,
    receiptSha256: sha256(body),
  };
}

export function assertExactCandidateQualification(receipt, sources = null) {
  if (
    !exactKeys(receipt, new Set([
      'assurance', 'candidate', 'deterministicMatrix', 'inputBindings',
      'installedSurface', 'policyAudit', 'providerTrafficAuthorized',
      'publicationAuthorized', 'qualification', 'receiptSha256', 'schema',
      'source',
    ])) ||
    receipt.schema !== 'scopa.s18-exact-candidate-qualification.v1' ||
    receipt.qualification !== 'pass' ||
    receipt.providerTrafficAuthorized !== false ||
    receipt.publicationAuthorized !== false ||
    receipt.assurance?.claude !== 'partial' ||
    receipt.assurance?.codex !== 'partial' ||
    receipt.assurance?.transferable !== false ||
    !DIGEST.test(receipt.receiptSha256 ?? '')
  ) {
    throw new Error('S18 exact candidate qualification receipt is invalid');
  }
  const body = structuredClone(receipt);
  delete body.receiptSha256;
  if (sha256(body) !== receipt.receiptSha256) {
    throw new Error('S18 exact candidate qualification digest failed');
  }
  if (sources !== null) {
    const expected = buildExactCandidateQualification(sources);
    if (canonicalJson(expected) !== canonicalJson(receipt)) {
      throw new Error('S18 exact candidate source binding failed');
    }
  }
  return receipt;
}

function summarizeBundle(pack) {
  const manifest = pack?.bundle?.manifest;
  const verification = pack?.bundle?.verification;
  if (
    manifest?.schema !== 'scopa.production-bundle.v1' ||
    verification?.schema !== 'scopa.production-bundle-verification.v1' ||
    verification.ok !== true ||
    !DIGEST.test(manifest.manifestSha256 ?? '') ||
    manifest.closureSha256 !== verification.closureSha256 ||
    manifest.bundledPayloadSha256 !== verification.bundledPayloadSha256 ||
    manifest.bundledPayloadSha256 !== verification.installedPayloadSha256 ||
    manifest.licenseInventorySha256 !== verification.licenseInventorySha256 ||
    manifest.packages.length !== verification.packageCount ||
    manifest.files.length !== verification.fileCount
  ) {
    throw new Error('bundled candidate production identity did not qualify');
  }
  return {
    manifestSha256: manifest.manifestSha256,
    closureSha256: verification.closureSha256,
    bundledPayloadSha256: verification.bundledPayloadSha256,
    installedPayloadSha256: verification.installedPayloadSha256,
    licenseInventorySha256: verification.licenseInventorySha256,
    packageCount: verification.packageCount,
    fileCount: verification.fileCount,
  };
}

function summarizeBundledInstalledSurface(installedProof) {
  const installed = summarizeInstalledSurface(installedProof);
  const bundle = installedProof?.productionBundle;
  if (
    bundle?.schema !== 'scopa.production-bundle-verification.v1' ||
    bundle.ok !== true ||
    !DIGEST.test(bundle.closureSha256 ?? '') ||
    !DIGEST.test(bundle.bundledPayloadSha256 ?? '') ||
    bundle.bundledPayloadSha256 !== bundle.installedPayloadSha256 ||
    !DIGEST.test(bundle.licenseInventorySha256 ?? '') ||
    installedProof.privacy?.bundledFindings?.length !== 0 ||
    !Number.isSafeInteger(
      installedProof.privacy?.upstreamStructuralReferences,
    )
  ) {
    throw new Error('installed bundled candidate surface did not qualify');
  }
  return {
    ...installed,
    productionBundle: structuredClone(bundle),
    bundledPrivacyFindings: 0,
    upstreamStructuralReferences:
      installedProof.privacy.upstreamStructuralReferences,
  };
}

function validateMatrixResults(definition, matrixResults) {
  return Array.isArray(matrixResults) &&
    matrixResults.length === definition.cases.length &&
    matrixResults.every((result, index) =>
      exactKeys(result, new Set(['command', 'exitCode', 'id', 'passed'])) &&
      result.id === definition.cases[index].id &&
      canonicalJson(result.command) ===
        canonicalJson(definition.cases[index].command) &&
      result.exitCode === 0 &&
      result.passed === true);
}

export function buildBundledExactCandidateQualification({
  npm10Pack,
  npm11Pack,
  npm10InstalledProof,
  npm11InstalledProof,
  npmVersions,
  policyAudit,
  matrix,
  matrixResults,
  inputBindings,
}) {
  const definition = validateBundledExactCandidateMatrix(matrix);
  const contract = bundledQualificationContract(definition.schema);
  const manifest = npm10Pack?.manifest;
  if (
    manifest?.schema !== 'scopa.candidate-manifest.v1' ||
    manifest.source?.dirty !== false ||
    !/^[0-9a-f]{40}$/.test(manifest.source?.commit ?? '') ||
    canonicalJson(manifest) !== canonicalJson(npm11Pack?.manifest) ||
    canonicalJson(npm10Pack?.bundle) !== canonicalJson(npm11Pack?.bundle) ||
    !validateMatrixResults(definition, matrixResults) ||
    !plainObject(inputBindings) ||
    Object.keys(inputBindings).join('\0') !== definition.inputs.join('\0') ||
    Object.values(inputBindings).some((digest) => !DIGEST.test(digest)) ||
    !exactKeys(npmVersions, new Set(['npm10', 'npm11'])) ||
    npmVersions.npm10 !== '10.9.7' ||
    npmVersions.npm11 !== '11.19.0'
  ) {
    throw new Error('bundled exact candidate qualification inputs are invalid');
  }
  const identity = summarizeBundle(npm10Pack);
  const installedByNpm = {
    npm10: summarizeBundledInstalledSurface(npm10InstalledProof),
    npm11: summarizeBundledInstalledSurface(npm11InstalledProof),
  };
  for (const installed of Object.values(installedByNpm)) {
    if (
      installed.candidateSha256 !== manifest.package.sha256 ||
      installed.repeatSha256 !== manifest.package.sha256 ||
      canonicalJson(installed.productionBundle) !==
        canonicalJson(npm10Pack.bundle.verification)
    ) {
      throw new Error('candidate, bundle, and installed identities diverged');
    }
  }
  if (
    new Set([
      manifest.package.sha256,
      identity.closureSha256,
      identity.bundledPayloadSha256,
    ]).size !== 3
  ) {
    throw new Error('candidate identity classes were collapsed');
  }
  const body = {
    schema: contract.receiptSchema,
    source: structuredClone(manifest.source),
    candidate: {
      manifestSha256: sha256(manifest),
      package: structuredClone(manifest.package),
      packageSha256: manifest.package.sha256,
      repeatedPackingByteIdentical: true,
      npmVersionPackingByteIdentical: true,
    },
    productionIdentity: identity,
    npmVersions: structuredClone(npmVersions),
    installedByNpm,
    inputBindings: structuredClone(inputBindings),
    policyAudit: summarizePolicy(policyAudit),
    deterministicMatrix: {
      definitionSha256: sha256(definition),
      providerTrafficAllowed: false,
      cases: structuredClone(matrixResults),
      passed: matrixResults.length,
      total: matrixResults.length,
      ok: true,
    },
    networkPolicy: {
      cache: 'empty',
      install: 'offline-ignore-scripts-no-audit-no-fund',
      registry: 'unreachable-loopback',
      denyShim: true,
      externalRequests: 0,
    },
    assurance: {
      claude: 'partial',
      codex: 'partial',
      transferable: false,
    },
    providerTrafficAuthorized: false,
    publicationAuthorized: false,
    qualification: 'pass',
  };
  return { ...body, receiptSha256: sha256(body) };
}

export function assertBundledExactCandidateQualification(
  receipt,
  sources = null,
) {
  const receiptSchemas = new Set([
    'scopa.s20-bundled-exact-candidate-qualification.v1',
    'scopa.s25-bundled-exact-candidate-qualification.v1',
  ]);
  if (
    !exactKeys(receipt, new Set([
      'assurance', 'candidate', 'deterministicMatrix', 'inputBindings',
      'installedByNpm', 'networkPolicy', 'npmVersions', 'policyAudit',
      'productionIdentity', 'providerTrafficAuthorized',
      'publicationAuthorized', 'qualification', 'receiptSha256', 'schema',
      'source',
    ])) ||
    !receiptSchemas.has(receipt.schema) ||
    receipt.qualification !== 'pass' ||
    receipt.providerTrafficAuthorized !== false ||
    receipt.publicationAuthorized !== false ||
    receipt.networkPolicy?.externalRequests !== 0 ||
    receipt.assurance?.transferable !== false ||
    !DIGEST.test(receipt.receiptSha256 ?? '')
  ) {
    throw new Error('bundled exact candidate receipt is invalid');
  }
  const body = structuredClone(receipt);
  delete body.receiptSha256;
  if (sha256(body) !== receipt.receiptSha256) {
    throw new Error('bundled exact candidate digest failed');
  }
  if (sources !== null) {
    const expected = buildBundledExactCandidateQualification(sources);
    if (canonicalJson(expected) !== canonicalJson(receipt)) {
      throw new Error('bundled exact candidate source binding failed');
    }
  }
  return receipt;
}

async function inputBindings(root, inputs) {
  const entries = await Promise.all(inputs.map(async (relativePath) => [
    relativePath,
    sha256(await readFile(path.join(root, ...relativePath.split('/')))),
  ]));
  return Object.fromEntries(entries);
}

export async function qualifyExactCandidate({
  sourceRoot = ROOT,
  artifactDirectory,
  matrixPath = DEFAULT_MATRIX,
} = {}) {
  if (typeof artifactDirectory !== 'string' || artifactDirectory.length === 0) {
    throw new TypeError('exact candidate artifact directory is required');
  }
  const root = path.resolve(sourceRoot);
  const matrix = validateExactCandidateMatrix(
    JSON.parse(await readFile(path.resolve(matrixPath), 'utf8')),
  );
  const matrixResults = [];
  for (const entry of matrix.cases) {
    let result;
    try {
      result = await invokeCaptured(entry.command[0], entry.command.slice(1), {
        cwd: root,
        env: createQualificationEnvironment(),
      });
    } catch (error) {
      const summary = matrixFailureSummary(error, root);
      throw new Error(
        `S18 matrix case ${entry.id} failed: ${error.message}` +
        (summary ? `\n${summary}` : ''),
      );
    }
    matrixResults.push({
      id: entry.id,
      command: entry.command,
      exitCode: result.exitCode,
      passed: result.exitCode === 0,
    });
  }
  const policyAudit = await auditReleasePolicies({ root });
  const installedProof = await probeInstalledSurface({
    sourceRoot: root,
    requireClean: true,
  });
  const packed = await packCandidate({
    sourceRoot: root,
    outputDirectory: path.resolve(artifactDirectory),
    requireClean: true,
  });
  const sources = {
    manifest: packed.manifest,
    installedProof,
    policyAudit,
    matrix,
    matrixResults,
    inputBindings: await inputBindings(root, matrix.inputs),
  };
  return {
    artifactPath: packed.artifactPath,
    receipt: assertExactCandidateQualification(
      buildExactCandidateQualification(sources),
      sources,
    ),
  };
}

export async function qualifyBundledExactCandidate({
  sourceRoot = ROOT,
  artifactDirectory,
  matrixPath,
  npm10Command = process.env.SCOPA_NPM_COMMAND || 'npm',
  npm11Command = process.env.SCOPA_NPM11_COMMAND,
} = {}) {
  if (typeof artifactDirectory !== 'string' || artifactDirectory.length === 0) {
    throw new TypeError('bundled exact candidate artifact directory is required');
  }
  if (typeof npm11Command !== 'string' || npm11Command.length === 0) {
    throw new TypeError('SCOPA_NPM11_COMMAND is required for bundled qualification');
  }
  const root = path.resolve(sourceRoot);
  const selectedMatrix = matrixPath ?? path.join(
    root,
    'fixtures/S20/deterministic-candidate-matrix.json',
  );
  const matrix = validateBundledExactCandidateMatrix(
    JSON.parse(await readFile(path.resolve(selectedMatrix), 'utf8')),
  );
  const matrixContract = bundledQualificationContract(matrix.schema);
  const matrixResults = [];
  for (const entry of matrix.cases) {
    let result;
    try {
      result = await invokeCaptured(entry.command[0], entry.command.slice(1), {
        cwd: root,
        env: createQualificationEnvironment(),
      });
    } catch (error) {
      const summary = matrixFailureSummary(error, root);
      throw new Error(
        `${matrixContract.label} matrix case ${entry.id} failed: ${error.message}` +
        (summary ? `\n${summary}` : ''),
      );
    }
    matrixResults.push({
      id: entry.id,
      command: entry.command,
      exitCode: result.exitCode,
      passed: result.exitCode === 0,
    });
  }
  const npm10Version = (await invokeCaptured(npm10Command, ['--version'])).stdout.trim();
  const npm11Version = (await invokeCaptured(npm11Command, ['--version'])).stdout.trim();
  const policyAudit = await auditReleasePolicies({ root });
  const npm10InstalledProof = await probeInstalledSurface({
    sourceRoot: root,
    requireClean: true,
    npmCommand: npm10Command,
  });
  const npm11InstalledProof = await probeInstalledSurface({
    sourceRoot: root,
    requireClean: true,
    npmCommand: npm11Command,
  });
  const npm10Pack = await packCandidate({
    sourceRoot: root,
    outputDirectory: path.join(path.resolve(artifactDirectory), 'npm10'),
    requireClean: true,
    npmCommand: npm10Command,
  });
  const npm11Pack = await packCandidate({
    sourceRoot: root,
    outputDirectory: path.join(path.resolve(artifactDirectory), 'npm11'),
    requireClean: true,
    npmCommand: npm11Command,
  });
  const sources = {
    npm10Pack,
    npm11Pack,
    npm10InstalledProof,
    npm11InstalledProof,
    npmVersions: { npm10: npm10Version, npm11: npm11Version },
    policyAudit,
    matrix,
    matrixResults,
    inputBindings: await inputBindings(root, matrix.inputs),
  };
  return {
    artifactPaths: {
      npm10: npm10Pack.artifactPath,
      npm11: npm11Pack.artifactPath,
    },
    receipt: assertBundledExactCandidateQualification(
      buildBundledExactCandidateQualification(sources),
      sources,
    ),
  };
}
