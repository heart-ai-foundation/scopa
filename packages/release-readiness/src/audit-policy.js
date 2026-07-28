#!/usr/bin/env node

import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';
import {
  canonicalJsonPretty,
} from '../../enforcement/src/index.js';
import {
  auditReleasePolicies,
} from './policy.js';

const ROOT = path.resolve(
  fileURLToPath(new URL('../../..', import.meta.url)),
);

auditReleasePolicies({ root: ROOT }).then((report) => {
  process.stdout.write(canonicalJsonPretty(report));
  if (!report.ok) process.exitCode = 1;
}).catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
