import {
  RELEASE_BINS,
  RELEASE_LICENSE,
  RELEASE_PACKAGE_NAME,
  RELEASE_SCHEMAS,
  RELEASE_VERSION,
} from './constants.js';

function fail(message) {
  throw new TypeError(message);
}

function object(value, name) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    fail(`${name} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, name) {
  object(value, name);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(
      `${name} keys must be exactly ${expected.join(', ')}; received ` +
      actual.join(', '),
    );
  }
}

function literal(value, expected, name) {
  if (value !== expected) {
    fail(`${name} must equal ${JSON.stringify(expected)}`);
  }
}

function nonempty(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    fail(`${name} must be a non-empty string`);
  }
}

function bool(value, name) {
  if (typeof value !== 'boolean') fail(`${name} must be boolean`);
}

function integer(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail(`${name} must be a non-negative safe integer`);
  }
}

function stringArray(value, name) {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'string' || item.length === 0)
  ) {
    fail(`${name} must be an array of non-empty strings`);
  }
}

export function validateReleasePosture(value) {
  exactKeys(value, [
    'schema',
    'project',
    'publisher',
    'version',
    'license',
    'contributions',
    'naming',
    'publication',
    'freeToolBoundary',
  ], 'release posture');
  literal(value.schema, RELEASE_SCHEMAS.posture, 'release posture schema');
  literal(value.project, 'SCOPA', 'release posture project');
  literal(value.publisher, 'Heart AI Foundation', 'release posture publisher');
  literal(value.version, RELEASE_VERSION, 'release posture version');
  literal(value.license, RELEASE_LICENSE, 'release posture license');

  exactKeys(value.contributions, [
    'model',
    'requiresSignoff',
    'claRequired',
  ], 'release posture contributions');
  literal(value.contributions.model, 'DCO-1.1', 'contribution model');
  literal(value.contributions.requiresSignoff, true, 'DCO signoff');
  literal(value.contributions.claRequired, false, 'CLA posture');

  exactKeys(value.naming, [
    'package',
    'bins',
    'trademarkStatus',
  ], 'release posture naming');
  literal(value.naming.package, RELEASE_PACKAGE_NAME, 'package name');
  exactKeys(value.naming.bins, ['scopa', 'scopa-mcp'], 'release posture bins');
  literal(value.naming.bins.scopa, RELEASE_BINS.scopa, 'scopa bin');
  literal(
    value.naming.bins['scopa-mcp'],
    RELEASE_BINS['scopa-mcp'],
    'scopa-mcp bin',
  );
  literal(
    value.naming.trademarkStatus,
    'working-name-no-registration-claim',
    'trademark status',
  );

  exactKeys(value.publication, [
    'repositoryVisibility',
    'artifactChannel',
    'npm',
    'githubRelease',
    'publicRelease',
    'production',
    'requiresSeparatePrincipalApproval',
  ], 'release posture publication');
  literal(
    value.publication.repositoryVisibility,
    'private',
    'repository visibility',
  );
  literal(
    value.publication.artifactChannel,
    'local-tarball',
    'artifact channel',
  );
  for (const key of ['npm', 'githubRelease', 'publicRelease', 'production']) {
    literal(value.publication[key], false, `publication ${key}`);
  }
  literal(
    value.publication.requiresSeparatePrincipalApproval,
    true,
    'separate publication approval',
  );

  exactKeys(value.freeToolBoundary, [
    'verificationPaidDependency',
    'consultationBoundary',
  ], 'free-tool boundary');
  literal(
    value.freeToolBoundary.verificationPaidDependency,
    false,
    'verification paid dependency',
  );
  stringArray(
    value.freeToolBoundary.consultationBoundary,
    'consultation boundary',
  );
  return structuredClone(value);
}

function validateCandidateFile(value, index) {
  exactKeys(value, ['path', 'size', 'mode'], `candidate file ${index}`);
  nonempty(value.path, `candidate file ${index} path`);
  if (
    value.path.startsWith('/') ||
    value.path.split('/').includes('..') ||
    value.path.includes('\\')
  ) {
    fail(`candidate file ${index} path must be normalized and relative`);
  }
  integer(value.size, `candidate file ${index} size`);
  integer(value.mode, `candidate file ${index} mode`);
}

export function validateCandidateManifest(value) {
  exactKeys(value, [
    'schema',
    'source',
    'package',
    'files',
  ], 'candidate manifest');
  literal(
    value.schema,
    RELEASE_SCHEMAS.candidateManifest,
    'candidate manifest schema',
  );
  exactKeys(value.source, ['commit', 'dirty'], 'candidate source');
  if (!/^[0-9a-f]{40}$/.test(value.source.commit)) {
    fail('candidate source commit must be a full lowercase Git SHA');
  }
  literal(value.source.dirty, false, 'candidate source dirty');

  exactKeys(value.package, [
    'name',
    'version',
    'filename',
    'entryCount',
    'packedBytes',
    'unpackedBytes',
    'shasum',
    'integrity',
    'sha256',
  ], 'candidate package');
  literal(value.package.name, RELEASE_PACKAGE_NAME, 'candidate package name');
  literal(value.package.version, RELEASE_VERSION, 'candidate package version');
  nonempty(value.package.filename, 'candidate filename');
  integer(value.package.entryCount, 'candidate entry count');
  integer(value.package.packedBytes, 'candidate packed bytes');
  integer(value.package.unpackedBytes, 'candidate unpacked bytes');
  if (!/^[0-9a-f]{40}$/.test(value.package.shasum)) {
    fail('candidate shasum must be SHA-1 hex');
  }
  if (!/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(value.package.integrity)) {
    fail('candidate integrity must be an npm SHA-512 integrity value');
  }
  if (!/^[0-9a-f]{64}$/.test(value.package.sha256)) {
    fail('candidate SHA-256 must be lowercase hex');
  }
  if (!Array.isArray(value.files) || value.files.length === 0) {
    fail('candidate files must be a non-empty array');
  }
  value.files.forEach(validateCandidateFile);
  const paths = value.files.map((entry) => entry.path);
  if (new Set(paths).size !== paths.length) {
    fail('candidate file paths must be unique');
  }
  if (JSON.stringify(paths) !== JSON.stringify([...paths].sort())) {
    fail('candidate file paths must be sorted');
  }
  literal(
    value.package.entryCount,
    value.files.length,
    'candidate entry count',
  );
  return structuredClone(value);
}

export function validateConsumerProof(value) {
  exactKeys(value, [
    'schema',
    'candidate',
    'policyAudit',
    'environment',
    'install',
    'adapter',
    'verification',
    'knownFailing',
    'claimBoundary',
  ], 'consumer proof');
  literal(
    value.schema,
    RELEASE_SCHEMAS.consumerProof,
    'consumer proof schema',
  );
  validateCandidateManifest(value.candidate);

  exactKeys(value.policyAudit, ['ok', 'sha256'], 'consumer policy audit');
  literal(value.policyAudit.ok, true, 'consumer policy audit ok');
  if (!/^[0-9a-f]{64}$/.test(value.policyAudit.sha256)) {
    fail('consumer policy audit SHA-256 must be lowercase hex');
  }

  exactKeys(value.environment, [
    'node',
    'npm',
    'sourceRoot',
    'temporaryRoot',
  ], 'consumer environment');
  nonempty(value.environment.node, 'consumer Node version');
  nonempty(value.environment.npm, 'consumer npm version');
  nonempty(value.environment.sourceRoot, 'consumer source root');
  nonempty(value.environment.temporaryRoot, 'consumer temporary root');

  exactKeys(value.install, [
    'exitCode',
    'sourceFree',
    'monorepoRelativeReferences',
  ], 'consumer install');
  literal(value.install.exitCode, 0, 'consumer install exit code');
  literal(value.install.sourceFree, true, 'source-free install');
  if (
    !Array.isArray(value.install.monorepoRelativeReferences) ||
    value.install.monorepoRelativeReferences.length !== 0
  ) {
    fail('monorepo-relative references must be an empty array');
  }

  exactKeys(value.adapter, [
    'schema',
    'toolNames',
    'allowedWrite',
    'scopeDenied',
    'terminal',
    'assurance',
  ], 'consumer adapter');
  nonempty(value.adapter.schema, 'consumer adapter schema');
  stringArray(value.adapter.toolNames, 'consumer adapter tool names');
  literal(value.adapter.allowedWrite, true, 'consumer allowed write');
  literal(value.adapter.scopeDenied, true, 'consumer scope denial');
  exactKeys(value.adapter.terminal, ['status', 'canStop'], 'adapter terminal');
  literal(value.adapter.terminal.status, 'satisfied', 'adapter status');
  literal(value.adapter.terminal.canStop, true, 'adapter canStop');
  nonempty(value.adapter.assurance, 'consumer adapter assurance');

  exactKeys(value.verification, [
    'exitCode',
    'nativePacket',
    'ok',
  ], 'consumer verification');
  literal(value.verification.exitCode, 0, 'verification exit code');
  literal(value.verification.nativePacket, true, 'native packet verification');
  literal(value.verification.ok, true, 'verification ok');

  exactKeys(value.knownFailing, [
    'exitCode',
    'code',
    'canStop',
  ], 'known-failing fixture');
  literal(value.knownFailing.exitCode, 4, 'known-failing exit code');
  literal(
    value.knownFailing.code,
    'SCOPA_COMPLETION_BLOCKED',
    'known-failing code',
  );
  literal(value.knownFailing.canStop, false, 'known-failing canStop');

  exactKeys(value.claimBoundary, [
    'verified',
    'nonClaims',
  ], 'consumer claim boundary');
  stringArray(value.claimBoundary.verified, 'verified claims');
  stringArray(value.claimBoundary.nonClaims, 'non-claims');
  return structuredClone(value);
}

export function validatePolicyAudit(value) {
  exactKeys(value, [
    'schema',
    'ok',
    'checks',
  ], 'policy audit');
  literal(
    value.schema,
    RELEASE_SCHEMAS.policyAudit,
    'policy audit schema',
  );
  bool(value.ok, 'policy audit ok');
  if (!Array.isArray(value.checks) || value.checks.length === 0) {
    fail('policy audit checks must be a non-empty array');
  }
  for (const [index, check] of value.checks.entries()) {
    exactKeys(check, ['id', 'passed', 'evidence'], `policy check ${index}`);
    nonempty(check.id, `policy check ${index} id`);
    bool(check.passed, `policy check ${index} passed`);
    nonempty(check.evidence, `policy check ${index} evidence`);
  }
  literal(
    value.ok,
    value.checks.every((check) => check.passed),
    'policy audit aggregate',
  );
  return structuredClone(value);
}
