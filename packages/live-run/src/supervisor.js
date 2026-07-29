import {
  spawn,
} from 'node:child_process';
import {
  createHash,
} from 'node:crypto';
import {
  createTerminalEnvelope,
  emptyCleanupSummary,
  emptyOutputSummary,
} from './schema.js';

const MAX_ALLOWED_CAPTURE_BYTES = 64 * 1024 * 1024;
const MAX_ALLOWED_INPUT_BYTES = 1024 * 1024;
const MAX_ALLOWED_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_ALLOWED_GRACE_MS = 10_000;

function positiveBoundedInteger(value, maximum, label) {
  if (
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    value > maximum
  ) {
    throw new TypeError(`${label} must be between 1 and ${maximum}`);
  }
}

function nonnegativeBoundedInteger(value, maximum, label) {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > maximum
  ) {
    throw new TypeError(`${label} must be between 0 and ${maximum}`);
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
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
    if (error?.code === 'EPERM') return true;
    return true;
  }
}

async function waitForGroupGone(processGroupId, {
  cleanupWaitMs,
  cleanupPollMs,
}) {
  const deadline = Date.now() + cleanupWaitMs;
  while (groupExists(processGroupId) && Date.now() < deadline) {
    await delay(cleanupPollMs);
  }
  return !groupExists(processGroupId);
}

function processResult({
  state,
  reason,
  exitCode = null,
  signal = null,
  maxCaptureBytes,
  stdout,
  stderr,
  stdoutBytes,
  stderrBytes,
  truncated,
  cleanup,
}) {
  const capturedBytes = stdout.length + stderr.length;
  return {
    terminal: createTerminalEnvelope({
      state,
      reason,
      exitCode,
      signal,
      output: {
        maxBytes: maxCaptureBytes,
        stdoutBytes,
        stderrBytes,
        capturedBytes,
        truncated,
        stdoutSha256: sha256(stdout),
        stderrSha256: sha256(stderr),
      },
      cleanup,
    }),
    stdout: stdout.toString('utf8'),
    stderr: stderr.toString('utf8'),
  };
}

function spawnFailure(maxCaptureBytes) {
  return {
    terminal: createTerminalEnvelope({
      state: 'spawn-failed',
      reason: 'spawn-error',
      output: emptyOutputSummary(maxCaptureBytes),
      cleanup: emptyCleanupSummary(),
    }),
    stdout: '',
    stderr: '',
  };
}

export async function superviseProcess({
  command,
  args = [],
  cwd,
  env,
  stdin = '',
  inputDelayMs = 0,
  timeoutMs,
  maxCaptureBytes,
  terminateGraceMs = 500,
  cleanupWaitMs = 1_000,
  cleanupPollMs = 10,
}) {
  if (process.platform === 'win32') {
    throw new Error('SCOPA live-run custody requires POSIX process groups');
  }
  if (typeof command !== 'string' || command.length === 0) {
    throw new TypeError('live command must be a non-empty string');
  }
  if (!Array.isArray(args) || args.some((value) => typeof value !== 'string')) {
    throw new TypeError('live args must contain strings');
  }
  if (typeof cwd !== 'string' || !cwd.startsWith('/')) {
    throw new TypeError('live cwd must be an absolute path');
  }
  if (
    env === null ||
    typeof env !== 'object' ||
    Array.isArray(env) ||
    Object.values(env).some((value) => typeof value !== 'string')
  ) {
    throw new TypeError('live env must map names to strings');
  }
  if (typeof stdin !== 'string') {
    throw new TypeError('live stdin must be a string');
  }
  if (Buffer.byteLength(stdin, 'utf8') > MAX_ALLOWED_INPUT_BYTES) {
    throw new TypeError('live stdin exceeds the input bound');
  }
  positiveBoundedInteger(
    timeoutMs,
    MAX_ALLOWED_TIMEOUT_MS,
    'timeoutMs',
  );
  positiveBoundedInteger(
    maxCaptureBytes,
    MAX_ALLOWED_CAPTURE_BYTES,
    'maxCaptureBytes',
  );
  nonnegativeBoundedInteger(
    inputDelayMs,
    MAX_ALLOWED_GRACE_MS,
    'inputDelayMs',
  );
  nonnegativeBoundedInteger(
    terminateGraceMs,
    MAX_ALLOWED_GRACE_MS,
    'terminateGraceMs',
  );
  positiveBoundedInteger(
    cleanupWaitMs,
    MAX_ALLOWED_GRACE_MS,
    'cleanupWaitMs',
  );
  positiveBoundedInteger(
    cleanupPollMs,
    cleanupWaitMs,
    'cleanupPollMs',
  );

  let child;
  try {
    child = spawn(command, args, {
      cwd,
      env,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return spawnFailure(maxCaptureBytes);
  }

  const cleanup = emptyCleanupSummary();
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let capturedBytes = 0;
  const stdoutChunks = [];
  const stderrChunks = [];
  let truncated = false;
  let terminalCause = null;
  let terminationPromise = null;

  const terminate = () => {
    if (terminationPromise !== null || !Number.isSafeInteger(child.pid)) {
      return terminationPromise;
    }
    terminationPromise = (async () => {
      try {
        cleanup.termSent = signalGroup(child.pid, 'SIGTERM');
        await delay(terminateGraceMs);
        if (groupExists(child.pid)) {
          cleanup.killSent = signalGroup(child.pid, 'SIGKILL');
        }
        cleanup.groupGone = await waitForGroupGone(child.pid, {
          cleanupWaitMs,
          cleanupPollMs,
        });
      } catch {
        cleanup.groupGone = false;
      }
    })();
    return terminationPromise;
  };

  const capture = (kind, chunk) => {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    if (kind === 'stdout') stdoutBytes += bytes.length;
    else stderrBytes += bytes.length;
    const remaining = Math.max(0, maxCaptureBytes - capturedBytes);
    if (remaining > 0) {
      const retained = bytes.subarray(0, remaining);
      if (kind === 'stdout') stdoutChunks.push(retained);
      else stderrChunks.push(retained);
      capturedBytes += retained.length;
    }
    if (bytes.length > remaining && terminalCause === null) {
      truncated = true;
      terminalCause = 'output-limit';
      terminate();
    }
  };

  child.stdout.on('data', (chunk) => capture('stdout', chunk));
  child.stderr.on('data', (chunk) => capture('stderr', chunk));
  for (const stream of [
    child.stdout,
    child.stderr,
  ]) {
    stream.on('error', () => {
      if (terminalCause === null) terminalCause = 'stream-error';
      terminate();
    });
  }
  child.stdin.on('error', () => {});

  const inputTimer = setTimeout(() => {
    if (!child.stdin.destroyed) child.stdin.end(stdin);
  }, inputDelayMs);
  const timeoutTimer = setTimeout(() => {
    if (terminalCause === null) terminalCause = 'timed-out';
    terminate();
  }, timeoutMs);

  let spawnError = false;
  const closePromise = new Promise((resolve) => {
    child.once('error', () => {
      spawnError = true;
    });
    child.once('close', (exitCode, signal) => {
      resolve({
        exitCode,
        signal,
        watchdog: false,
      });
    });
  });
  let watchdogTimer;
  const watchdogPromise = new Promise((resolve) => {
    watchdogTimer = setTimeout(() => {
      if (terminalCause === null) terminalCause = 'timed-out';
      terminate();
      resolve({
        exitCode: null,
        signal: null,
        watchdog: true,
      });
    }, timeoutMs + terminateGraceMs + cleanupWaitMs + 1_000);
  });
  const closed = await Promise.race([
    closePromise,
    watchdogPromise,
  ]);
  clearTimeout(inputTimer);
  clearTimeout(timeoutTimer);
  clearTimeout(watchdogTimer);

  if (!Number.isSafeInteger(child.pid)) {
    return spawnFailure(maxCaptureBytes);
  }

  if (terminationPromise !== null) {
    await terminationPromise;
  } else if (groupExists(child.pid)) {
    cleanup.orphanDetected = true;
    await terminate();
  } else {
    cleanup.groupGone = true;
  }

  const stdout = Buffer.concat(stdoutChunks);
  const stderr = Buffer.concat(stderrChunks);
  if (!cleanup.groupGone) {
    return processResult({
      state: 'cleanup-failed',
      reason: 'process-group-survived',
      exitCode: closed.exitCode,
      signal: closed.signal,
      maxCaptureBytes,
      stdout,
      stderr,
      stdoutBytes,
      stderrBytes,
      truncated,
      cleanup,
    });
  }
  if (cleanup.orphanDetected) {
    return processResult({
      state: 'cleanup-failed',
      reason: 'orphan-process-detected',
      exitCode: closed.exitCode,
      signal: closed.signal,
      maxCaptureBytes,
      stdout,
      stderr,
      stdoutBytes,
      stderrBytes,
      truncated,
      cleanup,
    });
  }
  if (spawnError) {
    return processResult({
      state: 'spawn-failed',
      reason: 'spawn-error',
      exitCode: closed.exitCode,
      signal: closed.signal,
      maxCaptureBytes,
      stdout,
      stderr,
      stdoutBytes,
      stderrBytes,
      truncated,
      cleanup,
    });
  }
  if (terminalCause === 'timed-out' || closed.watchdog) {
    return processResult({
      state: 'timed-out',
      reason: 'deadline-exceeded',
      exitCode: closed.exitCode,
      signal: closed.signal,
      maxCaptureBytes,
      stdout,
      stderr,
      stdoutBytes,
      stderrBytes,
      truncated,
      cleanup,
    });
  }
  if (terminalCause === 'output-limit') {
    return processResult({
      state: 'output-limit',
      reason: 'capture-limit-exceeded',
      exitCode: closed.exitCode,
      signal: closed.signal,
      maxCaptureBytes,
      stdout,
      stderr,
      stdoutBytes,
      stderrBytes,
      truncated,
      cleanup,
    });
  }
  if (terminalCause === 'stream-error') {
    return processResult({
      state: 'normalization-failed',
      reason: 'stream-normalization-error',
      exitCode: closed.exitCode,
      signal: closed.signal,
      maxCaptureBytes,
      stdout,
      stderr,
      stdoutBytes,
      stderrBytes,
      truncated,
      cleanup,
    });
  }
  if (closed.signal !== null) {
    return processResult({
      state: 'signaled',
      reason: 'process-signal',
      exitCode: closed.exitCode,
      signal: closed.signal,
      maxCaptureBytes,
      stdout,
      stderr,
      stdoutBytes,
      stderrBytes,
      truncated,
      cleanup,
    });
  }
  if (closed.exitCode !== 0) {
    return processResult({
      state: 'exited',
      reason: 'nonzero-exit',
      exitCode: closed.exitCode,
      signal: closed.signal,
      maxCaptureBytes,
      stdout,
      stderr,
      stdoutBytes,
      stderrBytes,
      truncated,
      cleanup,
    });
  }
  return processResult({
    state: 'succeeded',
    reason: 'completed',
    exitCode: 0,
    signal: null,
    maxCaptureBytes,
    stdout,
    stderr,
    stdoutBytes,
    stderrBytes,
    truncated,
    cleanup,
  });
}
