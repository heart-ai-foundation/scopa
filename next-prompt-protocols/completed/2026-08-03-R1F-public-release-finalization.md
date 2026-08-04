# R1F — Public Release Finalization

**Class:** `arc`
**Module:** `distribution-hardening`
**Crosses:** [`release-readiness`, `release-requalification`, `dependency-closure-identity`]
**Advances contracts:** [`DCI3`]
**Compound:** false
**Status:** completed; public `0.2.0` release and npm remediation verified

## Why this exists

S28 approved a private preview candidate for release eligibility. Public stable
metadata necessarily changes the package bytes, so R1F qualifies the actual
`0.2.0` artifact instead of transferring assurance from the preview tarball.

## Next objective

Produce one exact, provider-off qualified public `0.2.0` tarball and one closed
single-use execution matrix for separate digest approval.

## Descriptor rung check

Executable unlock: only a byte-bound final artifact plus successful public
publish dry-run can make the irreversible release calls decision-ready.

## Anti-ceremony gate

- Classification: final-byte migration and execution preflight.
- New uncertainty: whether stable public metadata preserves the qualified runtime
  and yields publishable exact bytes across both supported npm packers.
- Repetition removed: no model calls, production-live replay, soak, or outside review.
- One output: exact artifact identities plus one execution digest.

## Productivity mix

- Public metadata and historical-boundary migration: 30%
- Exact build/install/dry-run qualification: 50%
- Execution matrix, hosted gate, and evidence: 20%

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/release-readiness/**`
- bounded version-bearing integration fixtures/tests
- `fixtures/R1/**`
- `evidence/R1/**`
- `RELEASE_NOTES.md`
- `next-prompt-protocols/**`

## Evidence

- Approval: `evidence/R1/finalization-approval.json`
- Final candidate receipt: `evidence/R1/final-candidate.json`
- Closed execution matrix: `evidence/R1/release-execution-matrix.json`
- Provider-off qualification: `evidence/R1/provider-off-run.json`

## Non-goals

- No public repository change, tag, GitHub Release, npm publication, deployment, or announcement.
- No provider/model call or experiment use.
- No dependency, runtime, API, assurance, or historical evidence rewrite.

## Acceptance

- Stable metadata is internally consistent and schemas fail closed on drift.
- The S28 approved decision remains exactly reproducible from immutable historical inputs.
- npm 10 and npm 11 produce the same package/closure/bundle/install identities.
- Exact artifact install, runtime polarity, privacy, license, audit, and publish dry-run pass.
- GitHub/npm/tag preflight is named honestly; unavailable credentials cannot be asserted green.
- The matrix is closed, ordered, single-use, exact-byte bound, and authorizes zero actions until approved.
- Focused, protocol, accumulated, and hosted gates pass.

## Stop condition

Stop on historical receipt drift, runtime/dependency/API change, nondeterministic
bytes, publish dry-run failure, credential overclaim, public action, unrelated
change, or hosted failure. Present the matrix digest before execution.
