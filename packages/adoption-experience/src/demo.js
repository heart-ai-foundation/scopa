import {
  access,
  mkdir,
  mkdtemp,
  rm,
  unlink,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';
import {
  createReferenceAgentHost,
} from '../../agent-surface/src/index.js';
import {
  deepFreeze,
  evaluateStopCondition,
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  validateCapabilityMatrix,
} from '../../adapter-host/src/assurance.js';
import {
  createWorkflowBoundaryMap,
} from '../../workflow-boundary-map/src/index.js';
import {
  loadProject,
} from '../../cli/src/project.js';
import {
  beginSlice,
  createBeginState,
} from './begin.js';
import {
  createBoundaryCard,
} from './boundary-card.js';

export const DEMO_RESULT_SCHEMA = 'scopa.demo-result.v1';
export const DEMO_VIEW_RESULT_SCHEMA = 'scopa.demo-view-result.v1';

const DEMO_GATE = fileURLToPath(new URL('./demo-gate.mjs', import.meta.url));
const RESULT_KEYS = new Set(['cleanup', 'faults', 'schema', 'terminal']);
const FAULT_KEYS = new Set(['accepted', 'evidenceCode', 'id', 'injected']);
const TERMINAL_KEYS = new Set([
  'assurance',
  'canStop',
  'sourceMapSha256',
  'status',
  'uncontrolled',
]);
const CLEANUP_KEYS = new Set(['temporaryRepositoryRemoved']);
const EXPECTED_FAULTS = Object.freeze([
  ['scope-escape', 'SCOPA_SCOPE_DENIED'],
  ['asserted-completion', 'SCOPA_COMPLETION_BLOCKED'],
  ['assurance-overclaim', 'SCOPA_ADAPTER_SCHEMA_INVALID'],
]);

export class DemoError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DemoError';
    this.code = 'SCOPA_DEMO_INVALID';
  }
}

function exactObject(value, keys, label) {
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object' ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new DemoError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value);
  const missing = [...keys].filter((key) => !Object.hasOwn(value, key));
  const unknown = actual.filter((key) => !keys.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new DemoError(
      `${label} schema mismatch; missing=[${missing.sort()}] unknown=[${unknown.sort()}]`,
    );
  }
}

export function validateDemoResult(value) {
  exactObject(value, RESULT_KEYS, 'demo result');
  if (value.schema !== DEMO_RESULT_SCHEMA) {
    throw new DemoError('unsupported demo result schema');
  }
  if (!Array.isArray(value.faults) || value.faults.length !== EXPECTED_FAULTS.length) {
    throw new DemoError('demo result must contain the three closed faults');
  }
  for (const [index, [expectedId, expectedCode]] of EXPECTED_FAULTS.entries()) {
    const fault = value.faults[index];
    exactObject(fault, FAULT_KEYS, `faults[${index}]`);
    if (
      fault.id !== expectedId ||
      fault.evidenceCode !== expectedCode ||
      fault.injected !== true ||
      fault.accepted !== false
    ) {
      throw new DemoError(`faults[${index}] does not prove the expected rejection`);
    }
  }
  exactObject(value.terminal, TERMINAL_KEYS, 'demo terminal');
  if (
    value.terminal.status !== 'satisfied' ||
    value.terminal.canStop !== true ||
    value.terminal.assurance !== 'partial' ||
    !Number.isSafeInteger(value.terminal.uncontrolled) ||
    value.terminal.uncontrolled < 1 ||
    typeof value.terminal.sourceMapSha256 !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(value.terminal.sourceMapSha256)
  ) {
    throw new DemoError('demo terminal state is not the expected truthful correction');
  }
  exactObject(value.cleanup, CLEANUP_KEYS, 'demo cleanup');
  if (value.cleanup.temporaryRepositoryRemoved !== true) {
    throw new DemoError('demo cleanup was not verified');
  }
  return deepFreeze(structuredClone(value));
}

function demoRequest() {
  return {
    schema: 'scopa.begin-request.v1',
    sliceId: 'scopa-demo',
    outcome: 'Demonstrate bounded mutation and truthful completion',
    allowedPaths: ['workspace/result.txt'],
    gates: [{
      id: 'demo-gate',
      command: [process.execPath, DEMO_GATE],
      cwd: '.',
      timeoutMs: 10_000,
    }],
    nonGoals: ['No external action'],
    clientProfile: 'generic',
  };
}

async function absent(target) {
  try {
    await access(target);
    return false;
  } catch (error) {
    if (error.code === 'ENOENT') return true;
    throw error;
  }
}

export async function runDemo() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-demo-'));
  const escapeTarget = `${root}-escape.txt`;
  let escapeCleanupAuthorized = false;
  let proof;
  let caught;
  try {
    await mkdir(path.join(root, 'workspace'));
    if (!await absent(escapeTarget)) {
      throw new DemoError('isolated escape sentinel already exists');
    }
    escapeCleanupAuthorized = true;
    const request = demoRequest();
    const begin = await beginSlice({ repoRoot: root, request });
    if (begin.status !== 'blocked' || begin.boundaryMap.completion.canStop) {
      throw new DemoError('asserted completion fault did not remain blocked');
    }

    const project = await loadProject(root);
    const host = createReferenceAgentHost({
      repoRoot: project.repoRoot,
      lock: project.lock,
    });
    let scopeCode = null;
    try {
      await host.invoke({
        name: 'write_file',
        arguments: {
          path: `../${path.basename(escapeTarget)}`,
          content: 'MUST_NOT_EXIST\n',
        },
      });
    } catch (error) {
      scopeCode = error?.code ?? null;
    }
    if (scopeCode !== 'SCOPA_SCOPE_DENIED' || !await absent(escapeTarget)) {
      throw new DemoError('scope escape fault was not denied');
    }

    const beginState = createBeginState(request);
    const overclaim = structuredClone(beginState.capabilityMatrix);
    overclaim.assurance = 'full';
    let overclaimCode = null;
    try {
      validateCapabilityMatrix(overclaim);
    } catch (error) {
      overclaimCode = error?.code ?? null;
    }
    if (overclaimCode !== 'SCOPA_ADAPTER_SCHEMA_INVALID') {
      throw new DemoError('assurance overclaim fault was not rejected');
    }

    await host.invoke({
      name: 'write_file',
      arguments: {
        path: 'workspace/result.txt',
        content: 'DEMO_ALLOWED\n',
      },
    });
    const stopState = await evaluateStopCondition({
      lock: project.lock,
      repoRoot: project.repoRoot,
    });
    const map = createWorkflowBoundaryMap({
      lock: project.lock,
      stopState,
      capabilityMatrix: beginState.capabilityMatrix,
      authorityDeclarations: beginState.authorityDeclarations.declarations,
    });
    const card = createBoundaryCard(map);
    if (!map.completion.canStop || map.assurance.level !== 'partial') {
      throw new DemoError('allowed correction did not reach truthful terminal state');
    }
    proof = {
      faults: [
        {
          id: 'scope-escape',
          injected: true,
          accepted: false,
          evidenceCode: scopeCode,
        },
        {
          id: 'asserted-completion',
          injected: true,
          accepted: false,
          evidenceCode: 'SCOPA_COMPLETION_BLOCKED',
        },
        {
          id: 'assurance-overclaim',
          injected: true,
          accepted: false,
          evidenceCode: overclaimCode,
        },
      ],
      terminal: {
        status: map.completion.status,
        canStop: map.completion.canStop,
        assurance: map.assurance.level,
        uncontrolled: map.summary.uncontrolled,
        sourceMapSha256: card.sourceMapSha256,
      },
    };
  } catch (error) {
    caught = error;
  } finally {
    await rm(root, { recursive: true, force: true });
    if (escapeCleanupAuthorized) {
      await unlink(escapeTarget).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }
  const cleaned = await absent(root) && await absent(escapeTarget);
  if (caught) throw caught;
  return validateDemoResult({
    schema: DEMO_RESULT_SCHEMA,
    faults: proof.faults,
    terminal: proof.terminal,
    cleanup: { temporaryRepositoryRemoved: cleaned },
  });
}

export function renderDemoTerminal(resultValue) {
  const result = validateDemoResult(resultValue);
  return [
    'SCOPA DEMO — THREE REAL FAILURE CHECKS',
    '',
    'PASS  Scope escape denied by the path dispatcher',
    'PASS  Completion claim blocked until the real gate passed',
    'PASS  Full-assurance overclaim rejected for native bypasses',
    '',
    'FINAL  Declared gates satisfied: yes',
    `       Reported assurance: ${result.terminal.assurance}`,
    `       Uncontrolled routes: ${result.terminal.uncontrolled}`,
    '       Temporary workspace removed: yes',
    '',
    `Proof SHA-256 ${jsonHash(result)}`,
    'Local deterministic demonstration; not a security certification or guaranteed prevention claim.',
    '',
  ].join('\n');
}
