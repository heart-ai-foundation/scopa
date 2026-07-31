# S19 — Publishable Dependency-Closure Enforcement

**Class:** `arc`
**Module:** `dependency-closure-identity`
**Crosses:** [`release-readiness`, `distribution-hardening`, `conformance`]
**Advances contracts:** [`DCI1`, `DCI2`, `DCI3`]
**Compound:** false

## Why this exists

S18.4 rejected the frozen candidate because its tarball digest did not bind the
resolved transitive dependency closure. Direct dependencies were exact, but
their semver-ranged transitive SES and AJV dependencies could change during a
future clean install. The source lockfile was not packed and npm would ignore
it outside the project root.

The principal approved exact Macro Delta SHA-256
`858fb37d17a18767c79c513b13f669bc3458bf64cedb49b1f0957a23f5a3b394`.
Approval receipt
`evidence/S19/macro-delta-approval.json` has canonical digest
`34aa0a3b456e29331e4b3b940a94644d8aa71f0198bbcaeaa546d6d6b74f0be9`.

## Next objective

Generate a deterministic consumer-specific `npm-shrinkwrap.json`, include it
in every candidate tarball, derive one canonical production closure from it,
and independently compare fresh installed graphs with that closure. Prove
supported npm versions preserve the exact graph while missing, mutated,
transplanted, extra, stale, dev-contaminated, or semver-drifted states fail
closed.

## Descriptor rung check

Executable unlock: an installed candidate identity that includes package,
dependency closure, and installed tree as distinct verified digests.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: candidate staging gains a publishable production
  shrinkwrap and installed qualification rejects graph drift.
- New uncertainty reduced: whether the same SCOPA tarball can resolve different
  enforcement or validation dependency bytes.
- Validation: source-free npm 10/11 installs, synthetic compatible-transitive
  drift, hostile closure mutations, installed probe, accumulated gate.
- Consecutive metadata/decision slice check: pass; S19 changes pack/install
  behavior immediately after one approval boundary.
- Status-report alternative: insufficient because the reproduced medium
  finding requires executable installation enforcement.

## Productivity mix

- Runtime and packaging behavior: 45%
- Contract and adversarial test code: 45%
- Metadata/docs/evidence: 10%

## Slice queue

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S19 | Publishable dependency-closure enforcement | Generate, pack, enforce, and independently verify the complete production graph | Compatible transitive drift cannot change installed identity | npm 10/11 source-free installs and hostile closure corpus | `active` |
| S20 | Dependency-closed exact candidate freeze | Bind new package, closure, tree, policies, clients, and deterministic matrix | Two packs and fresh installs are identical | clean pack/install, matrix, protocol, accumulated and hosted gates | `queued` |
| S21 | Fresh candidate production-live matrix | Obtain new candidate-bound Claude/Codex evidence | No assurance or approval transfer | separately approved exact calls only | `queued and provider-closed` |
| S22 | Sustained dependency-closure soak | Repeat installs and runtime polarity without graph/tree/resource drift | No registry/cache moment can masquerade as stability | bounded cycles, graph/tree ledger, audit/privacy/cleanup | `queued` |
| S23 | Fresh exact-identity reviews and closeout | Three unfamiliar roles reproduce package/closure/tree claims | Three ACCEPT verdicts and zero critical/high/medium findings | consistency, protocol, local, hosted, no-publication gates | `queued` |

## Files in play

- `package.json`
- `package-lock.json`
- `npm-shrinkwrap.json`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `packages/cli/**`
- `schemas/**`
- `docs/**`
- `fixtures/S19/**`
- `notes/S19/**`
- `runs/S19/**`
- `evidence/S19/**`
- `next-prompt-protocols/**`

## Validation speed option

- Fast slice-local command: `npm run test:s19`.
- Active-slice test file:
  `packages/release-readiness/test/dependency-closure.test.js`.
- Upstream fixture policy: use minimal synthetic package graphs for range-drift
  and mutation tests; do not rebuild historical S18 live evidence.
- Broad-suite policy: run the accumulated release gate before the S19 commit
  and in hosted CI.

## Non-goals

- No provider traffic or provider-client launch.
- No new candidate qualification, live run, soak, or fresh review in S19.
- No npm publication, release, deployment, visibility change, announcement,
  certification, or trademark action.
- No silent fallback to bundled dependencies if npm shrinkwrap enforcement
  fails on npm 10 or npm 11.
- No opportunistic dependency version upgrade.
- No customer, experiment, credential, private topology, or historical
  evidence mutation.
- No new public CLI/bin/provider/tool/effect/trust/assurance surface.
- No weakening of current runtime, verifier, custody, hostile corpus, or free
  functionality.

## Evidence

S19 commits:

- `notes/S19/` — closure design decisions, npm behavior, and ruled-out paths;
- `runs/S19/` — focused, installed, accumulated, protocol, and privacy logs;
- `evidence/S19/` — approval, canonical closure, drift/mutation matrix, and
  source-free install equivalence receipt.

## Acceptance

- The packed consumer contains one canonical production-only
  `npm-shrinkwrap.json` whose root metadata matches the consumer package.
- Closure extraction rejects unknown fields, non-exact versions, missing or
  malformed integrity, local/git/unapproved sources, development nodes,
  duplicate semantic nodes, and graph inconsistency.
- Package manifest, closure digest, and installed-tree digest remain distinct
  and exact.
- Fresh npm 10 and npm 11 installation graphs match the closure exactly.
- A synthetic newer semver-compatible transitive package does not replace the
  approved version.
- Missing, mutated, transplanted, extra, stale, dev-contaminated, and
  self-rehashed false-green states are rejected.
- Package privacy/credential scanning returns zero findings.
- `npm run test:s19`, installed-surface regression, protocol check,
  accumulated release gate, and hosted CI pass.

## Stop condition

Stop S19 and request a new principal decision if either supported npm version
ignores or rewrites the packed shrinkwrap, if exact verification requires
mutable registry metadata, if bundling becomes necessary, or if any graph
drift can be reported green. Stop the arc on provider, privacy, experiment,
publication, deployment, customer, or historical-assurance crossover.
