#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';
import { loadSliceLock } from '../../enforcement/src/index.js';
import { createReferenceAgentHost } from './reference-host.js';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function failure(error) {
  return {
    ok: false,
    error: {
      code: error?.code ?? 'SCOPA_HOST_ERROR',
      message: error?.message ?? String(error),
      details: error?.details ?? null,
    },
  };
}

async function main() {
  const [repoRootArgument, lockPathArgument, requestArgument] =
    process.argv.slice(2);
  if (!repoRootArgument || !lockPathArgument) {
    throw new Error('usage: scopa-agent-host <repo-root> <slice-lock>');
  }
  const repoRoot = path.resolve(repoRootArgument);
  const lockPath = path.resolve(lockPathArgument);
  const lock = await loadSliceLock(lockPath);
  const host = createReferenceAgentHost({ repoRoot, lock });
  const request = JSON.parse(requestArgument ?? await readStdin());
  try {
    const result = await host.invoke(request);
    process.stdout.write(`${JSON.stringify({ ok: true, result })}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify(failure(error))}\n`);
    process.exitCode = 3;
  }
}

main().catch((error) => {
  process.stdout.write(`${JSON.stringify(failure(error))}\n`);
  process.exitCode = 2;
});
