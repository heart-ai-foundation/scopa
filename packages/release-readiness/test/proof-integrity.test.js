import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CONSUMER_NON_CLAIMS,
  CONSUMER_VERIFIED_CLAIMS,
  consumerProofSemanticFieldsChanged,
  createPublicConsumerProof,
  runProofParityCorpus,
  validateConsumerProof,
} from '../src/index.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);
const CORPUS_PATH = path.join(
  ROOT,
  'packages/release-readiness/src/proof-contract-corpus.json',
);
const CORPUS = JSON.parse(await readFile(CORPUS_PATH, 'utf8'));
const PACKAGE = JSON.parse(
  await readFile(path.join(ROOT, 'package.json'), 'utf8'),
);

function proof() {
  return structuredClone(CORPUS.bases.consumer);
}

function rawProof(value = proof()) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

test('runtime and published contracts agree over the hostile S11 corpus', () => {
  const binding = {
    sourceCommit: 'a'.repeat(40),
    candidateSha256: 'b'.repeat(64),
  };
  const receipt = runProofParityCorpus(CORPUS, binding);
  assert.equal(receipt.caseCount, CORPUS.cases.length);
  assert.equal(receipt.validatorsAgree, true);
  assert.equal(receipt.expectationsMet, true);
  assert.equal(receipt.ok, true);
  assert.deepEqual(receipt.binding, binding);
  assert.equal(
    receipt.cases.every((entry) => (
      entry.runtime.accepted === entry.published.accepted
    )),
    true,
  );
});

test('the installed package carries the parity probe corpus and validator dependency', () => {
  assert.equal(PACKAGE.files.includes('packages/*/src/**'), true);
  assert.equal(PACKAGE.dependencies.ajv, '8.20.0');
  assert.equal(
    PACKAGE.scripts['probe:s11:parity'].includes(
      'packages/release-readiness/src/proof-contract-corpus.json',
    ),
    true,
  );
});

test('RR-01 empty, duplicate, and zero states now fail closed', () => {
  const mutations = [
    (value) => {
      value.adapter.toolNames = [];
    },
    (value) => {
      value.adapter.toolNames = ['scopa_check', 'scopa_check'];
    },
    (value) => {
      value.claimBoundary.verified = [];
    },
    (value) => {
      value.candidate.package.packedBytes = 0;
    },
  ];

  for (const mutate of mutations) {
    const value = proof();
    mutate(value);
    assert.throws(() => validateConsumerProof(value), /contract violation/);
  }
});

test('consumer proof v1 rejects semantic adapter and claim drift', () => {
  const mutations = [
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

  for (const mutate of mutations) {
    const value = proof();
    mutate(value);
    assert.throws(() => validateConsumerProof(value), /contract violation/);
  }

  assert.deepEqual(proof().claimBoundary.verified, CONSUMER_VERIFIED_CLAIMS);
  assert.deepEqual(proof().claimBoundary.nonClaims, CONSUMER_NON_CLAIMS);
});

test('public proof changes only designated roots and binds raw bytes', () => {
  const raw = rawProof();
  const publication = createPublicConsumerProof(raw);

  assert.equal(
    publication.proof.environment.sourceRoot,
    '[SCOPA_SOURCE_ROOT]',
  );
  assert.equal(
    publication.proof.environment.temporaryRoot,
    '[SCOPA_CONSUMER_TEMP_ROOT]',
  );
  assert.equal(publication.proof.adapter.assurance, 'full');
  assert.equal(publication.receipt.semanticFieldsChanged, false);
  assert.deepEqual(
    publication.receipt.redactions.map(({ field }) => field),
    ['/environment/sourceRoot', '/environment/temporaryRoot'],
  );
  assert.equal(
    publication.receipt.sourceSha256,
    createHash('sha256').update(raw).digest('hex'),
  );
  assert.deepEqual(
    createPublicConsumerProof(raw),
    publication,
  );
});

test('RR-02 semantic collisions fail instead of altering assurance or claims', () => {
  const assuranceCollision = proof();
  assuranceCollision.environment.sourceRoot =
    assuranceCollision.adapter.assurance;
  assert.throws(
    () => createPublicConsumerProof(rawProof(assuranceCollision)),
    /semantic collision/,
  );

  const substringCollision = proof();
  substringCollision.environment.sourceRoot = 'source';
  assert.throws(
    () => createPublicConsumerProof(rawProof(substringCollision)),
    /semantic collision/,
  );
});

test('reserved placeholder injection fails closed', () => {
  const value = proof();
  value.claimBoundary.nonClaims = ['[SCOPA_SOURCE_ROOT] injection'];
  assert.throws(
    () => createPublicConsumerProof(rawProof(value)),
    /contract violation|reserved redaction placeholder/,
  );
});

test('overlapping and equal private roots are safe under field-only redaction', () => {
  const overlapping = proof();
  overlapping.environment.sourceRoot = '/private';
  overlapping.environment.temporaryRoot = '/private/consumer';
  const overlapPublication = createPublicConsumerProof(rawProof(overlapping));
  assert.equal(
    JSON.stringify(overlapPublication.proof).includes('/private'),
    false,
  );

  const equal = proof();
  equal.environment.sourceRoot = '/one/private/root';
  equal.environment.temporaryRoot = '/one/private/root';
  const equalPublication = createPublicConsumerProof(rawProof(equal));
  assert.equal(
    JSON.stringify(equalPublication.proof).includes('/one/private/root'),
    false,
  );
});

test('semantic change is computed from an explicit projection', () => {
  const before = proof();
  const rootsOnly = structuredClone(before);
  rootsOnly.environment.sourceRoot = '[SCOPA_SOURCE_ROOT]';
  rootsOnly.environment.temporaryRoot = '[SCOPA_CONSUMER_TEMP_ROOT]';
  assert.equal(
    consumerProofSemanticFieldsChanged(before, rootsOnly),
    false,
  );

  const altered = structuredClone(rootsOnly);
  altered.adapter.assurance = 'partial';
  assert.equal(
    consumerProofSemanticFieldsChanged(before, altered),
    true,
  );
});
