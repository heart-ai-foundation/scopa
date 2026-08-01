#!/usr/bin/env node

import {
  createHash,
} from 'node:crypto';
import {
  access,
  constants,
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
} from 'node:url';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  packCandidate,
} from './artifact.js';
import {
  scanProductionBundlePrivacy,
  verifyProductionBundleRoot,
} from './production-bundle.js';
import {
  scanPackagePrivacy,
} from './package-privacy.js';
import {
  invokeCaptured,
} from './subprocess.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);
async function invoke(command, args, {
  cwd,
  expectedExitCodes = [0],
  env = process.env,
} = {}) {
  return invokeCaptured(command, args, {
    cwd,
    env,
    expectedExitCodes,
  });
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function assertExactJsonLine(result, expectedCode, forbiddenValues) {
  if (result.exitCode !== 2) {
    throw new Error('installed launcher rejection returned an unexpected code');
  }
  const lines = result.stderr.trimEnd().split('\n');
  if (lines.length !== 1) {
    throw new Error('installed launcher rejection was not one JSON line');
  }
  const envelope = JSON.parse(lines[0]);
  if (
    envelope.schema !== 'scopa.launcher-error.v1' ||
    envelope.ok !== false ||
    envelope.error?.code !== expectedCode ||
    envelope.error?.boundary !== 'launcher' ||
    typeof envelope.error?.message !== 'string'
  ) {
    throw new Error('installed launcher rejection violated its closed envelope');
  }
  for (const value of forbiddenValues) {
    if (value.length > 0 && result.stderr.includes(value)) {
      throw new Error('installed launcher rejection disclosed private topology');
    }
  }
  if (
    result.stderr.includes('file:') ||
    /\s+at\s/.test(result.stderr)
  ) {
    throw new Error('installed launcher rejection disclosed source diagnostics');
  }
  return envelope;
}

async function prepareRepository(root, definition) {
  await mkdir(path.join(root, '.git'), { recursive: true });
  await mkdir(path.join(root, 'workspace'), { recursive: true });
  await copyFile(definition, path.join(root, 'scopa.slice-definition.json'));
}

function exportSpecifier(packageName, subpath) {
  if (subpath === '.') return packageName;
  if (!subpath.startsWith('./')) {
    throw new Error('consumer export contains an unsupported subpath');
  }
  return `${packageName}/${subpath.slice(2)}`;
}

async function probeExports({
  consumerRoot,
  packageJson,
}) {
  const specifiers = Object.keys(packageJson.exports)
    .sort()
    .map((subpath) => exportSpecifier(packageJson.name, subpath));
  const source = [
    `const specifiers = ${JSON.stringify(specifiers)};`,
    'const imported = [];',
    'for (const specifier of specifiers) {',
    '  const module = await import(specifier);',
    '  imported.push({specifier, exports: Object.keys(module).sort()});',
    '}',
    'process.stdout.write(`${JSON.stringify(imported)}\\n`);',
  ].join('\n');
  const result = await invoke(process.execPath, [
    '--input-type=module',
    '--eval',
    source,
  ], { cwd: consumerRoot });
  const imported = JSON.parse(result.stdout);
  if (
    imported.length !== specifiers.length ||
    imported.some((entry) => entry.exports.length === 0)
  ) {
    throw new Error('not every installed export imported successfully');
  }
  return imported;
}

async function probeBins({
  binRoot,
  consumerRoot,
  installedRoot,
  packageJson,
}) {
  const fixtureRoot = path.join(installedRoot, 'fixtures', 'S10');
  const repositoryRoot = path.join(consumerRoot, 'probe-repository');
  await mkdir(repositoryRoot);
  await prepareRepository(
    repositoryRoot,
    path.join(fixtureRoot, 'clean.slice-definition.json'),
  );
  await writeFile(
    path.join(repositoryRoot, 'workspace', 'consumer.txt'),
    'SCOPA_CONSUMER_ALLOWED\n',
  );
  const results = [];
  for (const name of Object.keys(packageJson.bin).sort()) {
    const binary = path.join(binRoot, name);
    await access(binary, constants.X_OK);
    const target = await realpath(binary);
    if (!target.startsWith(installedRoot)) {
      throw new Error('installed binary resolves outside the package');
    }
    if (name === 'scopa') {
      const initialization = await invoke(binary, [
        'init',
        '--definition',
        'scopa.slice-definition.json',
      ], { cwd: repositoryRoot });
      const initialized = JSON.parse(initialization.stdout);
      const status = await invoke(binary, ['status'], { cwd: repositoryRoot });
      const observed = JSON.parse(status.stdout);
      if (!initialized.ok || !observed.ok || !observed.result.canStop) {
        throw new Error('installed scopa binary did not reach a valid state');
      }
      results.push({
        name,
        executable: true,
        outcome: 'initialized-and-satisfied',
      });
      continue;
    }
    if (name === 'scopa-mcp') {
      const failure = await invoke(binary, [], {
        cwd: consumerRoot,
        expectedExitCodes: [2],
      });
      assertExactJsonLine(
        failure,
        'SCOPA_LAUNCHER_ARGUMENT_INVALID',
        [consumerRoot, installedRoot],
      );
      results.push({
        name,
        executable: true,
        outcome: 'closed-launcher-rejection',
      });
      continue;
    }
    throw new Error('consumer package exposes an unprobed binary');
  }
  return results;
}

async function probeLauncher({
  binary,
  consumerRoot,
  fixtureRoot,
  forbiddenValues,
}) {
  const hostileValue = path.join(consumerRoot, 'hostile-input-value');
  const sessionFile = path.join(consumerRoot, 'probe-session.json');
  const matrixFile = path.join(consumerRoot, 'probe-matrix.json');
  const validSession = await readFile(
    path.join(fixtureRoot, 'session.json'),
    'utf8',
  );
  const validMatrix = await readFile(
    path.join(fixtureRoot, 'capability-matrix.json'),
    'utf8',
  );
  const cases = [
    {
      name: 'invalid-option',
      args: ['--hostile-option', hostileValue],
      code: 'SCOPA_LAUNCHER_ARGUMENT_INVALID',
    },
    {
      name: 'unavailable-input',
      args: [
        '--session-file',
        path.join(consumerRoot, 'absent-session.json'),
        '--matrix-file',
        path.join(consumerRoot, 'absent-matrix.json'),
      ],
      code: 'SCOPA_LAUNCHER_INPUT_UNAVAILABLE',
    },
  ];
  await writeFile(sessionFile, '{malformed\n');
  await writeFile(matrixFile, validMatrix);
  cases.push({
    name: 'malformed-session',
    args: [
      '--session-file',
      sessionFile,
      '--matrix-file',
      matrixFile,
    ],
    code: 'SCOPA_LAUNCHER_INPUT_INVALID',
  });

  const receipts = [];
  for (const entry of cases) {
    const result = await invoke(binary, entry.args, {
      cwd: consumerRoot,
      expectedExitCodes: [2],
    });
    const envelope = assertExactJsonLine(
      result,
      entry.code,
      [...forbiddenValues, hostileValue],
    );
    receipts.push({
      name: entry.name,
      code: envelope.error.code,
      defaultPathFree: true,
      defaultStackFree: true,
    });
  }

  await writeFile(sessionFile, '{}\n');
  const invalidSession = await invoke(binary, [
    '--session-file',
    sessionFile,
    '--matrix-file',
    matrixFile,
  ], {
    cwd: consumerRoot,
    expectedExitCodes: [2],
  });
  assertExactJsonLine(
    invalidSession,
    'SCOPA_LAUNCHER_CONFIGURATION_INVALID',
    forbiddenValues,
  );
  receipts.push({
    name: 'invalid-session',
    code: 'SCOPA_LAUNCHER_CONFIGURATION_INVALID',
    defaultPathFree: true,
    defaultStackFree: true,
  });

  await writeFile(sessionFile, validSession);
  await writeFile(matrixFile, '{}\n');
  const invalidMatrix = await invoke(binary, [
    '--session-file',
    sessionFile,
    '--matrix-file',
    matrixFile,
  ], {
    cwd: consumerRoot,
    expectedExitCodes: [2],
  });
  assertExactJsonLine(
    invalidMatrix,
    'SCOPA_LAUNCHER_CONFIGURATION_INVALID',
    forbiddenValues,
  );
  receipts.push({
    name: 'invalid-capability-matrix',
    code: 'SCOPA_LAUNCHER_CONFIGURATION_INVALID',
    defaultPathFree: true,
    defaultStackFree: true,
  });

  const diagnostic = await invoke(binary, [
    '--hostile-option',
    hostileValue,
  ], {
    cwd: consumerRoot,
    env: {
      ...process.env,
      SCOPA_DEBUG_ERRORS: '1',
    },
    expectedExitCodes: [2],
  });
  const [diagnosticEnvelope, ...diagnosticLines] =
    diagnostic.stderr.trimEnd().split('\n');
  if (
    JSON.parse(diagnosticEnvelope).error?.code !==
      'SCOPA_LAUNCHER_ARGUMENT_INVALID' ||
    !diagnosticLines.join('\n').includes('LauncherError')
  ) {
    throw new Error('launcher diagnostic opt-in did not expose a stack');
  }
  return {
    cases: receipts,
    diagnosticOptIn: {
      environment: 'SCOPA_DEBUG_ERRORS',
      envelopeFirst: true,
      stackPresent: true,
    },
  };
}

export async function probeInstalledSurface({
  sourceRoot = ROOT,
  requireClean = true,
  npmCommand = process.env.SCOPA_NPM_COMMAND || 'npm',
} = {}) {
  const root = path.resolve(sourceRoot);
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-s12-installed-'),
  );
  try {
    const firstArtifactRoot = path.join(temporaryRoot, 'artifact-a');
    const secondArtifactRoot = path.join(temporaryRoot, 'artifact-b');
    const consumerRoot = path.join(temporaryRoot, 'consumer');
    await mkdir(firstArtifactRoot);
    await mkdir(secondArtifactRoot);
    await mkdir(consumerRoot);
    const first = await packCandidate({
      sourceRoot: root,
      outputDirectory: firstArtifactRoot,
      requireClean,
      npmCommand,
    });
    const second = await packCandidate({
      sourceRoot: root,
      outputDirectory: secondArtifactRoot,
      requireClean,
      npmCommand,
    });
    const firstBytes = await readFile(first.artifactPath);
    const secondBytes = await readFile(second.artifactPath);
    const firstHash = sha256(firstBytes);
    if (firstHash !== sha256(secondBytes)) {
      throw new Error('official consumer pack path is not deterministic');
    }
    if (
      JSON.stringify(first.manifest.files) !==
      JSON.stringify(second.manifest.files)
    ) {
      throw new Error('official consumer pack inventory is not deterministic');
    }

    await writeFile(
      path.join(consumerRoot, 'package.json'),
      '{"name":"scopa-installed-probe","version":"1.0.0","private":true}\n',
    );
    await invoke(npmCommand, [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      '--offline',
      '--cache', path.join(temporaryRoot, 'empty-cache'),
      '--registry', 'http://127.0.0.1:9',
      first.artifactPath,
    ], {
      cwd: consumerRoot,
      env: {
        ...process.env,
        NODE_OPTIONS: `--require=${path.join(root, 'fixtures', 'S19-v2', 'network-deny.cjs')}`,
      },
    });
    const installedRoot = await realpath(
      path.join(
        consumerRoot,
        'node_modules',
        '@heart-ai-foundation',
        'scopa',
      ),
    );
    const installedPackage = JSON.parse(
      await readFile(path.join(installedRoot, 'package.json'), 'utf8'),
    );
    if (Object.hasOwn(installedPackage, 'scripts')) {
      throw new Error('consumer package must not expose contributor scripts');
    }
    if (Object.hasOwn(installedPackage, 'devDependencies')) {
      throw new Error(
        'consumer package must not expose contributor dependencies',
      );
    }
    if (
      JSON.stringify(installedPackage) !==
      JSON.stringify(first.consumerPackage)
    ) {
      throw new Error('installed metadata drifted from the consumer contract');
    }
    const productionBundle = JSON.parse(await readFile(
      path.join(installedRoot, 'production-bundle.json'),
      'utf8',
    ));
    const bundleVerification = await verifyProductionBundleRoot({
      root: installedRoot,
      manifest: productionBundle,
    });

    const privacyFindings = await scanPackagePrivacy({
      installedRoot,
      files: first.manifest.files.filter(
        ({ path: filePath }) => !filePath.startsWith('node_modules/'),
      ),
      forbiddenValues: [
        root,
        path.dirname(root),
        path.basename(path.dirname(root)),
      ],
    });
    if (privacyFindings.length !== 0) {
      throw new Error('consumer package contains private or credential residue');
    }
    const bundlePrivacy = await scanProductionBundlePrivacy({
      root: installedRoot,
      manifest: productionBundle,
      forbiddenValues: [
        root,
        path.dirname(root),
        path.basename(path.dirname(root)),
      ],
    });
    if (bundlePrivacy.findings.length !== 0) {
      throw new Error('bundled dependencies contain private or credential residue');
    }

    const exports = await probeExports({
      consumerRoot,
      packageJson: installedPackage,
    });
    const binRoot = path.join(consumerRoot, 'node_modules', '.bin');
    const bins = await probeBins({
      binRoot,
      consumerRoot,
      installedRoot,
      packageJson: installedPackage,
    });
    const launcher = await probeLauncher({
      binary: path.join(binRoot, 'scopa-mcp'),
      consumerRoot,
      fixtureRoot: path.join(installedRoot, 'fixtures', 'S10'),
      forbiddenValues: [root, temporaryRoot, installedRoot],
    });

    return {
      schema: 'scopa.installed-surface-proof.v1',
      candidate: {
        manifest: first.manifest,
        repeatSha256: sha256(secondBytes),
        deterministic: true,
      },
      consumerPackage: installedPackage,
      productionBundle: bundleVerification,
      matrix: {
        bins,
        exports,
        scripts: [],
      },
      launcher,
      privacy: {
        scannedFiles: first.manifest.files.length,
        findings: privacyFindings,
        bundledFindings: bundlePrivacy.findings,
        upstreamStructuralReferences:
          bundlePrivacy.upstreamStructuralReferences.length,
      },
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

function parseArguments(argv) {
  if (argv.length === 0) return { output: null };
  if (argv.length === 2 && argv[0] === '--output') {
    return { output: path.resolve(argv[1]) };
  }
  throw new TypeError('usage: [--output installed-surface-proof.json]');
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  const { output } = parseArguments(process.argv.slice(2));
  probeInstalledSurface()
    .then(async (receipt) => {
      const text = canonicalJsonPretty(receipt);
      if (output === null) {
        process.stdout.write(text);
      } else {
        await mkdir(path.dirname(output), { recursive: true });
        await writeFile(output, text, { flag: 'wx', mode: 0o600 });
      }
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
