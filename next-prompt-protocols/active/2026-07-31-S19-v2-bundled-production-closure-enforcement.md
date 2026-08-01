# S19-v2 — Bundled Production-Closure Enforcement

**Class:** `arc`
**Module:** `dependency-closure-identity`
**Crosses:** [`release-readiness`, `distribution-hardening`, `conformance`]
**Advances contracts:** [`DCI1`, `DCI2`, `DCI3`]
**Compound:** false

## Why this exists

S19 stopped after npm 10.9.7 retained but did not enforce a dependency's
packed shrinkwrap. The principal subsequently approved exact bundled-closure
Macro Delta SHA-256
`b8951dc9e0803ecf85b1154f4db1ef352238712058b9f31f63dc75da14cc889c`.
Approval receipt `evidence/S19-v2/macro-delta-approval.json` has canonical
digest `e2b82e862e14c8e5e597672d90c6bbc15866d3d82ce7b78beb0f47ccaffaa0c5`.

## Next objective

Generate a candidate that physically carries its complete reviewed production
dependency payload. Bind the graph and every bundled file independently, then
prove npm 10 and npm 11 install identical bytes from an empty cache with an
unreachable registry and zero external requests.

## Descriptor rung check

Executable unlock: an offline installed candidate whose dependency graph and
executed dependency bytes are immutable parts of candidate identity.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: candidate staging gains bundled production dependencies,
  a canonical byte manifest, and installed-byte verification.
- New uncertainty reduced: whether npm can substitute or fetch production code
  after the SCOPA tarball is frozen.
- Validation: npm 10/11 empty-cache installs, unreachable registry, hostile
  graph/file mutations, license inventory, installed runtime, accumulated gate.
- Consecutive metadata/decision slice check: pass; approval and rotation are
  supporting controls inside the implementation slice.
- Status-report alternative: insufficient because install behavior must change
  and be proven from real tarball bytes.

## Productivity mix

- Runtime and packaging behavior: 50%
- Contract and adversarial tests: 40%
- Metadata/docs/evidence: 10%

## Slice queue

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S19-v2 | Bundled production-closure enforcement | Carry and independently bind all reviewed production bytes | Empty-cache installs cannot fetch or substitute dependency code | npm 10/11, unreachable registry, byte/graph hostility, license inventory | `active` |
| S20 | Bundled exact-candidate freeze | Bind package, closure, bundle, install, policies, clients, and deterministic matrix | Two packs and installs are identical | clean pack/install, matrix, protocol, accumulated and hosted gates | `queued` |
| S21 | Fresh candidate production-live matrix | Obtain new candidate-bound Claude/Codex evidence | No assurance or approval transfer | separately approved exact calls only | `queued and provider-closed` |
| S22 | Sustained bundled-closure soak | Repeat empty-cache installs and runtime polarity | No registry/cache moment can masquerade as stability | graph/tree ledger, audit/license/privacy/cleanup | `queued` |
| S23 | Fresh exact-identity reviews and closeout | Three unfamiliar roles reproduce four-part identity claims | Three ACCEPT verdicts and zero critical/high/medium findings | consistency, protocol, local, hosted, no-publication gates | `queued` |

## Files in play

- `package.json`
- `package-lock.json`
- `.github/workflows/case-validation.yml`
- `production-bundle.json`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `packages/cli/**`
- `schemas/**`
- `docs/**`
- `fixtures/S19-v2/**`
- `notes/S19-v2/**`
- `runs/S19-v2/**`
- `evidence/S19-v2/**`
- `next-prompt-protocols/**`

## Validation speed option

- Fast slice-local command: `npm run test:s19`.
- Active test file:
  `packages/release-readiness/test/dependency-closure.test.js`.
- Upstream fixture policy: use small generated hostile copies of the real
  canonical bundle; do not reconstruct historical live evidence.
- Broad-suite policy: run the accumulated release gate before completion and
  in hosted CI.

## Non-goals

- No provider traffic or provider-client launch.
- No S20 candidate qualification, S21 live run, S22 soak, or S23 review.
- No npm publication, release, deployment, visibility change, announcement,
  certification, or trademark action.
- No dependency upgrade, fork, patch, minimization, or rewrite.
- No customer, experiment, credential, private topology, or historical
  evidence mutation.
- No new public CLI/bin/provider/tool/effect/trust/assurance surface.
- No proprietary verifier, online activation, telemetry, or paid truth source.
- No weakening of runtime, verifier, custody, hostile corpora, or independently
  useful free functionality.

## Evidence

S19-v2 writes:

- `notes/S19-v2/` — bundle design and observed npm transformations;
- `runs/S19-v2/` — focused, npm-version, installed, accumulated, protocol, and
  privacy logs;
- `evidence/S19-v2/` — approval, canonical bundle, empty-cache install,
  network-denial, license, and hostile-corpus receipts.

## Acceptance

- Candidate metadata declares exactly the four reviewed direct production
  packages as `bundledDependencies`.
- Every reachable non-development lock node and every packed dependency byte
  appears in one canonical closed manifest; missing, extra, unsafe, native,
  lifecycle-active, local/git, or uncontrolled-source states fail.
- Candidate, closure, bundled-payload, and installed-payload digests remain
  distinct and exact.
- npm 10 and npm 11 empty-cache installs succeed with an unreachable registry,
  make zero external requests, and reproduce identical dependency bytes.
- Missing, mutated, transplanted, extra, stale, permission-drifted, dev-
  contaminated, and self-rehashed false-green states are rejected.
- Exact license/notice inventory is present and complete.
- Package privacy and credential scans return zero findings.
- `npm run test:s19`, installed-surface regression, protocol check, accumulated
  release gate, and hosted CI pass.

## Stop condition

Stop S19-v2 for a new principal decision if npm omits or rewrites bundled
bytes, attempts a fetch, produces npm-version-specific payloads, or if exact
byte equivalence cannot be independently established. Stop immediately on
unsafe package type, licensing ambiguity, provider, privacy, experiment,
publication, deployment, customer, or historical-assurance crossover.
