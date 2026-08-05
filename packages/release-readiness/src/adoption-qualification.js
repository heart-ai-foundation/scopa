import { createHash } from 'node:crypto';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  canonicalJsonPretty,
  jsonHash,
} from '../../enforcement/src/index.js';
import {
  invokeCaptured,
} from './subprocess.js';

export const INSTALLED_ADOPTION_QUALIFICATION_SCHEMA =
  'scopa.installed-adoption-qualification.v1';

const SOURCE_ROOT = path.resolve(new URL('../../..', import.meta.url).pathname);
const FIRST_INSIGHT_LIMIT_MS = 30_000;
const PRIVATE_MARKERS = Object.freeze([
  'WORKFLOW_ALPHA',
  'NON_GOAL_BRAVO',
  'GATE_CHARLIE',
  'PROMPT_DELTA',
].map((suffix) => ['S43', 'PRIVATE', suffix].join('_')));
const REQUIRED_PACKED_PATHS = Object.freeze([
  'README.md',
  'SCOPA_AGENT.md',
  'docs/BEGIN.md',
  'docs/ASSISTANT_INSTALLATION.md',
  'docs/BOUNDARY_CARD.md',
  'docs/DEMO.md',
  'docs/GITHUB_ACTION.md',
  'docs/ORGANIZATIONAL_REVIEW.md',
  'schemas/scopa.boundary-card.v1.schema.json',
  'packages/adoption-experience/src/assistant-install.js',
  'packages/adoption-experience/src/begin.js',
  'packages/adoption-experience/src/boundary-card.js',
  'packages/adoption-experience/src/demo.js',
  'packages/adoption-experience/src/pr-report.js',
  'packages/cli/src/cli.js',
  'packages/release-readiness/src/adoption-qualification.js',
]);
const FORBIDDEN_PACKED_PREFIXES = Object.freeze([
  'evidence/',
  'next-prompt-protocols/',
  'notes/',
  'runs/',
  'fixtures/S37/',
  'fixtures/S38/',
  'fixtures/S39/',
  'fixtures/S40/',
  'fixtures/S41/',
  'fixtures/S42/',
  'fixtures/S43/',
]);

export class InstalledAdoptionQualificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InstalledAdoptionQualificationError';
    this.code = 'SCOPA_INSTALLED_ADOPTION_QUALIFICATION_FAILED';
  }
}

function fail(message) {
  throw new InstalledAdoptionQualificationError(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function assertPrivateFree(value, label) {
  if (PRIVATE_MARKERS.some((marker) => value.includes(marker))) {
    fail(`${label} disclosed a private marker`);
  }
}

async function pathAbsent(target) {
  try {
    await access(target);
    return false;
  } catch (error) {
    if (error.code === 'ENOENT') return true;
    throw error;
  }
}

async function treeInventory(root) {
  const entries = [];
  async function walk(relative) {
    const children = await readdir(path.join(root, relative), {
      withFileTypes: true,
    });
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      const childRelative = relative
        ? path.posix.join(relative.split(path.sep).join('/'), child.name)
        : child.name;
      const target = path.join(root, ...childRelative.split('/'));
      if (child.isDirectory()) {
        entries.push({ kind: 'directory', path: `${childRelative}/` });
        await walk(childRelative);
      } else if (child.isFile()) {
        const bytes = await readFile(target);
        entries.push({
          kind: 'file',
          path: childRelative,
          bytes: bytes.length,
          sha256: sha256(bytes),
        });
      } else if (child.isSymbolicLink()) {
        entries.push({ kind: 'symlink', path: childRelative });
      } else {
        entries.push({ kind: 'other', path: childRelative });
      }
    }
  }
  await walk('');
  return entries;
}

function parseEnvelope(result, label) {
  if (result.stderr !== '') fail(`${label} wrote stderr`);
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`${label} did not return JSON: ${error.message}`);
  }
}

async function invokeCli(cli, cwd, args, runtimeEnv, expectedExitCodes = [0]) {
  return invokeCaptured(process.execPath, [cli, ...args], {
    cwd,
    env: runtimeEnv,
    expectedExitCodes,
  });
}

async function qualifyAssistant({
  cli,
  client,
  marker,
  runtimeEnv,
  temporaryRoot,
}) {
  const target = path.join(temporaryRoot, `assistant-${client}`);
  await mkdir(path.join(target, marker), { recursive: true });
  const before = await treeInventory(target);
  const detected = parseEnvelope(await invokeCli(
    cli,
    target,
    ['assistant', 'detect', '--repo', target],
    runtimeEnv,
  ), `${client} detection`);
  if (
    detected.result.status !== 'detected' ||
    !detected.result.candidates.includes(client)
  ) {
    fail(`${client} project surface was not detected`);
  }
  const clean = parseEnvelope(await invokeCli(
    cli,
    target,
    ['assistant', 'install', '--client', client, '--repo', target],
    runtimeEnv,
  ), `${client} clean install`);
  const cold = parseEnvelope(await invokeCli(
    cli,
    target,
    ['assistant', 'install', '--client', client, '--repo', target],
    runtimeEnv,
  ), `${client} cold install`);
  if (
    clean.result.status !== 'installed' ||
    cold.result.status !== 'installed' ||
    cold.result.created.length !== 0
  ) {
    fail(`${client} clean/cold installation did not remain idempotent`);
  }
  for (const created of clean.result.created) {
    const lexical = path.relative(target, path.resolve(target, created));
    if (
      lexical === '..' ||
      lexical.startsWith(`..${path.sep}`) ||
      path.isAbsolute(lexical)
    ) fail(`${client} installation escaped the project`);
  }
  const removed = parseEnvelope(await invokeCli(
    cli,
    target,
    ['assistant', 'uninstall', '--repo', target],
    runtimeEnv,
  ), `${client} uninstall`);
  if (removed.result.status !== 'removed') {
    fail(`${client} uninstall did not remove its receipt-bound files`);
  }
  const after = await treeInventory(target);
  if (jsonHash(after) !== jsonHash(before)) {
    fail(`${client} uninstall did not restore the project inventory`);
  }
  return {
    client,
    detected: true,
    cleanInstalled: true,
    coldIdempotent: true,
    uninstalled: true,
    restoredInventorySha256: jsonHash(after),
  };
}

function normalizeTarInventory(stdout) {
  return stdout
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.replace(/^package\//u, '').replace(/\/$/u, ''))
    .filter(Boolean)
    .sort();
}

function validatePackedInventory(inventory) {
  const packed = new Set(inventory);
  for (const required of REQUIRED_PACKED_PATHS) {
    if (!packed.has(required)) fail(`package is missing ${required}`);
  }
  for (const packedPath of inventory) {
    if (FORBIDDEN_PACKED_PREFIXES.some((prefix) => packedPath.startsWith(prefix))) {
      fail(`package contains qualification-only path ${packedPath}`);
    }
  }
}

async function sourceCommit(sourceRoot) {
  const result = await invokeCaptured('git', ['rev-parse', 'HEAD'], {
    cwd: sourceRoot,
    env: { PATH: process.env.PATH },
  });
  const commit = result.stdout.trim();
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail('source commit is unavailable');
  return commit;
}

function beginRequest() {
  return {
    schema: 'scopa.begin-request.v1',
    sliceId: 'S43-installed-adoption',
    outcome: PRIVATE_MARKERS[0],
    allowedPaths: ['workspace/result.txt'],
    gates: [{
      id: PRIVATE_MARKERS[2],
      command: [
        process.execPath,
        '-e',
        "const fs=require('node:fs');const p='workspace/result.txt';process.exit(fs.existsSync(p)&&fs.readFileSync(p,'utf8')==='S43_ALLOWED\\n'?0:1)",
      ],
      cwd: '.',
      timeoutMs: 10_000,
    }],
    nonGoals: [PRIVATE_MARKERS[1]],
    clientProfile: 'codex',
  };
}

export async function qualifyInstalledAdoption({
  sourceRoot = SOURCE_ROOT,
} = {}) {
  const root = path.resolve(sourceRoot);
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), 'scopa-s43-installed-'),
  );
  let result;
  let caught;
  try {
    const packageDocument = JSON.parse(
      await readFile(path.join(root, 'package.json'), 'utf8'),
    );
    const commit = await sourceCommit(root);
    const packed = await invokeCaptured('npm', [
      'pack', '--json', '--pack-destination', temporaryRoot,
    ], {
      cwd: root,
      env: { PATH: process.env.PATH },
    });
    const packResult = JSON.parse(packed.stdout);
    const archive = path.join(temporaryRoot, packResult[0].filename);
    const archiveBytes = await readFile(archive);
    const archiveMetadata = await stat(archive);
    const tar = await invokeCaptured('tar', ['-tzf', archive], {
      cwd: temporaryRoot,
      env: { PATH: process.env.PATH },
    });
    const packedInventory = normalizeTarInventory(tar.stdout);
    validatePackedInventory(packedInventory);

    const toolRoot = path.join(temporaryRoot, 'tool');
    await mkdir(toolRoot);
    await writeFile(
      path.join(toolRoot, 'package.json'),
      '{"name":"scopa-s43-qualification","private":true}\n',
      { flag: 'wx', mode: 0o600 },
    );
    await invokeCaptured('npm', [
      'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
      '--package-lock=false', archive,
    ], {
      cwd: toolRoot,
      env: { PATH: process.env.PATH },
    });
    const installedRoot = await realpath(path.join(
      toolRoot,
      'node_modules/@heart-ai-foundation/scopa',
    ));
    if (installedRoot === root || installedRoot.startsWith(`${root}${path.sep}`)) {
      fail('installed package resolved into the source checkout');
    }
    const cli = path.join(installedRoot, 'packages/cli/src/cli.js');
    await access(cli);

    const networkSentinel = path.join(temporaryRoot, 'network-attempted');
    const networkGuard = path.join(temporaryRoot, 'network-guard.mjs');
    await writeFile(networkGuard, [
      "import net from 'node:net';",
      "import { appendFileSync } from 'node:fs';",
      'const deny = () => {',
      "  appendFileSync(process.env.SCOPA_NETWORK_SENTINEL, 'attempted\\n');",
      "  const error = new Error('network use forbidden by S43 qualification');",
      "  error.code = 'SCOPA_NETWORK_FORBIDDEN';",
      '  throw error;',
      '};',
      'globalThis.fetch = deny;',
      'net.Socket.prototype.connect = deny;',
      'net.connect = deny;',
      'net.createConnection = deny;',
      '',
    ].join('\n'), { flag: 'wx', mode: 0o600 });
    const runtimeEnv = {
      CI: '1',
      LANG: 'C.UTF-8',
      PATH: process.env.PATH,
      NODE_OPTIONS: `--import=${networkGuard}`,
      SCOPA_NETWORK_SENTINEL: networkSentinel,
    };

    const insightTarget = path.join(temporaryRoot, 'insight-target');
    await mkdir(path.join(insightTarget, '.git'), { recursive: true });
    await writeFile(path.join(insightTarget, 'package.json'), JSON.stringify({
      name: 's43-insight-target',
      private: true,
      scripts: { test: 'node --test' },
    }));
    await writeFile(
      path.join(insightTarget, 'AGENTS.md'),
      `${PRIVATE_MARKERS[3]}\n`,
    );
    const insightBefore = await treeInventory(insightTarget);
    const insightStarted = process.hrtime.bigint();
    const insight = await invokeCli(cli, insightTarget, [], runtimeEnv);
    const insightDurationMs = Number(
      (process.hrtime.bigint() - insightStarted) / 1_000_000n,
    );
    const insightAfter = await treeInventory(insightTarget);
    if (
      insightDurationMs >= FIRST_INSIGHT_LIMIT_MS ||
      !insight.stdout.startsWith('SCOPA boundary snapshot\n') ||
      !insight.stdout.includes('A possible completion check is available: npm test.') ||
      jsonHash(insightBefore) !== jsonHash(insightAfter)
    ) fail('installed first insight did not meet the bounded no-write contract');
    assertPrivateFree(insight.stdout, 'first insight');
    if (insight.stdout.includes(insightTarget)) fail('first insight disclosed its target path');

    const taskTarget = path.join(temporaryRoot, 'task-target');
    await mkdir(path.join(taskTarget, '.git'), { recursive: true });
    await mkdir(path.join(taskTarget, 'workspace'));
    await writeFile(
      path.join(taskTarget, 'AGENTS.md'),
      `${PRIVATE_MARKERS[3]}\n`,
    );
    const controlPaths = [
      '.scopa/config.json',
      '.scopa/slice-lock.json',
      '.scopa/begin-state.json',
    ];
    const manualControlFiles = (await Promise.all(controlPaths.map(async (relative) =>
      !(await pathAbsent(path.join(taskTarget, relative))))))
      .filter(Boolean).length;
    if (manualControlFiles !== 0) fail('task target already contained SCOPA control state');
    const begin = parseEnvelope(await invokeCli(
      cli,
      taskTarget,
      ['begin', '--request-json', JSON.stringify(beginRequest()), '--repo', taskTarget],
      runtimeEnv,
      [4],
    ), 'installed begin');
    if (
      begin.result.status !== 'blocked' ||
      begin.result.boundaryMap.completion.canStop !== false ||
      begin.result.boundaryMap.assurance.level !== 'partial'
    ) fail('installed begin did not preserve blocked partial polarity');
    for (const relative of controlPaths) await access(path.join(taskTarget, relative));
    const scopaEntries = (await readdir(path.join(taskTarget, '.scopa'))).sort();
    if (JSON.stringify(scopaEntries) !== JSON.stringify([
      'begin-state.json', 'config.json', 'slice-lock.json',
    ])) fail('runtime-owned begin created an unexpected control surface');

    const mutation = parseEnvelope(await invokeCli(
      cli,
      taskTarget,
      [
        'run', '--request-json', JSON.stringify({
          name: 'write_file',
          arguments: { path: 'workspace/result.txt', content: 'S43_ALLOWED\n' },
        }),
        '--repo', taskTarget,
      ],
      runtimeEnv,
    ), 'installed governed mutation');
    if (mutation.result.written !== true) {
      fail('installed governed mutation did not write the allowed result');
    }
    const check = parseEnvelope(await invokeCli(
      cli,
      taskTarget,
      ['check', '--repo', taskTarget],
      runtimeEnv,
    ), 'installed completion check');
    if (check.result.canStop !== true) fail('installed completion remained blocked');

    const jsonView = await invokeCli(
      cli,
      taskTarget,
      [
        'view', '--format', 'json', '--output', 'scopa-boundary.json',
        '--repo', taskTarget,
      ],
      runtimeEnv,
    );
    const htmlView = await invokeCli(
      cli,
      taskTarget,
      [
        'view', '--format', 'html', '--output', 'scopa-boundary.html',
        '--repo', taskTarget,
      ],
      runtimeEnv,
    );
    const cardText = await readFile(
      path.join(taskTarget, 'scopa-boundary.json'),
      'utf8',
    );
    const html = await readFile(
      path.join(taskTarget, 'scopa-boundary.html'),
      'utf8',
    );
    const card = JSON.parse(cardText);
    if (
      !jsonView.stdout.startsWith('SCOPA Boundary Card exported') ||
      !htmlView.stdout.startsWith('SCOPA Boundary Card exported') ||
      card.assurance.level !== 'partial' ||
      card.completion.canStop !== true ||
      !html.includes(`data-source-map-sha256="${card.sourceMapSha256}"`) ||
      !html.startsWith('<!doctype html>') ||
      !html.includes('<html lang="en">') ||
      !html.includes('aria-labelledby="card-title"') ||
      /<script|\son[a-z]+=|https?:|url\(/iu.test(html)
    ) fail('installed Boundary Card failed semantic or accessibility checks');
    assertPrivateFree(cardText, 'Boundary Card JSON');
    assertPrivateFree(html, 'Boundary Card HTML');

    const prModule = await import(pathToFileURL(path.join(
      installedRoot,
      'packages/adoption-experience/src/pr-report.js',
    )).href);
    let networkCalled = false;
    const fetchImpl = async () => {
      networkCalled = true;
      throw new Error('network use forbidden');
    };
    const validSummary = path.join(temporaryRoot, 'valid-pr-summary.md');
    const missingSummary = path.join(temporaryRoot, 'missing-pr-summary.md');
    const validReport = await prModule.runPullRequestReport({
      GITHUB_WORKSPACE: taskTarget,
      GITHUB_STEP_SUMMARY: validSummary,
      INPUT_CARD_PATH: 'scopa-boundary.json',
      INPUT_COMMENT: 'false',
    }, { fetchImpl });
    const missingReport = await prModule.runPullRequestReport({
      GITHUB_WORKSPACE: taskTarget,
      GITHUB_STEP_SUMMARY: missingSummary,
      INPUT_CARD_PATH: 'missing-boundary.json',
      INPUT_COMMENT: 'false',
    }, { fetchImpl });
    const validSummaryText = await readFile(validSummary, 'utf8');
    const missingSummaryText = await readFile(missingSummary, 'utf8');
    if (
      validReport.evidence !== 'validated-card' ||
      missingReport.evidence !== 'unavailable' ||
      !missingSummaryText.includes('UNKNOWN') ||
      networkCalled
    ) fail('installed PR reporting lost evidence or no-network polarity');
    assertPrivateFree(validSummaryText, 'valid PR summary');
    assertPrivateFree(missingSummaryText, 'missing PR summary');

    const expectedDemo = await readFile(
      path.join(root, 'fixtures/S43/expected-demo-output.txt'),
      'utf8',
    );
    const demo = await invokeCli(cli, temporaryRoot, ['demo'], runtimeEnv);
    if (demo.stdout !== expectedDemo) fail('installed demo output drifted from S42');

    const assistants = [];
    assistants.push(await qualifyAssistant({
      cli,
      client: 'claude-code',
      marker: '.claude',
      runtimeEnv,
      temporaryRoot,
    }));
    assistants.push(await qualifyAssistant({
      cli,
      client: 'codex',
      marker: '.codex',
      runtimeEnv,
      temporaryRoot,
    }));

    const installedInventory = await treeInventory(installedRoot);
    const privacyModule = await import(pathToFileURL(path.join(
      installedRoot,
      'packages/release-readiness/src/package-privacy.js',
    )).href);
    const privacyFindings = await privacyModule.scanPackagePrivacy({
      installedRoot,
      files: installedInventory
        .filter((entry) =>
          entry.kind === 'file' && !entry.path.startsWith('node_modules/'))
        .map((entry) => ({ path: entry.path })),
      forbiddenValues: [root, temporaryRoot, installedRoot, ...PRIVATE_MARKERS],
    });
    if (privacyFindings.length !== 0) {
      fail(`installed package privacy scan failed: ${JSON.stringify(privacyFindings)}`);
    }
    if (!await pathAbsent(networkSentinel)) fail('a runtime network attempt occurred');

    result = {
      schema: INSTALLED_ADOPTION_QUALIFICATION_SCHEMA,
      source: {
        commit,
        packageName: packageDocument.name,
        packageVersion: packageDocument.version,
      },
      artifact: {
        tarballSha256: sha256(archiveBytes),
        tarballBytes: archiveMetadata.size,
        packedEntryCount: packedInventory.length,
        packedInventorySha256: jsonHash(packedInventory),
        requiredPathsPresent: true,
        qualificationOnlyPathsPresent: false,
        installedOutsideSourceCheckout: true,
      },
      firstInsight: {
        durationMs: insightDurationMs,
        limitMs: FIRST_INSIGHT_LIMIT_MS,
        underLimit: true,
        targetUnchanged: true,
        targetInventorySha256: jsonHash(insightAfter),
        outputSha256: sha256(insight.stdout),
      },
      taskBootstrap: {
        manualControlFiles,
        runtimeOwnedControlFiles: controlPaths,
        initiallyBlocked: true,
        governedAllowedWrite: true,
        terminalCanStop: true,
        assurance: 'partial',
      },
      assistants,
      demo: {
        exactQualifiedOutput: true,
        outputSha256: sha256(demo.stdout),
        proofSha256: /^Proof SHA-256 ([0-9a-f]{64})$/mu.exec(demo.stdout)?.[1],
      },
      boundaryCard: {
        sourceMapSha256: card.sourceMapSha256,
        jsonSha256: sha256(cardText),
        htmlSha256: sha256(html),
        accessibleStandaloneHtml: true,
        privateMarkerFindings: 0,
      },
      pullRequestReport: {
        validEvidence: validReport.evidence,
        missingEvidence: missingReport.evidence,
        validSummarySha256: sha256(validSummaryText),
        missingSummarySha256: sha256(missingSummaryText),
        networkCalled,
        commentEnabled: false,
      },
      privacy: {
        installedFirstPartyFindings: privacyFindings.length,
        shareablePrivateMarkerFindings: 0,
      },
      network: {
        runtimeGuardActive: true,
        attempts: 0,
      },
    };
  } catch (error) {
    caught = error;
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
  const temporaryRootRemoved = await pathAbsent(temporaryRoot);
  if (caught) throw caught;
  if (!temporaryRootRemoved) fail('qualification temporary root survived cleanup');
  return Object.freeze({
    ...result,
    cleanup: { temporaryRootRemoved },
  });
}

export function renderInstalledAdoptionQualification(value) {
  if (value?.schema !== INSTALLED_ADOPTION_QUALIFICATION_SCHEMA) {
    fail('installed adoption receipt has an unsupported schema');
  }
  return canonicalJsonPretty(value);
}
