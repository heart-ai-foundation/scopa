import { decodeDcbor, encodeDcbor } from '../../journal/src/dcbor.js';
import { hashHex } from '../../journal/src/hash.js';
import {
  createChainCommitment,
  sealRecord,
} from '../../journal/src/record.js';
import { CODING_AGENT_PROFILE, classifyCodingAgentEvent } from './profile.js';

function clone(value) {
  return decodeDcbor(encodeDcbor(value));
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
}

function reasonCode(error) {
  if (typeof error?.code === 'string' && error.code.length > 0) {
    return error.code;
  }
  return 'SCOPA_OBSERVATION_CAPTURE_FAILED';
}

export class ObserveModeSession {
  #attemptedEvents = 0;
  #captureGaps = [];
  #eventIds = new Set();
  #previousHash = null;
  #recordBytes = [];

  constructor({
    store,
    runId,
    scope = 'root',
    profile = CODING_AGENT_PROFILE,
  }) {
    if (!store || typeof store.append !== 'function') {
      throw new TypeError('observe mode requires an append-only store');
    }
    nonEmptyString(runId, 'runId');
    nonEmptyString(scope, 'scope');
    if (profile?.profileId !== CODING_AGENT_PROFILE.profileId) {
      throw new TypeError('unsupported observation profile');
    }
    this.store = store;
    this.runId = runId;
    this.scope = scope;
    this.profile = profile;
    this.scriptHash = hashHex(encodeDcbor(profile));
  }

  async invoke(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('observe mode handler must be a function');
    }
    this.#attemptedEvents += 1;
    let result;
    let toolError;
    try {
      result = await handler();
    } catch (error) {
      toolError = error;
    }

    try {
      const effect = classifyCodingAgentEvent(event, {
        resultStatus: toolError ? 'rejected' : 'fulfilled',
        scope: this.scope,
      });
      if (this.#eventIds.has(event.eventId)) {
        const duplicate = new Error('duplicate observation eventId');
        duplicate.code = 'SCOPA_OBSERVATION_DUPLICATE';
        throw duplicate;
      }
      const sealed = sealRecord({
        runId: this.runId,
        scriptHash: this.scriptHash,
        seq: this.#recordBytes.length,
        scope: this.scope,
        effect,
        outcome: {
          status: 'fulfilled',
          value: { observation: 'captured' },
        },
        previousHash: this.#previousHash,
      });
      await this.store.append(sealed.bytes);
      this.#recordBytes.push(sealed.bytes);
      this.#previousHash = sealed.hash;
      this.#eventIds.add(event.eventId);
    } catch (error) {
      this.#captureGaps.push({
        eventId:
          typeof event?.eventId === 'string' && event.eventId.length > 0
            ? event.eventId
            : null,
        reasonCode: reasonCode(error),
      });
    }

    if (toolError) throw toolError;
    return result;
  }

  snapshot() {
    const records = this.#recordBytes.map((bytes) => bytes.slice());
    return Object.freeze({
      schema: 'scopa.observation-session.v1',
      mode: 'observe',
      records,
      commitment:
        records.length > 0 ? createChainCommitment(records) : null,
      summary: clone({
        schema: 'scopa.observation-session-summary.v1',
        profileId: this.profile.profileId,
        runId: this.runId,
        scope: this.scope,
        attemptedEvents: this.#attemptedEvents,
        recordedEvents: records.length,
        captureGapCount: this.#captureGaps.length,
        captureGaps: this.#captureGaps,
      }),
    });
  }
}
