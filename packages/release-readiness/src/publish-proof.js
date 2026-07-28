#!/usr/bin/env node

import {
  createHash,
} from 'node:crypto';
import {
  readFile,
  writeFile,
} from 'node:fs/promises';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  RELEASE_SCHEMAS,
} from './constants.js';
import {
  validateConsumerProof,
} from './schema.js';

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!['--input', '--output'].includes(flag) || value === undefined) {
      throw new TypeError('usage: --input RAW.json --output PUBLIC.json');
    }
    values[flag.slice(2)] = value;
  }
  if (!values.input || !values.output) {
    throw new TypeError('usage: --input RAW.json --output PUBLIC.json');
  }
  return values;
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

const REDACTIONS = Object.freeze([
  Object.freeze({
    field: '/environment/sourceRoot',
    key: 'sourceRoot',
    replacement: '[SCOPA_SOURCE_ROOT]',
  }),
  Object.freeze({
    field: '/environment/temporaryRoot',
    key: 'temporaryRoot',
    replacement: '[SCOPA_CONSUMER_TEMP_ROOT]',
  }),
]);

function visitStrings(value, pointer = '', entries = []) {
  if (typeof value === 'string') {
    entries.push({ pointer: pointer || '/', value });
    return entries;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      visitStrings(item, `${pointer}/${index}`, entries);
    });
    return entries;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      const escaped = key.replaceAll('~', '~0').replaceAll('/', '~1');
      visitStrings(item, `${pointer}/${escaped}`, entries);
    }
  }
  return entries;
}

function failOnPublicationCollision(raw) {
  const designated = new Set(REDACTIONS.map(({ field }) => field));
  const entries = visitStrings(raw);
  const reserved = REDACTIONS.map(({ replacement }) => replacement);

  for (const { pointer, value } of entries) {
    if (reserved.some((placeholder) => value.includes(placeholder))) {
      throw new TypeError(
        `public proof contains a reserved redaction placeholder at ${pointer}`,
      );
    }
  }

  for (const { field, key } of REDACTIONS) {
    const source = raw.environment[key];
    for (const entry of entries) {
      if (!designated.has(entry.pointer) && entry.value.includes(source)) {
        throw new TypeError(
          `private-root semantic collision outside designated field ${field}`,
        );
      }
    }
  }
}

export function consumerProofSemanticProjection(value) {
  const projection = structuredClone(value);
  delete projection.environment.sourceRoot;
  delete projection.environment.temporaryRoot;
  return projection;
}

export function consumerProofSemanticFieldsChanged(before, after) {
  return canonicalJsonPretty(consumerProofSemanticProjection(before)) !==
    canonicalJsonPretty(consumerProofSemanticProjection(after));
}

export function createPublicConsumerProof(rawText) {
  const raw = validateConsumerProof(JSON.parse(rawText));
  failOnPublicationCollision(raw);

  const candidate = structuredClone(raw);
  for (const { key, replacement } of REDACTIONS) {
    candidate.environment[key] = replacement;
  }
  const proof = validateConsumerProof(candidate);
  const semanticFieldsChanged = consumerProofSemanticFieldsChanged(raw, proof);
  if (semanticFieldsChanged) {
    throw new TypeError('public proof transformation changed semantic fields');
  }

  return {
    proof,
    receipt: {
      schema: RELEASE_SCHEMAS.publicationReceipt,
      sourceSha256: sha256(rawText),
      redactions: REDACTIONS.map(({ field, key, replacement }) => ({
        field,
        replacement,
        occurrences: Number(raw.environment[key] !== proof.environment[key]),
      })),
      semanticFieldsChanged,
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rawText = await readFile(options.input, 'utf8');
  const publication = createPublicConsumerProof(rawText);
  await writeFile(options.output, canonicalJsonPretty(publication));
  process.stdout.write(canonicalJsonPretty({
    output: options.output,
    outputSha256: sha256(canonicalJsonPretty(publication)),
    ...publication.receipt,
  }));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
