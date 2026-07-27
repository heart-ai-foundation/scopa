#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyLocalModelSessionReceipt } from './model-session-receipt.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const [receiptPath, transcriptPath, planPath, schemaPath] = process.argv.slice(2);
if (!schemaPath) {
  throw new Error(
    'usage: verify-model-session-receipt <receipt> <transcript> <plan> <schema>',
  );
}
const [receiptText, transcript, plan, outputSchema] = await Promise.all([
  readFile(path.resolve(root, receiptPath), 'utf8'),
  readFile(path.resolve(root, transcriptPath), 'utf8'),
  readFile(path.resolve(root, planPath), 'utf8'),
  readFile(path.resolve(root, schemaPath), 'utf8'),
]);
const verification = verifyLocalModelSessionReceipt({
  receipt: JSON.parse(receiptText),
  transcript,
  plan,
  outputSchema,
});
process.stdout.write(`${JSON.stringify(verification, null, 2)}\n`);
if (!verification.ok) process.exitCode = 1;
