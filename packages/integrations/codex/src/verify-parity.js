#!/usr/bin/env node

import {
  readFile,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';
import {
  assertAgentParity,
  compareAgentProofs,
} from './parity.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../../..', import.meta.url)),
);

function options(argv) {
  const result = {
    claude: path.join(ROOT, 'evidence/S8/claude-live-proof.public.json'),
    codex: path.join(ROOT, 'evidence/S9/codex-live-proof.public.json'),
    output: null,
  };
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!['--claude', '--codex', '--output'].includes(flag) || !value) {
      throw new Error(
        'usage: verify-parity.js [--claude <json>] [--codex <json>] [--output <json>]',
      );
    }
    result[flag.slice(2)] = path.resolve(value);
  }
  return result;
}

const selected = options(process.argv.slice(2));
const report = assertAgentParity(compareAgentProofs({
  claudeProof: JSON.parse(await readFile(selected.claude, 'utf8')),
  codexProof: JSON.parse(await readFile(selected.codex, 'utf8')),
  sources: {
    claude: path.relative(ROOT, selected.claude),
    codex: path.relative(ROOT, selected.codex),
  },
}));
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (selected.output) {
  await writeFile(selected.output, serialized, { mode: 0o600 });
}
process.stdout.write(serialized);
