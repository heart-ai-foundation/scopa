import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  createBoundaryDiagnostic,
  createBoundarySnapshot,
  renderBoundarySnapshot,
} from '../src/index.js';

async function temporaryRoot(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-snapshot-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function nonblankLines(value) {
  return value.split(/\r?\n/u).filter((line) => line.trim().length > 0);
}

test('snapshot prioritizes a useful bounded result without protocol vocabulary', async (context) => {
  const root = await temporaryRoot(context);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    scripts: { test: 'node --test' },
  }));
  const diagnostic = await createBoundaryDiagnostic({ repoRoot: root });
  const first = renderBoundarySnapshot(diagnostic);
  const second = renderBoundarySnapshot(diagnostic);
  assert.equal(first, second);
  assert.match(first, /No SCOPA task boundary is locked/u);
  assert.match(first, /npm test/u);
  assert.match(first, /not measured/u);
  assert.ok(nonblankLines(first).length <= 20);
  assert.equal(/schema|digest|canonical|assurance/iu.test(first), false);
  assert.equal(first.match(/^- /gmu)?.length, 3);
});

test('snapshot prioritizes authority-sensitive repository markers without paths', async (context) => {
  const root = await temporaryRoot(context);
  await mkdir(path.join(root, '.github/workflows'), { recursive: true });
  await writeFile(
    path.join(root, '.github/workflows/private-customer-publish.yml'),
    'name: private customer publish\n',
  );
  await writeFile(path.join(root, '.env.private-customer'), 'PRIVATE_TOKEN=value\n');
  const diagnostic = await createBoundaryDiagnostic({ repoRoot: root });
  const output = renderBoundarySnapshot(diagnostic);
  assert.match(output, /credential-related, publication-related workflow files/u);
  assert.equal(output.includes('private-customer'), false);
  assert.equal(output.includes('PRIVATE_TOKEN'), false);
  assert.equal(output.includes(root), false);
});

test('truncated snapshot refuses favorable absence language', async (context) => {
  const root = await temporaryRoot(context);
  await writeFile(path.join(root, 'a.txt'), 'a');
  await writeFile(path.join(root, 'b.txt'), 'b');
  const diagnostic = await createBoundaryDiagnostic({
    repoRoot: root,
    limits: { maxEntries: 1 },
  });
  const snapshot = createBoundarySnapshot(diagnostic);
  assert.match(snapshot.observed[0], /reached its limit/u);
  assert.match(snapshot.observed[0], /remain unknown/u);
});

