#!/usr/bin/env node

import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  CompletionDeniedError,
  PathBoundary,
  assertCompletion,
  createEnforcedToolDispatcher,
  createSliceLock,
  evaluateStopCondition,
  loadRotationState,
  saveRotationState,
} from './index.js';
import { canonicalJsonPretty } from './canonical-json.js';
import { orientation } from '../../agent-surface/src/orientation.js';

const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-live-enforcement-'));

try {
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'allowed'), { recursive: true });
  await mkdir(path.join(root, 'denied'), { recursive: true });
  const failingLock = createSliceLock({
    schema: 'scopa.slice-definition.v1',
    sliceId: 'S2-live-probe',
    allowedPaths: ['allowed/**'],
    amendmentPath: 'protocol/amendment.md',
    gates: [
      {
        id: 'deliberate-failure',
        command: [process.execPath, '-e', 'process.exit(9)'],
        cwd: '.',
        timeoutMs: 5_000,
      },
    ],
    nonGoals: ['No out-of-scope writes'],
    stopCondition: { kind: 'all-gates-pass' },
  });
  let toolExecutions = 0;
  const dispatch = createEnforcedToolDispatcher({
    boundary: new PathBoundary({ repoRoot: root, lock: failingLock }),
    tools: {
      write_file: {
        effect: 'MUTATE',
        pathArguments: ['path'],
        async execute({ path: target, content }) {
          toolExecutions += 1;
          await writeFile(target, content);
        },
      },
    },
  });
  const deniedPath = path.join(root, 'denied/blocked.txt');
  let denial;
  try {
    await dispatch({
      name: 'write_file',
      arguments: { path: deniedPath, content: 'escaped' },
    });
  } catch (error) {
    denial = error.details;
  }
  let completion;
  try {
    await assertCompletion({ lock: failingLock, repoRoot: root });
  } catch (error) {
    if (!(error instanceof CompletionDeniedError)) throw error;
    completion = error.state;
  }

  const passingLock = createSliceLock({
    ...failingLock.definition,
    gates: [
      {
        ...failingLock.definition.gates[0],
        id: 'passing-control',
        command: [process.execPath, '-e', 'process.exit(0)'],
      },
    ],
  });
  const passingState = await evaluateStopCondition({
    lock: passingLock,
    repoRoot: root,
  });
  const rotationPath = path.join(root, '.scopa/rotation.json');
  await saveRotationState(rotationPath, {
    schema: 'scopa.rotation-state.v1',
    activeProtocol: 'S2-enforcement-loop',
    gitCommit: 'a'.repeat(40),
    lockHash: passingLock.definitionHash,
    sliceId: passingLock.definition.sliceId,
    stopState: passingState,
  });
  const restored = await loadRotationState(
    rotationPath,
    {
      lockHash: passingLock.definitionHash,
      gitCommit: 'a'.repeat(40),
    },
  );
  const blockedFileAbsent = await access(deniedPath).then(
    () => false,
    (error) => error.code === 'ENOENT',
  );
  const report = {
    schema: 'scopa.live-enforcement-probe.v1',
    ok:
      denial?.boundary === 'scope' &&
      toolExecutions === 0 &&
      blockedFileAbsent &&
      completion?.canStop === false &&
      completion?.gates[0]?.exitCode === 9 &&
      orientation({
        lock: passingLock,
        stopState: restored.state.stopState,
      }).canStop === true,
    scope: {
      blockedBeforeTool: toolExecutions === 0,
      blockedFileAbsent,
      denial,
    },
    completion: {
      refused: completion?.canStop === false,
      exitCode: completion?.gates[0]?.exitCode,
      failedGates: completion?.failedGates,
    },
    continuity: {
      restored: restored.stateHash.length === 64,
      canStop: restored.state.stopState.canStop,
    },
  };
  const serialized = canonicalJsonPretty(report);
  if (outputPath) await writeFile(outputPath, serialized);
  else process.stdout.write(serialized);
  if (!report.ok) process.exitCode = 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
