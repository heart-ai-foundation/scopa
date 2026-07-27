#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const env = { ...process.env };
delete env.NODE;

const result = spawnSync(
  process.execPath,
  ['--test', '--test-concurrency=1', ...process.argv.slice(2)],
  {
  cwd: process.cwd(),
  env,
  stdio: 'inherit',
  },
);
process.exitCode = result.status ?? 1;
