# S20 — Bundled Exact-Candidate Freeze

**Class:** `arc`
**Module:** `production-live-requalification`
**Crosses:** [`dependency-closure-identity`, `release-readiness`, `conformance`]
**Advances contracts:** [`DCI3`, `PLQ1`]
**Compound:** false

## Why this exists

S19-v2 established a dependency-closed packaging and install mechanism. S20
must now freeze a new candidate from a clean post-closeout commit and bind the
package, production closure, bundled payload, installed payload, policies,
clients, and deterministic production-like matrix as one qualified posture
without collapsing their distinct digests.

## Next objective

Build one new exact candidate from the clean S19-v2 closeout commit. Prove two
clean packs are byte-identical and npm 10 and npm 11 empty-cache installs
reproduce the exact reviewed payload with zero network, privacy, credential,
license, policy, advisory, or matrix finding.

## Descriptor rung check

Executable unlock: one exact dependency-closed candidate becomes eligible for
a separately approved fresh S21 production-live matrix.

## Anti-ceremony gate

- Classification: `implementation and executable qualification`.
- Executable change: the deterministic candidate matrix consumes the new
  four-part package/closure/bundle/install identity.
- New uncertainty reduced: whether the complete production-like surface is
  stable and policy-clean after bundling and after the S19-v2 closeout commit.
- Validation: two clean packs, npm 10/11 offline installs, full deterministic
  matrix, installed probe, policy/privacy/license/advisory gates, accumulated
  gate, protocol check, and hosted CI.
- Consecutive metadata/decision slice check: pass; S19-v2 changed executable
  pack/install behavior and S20 executes the resulting qualification surface.
- Status-report alternative: insufficient because the new exact candidate and
  complete matrix do not yet exist.

## Productivity mix

- Candidate and executable matrix behavior: 45%
- Contract, identity, and adversarial validation: 45%
- Evidence and protocol closeout: 10%

## Slice queue

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S19-v2 | Bundled production-closure enforcement | Carry and independently bind all reviewed production bytes | Empty-cache installs cannot fetch or substitute dependency code | npm 10/11, unreachable registry, byte/graph hostility, license inventory | `done` |
| S20 | Bundled exact-candidate freeze | Bind package, closure, bundle, install, policies, clients, and deterministic matrix | Two packs and installs are identical | clean pack/install, matrix, protocol, accumulated and hosted gates | `done` |
| S21 | Fresh candidate production-live matrix | Obtain new candidate-bound Claude/Codex evidence | No assurance or approval transfer | separately approved exact calls only | `queued and provider-closed` |
| S22 | Sustained bundled-closure soak | Repeat empty-cache installs and runtime polarity | No registry/cache moment can masquerade as stability | graph/tree ledger, audit/license/privacy/cleanup | `queued` |
| S23 | Fresh exact-identity reviews and closeout | Three unfamiliar roles reproduce four-part identity claims | Three ACCEPT verdicts and zero critical/high/medium findings | consistency, protocol, local, hosted, no-publication gates | `queued` |

## Files in play

- `package.json`
- `package-lock.json`
- `production-bundle.json`
- `.github/workflows/case-validation.yml`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `packages/cli/**`
- `fixtures/S20/**`
- `notes/S20/**`
- `runs/S20/**`
- `evidence/S20/**`
- `next-prompt-protocols/**`

## Validation speed option

- Reuse the S19-v2 bundle verifier and npm-version harness; do not duplicate
  graph or file-manifest logic.
- Extend the existing exact-candidate matrix only where four-part identity is
  now required.
- Run focused S20 qualification first, then installed-surface, accumulated,
  protocol, and hosted gates once the exact candidate is frozen.

## Non-goals

- No provider traffic; S21 remains closed pending a separate exact
  candidate-bound approval.
- No npm publication, GitHub Release, visibility change, deployment, customer
  use, public announcement, certification, or trademark action.
- No experiment work, historical evidence mutation, or assurance transfer.
- No dependency upgrade, fork, patch, minimization, or rewrite.
- No new public CLI/bin/provider/tool/effect/trust/assurance surface.
- No proprietary verifier, online activation, telemetry, or paid truth source.

## Evidence

S20 writes `notes/S20/`, `runs/S20/`, and `evidence/S20/` containing the exact
candidate qualification, four-part identity bindings, deterministic matrix,
policy/privacy/license/advisory results, and zero-provider/zero-publication
receipt.

## Acceptance

- A clean post-S19-v2 source commit produces two byte-identical official
  candidate tarballs.
- Candidate, closure, bundled-payload, and installed-payload digests are exact,
  distinct fields and consistent across all S20 receipts.
- npm 10 and npm 11 reproduce the exact installed payload from empty caches
  with an unreachable registry and zero external requests.
- The complete frozen deterministic production-like matrix passes from the
  installed candidate without source-checkout or historical-assurance use.
- Dependency, license, advisory, privacy, credential, policy, installed,
  accumulated, protocol, and hosted gates pass.
- S20 authorizes no provider call or publication action.

## Stop condition

Stop S20 on identity drift, nondeterminism, any network attempt, dependency or
installed-payload mismatch, false green, privacy or credential finding,
licensing ambiguity, advisory failure, policy failure, matrix failure, dirty
source, historical-assurance transfer, provider traffic, or publication.

## Completion

Completed against clean source commit
`d56440195dcb24cb6dd43c24e484641b1646a5a9`. Candidate SHA-256
`49b62ac4b4d869dbca8459aa08f515427e0a04349f014c85cc422d7e0625f147`
passed two-pack and npm 10.9.7/npm 11.19.0 byte identity, empty-cache offline
installed proofs, the five-case deterministic matrix, 38 release-policy
checks, privacy/license/credential gates, shallow-checkout protocol projection,
and hosted run `30678929665`.

Canonical qualification receipt:
`ad9d2dc7e22cfd6e5de07ebce0b430f3970e2eb1072f0e1a78711a82559cec2f`.
Canonical closeout receipt:
`d46d3be02571b6d90fd4b4c6a9dda7320db1a2bec2811b3c1c32cbad72d6045c`.
DCI3 and PLQ1 are advanced, not satisfied. S21 remains provider-closed until
a separate approval binds this exact candidate and every authorized call.
