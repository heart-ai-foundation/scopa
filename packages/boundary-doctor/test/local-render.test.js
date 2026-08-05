import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  createBoundaryDiagnostic,
  renderBoundaryDoctorLocal,
  renderBoundaryDoctorMarkdown,
  renderBoundarySnapshot,
} from '../src/index.js';

const EXPECTED_PATH = new URL(
  '../../../fixtures/S45/expected-local-diagnostic.txt',
  import.meta.url,
);

async function markerRichRoot(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-s45-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, '.claude'), { recursive: true });
  await mkdir(path.join(root, '.github/workflows'), { recursive: true });
  await writeFile(path.join(root, '.claude/settings.json'), '{}\n');
  await writeFile(path.join(root, '.env.local'), 'PRIVATE_VALUE=never-rendered\n');
  await writeFile(path.join(root, '.github/workflows/deploy.yml'), 'name: deploy\n');
  await writeFile(path.join(root, '.github/workflows/release.yml'), 'name: release\n');
  await writeFile(path.join(root, '.mcp.json'), '{}\n');
  await writeFile(path.join(root, 'AGENTS.md'), 'private instructions never rendered\n');
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    scripts: { build: 'node build.js', test: 'node --test' },
    publishConfig: { access: 'public' },
  }));
  return root;
}

test('local render names bounded evidence and matches the exact fixture', async (context) => {
  const root = await markerRichRoot(context);
  const diagnostic = await createBoundaryDiagnostic({ repoRoot: root });
  const rendered = renderBoundaryDoctorLocal(diagnostic);
  const expected = await readFile(EXPECTED_PATH, 'utf8');

  assert.equal(rendered, expected);
  assert.equal(rendered.includes(root), false);
  assert.equal(rendered.includes('PRIVATE_VALUE'), false);
  assert.equal(rendered.includes('never-rendered'), false);
  assert.equal(rendered.split('\n').filter((line) => line.trim()).length, 20);
  assert.match(rendered, /DETECTED {2}agent\.configuration-markers \[agent-config\] count 1 — \.claude\/settings\.json/u);
  assert.match(rendered, /UNKNOWN {3}authority\.network \[network\] count 0 — not probed/u);
  assert.match(rendered, /Not detected 2/u);
  assert.match(rendered, /not-detected means marker not observed/u);
});

test('local paths never reach the short or shareable projections', async (context) => {
  const root = await markerRichRoot(context);
  const diagnostic = await createBoundaryDiagnostic({ repoRoot: root });
  const local = renderBoundaryDoctorLocal(diagnostic);
  const snapshot = renderBoundarySnapshot(diagnostic);
  const shareable = renderBoundaryDoctorMarkdown(diagnostic).content;

  for (const marker of [
    '.claude/settings.json',
    '.env.local',
    '.github/workflows/deploy.yml',
    '.github/workflows/release.yml',
    '.mcp.json',
    'AGENTS.md',
    'package.json',
  ]) {
    assert.equal(local.includes(marker), true, `local output omitted ${marker}`);
    assert.equal(snapshot.includes(marker), false, `snapshot disclosed ${marker}`);
    assert.equal(shareable.includes(marker), false, `shareable output disclosed ${marker}`);
  }
});

test('truncated scans remain explicitly unknown', async (context) => {
  const root = await markerRichRoot(context);
  const diagnostic = await createBoundaryDiagnostic({
    repoRoot: root,
    limits: { maxEntries: 2 },
  });
  const rendered = renderBoundaryDoctorLocal(diagnostic);

  assert.match(rendered, /scan incomplete; missing markers remain unknown/u);
  assert.match(rendered, /UNKNOWN/u);
  assert.equal(rendered.toLowerCase().includes('safe'), false);
  assert.equal(rendered.toLowerCase().includes('secure'), false);
});
