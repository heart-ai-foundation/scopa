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

function replaceStrings(value, replacements) {
  if (typeof value === 'string') {
    let result = value;
    for (const [source, replacement] of replacements) {
      if (source) result = result.split(source).join(replacement);
    }
    return result;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceStrings(item, replacements));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceStrings(item, replacements),
      ]),
    );
  }
  return value;
}

export function createPublicConsumerProof(rawText) {
  const raw = validateConsumerProof(JSON.parse(rawText));
  const replacements = [
    [raw.environment.temporaryRoot, '[SCOPA_CONSUMER_TEMP_ROOT]'],
    [raw.environment.sourceRoot, '[SCOPA_SOURCE_ROOT]'],
  ].sort((left, right) => right[0].length - left[0].length);
  const proof = validateConsumerProof(replaceStrings(raw, replacements));
  return {
    proof,
    receipt: {
      schema: RELEASE_SCHEMAS.publicationReceipt,
      sourceSha256: sha256(rawText),
      redactions: replacements.map(([source, replacement]) => ({
        replacement,
        occurrences: rawText.split(source).length - 1,
      })),
      semanticFieldsChanged: false,
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
