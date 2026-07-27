import { verifySliceLock } from '../../enforcement/src/lock.js';
import { validateStopState } from '../../enforcement/src/completion.js';

export function orientation({ lock, stopState }) {
  const verified = verifySliceLock(lock);
  validateStopState(stopState, verified.definitionHash);
  return {
    schema: 'scopa.orientation.v1',
    slice: verified.definition.sliceId,
    lockHash: verified.definitionHash,
    allowedPaths: [...verified.definition.allowedPaths],
    nonGoals: [...verified.definition.nonGoals],
    gateStatus: stopState.status,
    failedGates: [...stopState.failedGates],
    stopCondition: verified.definition.stopCondition.kind,
    canStop: stopState.canStop,
    amendmentPath: verified.definition.amendmentPath,
  };
}

export function denialPayload(error) {
  if (error?.code !== 'SCOPA_SCOPE_DENIED' || !error.details) {
    throw new TypeError('a SCOPA scope denial is required');
  }
  return { ...error.details };
}
