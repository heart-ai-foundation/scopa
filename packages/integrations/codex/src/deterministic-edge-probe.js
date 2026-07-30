#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  execFile,
} from 'node:child_process';
import {
  createHash,
} from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rm,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  promisify,
} from 'node:util';
import {
  fileURLToPath,
  pathToFileURL,
} from 'node:url';
import {
  canonicalJsonPretty,
  jsonHash,
} from '../../../enforcement/src/index.js';
import {
  packCandidate,
} from '../../../release-readiness/src/artifact.js';
import {
  scanPrivateText,
} from '../../../release-readiness/src/package-privacy.js';
import {
  codexPolicyUsageLimits,
  validateCodexLivePolicy,
} from './live-policy.js';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const FIXTURE = path.join(ROOT, 'fixtures/S16');
const FAULT_CLIENT = path.join(FIXTURE, 'codex-fault-client.mjs');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function withinRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export function parseDeterministicArguments(argv) {
  if (argv.length === 0) return { output: null };
  if (argv.length !== 2 || argv[0] !== '--output') {
    throw new Error(
      'usage: deterministic-edge-probe.js [--output <json-file>]',
    );
  }
  return {
    output: path.resolve(argv[1]),
  };
}

export function validateDeterministicCorpus(value) {
  if (
    value?.schema !== 'scopa.codex-deterministic-edge-corpus.v1' ||
    value.version !== 'S16.v1' ||
    value.providerTrafficAllowed !== false ||
    !Array.isArray(value.scenarios) ||
    value.scenarios.length < 20
  ) {
    throw new TypeError('S16 deterministic corpus is incomplete');
  }
  const ids = new Set();
  for (const scenario of value.scenarios) {
    if (
      scenario === null ||
      typeof scenario !== 'object' ||
      Array.isArray(scenario) ||
      Object.keys(scenario).sort().join('\0') !==
        [
          'baseScenario',
          'expectedCanStop',
          'expectedState',
          'id',
          'mode',
        ].join('\0') ||
      typeof scenario.id !== 'string' ||
      scenario.id.length === 0 ||
      ids.has(scenario.id) ||
      typeof scenario.mode !== 'string' ||
      ![
        'clean',
        'coldRestart',
        'denied',
        'falseGreen',
      ].includes(scenario.baseScenario) ||
      typeof scenario.expectedState !== 'string' ||
      typeof scenario.expectedCanStop !== 'boolean'
    ) {
      throw new TypeError('S16 deterministic scenario is invalid');
    }
    ids.add(scenario.id);
  }
  for (const required of [
    'clean',
    'denied',
    'false-green',
    'cold-restart',
    'repeat-session',
    'client-version-drift',
    'mcp-inventory-drift',
    'model-drift',
    'client-schema-drift',
    'native-surface-drift',
    'mcp-tool-drift',
    'output-schema-drift',
    'early-eof',
    'malformed-event',
    'provider-refusal',
    'provider-rate-pressure',
    'timeout-ignored-termination',
    'capture-limit',
    'usage-limit',
    'cleanup-orphan',
  ]) {
    if (!ids.has(required)) {
      throw new TypeError(`S16 deterministic corpus omits ${required}`);
    }
  }
  return value;
}

async function assertCleanCandidate() {
  const status = (
    await execFileAsync('git', [
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    })
  ).stdout;
  if (status.length !== 0) {
    throw new TypeError(
      'S16 deterministic installed probe requires a clean candidate',
    );
  }
  return (
    await execFileAsync('git', [
      'rev-parse',
      'HEAD',
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    })
  ).stdout.trim();
}

async function installPackedRuntime(temporary, sourceCommit) {
  const packed = await packCandidate({
    sourceRoot: ROOT,
    outputDirectory: temporary,
    requireClean: true,
  });
  assert.equal(packed.manifest.source.commit, sourceCommit);
  const consumer = path.join(temporary, 'consumer');
  await mkdir(consumer);
  const packageHandle = await open(
    path.join(consumer, 'package.json'),
    'wx',
    0o600,
  );
  await packageHandle.writeFile(
    '{"name":"scopa-s16-deterministic","version":"1.0.0","private":true}\n',
  );
  await packageHandle.close();
  await execFileAsync('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
    packed.artifactPath,
  ], {
    cwd: consumer,
    encoding: 'utf8',
  });
  const packageRoot = await realpath(path.join(
    consumer,
    'node_modules/@heart-ai-foundation/scopa',
  ));
  const modulePath = async (relative) => {
    const resolved = await realpath(path.join(packageRoot, relative));
    assert.equal(withinRoot(packageRoot, resolved), true);
    return resolved;
  };
  return {
    integration: await import(pathToFileURL(
      await modulePath('packages/integrations/codex/src/index.js'),
    ).href),
    adapterCli: await modulePath('packages/adapter-host/src/cli.js'),
    artifact: {
      schema: 'scopa.installed-artifact-identity.v1',
      sourceCommit,
      package: {
        name: packed.manifest.package.name,
        version: packed.manifest.package.version,
        sha256: packed.manifest.package.sha256,
        integrity: packed.manifest.package.integrity,
      },
    },
    package: {
      name: packed.manifest.package.name,
      version: packed.manifest.package.version,
      sha256: packed.manifest.package.sha256,
      integrity: packed.manifest.package.integrity,
      entryCount: packed.manifest.package.entryCount,
    },
  };
}

async function withScenarioEnvironment(scenario, operation) {
  const names = [
    'SCOPA_S16_BASE_SCENARIO',
    'SCOPA_S16_FIXTURE_ROOT',
    'SCOPA_S16_MODE',
  ];
  const previous = Object.fromEntries(
    names.map((name) => [
      name,
      process.env[name],
    ]),
  );
  process.env.SCOPA_S16_BASE_SCENARIO = scenario.baseScenario;
  process.env.SCOPA_S16_FIXTURE_ROOT = ROOT;
  process.env.SCOPA_S16_MODE = scenario.mode;
  try {
    return await operation();
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
}

export async function runDeterministicScenario({
  scenario,
  repositoryRoot,
  integration,
  adapterCli,
  artifact,
  policy,
}) {
  const timeoutMs = scenario.mode === 'timeout' ? 150 : 2_000;
  const maxCaptureBytes =
    scenario.mode === 'capture-limit' ? 1_024 : 2 * 1024 * 1024;
  const result = await withScenarioEnvironment(
    scenario,
    () => integration.runCodexSession({
      repoRoot: repositoryRoot,
      session: integration.createCodexSession({
        sessionId: `S16-${scenario.id}`,
        request: 'Execute one deterministic S16 fault scenario.',
      }),
      capabilityMatrix: integration.createCodexCapabilityMatrix({}),
      prompt: 'Execute one deterministic S16 fault scenario.',
      installedArtifact: artifact,
      scenario: {
        id: scenario.id,
        version: 'S16.v1',
      },
      adapterCli,
      codexCommand: FAULT_CLIENT,
      timeoutMs,
      maxCaptureBytes,
      usageLimits: codexPolicyUsageLimits(policy),
      baseEnvironment: {
        LANG: 'C.UTF-8',
        LC_ALL: 'C.UTF-8',
        PATH: process.env.PATH ?? '/usr/bin',
        SCOPA_S16_BASE_SCENARIO: scenario.baseScenario,
        SCOPA_S16_FIXTURE_ROOT: ROOT,
        SCOPA_S16_MODE: scenario.mode,
      },
      environmentInheritance: 'explicit-allowlist',
      terminateGraceMs: 30,
      cleanupWaitMs: 1_000,
    }),
  );
  assert.equal(
    result.terminal.state,
    scenario.expectedState,
    `${scenario.id} terminal state (${result.terminal.reason}; expected client ${
      result.receipt.client.expectedVersion
    }; observed client ${result.receipt.client.observedVersion ?? 'null'})`,
  );
  assert.equal(
    result.terminal.canStop,
    scenario.expectedCanStop,
    `${scenario.id} stop polarity`,
  );
  assert.equal(
    result.terminal.cleanup.groupGone,
    true,
    `${scenario.id} process-group cleanup`,
  );
  return result;
}

export async function deterministicCampaign() {
  const sourceCommit = await assertCleanCandidate();
  const policyText = await readFile(
    path.join(FIXTURE, 'codex-live-policy.json'),
    'utf8',
  );
  const corpusText = await readFile(
    path.join(FIXTURE, 'deterministic-scenarios.json'),
    'utf8',
  );
  const policy = validateCodexLivePolicy(JSON.parse(policyText));
  const corpus = validateDeterministicCorpus(JSON.parse(corpusText));
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-s16-deterministic-'),
  );
  try {
    const installed = await installPackedRuntime(temporary, sourceCommit);
    const repositoryRoot = path.join(temporary, 'repository');
    await mkdir(repositoryRoot);
    await mkdir(path.join(repositoryRoot, '.git'));
    const records = [];
    for (const scenario of corpus.scenarios) {
      const result = await runDeterministicScenario({
        scenario,
        repositoryRoot,
        integration: installed.integration,
        adapterCli: installed.adapterCli,
        artifact: installed.artifact,
        policy,
      });
      records.push({
        id: scenario.id,
        mode: scenario.mode,
        expectedState: scenario.expectedState,
        observedState: result.terminal.state,
        expectedCanStop: scenario.expectedCanStop,
        observedCanStop: result.terminal.canStop,
        processGroupGone: result.terminal.cleanup.groupGone,
        orphanDetected: result.terminal.cleanup.orphanDetected,
        assurance: 'partial',
        receiptSha256: jsonHash(result.receipt),
      });
    }
    const evidence = {
      schema: 'scopa.codex-deterministic-edge-result.v1',
      slice: 'S16',
      sourceCommit,
      package: installed.package,
      policy: {
        sha256: policy.policySha256,
        providerGate: policy.authorization.providerGate,
      },
      corpus: {
        sha256: sha256(corpusText),
        scenarioCount: corpus.scenarios.length,
      },
      execution: {
        deterministic: true,
        providerInvocations: 0,
        allExpectedStatesObserved: records.every(
          (record) =>
            record.expectedState === record.observedState &&
            record.expectedCanStop === record.observedCanStop,
        ),
        allProcessGroupsGone: records.every(
          (record) => record.processGroupGone,
        ),
        assurance: 'partial',
      },
      scenarios: records,
    };
    const text = canonicalJsonPretty(evidence);
    const findings = scanPrivateText(text, {
      forbiddenValues: [
        temporary,
        repositoryRoot,
        installed.adapterCli,
      ],
    });
    if (findings.length !== 0) {
      throw new TypeError(
        `S16 deterministic evidence failed privacy scan: ${findings.join(', ')}`,
      );
    }
    return {
      evidence,
      text,
    };
  } finally {
    await rm(temporary, {
      recursive: true,
      force: true,
    });
  }
}

async function main() {
  const { output } = parseDeterministicArguments(process.argv.slice(2));
  const campaign = await deterministicCampaign();
  if (output !== null) {
    const handle = await open(output, 'wx', 0o644);
    await handle.writeFile(campaign.text);
    await handle.close();
  }
  process.stdout.write(`${JSON.stringify(campaign.evidence.execution)}\n`);
  if (output !== null) process.stdout.write(`${output}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
