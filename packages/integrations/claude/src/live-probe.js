#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  execFile,
} from 'node:child_process';
import {
  createHash,
} from 'node:crypto';
import {
  access,
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
  promisify,
} from 'node:util';
import {
  fileURLToPath,
  pathToFileURL,
} from 'node:url';
import {
  canonicalJsonPretty,
} from '../../../enforcement/src/index.js';
import {
  initializeProject,
} from '../../../cli/src/project.js';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);
const FIXTURE = path.join(ROOT, 'fixtures/S8');

function outputArgument(argv) {
  if (argv.length === 0) return null;
  if (argv.length !== 2 || argv[0] !== '--output') {
    throw new Error('usage: live-probe.js [--output <json-file>]');
  }
  return path.resolve(argv[1]);
}

async function createRepository(root, definitionFile) {
  await mkdir(root);
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'workspace'));
  const definition = JSON.parse(
    await readFile(path.join(FIXTURE, definitionFile), 'utf8'),
  );
  await writeFile(
    path.join(root, 'scopa.slice-definition.json'),
    canonicalJsonPretty(definition),
  );
  await writeFile(
    path.join(root, 'task.txt'),
    'Write only the exact scenario content requested by the live prompt.\n',
  );
  await initializeProject({
    repoRoot: root,
    definitionPath: 'scopa.slice-definition.json',
  });
}

async function installPackedRuntime(temporary) {
  const pack = await execFileAsync('npm', [
    'pack',
    '--json',
    '--pack-destination',
    temporary,
  ], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const [manifest] = JSON.parse(pack.stdout);
  const sourceCommit = (
    await execFileAsync('git', [
      'rev-parse',
      'HEAD',
    ], {
      cwd: ROOT,
      encoding: 'utf8',
    })
  ).stdout.trim();
  const packageSha256 = createHash('sha256')
    .update(await readFile(path.join(temporary, manifest.filename)))
    .digest('hex');
  const consumer = path.join(temporary, 'runtime-consumer');
  await mkdir(consumer);
  await writeFile(
    path.join(consumer, 'package.json'),
    '{"name":"scopa-claude-runtime","version":"1.0.0","private":true}\n',
  );
  await execFileAsync('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
    path.join(temporary, manifest.filename),
  ], {
    cwd: consumer,
    encoding: 'utf8',
  });
  const adapterCli = path.join(
    consumer,
    'node_modules/@heart-ai-foundation/scopa/packages/adapter-host/src/cli.js',
  );
  const resolved = await realpath(adapterCli);
  assert.equal(
    resolved.startsWith(await realpath(path.join(consumer, 'node_modules'))),
    true,
  );
  const integrationEntry = path.join(
    consumer,
    'node_modules/@heart-ai-foundation/scopa/packages/integrations/claude/src/index.js',
  );
  const resolvedIntegration = await realpath(integrationEntry);
  assert.equal(
    resolvedIntegration.startsWith(
      await realpath(path.join(consumer, 'node_modules')),
    ),
    true,
  );
  assert.equal(
    manifest.files.some(
      (entry) =>
        entry.path === 'packages/integrations/claude/src/index.js',
    ),
    true,
  );
  return {
    adapterCli,
    integration: await import(pathToFileURL(resolvedIntegration).href),
    artifact: {
      schema: 'scopa.installed-artifact-identity.v1',
      sourceCommit,
      package: {
        name: manifest.name,
        version: manifest.version,
        sha256: packageSha256,
        integrity: manifest.integrity,
      },
    },
    package: {
      filename: manifest.filename,
      integrity: manifest.integrity,
      sha256: packageSha256,
      sourceCommit,
      shasum: manifest.shasum,
      entryCount: manifest.entryCount,
      installedClaudeIntegration: true,
    },
  };
}

function shortToolNames(run) {
  return run.normalized.toolCalls.map((call) =>
    call.name.replace(/^mcp__scopa__/, ''),
  );
}

function findTool(run, name) {
  const call = run.normalized.toolCalls.findLast(
    (entry) => entry.name === `mcp__scopa__${name}`,
  );
  assert.ok(call, `missing ${name}`);
  return call;
}

function assertOrder(run, expected) {
  assert.deepEqual(shortToolNames(run), expected);
}

async function scenario({
  adapterCli,
  matrix,
  repoRoot,
  prompt,
  name,
  integration,
  installedArtifact,
  livePolicy,
}) {
  return integration.runClaudeSession({
    repoRoot,
    adapterCli,
    session: integration.createClaudeSession({
      sessionId: `S8-${name}`,
      request: prompt,
    }),
    capabilityMatrix: matrix,
    installedArtifact,
    livePolicy,
    scenario: {
      id: name,
      version: 'S8.v1',
    },
    prompt,
    model: 'sonnet',
    maxBudgetUsd: '0.20',
  });
}

async function main() {
  const output = outputArgument(process.argv.slice(2));
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-claude-live-'));
  try {
    const installed = await installPackedRuntime(temporary);
    const matrix = installed.integration.createClaudeCapabilityMatrix({});
    const livePolicy = installed.integration.createClaudeLivePolicy({});
    const prompts = JSON.parse(
      await readFile(path.join(FIXTURE, 'prompts.json'), 'utf8'),
    );
    const cleanRoot = path.join(temporary, 'clean');
    const deniedRoot = path.join(temporary, 'denied');
    const falseGreenRoot = path.join(temporary, 'false-green');
    await createRepository(cleanRoot, 'clean.slice-definition.json');
    await createRepository(deniedRoot, 'clean.slice-definition.json');
    await createRepository(falseGreenRoot, 'failing.slice-definition.json');

    const clean = await scenario({
      adapterCli: installed.adapterCli,
      matrix,
      repoRoot: cleanRoot,
      prompt: prompts.clean,
      name: 'clean',
      integration: installed.integration,
      installedArtifact: installed.artifact,
      livePolicy,
    });
    assertOrder(clean, [
      'scopa_orientation',
      'scopa_read_file',
      'scopa_write_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ]);
    assert.equal(findTool(clean, 'scopa_write_file').isError, false);
    assert.equal(clean.normalized.final.scenario, 'clean');
    assert.equal(clean.normalized.final.canStop, true);
    assert.equal(
      await readFile(path.join(cleanRoot, 'workspace/claude.txt'), 'utf8'),
      'CLAUDE_ALLOWED\n',
    );

    const denied = await scenario({
      adapterCli: installed.adapterCli,
      matrix,
      repoRoot: deniedRoot,
      prompt: prompts.denied,
      name: 'denied',
      integration: installed.integration,
      installedArtifact: installed.artifact,
      livePolicy,
    });
    assertOrder(denied, [
      'scopa_orientation',
      'scopa_write_file',
      'scopa_write_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ]);
    const deniedCalls = denied.normalized.toolCalls.filter(
      (call) => call.name.endsWith('scopa_write_file'),
    );
    assert.equal(deniedCalls[0].isError, true);
    assert.equal(deniedCalls[0].result.code, 'SCOPA_SCOPE_DENIED');
    assert.equal(deniedCalls[1].isError, false);
    assert.equal(denied.normalized.final.denialObserved, true);
    await assert.rejects(
      () => access(path.join(temporary, 'claude-escape.txt')),
      { code: 'ENOENT' },
    );

    const falseGreen = await scenario({
      adapterCli: installed.adapterCli,
      matrix,
      repoRoot: falseGreenRoot,
      prompt: prompts.falseGreen,
      name: 'false-green',
      integration: installed.integration,
      installedArtifact: installed.artifact,
      livePolicy,
    });
    assertOrder(falseGreen, [
      'scopa_orientation',
      'scopa_write_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ]);
    const blockedCheck = findTool(falseGreen, 'scopa_check');
    assert.equal(blockedCheck.isError, true);
    assert.equal(blockedCheck.result.state.canStop, false);
    assert.equal(falseGreen.normalized.final.canStop, false);
    assert.equal(falseGreen.normalized.final.status, 'blocked');

    const coldRestart = await scenario({
      adapterCli: installed.adapterCli,
      matrix,
      repoRoot: cleanRoot,
      prompt: prompts.coldRestart,
      name: 'cold-restart',
      integration: installed.integration,
      installedArtifact: installed.artifact,
      livePolicy,
    });
    assertOrder(coldRestart, [
      'scopa_orientation',
      'scopa_read_file',
      'scopa_check',
      'scopa_assurance',
      'scopa_transcript',
    ]);
    assert.equal(coldRestart.normalized.final.scenario, 'cold-restart');
    assert.equal(coldRestart.normalized.final.canStop, true);
    assert.equal(
      findTool(coldRestart, 'scopa_read_file').result.content,
      'CLAUDE_ALLOWED\n',
    );

    const proof = {
      schema: 'scopa.claude-live-proof.v1',
      package: installed.package,
      capabilityMatrix: matrix,
      scenarios: {
        clean,
        denied,
        falseGreen,
        coldRestart,
      },
      summary: {
        claudeCodeVersion: clean.receipt.client.observedVersion,
        requestedModel: clean.receipt.requestedModel,
        observedModel: clean.normalized.initialization.model,
        assurance: matrix.assurance,
        scenarioCount: 4,
        totalCostUsd: [
          clean,
          denied,
          falseGreen,
          coldRestart,
        ].reduce(
          (total, run) => total + run.normalized.result.costUsd,
          0,
        ),
        allModelCallableToolsScopaOnly: [
          clean,
          denied,
          falseGreen,
          coldRestart,
        ].every(
          (run) =>
            run.normalized.initialization.tools.every(
              (tool) => tool.startsWith('mcp__scopa__'),
            ),
        ),
        builtinAgentDefinitionsObserved:
          clean.normalized.initialization.agents,
        scopeDenied: deniedCalls[0].result.code === 'SCOPA_SCOPE_DENIED',
        falseGreenRefused: !falseGreen.normalized.final.canStop,
        coldRestartRecovered: coldRestart.normalized.final.canStop,
      },
    };
    const serialized = `${JSON.stringify(proof, null, 2)}\n`;
    if (output) {
      await writeFile(output, serialized, { mode: 0o600 });
      process.stdout.write(`${JSON.stringify(proof.summary)}\n`);
      process.stdout.write(`${output}\n`);
    } else {
      process.stdout.write(serialized);
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  if (error.details) {
    process.stderr.write(`${JSON.stringify(error.details, null, 2)}\n`);
  }
  process.exitCode = 1;
});
