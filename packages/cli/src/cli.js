#!/usr/bin/env node

import process from 'node:process';
import {
  runCli,
} from './app.js';

async function main() {
  process.exitCode = await runCli(process.argv.slice(2));
}

main().catch((error) => {
  process.stderr.write(`SCOPA CLI failed: ${error.message}\n`);
  process.exitCode = 1;
});
