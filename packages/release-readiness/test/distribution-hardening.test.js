import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  fileURLToPath,
} from 'node:url';
import {
  createConsumerPackageJson,
  installedPrivacyForbiddenValues,
  scanPrivateText,
} from '../src/index.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);
const SOURCE_PACKAGE = JSON.parse(
  await readFile(path.join(ROOT, 'package.json'), 'utf8'),
);

test('consumer metadata retains runtime contract and strips contributor surface', () => {
  const consumerPackage = createConsumerPackageJson(SOURCE_PACKAGE);
  assert.equal(consumerPackage.name, SOURCE_PACKAGE.name);
  assert.equal(consumerPackage.version, SOURCE_PACKAGE.version);
  assert.deepEqual(consumerPackage.bin, SOURCE_PACKAGE.bin);
  assert.deepEqual(consumerPackage.exports, SOURCE_PACKAGE.exports);
  assert.deepEqual(consumerPackage.dependencies, SOURCE_PACKAGE.dependencies);
  assert.deepEqual(consumerPackage.engines, SOURCE_PACKAGE.engines);
  assert.deepEqual(consumerPackage.files, SOURCE_PACKAGE.files);
  assert.equal(Object.hasOwn(consumerPackage, 'scripts'), false);
  assert.equal(Object.hasOwn(consumerPackage, 'devDependencies'), false);
});

test('privacy scanner detects structural paths and recognizable credentials', () => {
  assert.deepEqual(
    scanPrivateText('builder residue /home/example/private/project'),
    ['absolute-user-home'],
  );
  assert.deepEqual(
    scanPrivateText('token ghp_abcdefghijklmnopqrstuvwxyz123456'),
    ['recognizable-credential'],
  );
  assert.deepEqual(
    scanPrivateText('ordinary public documentation'),
    [],
  );
});

test('installed privacy roots never reduce a project name to a secret token', () => {
  const roots = installedPrivacyForbiddenValues(
    '/home/runner/work/scopa/scopa',
  );
  assert.deepEqual(roots, [
    '/home/runner/work/scopa/scopa',
    '/home/runner/work/scopa',
  ]);
  assert.equal(roots.includes('scopa'), false);
});
