import assert from 'node:assert/strict';
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  AssistantInstallError,
  detectAssistantSurfaces,
  installAssistant,
  uninstallAssistant,
} from '../src/index.js';
import {
  executeCommand,
} from '../../cli/src/index.js';

async function repository(prefix = 'scopa-s39-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function inventory(root, relative = '.') {
  const base = path.join(root, relative);
  let entries;
  try {
    entries = await readdir(base, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const paths = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const child = relative === '.' ? entry.name : `${relative}/${entry.name}`;
    paths.push(child);
    if (entry.isDirectory()) paths.push(...await inventory(root, child));
  }
  return paths;
}

test('assistant detection is explicit for Claude, Codex, and generic surfaces', async () => {
  const fixtures = [
    ['.claude', 'claude-code'],
    ['.codex', 'codex'],
    ['.agents', 'generic'],
  ];
  for (const [marker, expected] of fixtures) {
    const root = await repository();
    await mkdir(path.join(root, marker));
    const detection = await detectAssistantSurfaces(root);
    assert.equal(detection.status, 'detected');
    assert.equal(detection.client, expected);
    assert.deepEqual(detection.candidates, [expected]);
  }

  const unknown = await repository();
  assert.equal((await detectAssistantSurfaces(unknown)).status, 'unknown');
  await assert.rejects(
    installAssistant({ repoRoot: unknown, client: 'auto' }),
    AssistantInstallError,
  );
  assert.deepEqual(await inventory(unknown), []);

  const ambiguous = await repository();
  await mkdir(path.join(ambiguous, '.claude'));
  await mkdir(path.join(ambiguous, '.codex'));
  assert.equal((await detectAssistantSurfaces(ambiguous)).status, 'ambiguous');
  await assert.rejects(
    installAssistant({ repoRoot: ambiguous, client: 'auto' }),
    AssistantInstallError,
  );
  assert.deepEqual(await inventory(ambiguous), ['.claude', '.codex']);
});

test('dry-run, install, idempotence, and uninstall are plan-bound and reversible', async () => {
  const root = await repository();
  await mkdir(path.join(root, '.claude'));
  const before = await inventory(root);
  const preview = await installAssistant({
    repoRoot: root,
    client: 'auto',
    dryRun: true,
  });
  assert.equal(preview.action, 'preview');
  assert.equal(preview.status, 'absent');
  assert.deepEqual(await inventory(root), before);

  const installed = await installAssistant({ repoRoot: root, client: 'auto' });
  assert.deepEqual(installed.plan, preview.plan);
  assert.deepEqual(installed.created, [
    '.claude/skills/scopa/SKILL.md',
    '.scopa/assistant-install.json',
  ]);
  const skill = await readFile(
    path.join(root, '.claude/skills/scopa/SKILL.md'),
    'utf8',
  );
  assert.match(skill, /scopa begin --request-json/u);
  assert.doesNotMatch(skill, /capability-matrix|authority-declarations/u);
  assert.equal((await stat(path.join(root, '.scopa/assistant-install.json'))).mode & 0o777, 0o600);

  const repeated = await installAssistant({ repoRoot: root, client: 'claude-code' });
  assert.equal(repeated.status, 'installed');
  assert.deepEqual(repeated.created, []);

  const removalPreview = await uninstallAssistant({ repoRoot: root, dryRun: true });
  assert.equal(removalPreview.action, 'preview-uninstall');
  const removed = await uninstallAssistant({ repoRoot: root });
  assert.equal(removed.status, 'removed');
  assert.deepEqual(await inventory(root), before);
});

test('collisions, aliases, changed targets, and forged cleanup paths fail closed', async () => {
  const collision = await repository();
  await mkdir(path.join(collision, '.agents/skills/scopa'), { recursive: true });
  const target = path.join(collision, '.agents/skills/scopa/SKILL.md');
  await writeFile(target, 'owned by developer\n');
  const before = await inventory(collision);
  await assert.rejects(
    installAssistant({ repoRoot: collision, client: 'generic' }),
    (error) => error.code === 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
  );
  assert.deepEqual(await inventory(collision), before);

  const alias = await repository();
  const outside = await repository('scopa-s39-outside-');
  await symlink(outside, path.join(alias, '.agents'));
  await assert.rejects(
    installAssistant({ repoRoot: alias, client: 'generic' }),
    (error) => error.code === 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
  );
  assert.deepEqual(await inventory(outside), []);

  const changed = await repository();
  await installAssistant({ repoRoot: changed, client: 'generic' });
  const changedTarget = path.join(changed, '.agents/skills/scopa/SKILL.md');
  await chmod(changedTarget, 0o600);
  await writeFile(changedTarget, 'changed after install\n');
  await assert.rejects(
    uninstallAssistant({ repoRoot: changed }),
    (error) => error.code === 'SCOPA_ASSISTANT_INSTALL_CONFLICT',
  );
  await access(path.join(changed, '.scopa/assistant-install.json'));

  const forgedReceipt = JSON.parse(await readFile(
    path.join(changed, '.scopa/assistant-install.json'),
    'utf8',
  ));
  forgedReceipt.createdDirectories.push('unrelated-empty-directory');
  await writeFile(
    path.join(changed, '.scopa/assistant-install.json'),
    `${JSON.stringify(forgedReceipt)}\n`,
  );
  await assert.rejects(
    uninstallAssistant({ repoRoot: changed }),
    /unrelated directory/u,
  );
});

test('CLI exposes natural detect, install preview, install, and uninstall actions', async () => {
  const root = await repository();
  await mkdir(path.join(root, '.codex'));
  const detected = await executeCommand(['assistant', 'detect', '--repo', root]);
  assert.equal(detected.envelope.result.client, 'codex');
  const preview = await executeCommand([
    'assistant', 'install', '--dry-run', '--repo', root,
  ]);
  const installed = await executeCommand(['assistant', 'install', '--repo', root]);
  assert.deepEqual(installed.envelope.result.plan, preview.envelope.result.plan);
  const removed = await executeCommand(['assistant', 'uninstall', '--repo', root]);
  assert.equal(removed.envelope.result.status, 'removed');
});

test('project-local installation never reads or mutates a user-global home', async () => {
  const root = await repository();
  const fakeHome = await repository('scopa-s39-home-');
  await writeFile(path.join(fakeHome, 'sentinel'), 'unchanged\n');
  const before = await inventory(fakeHome);
  const original = process.env.HOME;
  process.env.HOME = fakeHome;
  try {
    await installAssistant({ repoRoot: root, client: 'generic' });
    await uninstallAssistant({ repoRoot: root });
  } finally {
    if (original === undefined) delete process.env.HOME;
    else process.env.HOME = original;
  }
  assert.deepEqual(await inventory(fakeHome), before);
  assert.equal(await readFile(path.join(fakeHome, 'sentinel'), 'utf8'), 'unchanged\n');
});

test('the agent entry is compact and uses only the runtime-owned bootstrap path', async () => {
  const text = await readFile(
    new URL('../../../SCOPA_AGENT.md', import.meta.url),
    'utf8',
  );
  assert.equal(text.split(/\r?\n/u).length <= 125, true);
  assert.match(text, /scopa begin --request-json/u);
  assert.doesNotMatch(
    text,
    /scopa\.capability-matrix|scopa\.authority-declarations|doctor --lock/u,
  );
});
