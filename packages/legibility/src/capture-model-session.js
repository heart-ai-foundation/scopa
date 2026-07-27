#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalModelSessionReceipt } from './model-session-receipt.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PLAN_PATH = path.join(ROOT, 'runs/S3/2026-07-26-model-agent-plan.json');
const TRANSCRIPT_PATH = path.join(
  ROOT,
  'runs/S3/2026-07-26-model-session.jsonl',
);
const RECEIPT_PATH = path.join(
  ROOT,
  'runs/S3/2026-07-26-model-session-receipt.json',
);
const SCHEMA_PATH = path.join(
  ROOT,
  'fixtures/S3/coding-agent-plan.schema.json',
);
const MODEL = 'gpt-5.6-terra';
const PROMPT =
  'You are the model component of a coding-agent integration test for SCOPA observe mode. Return only one valid plan matching the supplied schema. Choose a sensible read of workspace/source.txt and a write to workspace/agent-output.txt. Use unique event IDs, conventional tool names, and concise original content that reflects the source sentence. Do not perform tools yourself; the trusted host will execute your proposed calls.';

async function run() {
  const child = spawn(
    'codex',
    [
      'exec',
      '--json',
      '--ephemeral',
      '--ignore-user-config',
      '-s',
      'read-only',
      '-m',
      MODEL,
      '-C',
      ROOT,
      '--output-schema',
      SCHEMA_PATH,
      '-o',
      PLAN_PATH,
      PROMPT,
    ],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const stdout = [];
  const stderr = [];
  child.stdout.on('data', (chunk) => stdout.push(chunk));
  child.stderr.on('data', (chunk) => stderr.push(chunk));
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  const transcript = Buffer.concat(stdout).toString('utf8');
  const diagnostics = Buffer.concat(stderr).toString('utf8');
  if (exitCode !== 0) {
    throw new Error(`Codex exited ${exitCode}: ${diagnostics || transcript}`);
  }
  await writeFile(TRANSCRIPT_PATH, transcript);
  const [outputSchema, plan] = await Promise.all([
    readFile(SCHEMA_PATH, 'utf8'),
    readFile(PLAN_PATH, 'utf8'),
  ]);
  const receipt = createLocalModelSessionReceipt({
    capturedAt: new Date().toISOString(),
    clientVersion: execFileSync('codex', ['--version'], {
      encoding: 'utf8',
    }).trim(),
    outputSchema,
    plan,
    prompt: PROMPT,
    requestedModel: MODEL,
    transcript,
  });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({
      schema: receipt.schema,
      receiptHash: receipt.receiptHash,
      threadId: receipt.response.threadId,
      transcriptPath: path.relative(ROOT, TRANSCRIPT_PATH),
      planPath: path.relative(ROOT, PLAN_PATH),
      receiptPath: path.relative(ROOT, RECEIPT_PATH),
    }, null, 2)}\n`,
  );
}

run().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
