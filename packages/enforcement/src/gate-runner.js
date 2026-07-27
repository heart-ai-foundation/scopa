import { spawn } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import path from 'node:path';
import { verifySliceLock } from './lock.js';

const OUTPUT_LIMIT = 64 * 1024;

function appendLimited(current, chunk) {
  if (current.length >= OUTPUT_LIMIT) return current;
  return `${current}${chunk}`.slice(0, OUTPUT_LIMIT);
}

export async function runGate(gate, repoRoot) {
  const startedAt = Date.now();
  const root = await realpath(repoRoot);
  let cwd;
  try {
    cwd = await realpath(path.resolve(root, gate.cwd));
  } catch (error) {
    return {
      schema: 'scopa.gate-result.v1',
      id: gate.id,
      command: [...gate.command],
      exitCode: null,
      passed: false,
      timedOut: false,
      durationMs: Date.now() - startedAt,
      stdout: '',
      stderr: `gate cwd unavailable: ${error.message}`,
    };
  }
  const relative = path.relative(root, cwd);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return {
      schema: 'scopa.gate-result.v1',
      id: gate.id,
      command: [...gate.command],
      exitCode: null,
      passed: false,
      timedOut: false,
      durationMs: Date.now() - startedAt,
      stdout: '',
      stderr: 'gate cwd resolves outside repository',
    };
  }
  return new Promise((resolve) => {
    const child = spawn(gate.command[0], gate.command.slice(1), {
      cwd,
      env: {
        CI: '1',
        LANG: process.env.LANG ?? 'C.UTF-8',
        PATH: process.env.PATH ?? '/usr/bin:/bin',
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let spawnFailed = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, gate.timeoutMs);
    child.stdout.on('data', (chunk) => {
      stdout = appendLimited(stdout, chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr = appendLimited(stderr, chunk);
    });
    child.on('error', (error) => {
      spawnFailed = true;
      clearTimeout(timer);
      resolve({
        schema: 'scopa.gate-result.v1',
        id: gate.id,
        command: [...gate.command],
        exitCode: null,
        passed: false,
        timedOut,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr: appendLimited(stderr, error.message),
      });
    });
    child.on('close', (code) => {
      if (spawnFailed) return;
      clearTimeout(timer);
      resolve({
        schema: 'scopa.gate-result.v1',
        id: gate.id,
        command: [...gate.command],
        exitCode: code,
        passed: code === 0 && !timedOut,
        timedOut,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
      });
    });
  });
}

export async function runVerificationGates({ lock, repoRoot }) {
  const verified = verifySliceLock(lock);
  const results = [];
  for (const gate of verified.definition.gates) {
    results.push(await runGate(gate, repoRoot));
  }
  return results;
}
