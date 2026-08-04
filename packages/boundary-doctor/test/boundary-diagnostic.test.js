import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  createBoundaryDiagnostic,
  validateBoundaryDiagnostic,
} from '../src/index.js';

const SCHEMA_PATH = new URL(
  '../../../schemas/scopa.boundary-diagnostic.v1.schema.json',
  import.meta.url,
);

async function temporaryRoot(context, prefix = 'scopa-doctor-') {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function snapshot(root, relative = '') {
  const directory = path.join(root, relative);
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  const result = [];
  for (const entry of entries) {
    const child = relative === '' ? entry.name : `${relative}/${entry.name}`;
    if (entry.isSymbolicLink()) {
      result.push({ path: child, type: 'symlink' });
    } else if (entry.isDirectory()) {
      result.push({ path: child, type: 'directory' });
      result.push(...await snapshot(root, child));
    } else if (entry.isFile()) {
      const bytes = await readFile(path.join(root, child));
      result.push({
        path: child,
        type: 'file',
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
  return result;
}

function byId(report, id) {
  return report.indicators.find((item) => item.id === id);
}

test('zero-state diagnostic is deterministic, schema-valid, and non-mutating', async (context) => {
  const root = await temporaryRoot(context);
  const outside = await temporaryRoot(context, 'scopa-doctor-outside-');
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, '.github/hooks'), { recursive: true });
  await mkdir(path.join(root, '.github/workflows'), { recursive: true });
  await writeFile(path.join(root, 'AGENTS.md'), 'private fixture instruction\n');
  await writeFile(path.join(root, '.env.local'), 'SECRET_VALUE=not-for-output\n');
  await writeFile(path.join(root, '.github/hooks/pre.json'), '{}\n');
  await writeFile(path.join(root, '.github/workflows/deploy.yml'), 'name: deploy\n');
  await writeFile(path.join(outside, 'CLAUDE.md'), 'must never be traversed\n');
  await symlink(outside, path.join(root, 'escape'));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    scripts: {
      test: 'node --test',
      build: 'node build.js',
      secretInternalCommand: 'printenv',
    },
    publishConfig: { access: 'public' },
  }));

  const before = await snapshot(root);
  const first = await createBoundaryDiagnostic({ repoRoot: root });
  const second = await createBoundaryDiagnostic({ repoRoot: root });
  const after = await snapshot(root);

  assert.deepEqual(after, before);
  assert.equal(canonicalJsonPretty(first), canonicalJsonPretty(second));
  assert.equal(first.subject.repositoryKind, 'git');
  assert.equal(first.subject.scopaInitialized, false);
  assert.equal(first.inventory.symlinks, 1);
  assert.equal(first.inventory.truncated, false);
  assert.equal(byId(first, 'repository.instructions').status, 'detected');
  assert.deepEqual(byId(first, 'repository.instructions').paths, ['AGENTS.md']);
  assert.equal(byId(first, 'agent.hook-markers').status, 'detected');
  assert.equal(byId(first, 'authority.credential-markers').status, 'detected');
  assert.equal(byId(first, 'authority.network').status, 'unknown');
  assert.equal(byId(first, 'agent.tool-authority').status, 'unknown');
  assert.equal(byId(first, 'host.filesystem-write').category, 'host-process');
  assert.deepEqual(first.completionCandidates, [
    { id: 'package-script:build', source: 'package.json', invocation: ['npm', 'run', 'build'] },
    { id: 'package-script:test', source: 'package.json', invocation: ['npm', 'test'] },
  ]);
  const serialized = canonicalJsonPretty(first);
  assert.equal(serialized.includes(root), false);
  assert.equal(serialized.includes(outside), false);
  assert.equal(serialized.includes('SECRET_VALUE'), false);
  assert.equal(serialized.includes('not-for-output'), false);
  assert.equal(serialized.includes('secretInternalCommand'), false);
  assert.equal(serialized.includes('must never be traversed'), false);
  assert.deepEqual(first.claims, {
    agentAuthorityMeasured: false,
    environmentInspected: false,
    fileContentsIndexed: false,
    networkProbed: false,
    repositoryMutated: false,
  });

  const schema = JSON.parse(await readFile(SCHEMA_PATH, 'utf8'));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  assert.equal(validate(first), true, JSON.stringify(validate.errors));
});

test('bounded traversal is explicit and missing markers become unknown', async (context) => {
  const root = await temporaryRoot(context);
  await mkdir(path.join(root, 'a'));
  await writeFile(path.join(root, 'a/one.txt'), 'one');
  await writeFile(path.join(root, 'a/two.txt'), 'two');
  await writeFile(path.join(root, 'z.txt'), 'z');

  const report = await createBoundaryDiagnostic({
    repoRoot: root,
    limits: { maxEntries: 2 },
  });
  assert.equal(report.inventory.entriesObserved, 2);
  assert.equal(report.inventory.truncated, true);
  assert.equal(byId(report, 'repository.scan-completeness').status, 'unknown');
  assert.equal(byId(report, 'repository.instructions').status, 'unknown');
  assert.equal(byId(report, 'authority.publication-markers').status, 'unknown');
});

test('oversized structured manifest remains unknown and is never indexed', async (context) => {
  const root = await temporaryRoot(context);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    scripts: { test: 'secret command body that is never emitted' },
  }));
  const report = await createBoundaryDiagnostic({
    repoRoot: root,
    limits: { maxStructuredBytes: 8 },
  });
  assert.deepEqual(report.completionCandidates, []);
  assert.equal(byId(report, 'completion.package-script-candidates').status, 'unknown');
  assert.equal(canonicalJsonPretty(report).includes('secret command body'), false);
});

test('validator rejects favorable claims and contradictory projections', async (context) => {
  const root = await temporaryRoot(context);
  const report = await createBoundaryDiagnostic({ repoRoot: root });

  const authorityClaim = structuredClone(report);
  authorityClaim.claims.agentAuthorityMeasured = true;
  assert.throws(
    () => validateBoundaryDiagnostic(authorityClaim),
    /agentAuthorityMeasured must remain false/,
  );

  const favorablePosture = structuredClone(report);
  favorablePosture.posture.level = 'safe';
  assert.throws(
    () => validateBoundaryDiagnostic(favorablePosture),
    /posture overstates/,
  );

  const hiddenTruncation = structuredClone(report);
  hiddenTruncation.inventory.truncated = true;
  assert.throws(
    () => validateBoundaryDiagnostic(hiddenTruncation),
    /scan completeness contradicts/,
  );

  const absolutePath = structuredClone(report);
  const host = absolutePath.indicators.find((item) => item.id === 'host.process-execution');
  host.paths = ['/private/root'];
  assert.throws(
    () => validateBoundaryDiagnostic(absolutePath),
    /repository-relative/,
  );
});
