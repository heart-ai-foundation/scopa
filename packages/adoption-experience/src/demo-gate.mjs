#!/usr/bin/env node

import {
  readFile,
} from 'node:fs/promises';

try {
  const content = await readFile('workspace/result.txt', 'utf8');
  process.exitCode = content === 'DEMO_ALLOWED\n' ? 0 : 1;
} catch {
  process.exitCode = 1;
}
