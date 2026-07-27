# S6 Installable Developer Surface Candidate

## Reviewer result

The local package candidate installs into a source-free temporary consumer and
provides one `scopa` binary. The consumer-local binary initializes a closed
project, reports orientation, rejects false-green completion, mediates an
allowed mutation, rejects an out-of-scope mutation before execution, and
verifies the retained S4 packet under explicit timestamp trust policy.

## Stable surface

- Result schema: `scopa.cli-result.v1`
- Project config schema: `scopa.project-config.v1`
- Commands: `init`, `status`, `check`, `run`, `verify`
- Distinct exits: success, invalid/configuration, denied, blocked, and
  evidence-invalid
- Initialization: exclusive, idempotent for identical content, and
  fail-closed for conflicts or aliases

## Distribution review

The npm `files` allowlist includes only the root README plus package READMEs,
package manifests, and runtime source. The package test inspects the actual
manifest before installing it and rejects build-governance, historical
evidence, fixtures, keys, logs, or temporary receipts.

## Limits

This candidate is private, version `0.0.0`, and validated only as a local
tarball. No registry publication, public repository, license selection, or
provider integration is claimed. `scopa run` reaches the reference host
directly; adapter conformance begins in S7.
