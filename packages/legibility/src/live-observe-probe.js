#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { runLiveObserveProbe } from './live-observe.js';

const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
const report = await runLiveObserveProbe();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) await writeFile(outputPath, serialized);
else process.stdout.write(serialized);
if (!report.ok) process.exitCode = 1;
