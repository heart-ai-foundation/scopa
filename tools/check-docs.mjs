#!/usr/bin/env node

import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = [
  'README.md',
  'SCOPA_AGENT.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'GOVERNANCE.md',
  'SUPPORT.md',
  'CODE_OF_CONDUCT.md',
  'CHANGELOG.md',
];

async function markdownFiles(directory) {
  const entries = await readdir(path.join(root, directory), {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.relative(
      root,
      path.join(entry.parentPath, entry.name),
    ));
}

const files = [
  ...roots,
  ...await markdownFiles('docs'),
  ...await markdownFiles('packages'),
].sort();
const failures = [];
const stalePatterns = [
  /0\.2\.0-dev\.1/,
  /package remains private/i,
  /candidate remains ["`]?private/i,
  /developer-preview claims/i,
  /developer-preview threat model/i,
  /no production or public-release support/i,
];

for (const relative of files) {
  const absolute = path.join(root, relative);
  const text = await readFile(absolute, 'utf8');
  if (!text.startsWith('# ')) failures.push(`${relative}: missing H1`);
  for (const pattern of stalePatterns) {
    if (pattern.test(text)) failures.push(`${relative}: stale posture ${pattern}`);
  }
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const original = match[1].trim().replace(/^<|>$/g, '');
    if (
      original.startsWith('#') ||
      /^(?:https?:|mailto:)/.test(original)
    ) {
      continue;
    }
    const target = original.split('#')[0];
    if (!target) continue;
    if (path.isAbsolute(target)) {
      failures.push(`${relative}: absolute local link ${original}`);
      continue;
    }
    try {
      await access(path.resolve(path.dirname(absolute), decodeURI(target)));
    } catch {
      failures.push(`${relative}: missing link target ${original}`);
    }
  }
}

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json')));
if (!Array.isArray(packageJson.keywords) || packageJson.keywords.length < 4) {
  failures.push('package.json: developer discovery keywords are missing');
}
if (typeof packageJson.homepage !== 'string' || !packageJson.homepage) {
  failures.push('package.json: homepage is missing');
}
if (typeof packageJson.bugs?.url !== 'string' || !packageJson.bugs.url) {
  failures.push('package.json: issue URL is missing');
}

const agentEntry = await readFile(path.join(root, 'SCOPA_AGENT.md'), 'utf8');
for (const phrase of [
  'The developer should not need to install SCOPA',
  'Do not ask for approval merely to repeat a clear request',
  'scopa init --definition scopa.slice-definition.json',
  'Simplicity must not become a false security claim',
  'canStop: true',
]) {
  if (!agentEntry.includes(phrase)) {
    failures.push(`SCOPA_AGENT.md: missing point-and-go contract: ${phrase}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`documentation check passed (${files.length} files)\n`);
}
