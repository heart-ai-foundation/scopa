import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';

const STRUCTURAL_PATTERNS = Object.freeze([
  {
    kind: 'absolute-user-home',
    pattern: /\/(?:home|Users)\/[A-Za-z0-9._-]+(?:\/|$)/,
  },
  {
    kind: 'absolute-windows-user-home',
    pattern: /[A-Za-z]:\\Users\\[A-Za-z0-9._-]+(?:\\|$)/,
  },
  {
    kind: 'local-file-url',
    pattern: /file:\/\/\/(?:home|Users)\//,
  },
  {
    kind: 'private-evidence-topology',
    pattern: /(?:^|[/\\])projects[/\\][A-Za-z0-9._-]+[/\\](?:evidence|notes|runs)(?:[/\\]|$)/,
  },
]);

const CREDENTIAL_PATTERNS = Object.freeze([
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bsk-[A-Za-z0-9][A-Za-z0-9_-]{19,}\b/,
  /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/,
]);

function textBuffer(bytes) {
  if (bytes.includes(0)) return null;
  return bytes.toString('utf8');
}

export function scanPrivateText(text, {
  forbiddenValues = [],
} = {}) {
  if (typeof text !== 'string') {
    throw new TypeError('privacy scanner input must be text');
  }
  const findings = [];
  for (const { kind, pattern } of STRUCTURAL_PATTERNS) {
    if (pattern.test(text)) findings.push(kind);
  }
  if (CREDENTIAL_PATTERNS.some((pattern) => pattern.test(text))) {
    findings.push('recognizable-credential');
  }
  for (const value of forbiddenValues) {
    if (
      typeof value === 'string' &&
      value.length >= 4 &&
      text.includes(value)
    ) {
      findings.push('forbidden-runtime-value');
      break;
    }
  }
  return [...new Set(findings)].sort();
}

export async function scanPackagePrivacy({
  installedRoot,
  files,
  forbiddenValues = [],
}) {
  const root = path.resolve(installedRoot);
  const findings = [];
  for (const entry of files) {
    const bytes = await readFile(path.join(root, entry.path));
    const text = textBuffer(bytes);
    if (text === null) continue;
    for (const kind of scanPrivateText(text, { forbiddenValues })) {
      findings.push({
        kind,
        path: entry.path,
      });
    }
  }
  return findings.sort((left, right) => {
    const byPath = left.path.localeCompare(right.path);
    return byPath === 0 ? left.kind.localeCompare(right.kind) : byPath;
  });
}
