export const RELEASE_PACKAGE_NAME = '@heart-ai-foundation/scopa';
export const RELEASE_VERSION = '0.2.0-dev.1';
export const RELEASE_LICENSE = 'Apache-2.0';
export const RELEASE_LICENSE_SHA256 =
  'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4';

export const RELEASE_BINS = Object.freeze({
  scopa: './packages/cli/src/cli.js',
  'scopa-mcp': './packages/adapter-host/src/cli.js',
});

export const RELEASE_SCHEMAS = Object.freeze({
  posture: 'scopa.release-posture.v1',
  policyAudit: 'scopa.release-policy-audit.v1',
  candidateManifest: 'scopa.candidate-manifest.v1',
  consumerProof: 'scopa.consumer-proof.v1',
  publicationReceipt: 'scopa.proof-publication-receipt.v1',
});

export const REQUIRED_POLICY_PATHS = Object.freeze([
  'LICENSE',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'GOVERNANCE.md',
  'docs/QUICKSTART.md',
  'docs/THREAT_MODEL.md',
  'docs/CLAIMS.md',
  'docs/VERSIONING.md',
  'docs/release-posture.json',
  'schemas/scopa.release-posture.v1.schema.json',
  'schemas/scopa.candidate-manifest.v1.schema.json',
  'schemas/scopa.consumer-proof.v1.schema.json',
  'fixtures/S10/clean.slice-definition.json',
  'fixtures/S10/failing.slice-definition.json',
  'fixtures/S10/consumer-client.mjs',
  'fixtures/S10/session.json',
  'fixtures/S10/capability-matrix.json',
  'fixtures/S10/2026-07-26-freetsa-packet.json',
  'fixtures/S10/freetsa-root.pem',
]);

export const REQUIRED_PACKED_PREFIXES = Object.freeze([
  'LICENSE',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'GOVERNANCE.md',
  'README.md',
  'docs/',
  'schemas/',
  'fixtures/S10/',
  'packages/release-readiness/',
]);

export const FORBIDDEN_PACKED_PREFIXES = Object.freeze([
  '.git/',
  '.github/',
  'evidence/',
  'notes/',
  'runs/',
  'next-prompt-protocols/',
  'spec/',
  'node_modules/',
  'packages/release-readiness/test/',
]);
