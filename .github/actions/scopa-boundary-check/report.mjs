#!/usr/bin/env node

import {
  runPullRequestReport,
} from '../../../packages/adoption-experience/src/pr-report.js';

await runPullRequestReport();
