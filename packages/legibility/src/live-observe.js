import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MemoryAppendOnlyStore } from '../../journal/src/memory-store.js';
import { analyzeObservationSession } from './analyze.js';
import { ObserveModeSession } from './observe-session.js';

export async function runLiveObserveProbe() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-legibility-'));
  try {
    const workspace = path.join(root, 'workspace');
    await mkdir(workspace);
    const sourcePath = path.join(workspace, 'source.txt');
    const generatedPath = path.join(workspace, 'generated.txt');
    await writeFile(sourcePath, 'source');

    const session = new ObserveModeSession({
      store: new MemoryAppendOnlyStore(),
      runId: 'S3-live-observe-session',
      scope: 'workspace',
    });
    await session.invoke(
      {
        eventId: 'agent-write-1',
        operation: 'write',
        target: 'workspace/generated.txt',
        toolName: 'write_file',
      },
      () => writeFile(generatedPath, 'generated'),
    );
    const content = await session.invoke(
      {
        eventId: 'agent-read-1',
        operation: 'read',
        target: 'workspace/source.txt',
        toolName: 'read_file',
      },
      () => readFile(sourcePath, 'utf8'),
    );
    const snapshot = session.snapshot();
    const boundaryMap = analyzeObservationSession({
      records: snapshot.records,
      commitment: snapshot.commitment,
      summary: snapshot.summary,
      declaredBoundaries: [],
    });
    const manualBoundaries = [
      'read\u0000workspace/source.txt',
      'write\u0000workspace/generated.txt',
    ];
    const mappedBoundaries = boundaryMap.boundaries.map(
      ({ operation, target }) => `${operation}\u0000${target}`,
    );
    const notObserved = boundaryMap.coverage.operations
      .filter(({ status }) => status === 'not-observed')
      .map(({ operation }) => operation);
    return {
      schema: 'scopa.live-observe-probe.v1',
      ok:
        content === 'source' &&
        (await readFile(generatedPath, 'utf8')) === 'generated' &&
        JSON.stringify(mappedBoundaries) === JSON.stringify(manualBoundaries) &&
        boundaryMap.findings.length === 2 &&
        boundaryMap.findings.every(
          ({ kind, status }) =>
            kind === 'observed-not-declared' && status === 'observed',
        ) &&
        notObserved.includes('execute') &&
        notObserved.includes('query') &&
        notObserved.includes('emit') &&
        boundaryMap.reconstructability.scoreBasisPoints === 10_000,
      manualComparison: {
        agrees: JSON.stringify(mappedBoundaries) === JSON.stringify(manualBoundaries),
        expected: manualBoundaries,
        observed: mappedBoundaries,
      },
      boundaryMap,
    };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
