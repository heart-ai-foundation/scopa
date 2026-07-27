#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { verifyAgentPlanEvidence } from './agent-plan.js';

const [reportPath] = process.argv.slice(2);
if (!reportPath) {
  throw new Error('usage: verify-agent-plan-evidence <report.json>');
}
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const verification = verifyAgentPlanEvidence(report);
process.stdout.write(`${JSON.stringify(verification, null, 2)}\n`);
if (!verification.ok) process.exitCode = 1;
