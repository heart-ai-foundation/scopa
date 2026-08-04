import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import {
  jsonHash,
} from '../../enforcement/src/index.js';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(new URL('../../..', import.meta.url).pathname);
const PACKAGE = JSON.parse(
  await readFile(path.join(ROOT, 'package.json'), 'utf8'),
);

let commandSequence = 0;

async function command(runner, resultRoot, target, args) {
  commandSequence += 1;
  const resultPath = path.join(resultRoot, `command-${commandSequence}.json`);
  const { stderr } = await execFileAsync(process.execPath, [
    runner,
    JSON.stringify([...args, '--repo', target]),
    resultPath,
  ], {
    cwd: target,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
    },
  });
  assert.equal(stderr, '');
  return JSON.parse(await readFile(resultPath, 'utf8'));
}

test('packed doctor completes a source-free zero-state-to-lock journey in clean and cold processes', async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-doctor-installed-'));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  await execFileAsync('npm', [
    'pack', '--pack-destination', temporary,
  ], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const archive = path.join(
    temporary,
    `heart-ai-foundation-scopa-${PACKAGE.version}.tgz`,
  );
  await access(archive);

  const { stdout: tarInventory } = await execFileAsync('tar', [
    '-tzf', archive,
  ], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const inventory = new Set(tarInventory
    .split('\n')
    .filter(Boolean)
    .map((entry) => entry.replace(/^package\//u, '')));
  for (const required of [
    'README.md',
    'SCOPA_AGENT.md',
    'docs/BOUNDARY_DOCTOR.md',
    'schemas/scopa.boundary-diagnostic.v1.schema.json',
    'schemas/scopa.boundary-doctor-report.v1.schema.json',
    'packages/boundary-doctor/src/diagnostic.js',
    'packages/boundary-doctor/src/render.js',
    'packages/cli/src/cli.js',
    'fixtures/S36/scopa.slice-definition.json',
    'fixtures/S36/scopa.capability-matrix.json',
    'fixtures/S36/scopa.authority-declarations.json',
  ]) assert.equal(inventory.has(required), true, `missing packed byte: ${required}`);
  for (const packedPath of inventory) {
    assert.equal(/^(?:evidence|notes|runs|next-prompt-protocols)\//u.test(packedPath), false);
  }

  const toolRoot = path.join(temporary, 'tool');
  await mkdir(toolRoot);
  await writeFile(
    path.join(toolRoot, 'package.json'),
    '{"name":"scopa-doctor-tool","private":true}\n',
  );
  await execFileAsync('npm', [
    'install', '--ignore-scripts', '--no-audit', '--no-fund',
    '--package-lock=false', archive,
  ], { cwd: toolRoot, encoding: 'utf8' });
  const installed = path.join(
    toolRoot,
    'node_modules/@heart-ai-foundation/scopa',
  );
  const commandModule = path.join(installed, 'packages/cli/src/command.js');
  const runner = path.join(temporary, 'installed-command-runner.mjs');
  await writeFile(runner, [
    `import { executeCommand, failureResult } from ${JSON.stringify(pathToFileURL(commandModule).href)};`,
    "import { writeFile } from 'node:fs/promises';",
    'const argv = JSON.parse(process.argv[2]);',
    'let outcome;',
    'try { outcome = await executeCommand(argv); }',
    'catch (error) { outcome = failureResult(argv[0], error); }',
    "await writeFile(process.argv[3], JSON.stringify(outcome.envelope), { flag: 'wx', mode: 0o600 });",
    'process.exitCode = outcome.exitCode;',
    '',
  ].join('\n'));

  const target = path.join(temporary, 'target');
  await mkdir(target);
  await mkdir(path.join(target, '.git'));
  await writeFile(
    path.join(target, 'AGENTS.md'),
    'private installed journey instruction that must not be shared\n',
  );
  const zeroJson = await command(runner, temporary, target, ['doctor']);
  const zeroMarkdown = await command(runner, temporary, target, [
    'doctor', '--format', 'markdown',
  ]);
  assert.equal(zeroJson.ok, true);
  assert.equal(zeroJson.result.subject.scopaInitialized, false);
  assert.equal(zeroMarkdown.result.sourceSha256, jsonHash(zeroJson.result));
  assert.equal(zeroMarkdown.result.summary.before.scopaInitialized, false);
  assert.equal(zeroMarkdown.result.content.includes('AGENTS.md'), false);
  assert.equal(zeroMarkdown.result.content.includes(target), false);
  assert.equal(
    zeroMarkdown.result.content.includes('private installed journey instruction'),
    false,
  );

  for (const file of [
    'scopa.slice-definition.json',
    'scopa.capability-matrix.json',
    'scopa.authority-declarations.json',
  ]) {
    await copyFile(
      path.join(installed, 'fixtures/S36', file),
      path.join(target, file),
    );
  }
  const lockArgs = [
    'doctor', '--lock',
    '--definition', 'scopa.slice-definition.json',
    '--matrix', 'scopa.capability-matrix.json',
    '--authority', 'scopa.authority-declarations.json',
    '--format', 'markdown',
  ];
  const clean = await command(runner, temporary, target, lockArgs);
  assert.equal(clean.ok, true);
  assert.equal(clean.result.summary.kind, 'lock-result');
  assert.equal(clean.result.summary.before.scopaInitialized, false);
  assert.equal(clean.result.summary.terminal.canStop, true);
  assert.equal(clean.result.summary.terminal.assurance, 'partial');
  assert.equal(clean.result.content.includes('boundary-doctor-installed'), false);
  assert.equal(clean.result.content.includes('installed-provider-off-gate'), false);

  const cold = await command(runner, temporary, target, lockArgs);
  assert.equal(cold.ok, true);
  assert.equal(cold.result.summary.before.scopaInitialized, true);
  assert.deepEqual(cold.result.summary.terminal, clean.result.summary.terminal);
  assert.notEqual(cold.result.sourceSha256, clean.result.sourceSha256);

  await assert.rejects(() => access(path.join(target, 'package.json')), {
    code: 'ENOENT',
  });
  await assert.rejects(() => access(path.join(target, 'node_modules')), {
    code: 'ENOENT',
  });
  assert.equal(
    JSON.parse(await readFile(path.join(target, '.scopa/config.json'), 'utf8')).schema,
    'scopa.project-config.v1',
  );
});
