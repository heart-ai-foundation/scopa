#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { runAgentPlanProbe } from './agent-plan.js';

const [planPath] = process.argv.slice(2);
if (!planPath) {
  throw new Error('usage: agent-plan-probe <plan.json> [--output <report.json>]');
}
const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const report = await runAgentPlanProbe(plan);
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) await writeFile(outputPath, serialized);
else process.stdout.write(serialized);
if (!report.ok) process.exitCode = 1;
