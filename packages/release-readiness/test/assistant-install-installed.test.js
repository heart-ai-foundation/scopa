import assert from 'node:assert/strict';
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
import {
  invokeCaptured,
} from '../src/subprocess.js';

const ROOT = path.resolve(new URL('../../..', import.meta.url).pathname);
const PACKAGE = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));

async function command(cli, target, args) {
  const result = await invokeCaptured(process.execPath, [
    cli,
    'assistant',
    ...args,
    '--repo',
    target,
  ], {
    cwd: target,
    env: { PATH: process.env.PATH },
  });
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}

test('packed bytes install and remove the project-local assistant entry in clean and cold processes', async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'scopa-s39-installed-'));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  await invokeCaptured('npm', [
    'pack', '--pack-destination', temporary,
  ], { cwd: ROOT });
  const archive = path.join(
    temporary,
    `heart-ai-foundation-scopa-${PACKAGE.version}.tgz`,
  );
  await access(archive);

  const toolRoot = path.join(temporary, 'tool');
  await mkdir(toolRoot);
  await writeFile(
    path.join(toolRoot, 'package.json'),
    '{"name":"scopa-s39-installed","private":true}\n',
  );
  await invokeCaptured('npm', [
    'install', '--ignore-scripts', '--no-audit', '--no-fund',
    '--package-lock=false', archive,
  ], { cwd: toolRoot });
  const installed = path.join(
    toolRoot,
    'node_modules/@heart-ai-foundation/scopa',
  );
  for (const required of [
    'SCOPA_AGENT.md',
    'docs/ASSISTANT_INSTALLATION.md',
    'packages/adoption-experience/src/assistant-install.js',
    'packages/cli/src/cli.js',
  ]) await access(path.join(installed, required));

  const target = path.join(temporary, 'target');
  await mkdir(target);
  await mkdir(path.join(target, '.codex'));
  const cli = path.join(installed, 'packages/cli/src/cli.js');
  const preview = await command(cli, target, ['install', '--dry-run']);
  assert.equal(preview.result.status, 'absent');
  assert.deepEqual(await readdir(target), ['.codex']);

  const applied = await command(cli, target, ['install']);
  assert.deepEqual(applied.result.plan, preview.result.plan);
  assert.equal(
    await readFile(path.join(target, '.agents/skills/scopa/SKILL.md'), 'utf8')
      .then((value) => value.includes('scopa begin --request-json')),
    true,
  );

  const cold = await command(cli, target, ['install', '--client', 'codex']);
  assert.equal(cold.result.status, 'installed');
  assert.deepEqual(cold.result.created, []);

  const removed = await command(cli, target, ['uninstall']);
  assert.equal(removed.result.status, 'removed');
  assert.deepEqual(await readdir(target), ['.codex']);
  await assert.rejects(access(path.join(target, 'package.json')), { code: 'ENOENT' });
  await assert.rejects(access(path.join(target, 'node_modules')), { code: 'ENOENT' });
});
