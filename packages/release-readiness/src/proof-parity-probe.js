#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  RELEASE_SCHEMAS,
} from './constants.js';
import {
  validatePublishedContract,
} from './published-contracts.js';
import {
  validateCandidateManifest,
  validateConsumerProof,
  validateReleasePosture,
} from './schema.js';

const TARGETS = Object.freeze({
  posture: Object.freeze({
    runtime: validateReleasePosture,
    schema: RELEASE_SCHEMAS.posture,
  }),
  candidate: Object.freeze({
    runtime: validateCandidateManifest,
    schema: RELEASE_SCHEMAS.candidateManifest,
  }),
  consumer: Object.freeze({
    runtime: validateConsumerProof,
    schema: RELEASE_SCHEMAS.consumerProof,
  }),
});

function parseArgs(argv) {
  const options = {};
  const allowed = new Set(['--corpus', '--manifest', '--candidate']);
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(flag) || value === undefined || options[flag]) {
      throw new TypeError(
        'usage: --corpus CORPUS.json [--manifest MANIFEST.json --candidate CANDIDATE.tgz]',
      );
    }
    options[flag] = value;
  }
  if (
    options['--corpus'] === undefined ||
    (
      (options['--manifest'] === undefined) !==
      (options['--candidate'] === undefined)
    )
  ) {
    throw new TypeError(
      'usage: --corpus CORPUS.json [--manifest MANIFEST.json --candidate CANDIDATE.tgz]',
    );
  }
  return {
    candidate: options['--candidate'] ?? null,
    corpus: options['--corpus'],
    manifest: options['--manifest'] ?? null,
  };
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const VALIDATOR_INPUTS = Object.freeze([
  {
    path: 'packages/release-readiness/src/candidate-path.js',
    url: new URL('./candidate-path.js', import.meta.url),
  },
  {
    path: 'packages/release-readiness/src/constants.js',
    url: new URL('./constants.js', import.meta.url),
  },
  {
    path: 'packages/release-readiness/src/published-contracts.js',
    url: new URL('./published-contracts.js', import.meta.url),
  },
  {
    path: 'packages/release-readiness/src/proof-parity-probe.js',
    url: new URL('./proof-parity-probe.js', import.meta.url),
  },
  {
    path: 'packages/release-readiness/src/schema.js',
    url: new URL('./schema.js', import.meta.url),
  },
  {
    path: 'schemas/scopa.candidate-manifest.v1.schema.json',
    url: new URL(
      '../../../schemas/scopa.candidate-manifest.v1.schema.json',
      import.meta.url,
    ),
  },
  {
    path: 'schemas/scopa.consumer-proof.v1.schema.json',
    url: new URL(
      '../../../schemas/scopa.consumer-proof.v1.schema.json',
      import.meta.url,
    ),
  },
  {
    path: 'schemas/scopa.release-posture.v1.schema.json',
    url: new URL(
      '../../../schemas/scopa.release-posture.v1.schema.json',
      import.meta.url,
    ),
  },
]);

async function createExactBinding({
  candidatePath,
  corpusBytes,
  manifestPath,
}) {
  const [candidateBytes, manifestBytes, validatorInputs] = await Promise.all([
    readFile(candidatePath),
    readFile(manifestPath),
    Promise.all(
      VALIDATOR_INPUTS.map(async ({ path: inputPath, url }) => ({
        path: inputPath,
        sha256: sha256(await readFile(url)),
      })),
    ),
  ]);
  const manifest = JSON.parse(manifestBytes);
  validateCandidateManifest(manifest);
  const candidateSha256 = sha256(candidateBytes);
  if (candidateSha256 !== manifest.package.sha256) {
    throw new TypeError('candidate bytes do not match the binding manifest');
  }
  return {
    sourceCommit: manifest.source.commit,
    candidateSha256,
    manifestSha256: sha256(manifestBytes),
    corpusSha256: sha256(corpusBytes),
    validatorInputs,
    validatorSetSha256: sha256(
      Buffer.from(JSON.stringify(validatorInputs), 'utf8'),
    ),
  };
}

function pointerParts(pointer) {
  if (!pointer.startsWith('/') || pointer === '/') {
    throw new TypeError(`mutation path must be a non-root JSON Pointer: ${pointer}`);
  }
  return pointer
    .slice(1)
    .split('/')
    .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function resolveParent(document, pointer) {
  const parts = pointerParts(pointer);
  const key = parts.pop();
  let parent = document;
  for (const part of parts) {
    if (
      parent === null ||
      typeof parent !== 'object' ||
      !Object.hasOwn(parent, part)
    ) {
      throw new TypeError(`mutation path does not exist: ${pointer}`);
    }
    parent = parent[part];
  }
  return { parent, key };
}

function applyMutation(document, mutation) {
  const { parent, key } = resolveParent(document, mutation.path);
  if (
    ![
      'add',
      'remove',
      'replace',
      'replace-repeat-string',
    ].includes(mutation.operation)
  ) {
    throw new TypeError(`unsupported mutation operation: ${mutation.operation}`);
  }
  if (mutation.operation !== 'add' && !Object.hasOwn(parent, key)) {
    throw new TypeError(`mutation target does not exist: ${mutation.path}`);
  }
  if (mutation.operation === 'remove') {
    delete parent[key];
    return;
  }
  if (mutation.operation === 'replace-repeat-string') {
    if (
      typeof mutation.value !== 'string' ||
      mutation.value.length === 0 ||
      !Number.isSafeInteger(mutation.count) ||
      mutation.count < 1 ||
      mutation.count > 65536
    ) {
      throw new TypeError('invalid repeated-string mutation');
    }
    parent[key] = mutation.value.repeat(mutation.count);
    return;
  }
  parent[key] = structuredClone(mutation.value);
}

function outcome(call) {
  try {
    call();
    return { accepted: true, error: null };
  } catch (error) {
    return {
      accepted: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function runProofParityCorpus(corpus, binding = null) {
  if (corpus?.schema !== 'scopa.proof-contract-corpus.v1') {
    throw new TypeError('unsupported proof-contract corpus schema');
  }
  if (
    corpus.bases === null ||
    typeof corpus.bases !== 'object' ||
    !Array.isArray(corpus.cases) ||
    corpus.cases.length === 0
  ) {
    throw new TypeError('proof-contract corpus requires bases and cases');
  }

  const seen = new Set();
  const cases = corpus.cases.map((entry) => {
    if (seen.has(entry.id)) {
      throw new TypeError(`duplicate proof-contract case id: ${entry.id}`);
    }
    seen.add(entry.id);

    const target = TARGETS[entry.target];
    if (!target || !['accept', 'reject'].includes(entry.expected)) {
      throw new TypeError(`invalid proof-contract case: ${entry.id}`);
    }
    if (!Object.hasOwn(corpus.bases, entry.target)) {
      throw new TypeError(`missing corpus base for target: ${entry.target}`);
    }

    const value = structuredClone(corpus.bases[entry.target]);
    for (const mutation of entry.mutations ?? []) {
      applyMutation(value, mutation);
    }

    const runtime = outcome(() => target.runtime(value));
    const published = outcome(
      () => validatePublishedContract(target.schema, value),
    );
    const expectedAccepted = entry.expected === 'accept';
    const agreed = runtime.accepted === published.accepted;
    const expectationMet =
      runtime.accepted === expectedAccepted &&
      published.accepted === expectedAccepted;

    return {
      id: entry.id,
      target: entry.target,
      expected: entry.expected,
      runtime,
      published,
      agreed,
      expectationMet,
    };
  });

  const receipt = {
    schema: 'scopa.proof-contract-parity-receipt.v1',
    corpusSchema: corpus.schema,
    caseCount: cases.length,
    acceptedCount: cases.filter(({ expected }) => expected === 'accept').length,
    rejectedCount: cases.filter(({ expected }) => expected === 'reject').length,
    validatorsAgree: cases.every(({ agreed }) => agreed),
    expectationsMet: cases.every(({ expectationMet }) => expectationMet),
    ok: cases.every(({ agreed, expectationMet }) => agreed && expectationMet),
    cases,
  };
  if (binding !== null) receipt.binding = structuredClone(binding);
  return receipt;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const corpusBytes = await readFile(options.corpus);
  const corpus = JSON.parse(corpusBytes);
  const binding = options.manifest === null
    ? null
    : await createExactBinding({
      candidatePath: options.candidate,
      corpusBytes,
      manifestPath: options.manifest,
    });
  const receipt = runProofParityCorpus(corpus, binding);
  process.stdout.write(canonicalJsonPretty(receipt));
  if (!receipt.ok) process.exitCode = 1;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
