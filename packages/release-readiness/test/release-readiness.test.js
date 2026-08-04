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
  fileURLToPath,
} from 'node:url';
import {
  CONSUMER_NON_CLAIMS,
  CONSUMER_VERIFIED_CLAIMS,
  RELEASE_SCHEMAS,
  auditReleasePolicies,
  createPublicConsumerProof,
  findMissingPackedDocumentationReferences,
  findUnqualifiedPackedNpmScriptDocuments,
  validateCandidateManifest,
  validateConsumerProof,
  validatePolicyAudit,
  validateReleasePosture,
} from '../src/index.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);
const PACKAGE = JSON.parse(
  await readFile(path.join(ROOT, 'package.json'), 'utf8'),
);

function releasePosture() {
  return {
    schema: RELEASE_SCHEMAS.posture,
    project: 'SCOPA',
    publisher: 'Heart AI Foundation',
    version: '0.2.0',
    license: 'Apache-2.0',
    contributions: {
      model: 'DCO-1.1',
      requiresSignoff: true,
      claRequired: false,
    },
    naming: {
      package: '@heart-ai-foundation/scopa',
      bins: {
        scopa: './packages/cli/src/cli.js',
        'scopa-mcp': './packages/adapter-host/src/cli.js',
      },
      trademarkStatus: 'working-name-no-registration-claim',
    },
    publication: {
      repositoryVisibility: 'public',
      artifactChannel: 'npm-and-github-release',
      npm: true,
      githubRelease: true,
      publicRelease: true,
      production: false,
      requiresSeparatePrincipalApproval: true,
    },
    freeToolBoundary: {
      verificationPaidDependency: false,
      consultationBoundary: [
        'profile design',
        'governance installation',
      ],
    },
  };
}

function candidateManifest() {
  return {
    schema: RELEASE_SCHEMAS.candidateManifest,
    source: {
      commit: 'a'.repeat(40),
      dirty: false,
    },
    package: {
      name: '@heart-ai-foundation/scopa',
      version: '0.2.0',
      filename: 'heart-ai-foundation-scopa-0.2.0.tgz',
      entryCount: 1,
      packedBytes: 1,
      unpackedBytes: 1,
      shasum: 'b'.repeat(40),
      integrity: `sha512-${Buffer.alloc(64).toString('base64')}`,
      sha256: 'c'.repeat(64),
    },
    files: [
      {
        path: 'README.md',
        size: 1,
        mode: 420,
      },
    ],
  };
}

function consumerProof() {
  return {
    schema: RELEASE_SCHEMAS.consumerProof,
    candidate: candidateManifest(),
    policyAudit: {
      ok: true,
      sha256: 'd'.repeat(64),
    },
    environment: {
      node: 'v22.0.0',
      npm: '10.0.0',
      sourceRoot: '/private/source',
      temporaryRoot: '/private/consumer',
    },
    install: {
      exitCode: 0,
      sourceFree: true,
      monorepoRelativeReferences: [],
    },
    adapter: {
      schema: 'scopa.consumer-adapter-result.v1',
      toolNames: [
        'scopa_assurance',
        'scopa_check',
        'scopa_orientation',
        'scopa_read_file',
        'scopa_transcript',
        'scopa_write_file',
      ],
      allowedWrite: true,
      scopeDenied: true,
      terminal: {
        status: 'satisfied',
        canStop: true,
      },
      assurance: 'full',
    },
    verification: {
      exitCode: 0,
      nativePacket: true,
      ok: true,
    },
    knownFailing: {
      exitCode: 4,
      code: 'SCOPA_COMPLETION_BLOCKED',
      canStop: false,
    },
    claimBoundary: {
      verified: [...CONSUMER_VERIFIED_CLAIMS],
      nonClaims: [...CONSUMER_NON_CLAIMS],
    },
  };
}

test('root package carries the approved public stable identity', () => {
  assert.equal(PACKAGE.name, '@heart-ai-foundation/scopa');
  assert.equal(PACKAGE.version, '0.2.0');
  assert.equal(PACKAGE.private, false);
  assert.deepEqual(PACKAGE.publishConfig, { access: 'public', tag: 'latest' });
  assert.equal(PACKAGE.license, 'Apache-2.0');
  assert.equal(
    PACKAGE.exports['./release-readiness'],
    './packages/release-readiness/src/index.js',
  );
});

test('release posture fixes the public channels and rejects drift', () => {
  assert.deepEqual(validateReleasePosture(releasePosture()), releasePosture());
  const unknown = releasePosture();
  unknown.extra = true;
  assert.throws(
    () => validateReleasePosture(unknown),
    /contract violation/,
  );
  const publicRelease = releasePosture();
  publicRelease.publication.npm = false;
  assert.throws(
    () => validateReleasePosture(publicRelease),
    /contract violation/,
  );
});

test('candidate manifest is closed, sorted, normalized, and identity-bound', () => {
  assert.deepEqual(
    validateCandidateManifest(candidateManifest()),
    candidateManifest(),
  );
  const escaped = candidateManifest();
  escaped.files[0].path = '../README.md';
  assert.throws(
    () => validateCandidateManifest(escaped),
    /contract violation/,
  );
  const wrong = candidateManifest();
  wrong.package.version = '0.2.1';
  assert.throws(
    () => validateCandidateManifest(wrong),
    /contract violation/,
  );
  for (const nonCanonical of [
    './README.md',
    'docs/./README.md',
    'docs//README.md',
    'docs/README.md/',
    'docs\\README.md',
    'bad\u0000name',
    'bad\nname',
    'bad\rname',
    'bad\tname',
    'bad\u007fname',
  ]) {
    const aliased = candidateManifest();
    aliased.files[0].path = nonCanonical;
    assert.throws(
      () => validateCandidateManifest(aliased),
      /contract violation/,
    );
  }
  const oversizedAscii = candidateManifest();
  oversizedAscii.files[0].path = 'a'.repeat(4097);
  assert.throws(
    () => validateCandidateManifest(oversizedAscii),
    /contract violation/,
  );
  const oversizedUtf8 = candidateManifest();
  oversizedUtf8.files[0].path = 'é'.repeat(2049);
  assert.throws(
    () => validateCandidateManifest(oversizedUtf8),
    /contract violation/,
  );
  for (const invalidMode of [0, 512, Number.MAX_SAFE_INTEGER]) {
    const invalid = candidateManifest();
    invalid.files[0].mode = invalidMode;
    assert.throws(
      () => validateCandidateManifest(invalid),
      /contract violation/,
    );
  }
});

test('candidate documentation cannot reference absent packed files', () => {
  const packedPaths = [
    'README.md',
    'docs/CLAIMS.md',
    'packages/cli/README.md',
    'packages/cli/src/cli.js',
  ];
  assert.deepEqual(
    findMissingPackedDocumentationReferences({
      documents: [
        {
          path: 'README.md',
          text:
            'Read `docs/CLAIMS.md`, `packages/cli/README.md`, and ' +
            '`packages/*/src/**`; external references include ' +
            'https://example.test/docs/external.md and ' +
            'ssh://example.test/repository/docs/external.md plus ' +
            'mailto:user@example.test/docs/external.md.',
        },
      ],
      packedPaths,
    }),
    [],
  );
  assert.deepEqual(
    findMissingPackedDocumentationReferences({
      documents: [
        {
          path: 'docs/ARCHITECTURE.md',
          text: 'Read [claims](CLAIMS.md).',
        },
      ],
      packedPaths,
    }),
    [],
  );
  assert.deepEqual(
    findMissingPackedDocumentationReferences({
      documents: [
        {
          path: 'README.md',
          text: 'Read `spec/missing.md`.',
        },
      ],
      packedPaths,
    }),
    [
      {
        document: 'README.md',
        reference: 'spec/missing.md',
      },
    ],
  );
  assert.deepEqual(
    findMissingPackedDocumentationReferences({
      documents: [
        {
          path: 'README.md',
          text: 'Review `Z*.md` before proceeding.',
        },
      ],
      packedPaths,
    }),
    [
      {
        document: 'README.md',
        reference: 'Z*.md',
      },
    ],
  );
  assert.deepEqual(
    findMissingPackedDocumentationReferences({
      documents: [
        {
          path: 'README.md',
          text:
            'Read `CHANGELOG.md` and `spec/definitely-absent*.md`.',
        },
      ],
      packedPaths,
    }),
    [
      {
        document: 'README.md',
        reference: 'CHANGELOG.md',
      },
      {
        document: 'README.md',
        reference: 'spec/definitely-absent*.md',
      },
    ],
  );
});

test('packed npm contributor commands require source-checkout qualification', () => {
  assert.deepEqual(
    findUnqualifiedPackedNpmScriptDocuments([
      {
        path: 'README.md',
        text:
          'From a source checkout, run `npm test` and ' +
          '`npm run protocol:check`.',
      },
      {
        path: 'docs/CLAIMS.md',
        text: 'Installed consumers use the exported verifier.',
      },
    ]),
    [],
  );
  assert.deepEqual(
    findUnqualifiedPackedNpmScriptDocuments([
      {
        path: 'packages/example/README.md',
        text: 'Run `npm run source-only`.',
      },
    ]),
    ['packages/example/README.md'],
  );
  assert.deepEqual(
    findUnqualifiedPackedNpmScriptDocuments([
      {
        path: 'packages/example/README.md',
        text:
          'A source checkout may exist. ' +
          'Installed\nusers should run `npm run absent-script`.',
      },
    ]),
    ['packages/example/README.md'],
  );
});

test('policy audit cannot claim green over a failed constituent check', () => {
  const report = {
    schema: RELEASE_SCHEMAS.policyAudit,
    ok: true,
    checks: [
      {
        id: 'fixture',
        passed: false,
        evidence: 'fixture failed',
      },
    ],
  };
  assert.throws(
    () => validatePolicyAudit(report),
    /policy audit aggregate/,
  );
});

test('consumer proof is closed and refuses false-green or sourceful installs', () => {
  assert.deepEqual(validateConsumerProof(consumerProof()), consumerProof());
  const falseGreen = consumerProof();
  falseGreen.knownFailing.canStop = true;
  assert.throws(
    () => validateConsumerProof(falseGreen),
    /contract violation/,
  );
  const sourceful = consumerProof();
  sourceful.install.sourceFree = false;
  assert.throws(
    () => validateConsumerProof(sourceful),
    /contract violation/,
  );
  const semanticDrifts = [
    (value) => {
      value.adapter.schema = 'unrelated.nonempty.schema';
    },
    (value) => {
      value.adapter.toolNames = ['unrelated_tool'];
    },
    (value) => {
      value.adapter.assurance = 'unrelated-nonempty-level';
    },
    (value) => {
      value.claimBoundary.verified = ['arbitrary assertion'];
    },
    (value) => {
      value.claimBoundary.nonClaims = ['arbitrary boundary'];
    },
  ];
  for (const mutate of semanticDrifts) {
    const drifted = consumerProof();
    mutate(drifted);
    assert.throws(
      () => validateConsumerProof(drifted),
      /contract violation/,
    );
  }
});

test('public proof replaces private roots and binds the exact raw bytes', () => {
  const rawText = `${JSON.stringify(consumerProof(), null, 2)}\n`;
  const publication = createPublicConsumerProof(rawText);
  assert.equal(
    JSON.stringify(publication).includes('/private/source'),
    false,
  );
  assert.equal(
    JSON.stringify(publication).includes('/private/consumer'),
    false,
  );
  assert.equal(publication.receipt.semanticFieldsChanged, false);
  assert.equal(publication.receipt.redactions.length, 2);
  assert.equal(publication.receipt.sourceSha256.length, 64);
});

test('repository release policies form one passing closed audit', async () => {
  const report = await auditReleasePolicies({ root: ROOT });
  assert.equal(
    report.ok,
    true,
    report.checks
      .filter((check) => !check.passed)
      .map((check) => `${check.id}: ${check.evidence}`)
      .join('\n'),
  );
  assert.equal(
    new Set(report.checks.map((check) => check.id)).size,
    report.checks.length,
  );
});
