#!/usr/bin/env node

import {
  createHash,
} from 'node:crypto';
import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJson,
} from '../../../enforcement/src/index.js';

function options(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!['--input', '--output'].includes(flag) || !value) {
      throw new Error(
        'usage: publish-proof.js --input <raw-json> --output <public-json>',
      );
    }
    result[flag.slice(2)] = path.resolve(value);
  }
  if (!result.input || !result.output) {
    throw new Error(
      'usage: publish-proof.js --input <raw-json> --output <public-json>',
    );
  }
  return result;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function semanticProjection(proof) {
  return {
    schema: proof.schema,
    package: proof.package,
    capabilityMatrix: proof.capabilityMatrix,
    scenarios: Object.fromEntries(
      Object.entries(proof.scenarios).map(([name, scenario]) => [
        name,
        {
          final: scenario.normalized.final,
          terminal: scenario.normalized.scopaTranscript.terminal,
          toolCalls: scenario.normalized.toolCalls.map((call) => ({
            tool: call.tool,
            input: call.input,
            result: call.result,
            status: call.status,
            isError: call.isError,
          })),
        },
      ]),
    ),
    summary: proof.summary,
  };
}

const selected = options(process.argv.slice(2));
const rawText = await readFile(selected.input, 'utf8');
const rawProof = JSON.parse(rawText);
if (rawProof.schema !== 'scopa.codex-live-proof.v1') {
  throw new Error('input is not a SCOPA Codex live proof');
}
const liveRoots = [
  ...new Set(rawText.match(/\/tmp\/scopa-codex-live-[A-Za-z0-9]+/g) ?? []),
].sort();
const controlRoots = [
  ...new Set(rawText.match(/\/tmp\/scopa-codex-control-[A-Za-z0-9]+/g) ?? []),
].sort();
if (liveRoots.length !== 1 || controlRoots.length !== 4) {
  throw new Error(
    `unexpected proof roots: live=${liveRoots.length} control=${controlRoots.length}`,
  );
}
let publicText = rawText.replaceAll(
  liveRoots[0],
  '<SCOPA_CODEX_LIVE_ROOT>',
);
for (const [index, root] of controlRoots.entries()) {
  publicText = publicText.replaceAll(
    root,
    `<SCOPA_CODEX_CONTROL_ROOT_${index + 1}>`,
  );
}
const publicProof = JSON.parse(publicText);
const semanticFieldsChanged =
  canonicalJson(semanticProjection(rawProof)) !==
  canonicalJson(semanticProjection(publicProof));
if (semanticFieldsChanged) {
  throw new Error('publication redaction changed semantic proof fields');
}
publicProof.publicationReceipt = {
  schema: 'scopa.proof-publication-receipt.v1',
  sourceSha256: sha256(rawText),
  redactions: [
    {
      kind: 'temporary-live-root',
      count: liveRoots.length,
      replacement: '<SCOPA_CODEX_LIVE_ROOT>',
    },
    {
      kind: 'temporary-control-root',
      count: controlRoots.length,
      replacementPattern: '<SCOPA_CODEX_CONTROL_ROOT_N>',
    },
  ],
  semanticFieldsChanged,
};
await mkdir(path.dirname(selected.output), { recursive: true });
await writeFile(
  selected.output,
  `${JSON.stringify(publicProof, null, 2)}\n`,
  { mode: 0o600 },
);
process.stdout.write(`${JSON.stringify(publicProof.publicationReceipt)}\n`);
