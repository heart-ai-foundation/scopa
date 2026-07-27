import { readFile, writeFile } from 'node:fs/promises';
import {
  PathBoundary,
  createEnforcedToolDispatcher,
} from '../../enforcement/src/index.js';

export function createReferenceAgentHost({
  repoRoot,
  lock,
  decisionVerifier = null,
}) {
  const boundary = new PathBoundary({
    repoRoot,
    lock,
    decisionVerifier,
  });
  const dispatch = createEnforcedToolDispatcher({
    boundary,
    tools: {
      read_file: {
        effect: 'OBSERVE',
        async execute({ path, encoding = 'utf8' }) {
          return { content: await readFile(path, encoding) };
        },
      },
      write_file: {
        effect: 'MUTATE',
        pathArguments: ['path'],
        async execute({ path, content }) {
          await writeFile(path, content, { encoding: 'utf8' });
          return { written: true };
        },
      },
    },
  });

  return Object.freeze({
    invoke(call) {
      return dispatch(call);
    },
    tools: Object.freeze([
      Object.freeze({ name: 'read_file', effect: 'OBSERVE' }),
      Object.freeze({
        name: 'write_file',
        effect: 'MUTATE',
        pathArguments: Object.freeze(['path']),
      }),
    ]),
  });
}
