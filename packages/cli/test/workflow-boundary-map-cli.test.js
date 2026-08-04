import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
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
  executeCommand,
  failureResult,
} from '../src/command.js';
import { jsonHash } from '../../enforcement/src/index.js';

const MATRIX = JSON.parse(await readFile(
  new URL('../../../fixtures/S10/capability-matrix.json', import.meta.url),
  'utf8',
));

async function repository(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-map-cli-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'workspace'));
  const definition = {
    schema: 'scopa.slice-definition.v1',
    sliceId: 'cli-map',
    allowedPaths: ['workspace/**'],
    amendmentPath: '.scopa/amendment.json',
    gates: [{
      id: 'clean',
      command: ['node', '-e', 'process.exit(0)'],
      cwd: '.',
      timeoutMs: 30000,
    }],
    nonGoals: ['No deployment'],
    stopCondition: { kind: 'all-gates-pass' },
  };
  await writeFile(
    path.join(root, 'scopa.slice-definition.json'),
    `${JSON.stringify(definition, null, 2)}\n`,
  );
  const initialized = await executeCommand([
    'init', '--repo', root, '--definition', 'scopa.slice-definition.json',
  ]);
  assert.equal(initialized.exitCode, 0);
  return root;
}

async function fileLedger(root) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)))
    .sort();
  const ledger = {};
  for (const file of files) {
    ledger[file] = createHash('sha256')
      .update(await readFile(path.join(root, file)))
      .digest('hex');
  }
  return ledger;
}

const authorityDocument = {
  schema: 'scopa.authority-declarations.v1',
  declarations: [
    { id: 'browser', status: 'disabled' },
    { id: 'credentials', status: 'authority-required' },
    { id: 'deployment', status: 'authority-required' },
    { id: 'external-systems', status: 'authority-required' },
    { id: 'provider', status: 'authority-required' },
    { id: 'publication', status: 'authority-required' },
  ],
};

test('map defaults closed and does not mutate an observational repository', async (context) => {
  const root = await repository(context);
  const before = await fileLedger(root);
  const result = await executeCommand(['map', '--repo', root]);
  const after = await fileLedger(root);
  assert.equal(result.exitCode, 0);
  assert.equal(result.envelope.result.schema, 'scopa.workflow-boundary-map.v1');
  assert.equal(result.envelope.result.assurance.level, 'unknown');
  assert.equal(result.envelope.result.summary.unknown, 11);
  assert.deepEqual(after, before);
});

test('JSON and Markdown projections bind the same complete map', async (context) => {
  const root = await repository(context);
  await writeFile(path.join(root, 'matrix.json'), `${JSON.stringify(MATRIX)}\n`);
  await writeFile(
    path.join(root, 'authority.json'),
    `${JSON.stringify(authorityDocument)}\n`,
  );
  const common = [
    '--repo', root,
    '--matrix', 'matrix.json',
    '--authority', 'authority.json',
  ];
  const json = await executeCommand(['map', ...common]);
  const markdown = await executeCommand(['map', ...common, '--format', 'markdown']);
  assert.equal(json.envelope.result.assurance.level, 'full');
  assert.equal(markdown.envelope.result.schema, 'scopa.workflow-boundary-map-render.v1');
  assert.equal(markdown.envelope.result.mapSha256, jsonHash(json.envelope.result));
  for (const surface of json.envelope.result.surfaces) {
    assert.match(markdown.envelope.result.content, new RegExp(
      surface.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    ));
    assert.match(markdown.envelope.result.content, new RegExp(surface.status));
  }
  assert.match(markdown.envelope.result.content, /workspace\/\*\*/);
  assert.match(markdown.envelope.result.content, /No deployment/);
});

test('renderer escapes hostile capability labels', async (context) => {
  const root = await repository(context);
  const hostile = structuredClone(MATRIX);
  hostile.capabilities.push({
    id: '<script>|hostile\nroute',
    category: 'network',
    exposure: 'native',
    mediation: 'uncontrolled',
    effect: 'OBSERVE',
    evidence: 'hostile renderer corpus',
  });
  hostile.assurance = 'partial';
  await writeFile(path.join(root, 'matrix.json'), `${JSON.stringify(hostile)}\n`);
  const result = await executeCommand([
    'map', '--repo', root, '--matrix', 'matrix.json', '--format', 'markdown',
  ]);
  assert.doesNotMatch(result.envelope.result.content, /<script>/);
  assert.match(result.envelope.result.content, /&lt;script&gt;\\\|hostile route/);
});

test('invalid formats and stale or malformed inputs fail closed', async (context) => {
  const root = await repository(context);
  await assert.rejects(
    () => executeCommand(['map', '--repo', root, '--format', 'html']),
    /json or markdown/,
  );
  await writeFile(path.join(root, 'matrix.json'), '{}\n');
  for (const args of [
    ['map', '--repo', root, '--matrix', 'matrix.json'],
    ['map', '--repo', root, '--authority', 'missing.json'],
  ]) {
    try {
      await executeCommand(args);
      assert.fail('expected map command to reject');
    } catch (error) {
      const failure = failureResult('map', error);
      assert.equal(failure.exitCode, 2);
      assert.equal(failure.envelope.ok, false);
    }
  }
  const lockPath = path.join(root, '.scopa/slice-lock.json');
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  lock.definitionHash = '0'.repeat(64);
  await writeFile(lockPath, `${JSON.stringify(lock)}\n`);
  await assert.rejects(
    () => executeCommand(['map', '--repo', root]),
    /hash mismatch/,
  );
});
