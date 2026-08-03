export const RELEASE_PACKAGE_NAME = '@heart-ai-foundation/scopa';
export const RELEASE_VERSION = '0.2.0';
export const RELEASE_LICENSE = 'Apache-2.0';
export const RELEASE_LICENSE_SHA256 =
  'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4';

export const RELEASE_BINS = Object.freeze({
  scopa: './packages/cli/src/cli.js',
  'scopa-mcp': './packages/adapter-host/src/cli.js',
});

export const CONSUMER_ADAPTER_SCHEMA =
  'scopa.consumer-adapter-result.v1';

export const CONSUMER_TOOL_NAMES = Object.freeze([
  'scopa_assurance',
  'scopa_check',
  'scopa_orientation',
  'scopa_read_file',
  'scopa_transcript',
  'scopa_write_file',
]);

export const CONSUMER_ASSURANCE = 'full';

export const CONSUMER_VERIFIED_CLAIMS = Object.freeze([
  'exact local tarball installed without source-checkout resolution',
  'six-tool model-neutral adapter completed allowed work',
  'escaping mutation received SCOPA_SCOPE_DENIED',
  'real clean gate reached satisfied canStop true',
  'retained signed packet verified with caller trust policy',
  'known exit-7 fixture remained blocked',
]);

export const CONSUMER_NON_CLAIMS = Object.freeze([
  'no hosted service, production deployment, or telemetry',
  'no operating-system sandbox claim',
  'no provider or human identity attestation',
  'no transfer of full assurance to Claude or Codex',
  'no formal compliance or trademark claim',
]);

export const RELEASE_SCHEMAS = Object.freeze({
  posture: 'scopa.release-posture.v1',
  policyAudit: 'scopa.release-policy-audit.v1',
  candidateManifest: 'scopa.candidate-manifest.v1',
  consumerProof: 'scopa.consumer-proof.v1',
  publicationReceipt: 'scopa.proof-publication-receipt.v1',
  productionBundle: 'scopa.production-bundle.v1',
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
  'schemas/scopa.production-bundle.v1.schema.json',
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
  'RELEASE_NOTES.md',
  'docs/',
  'schemas/',
  'fixtures/S10/',
  'packages/release-readiness/',
  'production-bundle.json',
]);

export const FORBIDDEN_PACKED_PREFIXES = Object.freeze([
  '.git/',
  '.github/',
  'evidence/',
  'notes/',
  'runs/',
  'next-prompt-protocols/',
  'spec/',
  'packages/release-readiness/test/',
]);
