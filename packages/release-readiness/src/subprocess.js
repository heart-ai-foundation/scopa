import {
  spawn,
} from 'node:child_process';
import {
  mkdtemp,
  open,
  readFile,
  rm,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function cleanEnvironment(providedEnv) {
  const env = { ...providedEnv };
  delete env.NODE;
  delete env.NODE_TEST_CONTEXT;
  for (const name of Object.keys(env)) {
    if (
      name === 'npm_command' ||
      name === 'npm_execpath' ||
      name === 'npm_node_execpath' ||
      name.startsWith('npm_lifecycle_') ||
      name.startsWith('npm_package_')
    ) {
      delete env[name];
    }
  }
  return env;
}

export async function invokeCaptured(command, args, {
  cwd,
  env: providedEnv = process.env,
  expectedExitCodes = [0],
} = {}) {
  const captureRoot = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-process-capture-'),
  );
  const stdoutPath = path.join(captureRoot, 'stdout');
  const stderrPath = path.join(captureRoot, 'stderr');
  let stdoutHandle = null;
  let stderrHandle = null;
  try {
    stdoutHandle = await open(stdoutPath, 'w', 0o600);
    stderrHandle = await open(stderrPath, 'w', 0o600);
    const child = spawn(command, args, {
      cwd,
      env: cleanEnvironment(providedEnv),
      stdio: [
        'ignore',
        stdoutHandle.fd,
        stderrHandle.fd,
      ],
    });
    const outcome = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code, signal) => resolve({ code, signal }));
    });
    await Promise.all([
      stdoutHandle.close(),
      stderrHandle.close(),
    ]);
    stdoutHandle = null;
    stderrHandle = null;
    const [stdout, stderr] = await Promise.all([
      readFile(stdoutPath, 'utf8'),
      readFile(stderrPath, 'utf8'),
    ]);
    if (!expectedExitCodes.includes(outcome.code)) {
      const error = new Error(
        `${command} exited with status ${outcome.code ?? outcome.signal}`,
      );
      error.code = outcome.code;
      error.stdout = stdout;
      error.stderr = stderr;
      throw error;
    }
    return {
      exitCode: outcome.code,
      stdout,
      stderr,
    };
  } finally {
    await Promise.allSettled([
      stdoutHandle?.close(),
      stderrHandle?.close(),
    ]);
    await rm(captureRoot, { recursive: true, force: true });
  }
}
