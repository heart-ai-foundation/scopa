#!/usr/bin/env node

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
  if (argv.length !== 2 || argv[0] !== '--corpus') {
    throw new TypeError('usage: --corpus fixtures/S11/CORPUS.json');
  }
  return { corpus: argv[1] };
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
  if (!['add', 'remove', 'replace'].includes(mutation.operation)) {
    throw new TypeError(`unsupported mutation operation: ${mutation.operation}`);
  }
  if (mutation.operation !== 'add' && !Object.hasOwn(parent, key)) {
    throw new TypeError(`mutation target does not exist: ${mutation.path}`);
  }
  if (mutation.operation === 'remove') {
    delete parent[key];
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

export function runProofParityCorpus(corpus) {
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

  return {
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
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const corpus = JSON.parse(await readFile(options.corpus, 'utf8'));
  const receipt = runProofParityCorpus(corpus);
  process.stdout.write(canonicalJsonPretty(receipt));
  if (!receipt.ok) process.exitCode = 1;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
