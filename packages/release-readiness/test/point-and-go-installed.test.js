import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(new URL('../../..', import.meta.url).pathname);
const PACKAGE = JSON.parse(
  await readFile(path.join(ROOT, 'package.json'), 'utf8'),
);

test('installed package completes the one-task map-first journey', async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-point-go-'));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  await execFileAsync('npm', [
    'pack', '--json', '--pack-destination', temporary,
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

  const toolRoot = path.join(temporary, 'tool');
  await mkdir(toolRoot);
  await writeFile(
    path.join(toolRoot, 'package.json'),
    '{"name":"scopa-point-go-tool","private":true}\n',
  );
  await execFileAsync('npm', [
    'install', '--ignore-scripts', '--no-audit', '--no-fund',
    '--package-lock=false', archive,
  ], { cwd: toolRoot, encoding: 'utf8' });

  const target = path.join(temporary, 'target');
  await mkdir(target);
  await mkdir(path.join(target, '.git'));
  await mkdir(path.join(target, 'workspace'));
  await writeFile(
    path.join(target, 'TASK.txt'),
    'Create workspace/result.txt containing exactly: point-and-go complete\n',
  );
  const installed = path.join(
    toolRoot,
    'node_modules/@heart-ai-foundation/scopa',
  );
  await access(path.join(installed, 'SCOPA_AGENT.md'));
  await access(path.join(installed, 'fixtures/S31/point-and-go-client.mjs'));
  const resultPath = path.join(temporary, 'point-and-go-result.json');
  await execFileAsync(process.execPath, [
    path.join(installed, 'fixtures/S31/point-and-go-client.mjs'),
    '--cli', path.join(installed, 'packages/cli/src/cli.js'),
    '--repo', target,
    '--task', path.join(target, 'TASK.txt'),
    '--result', resultPath,
  ], { cwd: target, encoding: 'utf8' });
  const report = JSON.parse(await readFile(resultPath, 'utf8'));
  const coldScript = path.join(temporary, 'cold-map-probe.mjs');
  const coldResult = path.join(temporary, 'cold-map-result.json');
  await writeFile(coldScript, [
    `import { executeCommand } from ${JSON.stringify(pathToFileURL(path.join(installed, 'packages/cli/src/command.js')).href)};`,
    "import { writeFile } from 'node:fs/promises';",
    `const outcome = await executeCommand(${JSON.stringify([
      'map', '--repo', target,
      '--matrix', 'scopa.capability-matrix.json',
      '--authority', 'scopa.authority-declarations.json',
    ])});`,
    `await writeFile(${JSON.stringify(coldResult)}, JSON.stringify(outcome.envelope.result), { flag: 'wx', mode: 0o600 });`,
    '',
  ].join('\n'));
  await execFileAsync(process.execPath, [coldScript], {
    cwd: temporary,
    encoding: 'utf8',
  });
  const coldMap = JSON.parse(await readFile(coldResult, 'utf8'));
  assert.equal(report.schema, 'scopa.point-and-go-result.v1');
  assert.deepEqual(report.preMutation, {
    assurance: 'partial',
    canStop: false,
    uncontrolled: 2,
  });
  assert.equal(report.allowedWrite, true);
  assert.deepEqual(report.deniedEscape, {
    denied: true,
    code: 'SCOPA_SCOPE_DENIED',
  });
  assert.deepEqual(report.terminal, {
    canStop: true,
    assurance: 'partial',
    mapSchema: 'scopa.workflow-boundary-map.v1',
  });
  assert.equal(coldMap.completion.canStop, true);
  assert.equal(coldMap.assurance.level, 'partial');
  assert.equal(coldMap.schema, 'scopa.workflow-boundary-map.v1');
  assert.equal(
    await readFile(path.join(target, 'workspace/result.txt'), 'utf8'),
    'point-and-go complete\n',
  );
  await assert.rejects(() => access(path.join(temporary, 'escape.txt')), {
    code: 'ENOENT',
  });
  await assert.rejects(() => access(path.join(target, 'package.json')), {
    code: 'ENOENT',
  });
  await assert.rejects(() => access(path.join(target, 'node_modules')), {
    code: 'ENOENT',
  });

  const targetEntries = (await readdir(target)).sort();
  assert.deepEqual(targetEntries, [
    '.git',
    '.scopa',
    'TASK.txt',
    'scopa.authority-declarations.json',
    'scopa.capability-matrix.json',
    'scopa.slice-definition.json',
    'workspace',
  ]);
});
