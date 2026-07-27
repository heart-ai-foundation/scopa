import { canonicalJson, sha256Canonical } from './canonical-json.js';

export class ReplayDivergenceError extends Error {
  constructor(report) {
    const first = report.differences[0];
    super(
      first
        ? `replay diverged at ${first.path}: ${first.reason}`
        : 'replay diverged',
    );
    this.name = 'ReplayDivergenceError';
    this.code = 'SCOPA_REPLAY_DIVERGENCE';
    this.report = report;
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

class ReplayJournalSource {
  #records;
  #cursor = 0;

  constructor(journal) {
    this.#records = structuredClone(journal);
  }

  next() {
    if (this.#cursor >= this.#records.length) {
      throw new Error(`replay journal exhausted at effect ${this.#cursor}`);
    }
    const record = deepFreeze(structuredClone(this.#records[this.#cursor]));
    this.#cursor += 1;
    return record;
  }

  get consumedEffects() {
    return this.#cursor;
  }

  get totalEffects() {
    return this.#records.length;
  }
}

function difference(live, replay, path = '$') {
  if (Object.is(live, replay)) {
    return null;
  }

  const liveDate = live instanceof Date;
  const replayDate = replay instanceof Date;
  if (liveDate || replayDate) {
    if (!liveDate || !replayDate) {
      return { path, reason: 'value kinds differ', live, replay };
    }
    return live.getTime() === replay.getTime()
      ? null
      : {
          path,
          reason: 'date values differ',
          live: live.toISOString(),
          replay: replay.toISOString(),
        };
  }

  const liveArray = Array.isArray(live);
  const replayArray = Array.isArray(replay);
  if (liveArray || replayArray) {
    if (!liveArray || !replayArray) {
      return { path, reason: 'value kinds differ', live, replay };
    }
    if (live.length !== replay.length) {
      return {
        path,
        reason: 'array lengths differ',
        live: live.length,
        replay: replay.length,
      };
    }
    for (let index = 0; index < live.length; index += 1) {
      const found = difference(live[index], replay[index], `${path}[${index}]`);
      if (found) return found;
    }
    return null;
  }

  const liveObject = live !== null && typeof live === 'object';
  const replayObject = replay !== null && typeof replay === 'object';
  if (liveObject || replayObject) {
    if (!liveObject || !replayObject) {
      return { path, reason: 'value kinds differ', live, replay };
    }
    const liveKeys = Object.keys(live).sort();
    const replayKeys = Object.keys(replay).sort();
    if (canonicalJson(liveKeys) !== canonicalJson(replayKeys)) {
      return {
        path,
        reason: 'object keys differ',
        live: liveKeys,
        replay: replayKeys,
      };
    }
    for (const key of liveKeys) {
      const found = difference(live[key], replay[key], `${path}.${key}`);
      if (found) return found;
    }
    return null;
  }

  return { path, reason: 'values differ', live, replay };
}

function requireLiveRunResult(value) {
  if (!value || typeof value !== 'object') {
    throw new TypeError('runLive must return an object');
  }
  if (!Object.hasOwn(value, 'output')) {
    throw new TypeError('runLive must return output');
  }
  if (!Array.isArray(value.journal)) {
    throw new TypeError('runLive must return a journal array');
  }
}

function requireReplayRunResult(value) {
  if (!value || typeof value !== 'object' || !Object.hasOwn(value, 'output')) {
    throw new TypeError('runReplay must return an object with output');
  }
}

export async function evaluateReplayEquivalence({ runLive, runReplay }) {
  if (typeof runLive !== 'function' || typeof runReplay !== 'function') {
    throw new TypeError('runLive and runReplay must be functions');
  }

  const unexpectedEffects = [];
  const context = (phase) =>
    Object.freeze({
      reportUnexpectedEffect(effect) {
        unexpectedEffects.push({
          ...structuredClone(effect),
          phase,
        });
      },
    });

  const live = await runLive(context('live'));
  requireLiveRunResult(live);

  const replaySource = new ReplayJournalSource(live.journal);
  const replay = await runReplay(replaySource, context('replay'));
  requireReplayRunResult(replay);

  const differences = [];
  const outputDifference = difference(live.output, replay.output, '$.output');
  if (outputDifference) differences.push(outputDifference);

  const liveEmitted = live.emitted ?? [];
  const replayEmitted = replay.emitted ?? [];
  const emittedDifference = difference(liveEmitted, replayEmitted, '$.emitted');
  if (emittedDifference) differences.push(emittedDifference);

  if (replaySource.consumedEffects !== replaySource.totalEffects) {
    differences.push({
      path: '$.consumedEffects',
      reason: 'replay did not consume every journal record through the harness',
      live: replaySource.totalEffects,
      replay: replaySource.consumedEffects,
    });
  }

  if (unexpectedEffects.length > 0) {
    differences.push({
      path: '$.unexpectedEffects',
      reason: 'an effect escaped the journal boundary',
      live: 0,
      replay: unexpectedEffects.length,
    });
  }

  return {
    schema: 'scopa.conformance.replay-equivalence.v1',
    ok: differences.length === 0,
    journalEntries: replaySource.totalEffects,
    consumedEffects: replaySource.consumedEffects,
    output: replay.output,
    outputSha256: sha256Canonical(replay.output),
    unexpectedEffects,
    differences,
  };
}

export async function assertReplayEquivalent(options) {
  const report = await evaluateReplayEquivalence(options);
  if (!report.ok) {
    throw new ReplayDivergenceError(report);
  }
  return report;
}
