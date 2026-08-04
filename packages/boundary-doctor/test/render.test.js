import assert from 'node:assert/strict';
import {
  access,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  executeCommand,
  failureResult,
} from '../../cli/src/command.js';
import {
  createBoundaryDiagnostic,
  renderBoundaryDoctorMarkdown,
  validateBoundaryDoctorReport,
} from '../src/index.js';

const PRIVATE = Object.freeze({
  authorityEvidence: 'credential-name-SCOPA_PRIVATE_TOKEN',
  client: 'private-customer-client',
  gate: 'customer-secret-gate',
  path: 'private-customer-workspace/**',
  prompt: 'prompt: deploy the unreleased private customer system',
  slice: 'private-customer-slice',
});

async function temporaryRoot(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-doctor-render-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function declarationSet(exitCode = 0) {
  return {
    definition: {
      schema: 'scopa.slice-definition.v1',
      sliceId: PRIVATE.slice,
      allowedPaths: [PRIVATE.path],
      amendmentPath: '.scopa/amendment.json',
      gates: [{
        id: PRIVATE.gate,
        command: [process.execPath, '-e', `/* ${PRIVATE.prompt} */ process.exit(${exitCode})`],
        cwd: '.',
        timeoutMs: 5_000,
      }],
      nonGoals: [PRIVATE.prompt],
      stopCondition: { kind: 'all-gates-pass' },
    },
    matrix: {
      schema: 'scopa.capability-matrix.v1',
      subject: {
        adapter: 'private-adapter',
        client: PRIVATE.client,
        transport: 'private-transport',
      },
      capabilities: [
        { id: 'scopa.write_file', category: 'mutate', exposure: 'advertised', mediation: 'scopa-dispatcher', effect: 'MUTATE', evidence: 'private-dispatcher-evidence' },
        { id: 'native.filesystem-write', category: 'mutate', exposure: 'native', mediation: 'uncontrolled', effect: 'MUTATE', evidence: 'private-native-write-evidence' },
        { id: 'native.process-execution', category: 'execute', exposure: 'native', mediation: 'uncontrolled', effect: 'OBSERVE', evidence: 'private-process-evidence' },
        { id: 'native.network', category: 'network', exposure: 'disabled', mediation: 'disabled', effect: null, evidence: 'private-network-evidence' },
        { id: 'native.extensions', category: 'extension', exposure: 'disabled', mediation: 'disabled', effect: null, evidence: 'private-extension-evidence' },
      ],
      assurance: 'partial',
    },
    authority: {
      schema: 'scopa.authority-declarations.v1',
      declarations: [
        { id: 'browser', status: 'disabled' },
        { id: 'credentials', status: 'authority-required' },
        { id: 'deployment', status: 'authority-required' },
        { id: 'external-systems', status: 'authority-required' },
        { id: 'provider', status: 'authority-required' },
        { id: 'publication', status: 'authority-required' },
      ],
    },
  };
}

async function writeDeclarations(root, exitCode = 0) {
  const set = declarationSet(exitCode);
  for (const [name, value] of Object.entries(set)) {
    await writeFile(path.join(root, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
  }
}

function lockArguments(root, format = 'json') {
  return [
    'doctor', '--lock',
    '--definition', 'definition.json',
    '--matrix', 'matrix.json',
    '--authority', 'authority.json',
    '--format', format,
    '--repo', root,
  ];
}

async function invoke(args) {
  try {
    return await executeCommand(args);
  } catch (error) {
    return failureResult(args[0], error);
  }
}

function assertNoPrivateProjection(content, root = null) {
  const forbidden = [
    ...Object.values(PRIVATE),
    'private-adapter',
    'private-transport',
    'private-dispatcher-evidence',
    'definition.json',
    'matrix.json',
    'authority.json',
  ];
  if (root !== null) forbidden.push(root);
  for (const privateValue of forbidden) {
    assert.equal(
      content.includes(privateValue),
      false,
      `shareable projection disclosed ${privateValue}`,
    );
  }
}

test('diagnostic Markdown is digest-bound and omits repository marker paths', async (context) => {
  const root = await temporaryRoot(context);
  await writeFile(path.join(root, 'AGENTS.md'), PRIVATE.prompt);
  await writeFile(path.join(root, '.env.private-customer'), 'SCOPA_PRIVATE_TOKEN=secret-value\n');
  const diagnostic = await createBoundaryDiagnostic({ repoRoot: root });
  const report = renderBoundaryDoctorMarkdown(diagnostic);
  assert.equal(report.sourceSha256, jsonHash(diagnostic));
  assert.equal(report.summary.kind, 'diagnostic');
  assert.equal(report.summary.terminal, null);
  assert.deepEqual(validateBoundaryDoctorReport(report, { source: diagnostic }), report);
  assertNoPrivateProjection(report.content, root);
  assert.equal(report.content.includes('AGENTS.md'), false);
  assert.equal(report.content.includes('.env.private-customer'), false);
  assert.throws(
    () => validateBoundaryDoctorReport({
      ...report,
      sourceSha256: '0'.repeat(64),
    }, { source: diagnostic }),
    /digest contradicts source/,
  );
});

test('JSON and Markdown lock modes retain identical terminal semantics and binding', async (context) => {
  const jsonRoot = await temporaryRoot(context);
  const markdownRoot = await temporaryRoot(context);
  await writeDeclarations(jsonRoot);
  await writeDeclarations(markdownRoot);
  const json = await invoke(lockArguments(jsonRoot));
  const markdown = await invoke(lockArguments(markdownRoot, 'markdown'));
  assert.equal(json.exitCode, 0, JSON.stringify(json.envelope));
  assert.equal(markdown.exitCode, 0, JSON.stringify(markdown.envelope));
  assert.equal(markdown.envelope.result.sourceSha256, jsonHash(json.envelope.result));
  assert.deepEqual(
    markdown.envelope.result.summary.terminal,
    renderBoundaryDoctorMarkdown(json.envelope.result).summary.terminal,
  );
  assert.equal(markdown.envelope.result.summary.terminal.canStop, true);
  assert.equal(markdown.envelope.result.summary.terminal.assurance, 'partial');
  assertNoPrivateProjection(markdown.envelope.result.content, markdownRoot);
});

test('blocked Markdown cannot format a failing lock green or disclose its gate', async (context) => {
  const root = await temporaryRoot(context);
  await writeDeclarations(root, 9);
  const outcome = await invoke(lockArguments(root, 'markdown'));
  assert.equal(outcome.exitCode, 4, JSON.stringify(outcome.envelope));
  assert.equal(outcome.envelope.ok, false);
  assert.equal(outcome.envelope.error.code, 'SCOPA_DOCTOR_LOCK_BLOCKED');
  assert.equal(outcome.envelope.error.message.includes(PRIVATE.gate), false);
  assert.equal(outcome.envelope.error.details.summary.terminal.canStop, false);
  assert.equal(outcome.envelope.error.details.summary.terminal.failedGates, 1);
  assertNoPrivateProjection(outcome.envelope.error.details.content, root);
});

test('unsupported doctor format is rejected before lock mutation', async (context) => {
  const root = await temporaryRoot(context);
  await writeDeclarations(root);
  const outcome = await invoke(lockArguments(root, 'html'));
  assert.equal(outcome.exitCode, 2);
  assert.equal(outcome.envelope.ok, false);
  await assert.rejects(() => access(path.join(root, '.scopa')), { code: 'ENOENT' });
});
