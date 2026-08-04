import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { verifyReleaseAsset } from './verify-release-asset.mjs';

const execFileAsync = promisify(execFile);

function metadata(overrides = {}) {
  return {
    name: '@heart-ai-foundation/scopa',
    version: '0.3.0',
    private: false,
    publishConfig: { access: 'public', tag: 'latest' },
    repository: {
      type: 'git',
      url: 'https://github.com/heart-ai-foundation/scopa.git',
    },
    scripts: { test: 'node --test' },
    ...overrides,
  };
}

async function fixture(t, packageJson = metadata()) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-oidc-asset-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const packageRoot = path.join(root, 'package');
  await mkdir(packageRoot);
  await writeFile(
    path.join(packageRoot, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
  const archive = path.join(root, 'heart-ai-foundation-scopa-0.3.0.tgz');
  await execFileAsync('tar', ['-czf', archive, '-C', root, 'package']);
  const sha256 = createHash('sha256').update(await readFile(archive)).digest('hex');
  const checksum = path.join(root, 'SHA256SUMS');
  await writeFile(checksum, `${sha256}  ${path.basename(archive)}\n`);
  const sourcePackage = path.join(root, 'source-package.json');
  await writeFile(sourcePackage, `${JSON.stringify(packageJson, null, 2)}\n`);
  return { archive, checksum, sourcePackage, sha256 };
}

test('accepts an exact stable public release asset', async (t) => {
  const files = await fixture(t);
  const result = await verifyReleaseAsset({
    ...files,
    tag: 'v0.3.0',
    expectedSha256: files.sha256,
  });
  assert.equal(result.ok, true);
  assert.equal(result.version, '0.3.0');
  assert.equal(result.sha256, files.sha256);
  assert.match(result.integrity, /^sha512-/);
});

test('rejects a checksum that is not bound to the exact archive', async (t) => {
  const files = await fixture(t);
  await writeFile(files.checksum, `${'0'.repeat(64)}  ignored.tgz\n`);
  await assert.rejects(
    verifyReleaseAsset({
      ...files,
      tag: 'v0.3.0',
      expectedSha256: files.sha256,
    }),
    /SHA256SUMS is not the exact single-file checksum contract/,
  );
});

test('rejects lifecycle code in the release archive', async (t) => {
  const files = await fixture(t, metadata({
    scripts: { prepublishOnly: 'node unexpected.js' },
  }));
  await assert.rejects(
    verifyReleaseAsset({
      ...files,
      tag: 'v0.3.0',
      expectedSha256: files.sha256,
    }),
    /archive contains lifecycle scripts: prepublishOnly/,
  );
});

test('rejects a release-source identity that differs from the archive', async (t) => {
  const files = await fixture(t);
  const source = JSON.parse(await readFile(files.sourcePackage, 'utf8'));
  source.repository.url = 'https://github.com/example/fork.git';
  await writeFile(files.sourcePackage, `${JSON.stringify(source, null, 2)}\n`);
  await assert.rejects(
    verifyReleaseAsset({
      ...files,
      tag: 'v0.3.0',
      expectedSha256: files.sha256,
    }),
    /release source repository identity differs/,
  );
});
