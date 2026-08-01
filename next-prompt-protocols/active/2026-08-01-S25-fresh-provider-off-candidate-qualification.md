# S25 — Fresh Provider-Off Candidate Qualification

**Class:** `arc`
**Module:** `gate-process-custody`
**Crosses:** [`release-readiness`, `distribution-hardening`, `enforcement`, `conformance`]
**Advances contracts:** [`PTC3`]
**Compound:** false

## Why this exists

S24 changed runtime bytes to close the S23-v2 descendant-survivor defect. The
S20 candidate and its S21-S23 evidence cannot qualify these new bytes.

## Next objective

From one clean source commit, produce byte-identical npm 10.9.7 and npm 11.19.0
packs; install both with empty caches, offline mode, an unreachable registry,
ignore-scripts, and the network-deny shim; then bind package, production bundle,
closure, installed payload, license, privacy, policy, protocol, and S24
process-tree results in a fresh S25 receipt.

## Descriptor rung check

Executable unlock: a clean, exact S25 candidate identity is the prerequisite
for any later separately authorized installed-runtime evaluation.

## Anti-ceremony gate

- Classification: `verification`.
- Executable unlock: establish exact distributable bytes containing the S24
  fix that can support any later separately approved evaluation.
- New uncertainty reduced: whether the hardened source is reproducible,
  dependency-closed, privacy-clean, and operationally green when installed.
- Validation: S25 deterministic matrix, dual-npm clean pack/install, policy and
  privacy audits, protocol check, accumulated gate, and hosted CI.
- Status-report alternative: insufficient because the implementation changed
  candidate bytes and invalidated all earlier candidate identity claims.

## Productivity mix

- Provider-off candidate execution: 70%
- Qualification schema and adversarial validation: 25%
- Evidence/protocol: 5%

## Files in play

- `fixtures/S25/**`
- `evidence/S25/**`
- `packages/release-readiness/**`
- `next-prompt-protocols/**`

## Validation speed option

- Fast schema test: `node --test packages/release-readiness/test/bundled-exact-candidate.test.js`
- Exact qualification: `npm run probe:s20:candidate -- --matrix fixtures/S25/deterministic-candidate-matrix.json ...`

## Non-goals

- No provider or experiment call.
- No publication, GitHub Release, deployment, or public announcement.
- No dependency or unrelated runtime change.
- No reuse or transfer of S20-S23 candidate assurance.
- No production-live posture; later calls require a separate exact-digest
  principal approval.

## Evidence

S25 commits only the public, path-safe qualification receipt and closeout under
`evidence/S25/`. Disposable packages, caches, and installed trees remain
outside the repository and are removed after qualification.

## Acceptance

- Source commit is clean and exact.
- npm 10.9.7 and npm 11.19.0 produce identical package and bundle identities.
- Both disposable installs are offline, dependency-closed, privacy-clean, and
  behaviorally green, including the S24 process-tree matrix.
- Current policy, license, advisory, protocol, accumulated, and hosted gates
  pass.
- Candidate assurance remains non-transferable and provider traffic remains
  closed.

## Stop condition

Stop on dirty source, byte/closure/install/npm drift, any network attempt,
privacy/license/advisory/process survivor, false green, or provider,
experiment, publication, release, dependency, or unrelated runtime action.
