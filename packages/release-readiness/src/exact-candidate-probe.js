#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalJson,
  canonicalJsonPretty,
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
  if (
    !exactKeys(value, new Set([
      'cases', 'inputs', 'providerTrafficAllowed', 'schema',
    ])) ||
    value.schema !== 'scopa.s18-deterministic-candidate-matrix.v1' ||
    value.providerTrafficAllowed !== false ||
    !Array.isArray(value.inputs) ||
    value.inputs.length === 0 ||
    !Array.isArray(value.cases) ||
    value.cases.length === 0
  ) {
    throw new TypeError('S18 deterministic candidate matrix is invalid');
  }
  const inputs = value.inputs.map(assertRelativePath);
  if ([...new Set(inputs)].length !== inputs.length ||
      inputs.join('\0') !== [...inputs].sort().join('\0')) {
    throw new TypeError('S18 matrix inputs must be unique and sorted');
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
      throw new TypeError('S18 matrix case is invalid');
    }
    ids.push(entry.id);
  }
  if ([...new Set(ids)].length !== ids.length) {
    throw new TypeError('S18 matrix case ids must be unique');
  }
  return structuredClone(value);
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
      throw new Error(`S18 matrix case ${entry.id} failed: ${error.message}`);
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

function parseArguments(argv) {
  const selected = { artifactDirectory: null, output: null, matrixPath: DEFAULT_MATRIX };
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value || !['--artifact-dir', '--matrix', '--output'].includes(flag)) {
      throw new TypeError(
        'usage: --artifact-dir <private-directory> --output <receipt.json> [--matrix <matrix.json>]',
      );
    }
    if (flag === '--artifact-dir') selected.artifactDirectory = path.resolve(value);
    if (flag === '--matrix') selected.matrixPath = path.resolve(value);
    if (flag === '--output') selected.output = path.resolve(value);
  }
  if (!selected.artifactDirectory || !selected.output) {
    throw new TypeError('artifact directory and output are required');
  }
  return selected;
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  Promise.resolve(parseArguments(process.argv.slice(2)))
    .then(async (selected) => {
      const result = await qualifyExactCandidate(selected);
      await mkdir(path.dirname(selected.output), { recursive: true });
      await writeFile(selected.output, canonicalJsonPretty(result.receipt), {
        flag: 'wx',
        mode: 0o600,
      });
      process.stdout.write(`${JSON.stringify({
        ok: true,
        schema: result.receipt.schema,
        sourceCommit: result.receipt.source.commit,
        packageSha256: result.receipt.candidate.packageSha256,
        receiptSha256: result.receipt.receiptSha256,
      })}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
