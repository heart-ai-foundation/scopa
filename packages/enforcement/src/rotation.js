import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJsonPretty,
  deepFreeze,
  jsonHash,
} from './canonical-json.js';
import { validateStopState } from './completion.js';

const STATE_KEYS = new Set([
  'activeProtocol',
  'gitCommit',
  'lockHash',
  'schema',
  'sliceId',
  'stopState',
]);
const ENVELOPE_KEYS = new Set(['state', 'stateHash']);
let rotationTempSequence = 0;

function exact(value, keys, label) {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`${label} must be an object`);
  }
  const actual = Object.keys(value);
  if (
    actual.some((key) => !keys.has(key)) ||
    [...keys].some((key) => !Object.hasOwn(value, key))
  ) {
    throw new Error(`${label} schema mismatch`);
  }
}

export function createRotationState(state) {
  exact(state, STATE_KEYS, 'rotation state');
  if (
    state.schema !== 'scopa.rotation-state.v1' ||
    typeof state.lockHash !== 'string' ||
    !/^[0-9a-f]{64}$/.test(state.lockHash) ||
    typeof state.gitCommit !== 'string' ||
    !/^[0-9a-f]{7,40}$/.test(state.gitCommit) ||
    typeof state.sliceId !== 'string' ||
    state.sliceId.length === 0 ||
    typeof state.activeProtocol !== 'string' ||
    state.activeProtocol.length === 0 ||
    state.stopState?.sliceId !== state.sliceId
  ) {
    throw new Error('invalid rotation state');
  }
  validateStopState(state.stopState, state.lockHash);
  const stable = JSON.parse(canonicalJsonPretty(state));
  return deepFreeze({ state: stable, stateHash: jsonHash(stable) });
}

export function verifyRotationState(envelope, { lockHash, gitCommit }) {
  exact(envelope, ENVELOPE_KEYS, 'rotation envelope');
  const recreated = createRotationState(envelope.state);
  if (
    envelope.stateHash !== recreated.stateHash ||
    envelope.state.lockHash !== lockHash ||
    envelope.state.gitCommit !== gitCommit
  ) {
    throw new Error('rotation state verification failed');
  }
  return deepFreeze(JSON.parse(canonicalJsonPretty(envelope)));
}

export async function saveRotationState(filePath, state) {
  const envelope = createRotationState(state);
  await mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.${rotationTempSequence += 1}.tmp`;
  const handle = await open(temp, 'wx', 0o600);
  try {
    await handle.writeFile(canonicalJsonPretty(envelope));
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temp, filePath);
  } finally {
    await unlink(temp).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
  return envelope;
}

export async function loadRotationState(filePath, expected) {
  const envelope = JSON.parse(await readFile(filePath, 'utf8'));
  return verifyRotationState(envelope, expected);
}
