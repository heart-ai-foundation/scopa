import { spawn } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import path from 'node:path';
import { verifySliceLock } from './lock.js';

const OUTPUT_LIMIT = 64 * 1024;
const TERMINATE_GRACE_MS = 100;
const CLEANUP_WAIT_MS = 1_000;
const CLEANUP_POLL_MS = 10;

function appendLimited(current, chunk) {
  if (current.length >= OUTPUT_LIMIT) return current;
  return `${current}${chunk}`.slice(0, OUTPUT_LIMIT);
}

function outputMetadata(stdout, stderr, stdoutBytes, stderrBytes) {
  return {
    stdoutBytes,
    stderrBytes,
    stdoutTruncated: stdoutBytes > Buffer.byteLength(stdout, 'utf8'),
    stderrTruncated: stderrBytes > Buffer.byteLength(stderr, 'utf8'),
  };
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function signalGroup(processGroupId, signal) {
  try {
    process.kill(-processGroupId, signal);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    return false;
  }
}

function groupExists(processGroupId) {
  try {
    process.kill(-processGroupId, 0);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    return true;
  }
}

async function waitForGroupGone(processGroupId) {
  const deadline = Date.now() + CLEANUP_WAIT_MS;
  while (groupExists(processGroupId) && Date.now() < deadline) {
    await delay(CLEANUP_POLL_MS);
  }
  return !groupExists(processGroupId);
}

function failedGateResult({ gate, startedAt, stderr }) {
  const stderrBytes = Buffer.byteLength(stderr, 'utf8');
  return {
    schema: 'scopa.gate-result.v1',
    id: gate.id,
    command: [...gate.command],
    exitCode: null,
    passed: false,
    timedOut: false,
    durationMs: Date.now() - startedAt,
    stdout: '',
    stderr,
    ...outputMetadata('', stderr, 0, stderrBytes),
  };
}

export async function runGate(gate, repoRoot) {
  const startedAt = Date.now();
  const root = await realpath(repoRoot);
  let cwd;
  try {
    cwd = await realpath(path.resolve(root, gate.cwd));
  } catch (error) {
    return failedGateResult({
      gate,
      startedAt,
      stderr: `gate cwd unavailable: ${error.message}`,
    });
  }
  const relative = path.relative(root, cwd);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return failedGateResult({
      gate,
      startedAt,
      stderr: 'gate cwd resolves outside repository',
    });
  }
  if (process.platform === 'win32') {
    return failedGateResult({
      gate,
      startedAt,
      stderr: 'gate process-tree custody requires POSIX process groups',
    });
  }

  let child;
  try {
    child = spawn(gate.command[0], gate.command.slice(1), {
      cwd,
      env: {
        CI: '1',
        LANG: process.env.LANG ?? 'C.UTF-8',
        PATH: process.env.PATH ?? '/usr/bin:/bin',
      },
      detached: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    return failedGateResult({ gate, startedAt, stderr: error.message });
  }

  let stdout = '';
  let stderr = '';
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let timedOut = false;
  let terminalCause = null;
  let spawnError = null;
  let orphanDetected = false;
  let groupGone = false;
  let terminationPromise = null;

  const appendDiagnostic = (message) => {
    const separator = stderr.length === 0 ? '' : '\n';
    const addition = `${separator}${message}`;
    stderrBytes += Buffer.byteLength(addition, 'utf8');
    stderr = appendLimited(stderr, addition);
  };

  const terminate = () => {
    if (terminationPromise !== null || !Number.isSafeInteger(child.pid)) {
      return terminationPromise;
    }
    terminationPromise = (async () => {
      signalGroup(child.pid, 'SIGTERM');
      await delay(TERMINATE_GRACE_MS);
      if (groupExists(child.pid)) signalGroup(child.pid, 'SIGKILL');
      groupGone = await waitForGroupGone(child.pid);
    })().catch(() => {
      groupGone = false;
    });
    return terminationPromise;
  };

  const capture = (kind, chunk) => {
    const bytes = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
    if (kind === 'stdout') {
      stdoutBytes += bytes;
      stdout = appendLimited(stdout, chunk);
    } else {
      stderrBytes += bytes;
      stderr = appendLimited(stderr, chunk);
    }
    if (
      (stdoutBytes > OUTPUT_LIMIT || stderrBytes > OUTPUT_LIMIT) &&
      terminalCause === null
    ) {
      terminalCause = 'output-limit';
      terminate();
    }
  };

  child.stdout.on('data', (chunk) => capture('stdout', chunk));
  child.stderr.on('data', (chunk) => capture('stderr', chunk));
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('error', () => {
      if (terminalCause === null) terminalCause = 'stream-error';
      terminate();
    });
  }
  child.once('error', (error) => {
    spawnError = error;
  });
  child.once('exit', () => {
    if (
      terminalCause === null &&
      Number.isSafeInteger(child.pid) &&
      groupExists(child.pid)
    ) {
      orphanDetected = true;
      terminalCause = 'orphan-process';
      terminate();
    }
  });

  const timeoutTimer = setTimeout(() => {
    if (terminalCause !== null) return;
    timedOut = true;
    terminalCause = 'timed-out';
    terminate();
  }, gate.timeoutMs);
  const closePromise = new Promise((resolve) => {
    child.once('close', (exitCode) => resolve({ exitCode, watchdog: false }));
  });
  let watchdogTimer;
  const watchdogPromise = new Promise((resolve) => {
    watchdogTimer = setTimeout(() => {
      if (terminalCause === null) {
        timedOut = true;
        terminalCause = 'timed-out';
      }
      terminate();
      resolve({ exitCode: null, watchdog: true });
    }, gate.timeoutMs + TERMINATE_GRACE_MS + CLEANUP_WAIT_MS + 1_000);
  });
  const closed = await Promise.race([closePromise, watchdogPromise]);
  clearTimeout(timeoutTimer);
  clearTimeout(watchdogTimer);

  if (terminationPromise !== null) {
    await terminationPromise;
  } else if (Number.isSafeInteger(child.pid) && groupExists(child.pid)) {
    orphanDetected = true;
    terminalCause = 'orphan-process';
    await terminate();
  } else {
    groupGone = true;
  }

  if (!groupGone) appendDiagnostic('gate process-group cleanup could not be verified');
  if (orphanDetected) appendDiagnostic('gate left a descendant process');
  if (terminalCause === 'output-limit') appendDiagnostic('gate output limit exceeded');
  if (terminalCause === 'stream-error') appendDiagnostic('gate output stream failed');
  if (spawnError !== null) appendDiagnostic(spawnError.message);

  return {
    schema: 'scopa.gate-result.v1',
    id: gate.id,
    command: [...gate.command],
    exitCode: closed.exitCode,
    passed:
      closed.exitCode === 0 &&
      !closed.watchdog &&
      terminalCause === null &&
      spawnError === null &&
      groupGone,
    timedOut,
    durationMs: Date.now() - startedAt,
    stdout,
    stderr,
    ...outputMetadata(stdout, stderr, stdoutBytes, stderrBytes),
  };
}

export async function runVerificationGates({ lock, repoRoot }) {
  const verified = verifySliceLock(lock);
  const results = [];
  for (const gate of verified.definition.gates) {
    results.push(await runGate(gate, repoRoot));
  }
  return results;
}
