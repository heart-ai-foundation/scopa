#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function argumentsFor(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!['--cli', '--repo', '--result', '--task'].includes(flag) || value === undefined) {
      throw new Error('usage: point-and-go-client --cli <file> --repo <dir> --task <file> --result <file>');
    }
    values[flag.slice(2)] = value;
  }
  if (!values.cli || !values.repo || !values.result || !values.task) {
    throw new Error('cli, repo, result, and task are required');
  }
  return values;
}

async function command(runtime, repo, args, expectedExit = 0) {
  let outcome;
  try {
    outcome = await runtime.executeCommand([...args, '--repo', repo]);
  } catch (error) {
    outcome = runtime.failureResult(args[0], error);
  }
  if (outcome.exitCode !== expectedExit) {
    throw new Error(`scopa command failed with exit ${outcome.exitCode}`);
  }
  return outcome.envelope;
}

const options = argumentsFor(process.argv.slice(2));
const repo = path.resolve(options.repo);
const runtime = await import(pathToFileURL(path.join(
  path.dirname(path.resolve(options.cli)),
  'command.js',
)));
const task = await readFile(path.resolve(options.task), 'utf8');
if (task.trim() !== 'Create workspace/result.txt containing exactly: point-and-go complete') {
  throw new Error('unexpected deterministic task');
}

const definition = {
  schema: 'scopa.slice-definition.v1',
  sliceId: 'point-and-go-installed',
  allowedPaths: ['workspace/**'],
  amendmentPath: '.scopa/amendment.json',
  gates: [{
    id: 'result-content',
    command: [
      process.execPath,
      '-e',
      "const fs=require('fs');process.exit(fs.readFileSync('workspace/result.txt','utf8')==='point-and-go complete\\n'?0:7)",
    ],
    cwd: '.',
    timeoutMs: 30000,
  }],
  nonGoals: ['No dependency changes', 'No deployment or publication'],
  stopCondition: { kind: 'all-gates-pass' },
};
const matrix = {
  schema: 'scopa.capability-matrix.v1',
  subject: {
    adapter: 'SCOPA_AGENT.md@0.2.0',
    client: 'point-and-go-consumer@0.2.0',
    transport: 'native-agent-session',
  },
  capabilities: [
    {
      id: 'scopa.write_file',
      category: 'mutate',
      exposure: 'advertised',
      mediation: 'scopa-dispatcher',
      effect: 'MUTATE',
      evidence: 'product write submitted through scopa run',
    },
    {
      id: 'native.filesystem-write',
      category: 'mutate',
      exposure: 'native',
      mediation: 'uncontrolled',
      effect: 'MUTATE',
      evidence: 'fixture bootstrap can create control-plane files',
    },
    {
      id: 'native.process-execution',
      category: 'execute',
      exposure: 'native',
      mediation: 'uncontrolled',
      effect: 'OBSERVE',
      evidence: 'fixture launches the SCOPA CLI',
    },
    {
      id: 'native.network',
      category: 'network',
      exposure: 'disabled',
      mediation: 'disabled',
      effect: null,
      evidence: 'installed journey performs no network request',
    },
    {
      id: 'native.extensions',
      category: 'extension',
      exposure: 'disabled',
      mediation: 'disabled',
      effect: null,
      evidence: 'fixture loads no plugin or extension',
    },
  ],
  assurance: 'partial',
};
const authority = {
  schema: 'scopa.authority-declarations.v1',
  declarations: [
    { id: 'browser', status: 'disabled' },
    { id: 'credentials', status: 'authority-required' },
    { id: 'deployment', status: 'authority-required' },
    { id: 'external-systems', status: 'authority-required' },
    { id: 'provider', status: 'authority-required' },
    { id: 'publication', status: 'authority-required' },
  ],
};

await writeFile(
  path.join(repo, 'scopa.slice-definition.json'),
  `${JSON.stringify(definition, null, 2)}\n`,
);
await writeFile(
  path.join(repo, 'scopa.capability-matrix.json'),
  `${JSON.stringify(matrix, null, 2)}\n`,
);
await writeFile(
  path.join(repo, 'scopa.authority-declarations.json'),
  `${JSON.stringify(authority, null, 2)}\n`,
);

await command(runtime, repo, [
  'init', '--definition', 'scopa.slice-definition.json',
]);
const mapArguments = [
  'map',
  '--matrix', 'scopa.capability-matrix.json',
  '--authority', 'scopa.authority-declarations.json',
];
const before = await command(runtime, repo, mapArguments);
const allowed = await command(runtime, repo, [
  'run',
  '--request-json',
  JSON.stringify({
    name: 'write_file',
    arguments: {
      path: 'workspace/result.txt',
      content: 'point-and-go complete\n',
    },
  }),
]);
const denied = await command(runtime, repo, [
  'run',
  '--request-json',
  JSON.stringify({
    name: 'write_file',
    arguments: {
      path: '../escape.txt',
      content: 'must not exist\n',
    },
  }),
], 3);
const check = await command(runtime, repo, ['check']);
const after = await command(runtime, repo, mapArguments);

const report = {
  schema: 'scopa.point-and-go-result.v1',
  taskAccepted: true,
  preMutation: {
    assurance: before.result.assurance.level,
    canStop: before.result.completion.canStop,
    uncontrolled: before.result.summary.uncontrolled,
  },
  allowedWrite: allowed.ok,
  deniedEscape: {
    denied: denied.ok === false,
    code: denied.error.code,
  },
  terminal: {
    canStop: check.result.canStop,
    assurance: after.result.assurance.level,
    mapSchema: after.result.schema,
  },
};
await writeFile(
  path.resolve(options.result),
  `${JSON.stringify(report, null, 2)}\n`,
  { flag: 'wx', mode: 0o600 },
);
