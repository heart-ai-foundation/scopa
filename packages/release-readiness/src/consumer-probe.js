#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  fileURLToPath,
  pathToFileURL,
} from 'node:url';
import { canonicalJsonPretty } from '../../enforcement/src/index.js';
import { packCandidate } from './artifact.js';
import {
  CONSUMER_NON_CLAIMS,
  CONSUMER_VERIFIED_CLAIMS,
  RELEASE_SCHEMAS,
} from './constants.js';
import { auditReleasePolicies } from './policy.js';
import { validateConsumerProof } from './schema.js';
import { invokeCaptured } from './subprocess.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);

function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--output') {
    throw new TypeError('usage: --output /trusted/private-consumer-proof.json');
  }
  return { output: path.resolve(argv[1]) };
}

async function invoke(command, args, {
  cwd,
  expectedExitCodes = [0],
} = {}) {
  return invokeCaptured(command, args, {
    cwd,
    expectedExitCodes,
  });
}

function parseJson(stdout, name) {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`${name} did not return JSON: ${error.message}`);
  }
}

async function mustNotExist(filePath) {
  try {
    await access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`denied consumer target exists: ${filePath}`);
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

async function scanInstalledFiles({
  installedRoot,
  manifest,
  sourceRoot,
}) {
  const matches = [];
  for (const entry of manifest.files) {
    const bytes = await readFile(path.join(installedRoot, entry.path));
    if (bytes.includes(Buffer.from(sourceRoot))) matches.push(entry.path);
  }
  return matches.sort();
}

async function prepareRepository(root, definitionPath) {
  await mkdir(path.join(root, '.git'), { recursive: true });
  await mkdir(path.join(root, 'workspace'), { recursive: true });
  await copyFile(definitionPath, path.join(root, 'scopa.slice-definition.json'));
}

export async function runConsumerProbe({
  sourceRoot = ROOT,
  output,
}) {
  const root = path.resolve(sourceRoot);
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-s10-consumer-'),
  );
  try {
    const artifactDirectory = path.join(temporaryRoot, 'artifact');
    const consumerRoot = path.join(temporaryRoot, 'consumer');
    const cleanRepo = path.join(temporaryRoot, 'clean-repo');
    const failingRepo = path.join(temporaryRoot, 'failing-repo');
    await mkdir(artifactDirectory);
    await mkdir(consumerRoot);
    await mkdir(cleanRepo);
    await mkdir(failingRepo);

    const policyAudit = await auditReleasePolicies({ root });
    if (!policyAudit.ok) {
      throw new Error('release policy audit must pass before consumer proof');
    }
    const policyText = canonicalJsonPretty(policyAudit);
    const { artifactPath, manifest } = await packCandidate({
      sourceRoot: root,
      outputDirectory: artifactDirectory,
      requireClean: true,
    });

    await invoke('npm', ['init', '-y'], { cwd: consumerRoot });
    const installation = await invoke('npm', [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      artifactPath,
    ], { cwd: consumerRoot });
    const installedRoot = await realpath(
      path.join(
        consumerRoot,
        'node_modules',
        '@heart-ai-foundation',
        'scopa',
      ),
    );
    if (installedRoot === root || installedRoot.startsWith(`${root}${path.sep}`)) {
      throw new Error('candidate resolved to the source checkout');
    }
    const monorepoRelativeReferences = await scanInstalledFiles({
      installedRoot,
      manifest,
      sourceRoot: root,
    });
    if (monorepoRelativeReferences.length !== 0) {
      throw new Error(
        `installed package contains source references: ` +
        monorepoRelativeReferences.join(', '),
      );
    }

    const binRoot = path.join(consumerRoot, 'node_modules', '.bin');
    const fixtureRoot = path.join(installedRoot, 'fixtures', 'S10');
    await prepareRepository(
      cleanRepo,
      path.join(fixtureRoot, 'clean.slice-definition.json'),
    );
    const initialization = await invoke(path.join(binRoot, 'scopa'), [
      'init',
      '--definition',
      'scopa.slice-definition.json',
    ], { cwd: cleanRepo });
    const initializationReport = parseJson(
      initialization.stdout,
      'scopa init',
    );
    if (!initializationReport.ok) {
      throw new Error('source-free scopa init did not succeed');
    }

    const consumerClient = await import(pathToFileURL(
      path.join(fixtureRoot, 'consumer-client.mjs'),
    ));
    const adapter = await consumerClient.runConsumerClient({
      server: path.join(binRoot, 'scopa-mcp'),
      repo: cleanRepo,
      session: path.join(fixtureRoot, 'session.json'),
      matrix: path.join(fixtureRoot, 'capability-matrix.json'),
    });
    await mustNotExist(path.join(temporaryRoot, 'consumer-escape.txt'));

    const verificationRun = await invoke(path.join(binRoot, 'scopa'), [
      'verify',
      '--packet',
      path.join(fixtureRoot, '2026-07-26-freetsa-packet.json'),
      '--timestamp-roots',
      path.join(fixtureRoot, 'freetsa-root.pem'),
      '--require-timestamp',
      '--timestamp-authority-id',
      'freetsa.org-2026',
      '--timestamp-signer-sha256',
      '32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc',
    ], { cwd: cleanRepo });
    const verificationReport = parseJson(
      verificationRun.stdout,
      'scopa verify',
    );

    await prepareRepository(
      failingRepo,
      path.join(fixtureRoot, 'failing.slice-definition.json'),
    );
    const failingInit = await invoke(path.join(binRoot, 'scopa'), [
      'init',
      '--definition',
      'scopa.slice-definition.json',
    ], { cwd: failingRepo });
    if (!parseJson(failingInit.stdout, 'failing scopa init').ok) {
      throw new Error('known-failing fixture initialization failed');
    }
    const failingRun = await invoke(path.join(binRoot, 'scopa'), ['check'], {
      cwd: failingRepo,
      expectedExitCodes: [4],
    });
    const failingReport = parseJson(
      failingRun.stdout,
      'known-failing scopa check',
    );
    const npmVersion = (
      await invoke('npm', ['--version'], { cwd: consumerRoot })
    ).stdout.trim();

    const proof = validateConsumerProof({
      schema: RELEASE_SCHEMAS.consumerProof,
      candidate: manifest,
      policyAudit: {
        ok: policyAudit.ok,
        sha256: sha256(policyText),
      },
      environment: {
        node: process.version,
        npm: npmVersion,
        sourceRoot: root,
        temporaryRoot,
      },
      install: {
        exitCode: installation.exitCode,
        sourceFree: true,
        monorepoRelativeReferences,
      },
      adapter: {
        schema: adapter.schema,
        toolNames: adapter.toolNames,
        allowedWrite: adapter.allowedWrite,
        scopeDenied: adapter.scopeDenied,
        terminal: adapter.terminal,
        assurance: adapter.assurance,
      },
      verification: {
        exitCode: verificationRun.exitCode,
        nativePacket: verificationReport.result?.type === 'native-packet',
        ok: verificationReport.result?.report?.ok === true,
      },
      knownFailing: {
        exitCode: failingRun.exitCode,
        code: failingReport.error?.code,
        canStop: false,
      },
      claimBoundary: {
        verified: [...CONSUMER_VERIFIED_CLAIMS],
        nonClaims: [...CONSUMER_NON_CLAIMS],
      },
    });
    await writeFile(output, canonicalJsonPretty(proof));
    return proof;
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const proof = await runConsumerProbe({
    sourceRoot: ROOT,
    output: options.output,
  });
  process.stdout.write(canonicalJsonPretty({
    schema: proof.schema,
    candidate: proof.candidate.package,
    policyAudit: proof.policyAudit,
    install: proof.install,
    adapter: {
      toolNames: proof.adapter.toolNames,
      allowedWrite: proof.adapter.allowedWrite,
      scopeDenied: proof.adapter.scopeDenied,
      terminal: proof.adapter.terminal,
      assurance: proof.adapter.assurance,
    },
    verification: proof.verification,
    knownFailing: proof.knownFailing,
    output: options.output,
  }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
