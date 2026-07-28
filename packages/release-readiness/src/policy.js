import {
  createHash,
} from 'node:crypto';
import {
  access,
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  RELEASE_BINS,
  RELEASE_LICENSE,
  RELEASE_LICENSE_SHA256,
  RELEASE_PACKAGE_NAME,
  RELEASE_SCHEMAS,
  RELEASE_VERSION,
  REQUIRED_POLICY_PATHS,
} from './constants.js';
import {
  validatePolicyAudit,
  validateReleasePosture,
} from './schema.js';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function includesAll(text, phrases) {
  return phrases.every((phrase) => text.includes(phrase));
}

export async function auditReleasePolicies({ root }) {
  const sourceRoot = path.resolve(root);
  const checks = [];
  const add = (id, passed, evidence) => {
    checks.push({ id, passed: Boolean(passed), evidence });
  };
  const read = async (relativePath) =>
    readFile(path.join(sourceRoot, relativePath), 'utf8');

  for (const relativePath of REQUIRED_POLICY_PATHS) {
    add(
      `required-file:${relativePath}`,
      await exists(path.join(sourceRoot, relativePath)),
      `required release surface ${relativePath}`,
    );
  }

  let packageJson = null;
  try {
    packageJson = JSON.parse(await read('package.json'));
    add(
      'package-identity',
      packageJson.name === RELEASE_PACKAGE_NAME &&
        packageJson.version === RELEASE_VERSION &&
        packageJson.license === RELEASE_LICENSE,
      `${packageJson.name}@${packageJson.version} license=${packageJson.license}`,
    );
    add(
      'package-private',
      packageJson.private === true,
      'package.json private must remain true for private evaluation',
    );
    add(
      'package-binaries',
      JSON.stringify(packageJson.bin) === JSON.stringify(RELEASE_BINS),
      'package exposes only the approved scopa and scopa-mcp binaries',
    );
    const fileRules = Array.isArray(packageJson.files)
      ? packageJson.files
      : [];
    add(
      'package-public-surfaces',
      [
        'LICENSE',
        'SECURITY.md',
        'CONTRIBUTING.md',
        'GOVERNANCE.md',
        'docs/**',
        'schemas/**',
        'fixtures/S10/**',
      ].every((entry) => fileRules.includes(entry)),
      'package allowlist includes license, policy, docs, schemas, and S10 fixtures',
    );
  } catch (error) {
    add('package-identity', false, `package.json error: ${error.message}`);
  }

  try {
    const license = await read('LICENSE');
    add(
      'license-exact',
      sha256(license) === RELEASE_LICENSE_SHA256,
      `Apache-2.0 text SHA-256 ${sha256(license)}`,
    );
  } catch (error) {
    add('license-exact', false, `LICENSE error: ${error.message}`);
  }

  try {
    const posture = validateReleasePosture(
      JSON.parse(await read('docs/release-posture.json')),
    );
    add(
      'release-posture-closed',
      posture.publication.npm === false &&
        posture.publication.publicRelease === false &&
        posture.publication.repositoryVisibility === 'private',
      'closed release posture preserves private tarball-only evaluation',
    );
  } catch (error) {
    add(
      'release-posture-closed',
      false,
      `release posture error: ${error.message}`,
    );
  }

  const contentChecks = [
    {
      id: 'security-route',
      path: 'SECURITY.md',
      phrases: [
        'Do not open a public issue',
        'https://empathyethicist.ai/contact/',
        'do not include exploit details',
      ],
    },
    {
      id: 'contribution-dco',
      path: 'CONTRIBUTING.md',
      phrases: ['Developer Certificate of Origin', 'Signed-off-by', 'no CLA'],
    },
    {
      id: 'governance-authority',
      path: 'GOVERNANCE.md',
      phrases: [
        'Heart AI Foundation',
        'separate principal approval',
        'verification',
      ],
    },
    {
      id: 'quickstart-source-free',
      path: 'docs/QUICKSTART.md',
      phrases: [
        '0.2.0-dev.1.tgz',
        'scopa init',
        'scopa-mcp',
        'SCOPA_SCOPE_DENIED',
      ],
    },
    {
      id: 'threat-model-boundaries',
      path: 'docs/THREAT_MODEL.md',
      phrases: [
        '## Assets',
        '## Trust boundaries',
        '## Threats and controls',
        'Residual risk',
      ],
    },
    {
      id: 'claims-partial-assurance',
      path: 'docs/CLAIMS.md',
      phrases: ['Verified claims', 'Non-claims', 'partial', 'does not'],
    },
    {
      id: 'versioning-preview',
      path: 'docs/VERSIONING.md',
      phrases: ['0.2.0-dev.1', 'pre-release', 'separate principal approval'],
    },
  ];
  for (const check of contentChecks) {
    try {
      const text = await read(check.path);
      add(
        check.id,
        includesAll(text, check.phrases) &&
          !text.includes('/home/dylan') &&
          !text.includes('llm-memories'),
        `${check.path} contains its bounded release requirements and no private path`,
      );
    } catch (error) {
      add(check.id, false, `${check.path} error: ${error.message}`);
    }
  }

  const schemaChecks = [
    [
      'schemas/scopa.release-posture.v1.schema.json',
      'scopa.release-posture.v1.schema.json',
    ],
    [
      'schemas/scopa.candidate-manifest.v1.schema.json',
      'scopa.candidate-manifest.v1.schema.json',
    ],
    [
      'schemas/scopa.consumer-proof.v1.schema.json',
      'scopa.consumer-proof.v1.schema.json',
    ],
  ];
  for (const [relativePath, suffix] of schemaChecks) {
    try {
      const schema = JSON.parse(await read(relativePath));
      add(
        `json-schema:${suffix}`,
        schema.$schema === 'https://json-schema.org/draft/2020-12/schema' &&
          typeof schema.$id === 'string' &&
          schema.$id.endsWith(suffix) &&
          schema.type === 'object' &&
          schema.additionalProperties === false,
        `${relativePath} is a closed draft-2020-12 object schema`,
      );
    } catch (error) {
      add(
        `json-schema:${suffix}`,
        false,
        `${relativePath} error: ${error.message}`,
      );
    }
  }

  try {
    const clean = JSON.parse(
      await read('fixtures/S10/clean.slice-definition.json'),
    );
    const failing = JSON.parse(
      await read('fixtures/S10/failing.slice-definition.json'),
    );
    add(
      'fixture-pair',
      clean.schema === 'scopa.slice-definition.v1' &&
        failing.schema === 'scopa.slice-definition.v1' &&
        clean.gates[0].command.join(' ').includes('consumer.txt') &&
        failing.gates[0].command.at(-1) === 'process.exit(7)',
      'S10 retains one satisfiable consumer fixture and one real exit-7 fixture',
    );
  } catch (error) {
    add('fixture-pair', false, `S10 fixture error: ${error.message}`);
  }

  try {
    const packet = await read(
      'fixtures/S10/2026-07-26-freetsa-packet.json',
    );
    const rootCertificate = await read('fixtures/S10/freetsa-root.pem');
    add(
      'verification-fixture-integrity',
      sha256(packet) ===
        'f30c9fa735b0a9f76de71eeefa135f6fbf5967b62d36666aa16771cf0653bfcd' &&
        sha256(rootCertificate) ===
        '2151b61137ffa86bf664691ba67e7da0b19f98c758e3d228d5d8ebf27e044438',
      'packaged signed packet and verifier-supplied root match accepted S4 bytes',
    );
  } catch (error) {
    add(
      'verification-fixture-integrity',
      false,
      `verification fixture error: ${error.message}`,
    );
  }

  return validatePolicyAudit({
    schema: RELEASE_SCHEMAS.policyAudit,
    ok: checks.every((check) => check.passed),
    checks,
  });
}
