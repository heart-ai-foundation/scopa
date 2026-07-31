---
title: "Macro Delta: 2026-07-31: SCOPA Dependency-Closure Identity Hardening"
entity: heart
type: compliance
tags:
  - compliance
  - forensic-methodologies
  - agentic-workflow-forensics
  - scopa
  - macro-delta
  - dependency-closure
  - release-requalification
---

# Macro Delta: 2026-07-31: SCOPA Dependency-Closure Identity Hardening

**Status:** PROPOSED — no implementation authority until a separate principal
approval record binds this document's exact SHA-256
**Document Classification:** Dependency-Closure Identity Hardening Build Plan
**Format:** Macro Delta, per Next-Prompt Protocol v2.4
**Project:** SCOPA (Scope, Completion, and Operational Persistence for Agents)
**Publisher:** Heart AI Foundation
**Phase:** Proposed Phase 7 — Dependency-Closed Release Requalification
**Window:** `3ac0173` → `5b25262` (S14-S18)
**Author:** Codex, under principal direction
**Trigger:** S18.4 fresh artifact-review program stop and principal request to
proceed with a fresh hardening authority
**Predecessor:** `2026-07-28-scopa-production-live-run-hardening.md`
**Baseline:** `5b2526282eeba6142fa657e0a3d86f4676f643e8` on private
`heart-ai-foundation/scopa`
**Principal authorization:** pending exact-digest approval
**Date:** July 31, 2026

---

## Authority boundary

This proposal becomes the sole authority for S19-S23 only when a separate
principal approval record binds the exact file SHA-256. Before that event it
authorizes no runtime edit, candidate build, provider call, publication, or
protocol rotation.

If ratified, it authorizes only the dependency-closure remediation reproduced
by the S18.4 artifact reviewer, the minimum receipt/installer changes needed to
bind that closure, and complete exact-candidate requalification. It does not
authorize a general dependency upgrade, runtime feature, schema expansion
unrelated to closure identity, experiment work, or release.

Provider traffic remains closed by default. S19, S20, and S22 require zero
provider calls. S21 may materialize a closed matrix but may launch nothing
until the principal separately approves an exact candidate-bound call matrix,
clients, models, sequence, custody destinations, budgets, and expiry. No S18
approval, candidate, or review verdict carries forward.

This proposal does not authorize npm publication, a GitHub Release,
repository visibility change, deployment, customer use, public announcement,
formal certification, trademark exclusivity, or customer-data processing.

## Where we are

SCOPA's production-like runtime, custody, provider, recovery, and sustained
soak controls passed their declared gates. The final fresh artifact reviewer
then found that “exact candidate” named only the SCOPA tarball while a clean
npm install could later choose different transitive SES or AJV bytes. S18
stopped correctly with PLQ2 and PLQ3 open. The remaining work is narrow but
foundational: make the complete installed production dependency closure part
of candidate identity, prove npm enforces it, and requalify entirely new bytes
without transferring assurance from the rejected candidate.

## Why this exists

SCOPA is an enforcement and evidence runtime. A tarball digest is not an exact
runtime identity when the package's transitive enforcement or validation code
can change during installation. Direct dependency pins do not close that gap
because published dependencies retain semver ranges, and the source
`package-lock.json` is neither packed nor honored when the tarball is installed
as a dependency.

Official npm documentation distinguishes the two lock surfaces:
`package-lock.json` is ignored outside the root project and cannot be
published, while `npm-shrinkwrap.json` is publishable and is intended for
deployed command-line tools. This delta treats shrinkwrap as the primary npm
enforcement mechanism but not as sufficient evidence by itself. Candidate and
live receipts must also bind a canonical closure digest and the observed
installed tree.

## Governing decisions

- The dependency closure includes every production package path, exact name,
  version, resolved source, integrity, dependency edge, and relevant platform
  selector; dev-only packages are excluded.
- The primary installation unit is a consumer-specific, publishable
  `npm-shrinkwrap.json` generated deterministically from reviewed lock state.
- The shrinkwrap is included in the tarball manifest and its canonical closure
  digest is part of candidate identity.
- The installed probe independently reconstructs the actual production graph
  and compares it with the approved closure; shrinkwrap presence alone cannot
  produce a green result.
- Runtime and live receipts bind package SHA-256, dependency-closure SHA-256,
  and installed-tree SHA-256 as distinct fields.
- Source-free qualification uses lifecycle scripts disabled, a clean root,
  and no source-checkout lockfile or `node_modules` inheritance.
- A deterministic synthetic package family makes a newer semver-compatible
  transitive version available and proves the approved version/integrity still
  wins. Removal, mutation, range transplant, missing integrity, extra node,
  and unsupported npm behavior fail closed.
- Supported npm versions are exercised explicitly. The initial compatibility
  target is npm 10 and npm 11 on supported Node 22 environments.
- If either supported npm version does not enforce the shrinkwrap from the
  packed installation unit exactly, S19 stops. Bundled production dependencies
  become the only permitted fallback and require a new principal decision
  before implementation.
- Dependencies are not opportunistically upgraded. Any version change must be
  separately justified, audited, and reflected in closure identity.
- S18 live evidence may inform test design but cannot satisfy a new candidate's
  live gate. Assurance does not transfer across candidate bytes.
- New provider calls, if later approved, use fresh external custody roots and
  fresh one-use approvals; all historical approvals remain consumed or closed.
- The free runtime, verifier, schemas, fixtures, and closure verifier remain
  independently available. Consultation may support deployment and evidence
  review but cannot sell exclusive verification truth.

## Blocks

### Block M: Dependency-closure enforcement

| Field | Value |
|---|---|
| Block goal | Make the complete resolved production dependency graph an enforced part of installed candidate identity |
| Modules | `dependency-closure-identity`, `release-readiness`, `distribution-hardening`, `conformance` |
| Slice count | 1 (S19) |
| Stop boundary | Stop if packed shrinkwrap is ignored, mutable, incomplete, dev-contaminated, registry-dependent for verification, or inconsistent across supported npm versions |
| Production policy | Provider-closed and deterministic; registry access only for a separately bounded current advisory audit |
| Evidence policy | Closure manifest, shrinkwrap equivalence, synthetic drift corpus, installed graph/tree receipts |

### Block N: New exact candidate

| Field | Value |
|---|---|
| Block goal | Freeze new bytes whose package, closure, installed graph, policies, and deterministic matrix are one identity |
| Modules | `production-live-requalification`, `dependency-closure-identity`, `release-readiness`, `conformance` |
| Slice count | 1 (S20) |
| Stop boundary | Stop on source drift, nondeterministic pack, closure mismatch, installed-tree drift, privacy finding, advisory, or false green |
| Production policy | Zero provider traffic; private candidate only |
| Evidence policy | New candidate manifest and qualification receipt; rejected S18 candidate remains immutable history |

### Block O: Fresh production-live requalification

| Field | Value |
|---|---|
| Block goal | Exercise the new exact dependency-closed candidate through fresh Claude and Codex calls without evidence or approval transfer |
| Modules | `production-live-requalification`, `live-run-custody`, `claude-live-hardening`, `codex-live-hardening` |
| Slice count | 1 (S21) |
| Stop boundary | Stop before launch without separate exact approval; then stop on drift, budget, privacy, cleanup, false green, or any unapproved call |
| Production policy | Closed matrix first; explicit principal approval required for exact provider calls |
| Evidence policy | Fresh private custody and privacy-clean public derivatives bound to the new package/closure/tree identity |

### Block P: Sustained closure soak and audit

| Field | Value |
|---|---|
| Block goal | Prove repeated clean installs cannot escape or drift from the approved dependency closure |
| Modules | `dependency-closure-identity`, `operational-resilience`, `release-readiness`, `conformance` |
| Slice count | 1 (S22) |
| Stop boundary | Stop on graph/tree drift, advisory, privacy event, survivor, stale state, resource growth, or false green |
| Production policy | Provider-closed; one separately bounded current registry advisory audit |
| Evidence policy | Multi-cycle graph/tree ledger, resource/cleanup receipt, audit and privacy results |

### Block Q: Fresh dependency-closed reviews

| Field | Value |
|---|---|
| Block goal | Obtain unfamiliar artifact, evidence, and runtime verdicts against the same new package/closure/tree identity |
| Modules | `production-live-requalification`, `dependency-closure-identity`, `release-readiness`, `conformance` |
| Slice count | 1 (S23) |
| Stop boundary | Stop on any critical/high/medium finding, contrary verdict, identity mismatch, or unadjudicated low |
| Production policy | Provider-closed reviews; no publication or release decision |
| Evidence policy | Three exact-byte reports, cross-review consistency, protocol/local/hosted gates, no-publication receipt |

## Module map and exit contracts

| Module | Exit contracts |
|---|---|
| `dependency-closure-identity` | DCI1 every consumer candidate carries a canonical publishable production closure with exact versions, resolved sources, integrities, edges, and no dev nodes; DCI2 supported npm installs and the independent installed probe reproduce exactly that closure and reject missing, mutated, transplanted, extra, or stale graphs; DCI3 qualification, live, soak, and review evidence bind package, closure, and installed-tree digests without collapsing them into one claim |
| `production-live-requalification` | PLQ1 one new dependency-closed installed candidate passes the full frozen production-like matrix and sustained soak; PLQ2 three fresh artifact, evidence, and runtime reviewers return ACCEPT with no critical/high/medium finding and every low adjudicated; PLQ3 dependency, privacy, credential, protocol, local, and hosted gates remain green and establish only eligibility for a separate release decision |

On ratification, DCI1-DCI3 are added as open contracts and PLQ1-PLQ3 are
reopened. Historical S18 receipts remain valid statements about the rejected
candidate, not satisfaction evidence for the replacement candidate.

## Proposed slice queue

### S19: Publishable dependency-closure enforcement

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `dependency-closure-identity` |
| Crosses | `release-readiness`, `distribution-hardening`, `conformance` |
| Advances contracts | DCI1, DCI2, DCI3 |
| Objective | Generate, pack, enforce, and independently verify one canonical production dependency closure |
| Purpose | The rejected candidate hash does not identify all installed enforcement and validation bytes |
| Value gate | A packed source-free install reproduces the exact closure across npm 10 and 11 while a compatible-transitive drift corpus and every closure mutation fail closed |
| Validation gate | Shrinkwrap presence/canonicality, production-only graph, version/resolved/integrity/edge checks, synthetic drift, missing/extra/transplanted nodes, lifecycle-off install, package privacy, npm 10/11 hosted matrix |
| Likely artifacts | consumer shrinkwrap generator, closure schema/validator, installed graph attestation, hostile fixture family, focused tests |
| Dependencies | Principal approval of this exact Macro Delta |
| Stop or defer condition | Stop for a new principal decision if supported npm ignores or rewrites the packed shrinkwrap; do not silently switch to bundling |
| Evidence path | `evidence/S19/` with closure and install-equivalence receipts |
| Status | `queued pending ratification` |

**Descriptor-rung check.** Unlocks an executable install identity that closes
the reproduced medium finding.

**Anti-ceremony gate.** Classification: `implementation`; pack/install and
failure behavior change and are exercised through hostile dependency graphs.

### S20: Dependency-closed exact candidate freeze

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `production-live-requalification` |
| Crosses | `dependency-closure-identity`, `release-readiness`, `conformance` |
| Advances contracts | DCI3, PLQ1 |
| Objective | Build one clean new candidate and bind package, closure, installed tree, policies, clients, and deterministic matrix |
| Value gate | Two clean packs are byte-identical and independent fresh installs reproduce the exact closure and tree with zero privacy, credential, policy, or advisory finding |
| Validation gate | Clean pack, manifest, closure validator, npm 10/11 source-free install, full deterministic matrix, accumulated gate, protocol check, hosted CI |
| Likely artifacts | new private tarball, candidate manifest, qualification receipt, closed live matrix |
| Dependencies | S19 complete and clean source commit |
| Stop or defer condition | Stop on any identity drift, package nondeterminism, dependency mismatch, false green, or privacy/advisory result |
| Evidence path | `evidence/S20/` with the new exact candidate qualification |
| Status | `queued` |

**Descriptor-rung check.** Unlocks provider review of one dependency-closed
runtime, not a transfer from the rejected candidate.

**Anti-ceremony gate.** Classification: `test/validation` with real
source-free installations and deterministic runtime probes.

### S21: Fresh candidate production-live matrix

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `production-live-requalification` |
| Crosses | `live-run-custody`, `claude-live-hardening`, `codex-live-hardening`, `dependency-closure-identity` |
| Advances contracts | PLQ1 |
| Objective | Run the new exact candidate through fresh bounded Claude and Codex clean/cold-restart calls |
| Value gate | Every approved call binds the new package/closure/tree identity and preserves polarity, budgets, cleanup, privacy, and replay closure |
| Validation gate | Closed matrix and preflight first; only a separately approved exact call set may execute; private/public receipt validation and consumed-approval registry afterward |
| Likely artifacts | closed matrix, separate approval, controller receipt, public derivatives, consumed approval |
| Dependencies | S20 hosted green plus fresh principal call approval |
| Stop or defer condition | Zero calls without exact approval; stop on any drift, extra call, budget breach, privacy event, cleanup failure, or ambiguous terminal |
| Evidence path | `evidence/S21/` with fresh candidate-bound live evidence |
| Status | `queued and provider-closed` |

**Descriptor-rung check.** Unlocks exact-candidate live evidence that cannot be
inferred from dependency equivalence or historical runs.

**Anti-ceremony gate.** Classification: `test/validation`; bounded provider
calls are the executable action, with separate approval mandatory.

### S22: Sustained dependency-closure soak and audits

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `dependency-closure-identity` |
| Crosses | `operational-resilience`, `release-readiness`, `conformance` |
| Advances contracts | DCI2, DCI3, PLQ1 |
| Objective | Repeat fresh installations and runtime polarity while proving closure, tree, resource, and cleanup stability |
| Value gate | Every cycle has identical approved closure/tree identity and leaves no growth, survivor, stale state, privacy finding, advisory, or false green |
| Validation gate | Bounded repeated installs, graph/tree ledgers, allow/deny/check cold reload, process/filesystem cleanup, descriptor/RSS ceilings, one current production audit |
| Likely artifacts | frozen soak plan, closure/tree cycle receipt, audit and privacy summaries |
| Dependencies | S21 completed without replay authority |
| Stop or defer condition | Stop on the first graph/tree mismatch or any existing S18 soak stop condition |
| Evidence path | `evidence/S22/` with sustained closure receipts |
| Status | `queued` |

**Descriptor-rung check.** Unlocks a stability claim over exact installed
dependency bytes rather than one registry/cache moment.

**Anti-ceremony gate.** Classification: `test/validation`; repeated real
install/runtime behavior dominates.

### S23: Three fresh exact-identity reviews and closeout

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `production-live-requalification` |
| Crosses | `dependency-closure-identity`, `release-readiness`, `conformance` |
| Advances contracts | PLQ2, PLQ3 |
| Objective | Obtain fresh artifact, evidence, and runtime verdicts over the same package/closure/tree identity and close only release-decision eligibility |
| Value gate | Three ACCEPT verdicts, zero critical/high/medium findings, every low adjudicated, exact cross-report identity, and green local/hosted gates |
| Validation gate | Three role-separated fresh reviews, consistency validator, dependency/privacy/credential scans, protocol check, accumulated gate, hosted CI |
| Likely artifacts | review plan, three reports, consistency receipt, hosted/no-publication closeout |
| Dependencies | S22 complete and immutable reviewer packet |
| Stop or defer condition | Any critical/high/medium finding or contrary verdict stops the program and requires new authority |
| Evidence path | `evidence/S23/` with reports and closeout receipts |
| Status | `queued` |

**Descriptor-rung check.** Unlocks only a separate private release decision;
it does not itself release or publish SCOPA.

**Anti-ceremony gate.** Classification: `test/validation`; unfamiliar agents
must reproduce executable artifact, evidence, and runtime boundaries.

## Slice arc

Completed predecessor window, oldest first:

| # | Slice | Terminal commit | Primary result | Non-goals all held? |
|---|---|---|---|---|
| 1 | S14 shared live-run custody | `0f2a48b` | bounded supervisor and private/public evidence custody | yes |
| 2 | S15 Claude production live hardening | `855148a` | bounded Claude edge campaign and replay-safe evidence | yes |
| 3 | S16 Codex production live hardening | `6297c85` | seven closed postures culminating in qualified Codex live evidence | yes |
| 4 | S17 sustained operational resilience | `0a3570b` | interruption, concurrency, resource, cleanup, and parity closure | yes |
| 5 | S18 exact production-live requalification | `5b25262` | live matrix and soak passed; fresh artifact review rejected candidate on dependency identity | yes; stop condition fired correctly |

The window changed 223 files by +33117/-379 lines. Accumulated tests grew
from 119 to 172 while all pushed checkpoint workflows remained green.

## Trajectory check

**Original goal (principal directive and SCOPA charter):** provide a free,
world-class runtime and evidence tool for developers, using the Next-Prompt
Protocol and Macro Delta as the build basis, while preserving truthful
assurance boundaries and enabling ethical downstream consultation.

**Current direction:** close one reproduced distribution-identity defect, then
repeat exact production-live qualification without transferring assurance.

**Drift assessment:** NONE.

Binding the complete installed dependency closure is directly required by the
project's evidence-truthfulness and exact-runtime claims.

## Cumulative scope audit

| Addition | Slice/window | Justified by | In charter? |
|---|---|---|---|
| Shared live process/evidence custody | S14 | production-live correctness | yes |
| Claude and Codex provider-specific edge controllers | S15-S16 | principal-directed production live testing | yes |
| Resource-bound evidence and recovery ledger | S17 | sustained operational safety | yes |
| Exact candidate/live/soak receipts | S18 | world-class release evidence | yes |
| Publishable dependency-closure identity | proposed S19 | reproduced S18.4 medium finding | yes |

No unrelated application, hosted service, proprietary verifier, or experiment
surface is added.

## Non-goal preservation

| Surface | Status | Notes |
|---|---|---|
| SCOPA prospective experiment | PRESERVED | separate running workstream remains untouched |
| Customer repository/data | PRESERVED | only disposable synthetic repositories |
| Credential or private topology retention | PRESERVED | public evidence privacy scans remain clean |
| npm publication or GitHub Release | PRESERVED | not authorized by predecessor or proposal |
| Deployment, announcement, certification, trademark claim | PRESERVED | separate principal decisions remain required |
| Assurance transfer across providers/candidates | PRESERVED | proposed arc requires fresh candidate and fresh live evidence |
| Paid verification dependency | PRESERVED | closure verifier remains part of the free tool |

## Forbidden-surface audit

| Forbidden surface | Source | Status | Notes |
|---|---|---|---|
| Experiment implementation/evidence crossover | production-live Macro Delta | NOT APPROACHED | explicitly excluded |
| Customer or credential-bearing test material | production-live Macro Delta | NOT APPROACHED | synthetic inputs only |
| Unapproved provider traffic | S14-S18 policies | NOT APPROACHED | every live call used exact approval; proposal defaults closed |
| Publication/deployment/visibility change | project governance and Macro Deltas | NOT APPROACHED | proposal grants no release authority |
| Closed or consulting-only verifier | project charter | NOT APPROACHED | all new closure checks remain free |

## Cost trajectory

n/a — no standing project cost ceiling is defined. Historical provider runs
used exact per-campaign ceilings and are closed. Drafting, S19, S20, S22, and
S23 require zero provider calls. S21 remains zero-call until a separate exact
budget approval.

## Verification health

| Metric | Start of window | Current | Delta |
|---|---|---|---|
| Accumulated discovered tests | 119 | 172 | +53 |
| Declared contracts satisfied | 53/53 | 68/70 | +15 satisfied, +17 declared |
| Regression incidents on pushed `main` | 0 | 0 | 0 |
| Protocol projection failures at checkpoint | 0 | 0 | 0 |
| Hosted checkpoint failures retained as green | 0 | 0 | 0 |
| Fresh S18 final ACCEPT verdicts | 0/3 | 0/3 | stopped on first REJECT |

**Observed regressions:** provider/candidate drift and publication-path defects
were retained as stopped evidence, not misreported as green. The S18.4 medium
finding is an assurance defect discovered by review, not a broken-main event.

**Test-count growth policy:** S19 adds only closure-specific hostile cases.
S20-S23 are validation-heavy and may not duplicate historical runtime tests.

## Open questions / tensions

1. **Shrinkwrap compatibility** — npm documents `npm-shrinkwrap.json` as the
   publishable lock surface for CLI tools, but SCOPA must prove actual packed
   dependency behavior on npm 10 and 11. Failure triggers a stop and a separate
   principal choice about bundling; it does not permit a silent fallback.
2. **Provider budget for S21** — no amount, model, call count, or execution
   window is authorized by this Macro Delta. Those values remain a later exact
   principal decision after the new candidate is frozen and hosted green.
3. **Release decision** — successful S23 would establish eligibility only.
   Publication and release remain separate principal actions.

## Continue / pause / pivot recommendation

**Recommendation:** PAUSE TO CONSOLIDATE pending exact-digest ratification;
then CONTINUE with S19 only.

The next executable seam is narrow and testable: generate and enforce the
publishable production closure, then prove it resists compatible transitive
drift. No candidate or provider work should resume until that seam passes.

## Program stop conditions

- The proposal is edited after its approved digest instead of superseded by a
  new proposal.
- Packed shrinkwrap is ignored, rewritten, or resolved differently by a
  supported npm version.
- Closure verification depends on mutable registry metadata rather than the
  packed closure and installed bytes.
- A dev dependency, lifecycle hook, local path, credential, private topology,
  or uncontrolled network target enters the consumer closure.
- Package, closure, installed graph, or installed tree identity drifts without
  an explicit failing outcome.
- Historical candidate, live evidence, approval, or review verdict is used to
  satisfy a replacement-candidate gate.
- A provider process launches without a fresh exact S21 approval.
- A provider call exceeds its exact sequence, model/client, token/cost, time,
  custody, or cleanup policy.
- Any critical/high/medium fresh-review finding or contrary verdict occurs.
- npm publication, GitHub Release, visibility change, deployment, customer
  action, announcement, certification, or trademark claim is attempted.

## Ratification gate

Approval must name this document's exact SHA-256 and authorize only S19-S23
under the boundaries above. Ratification creates a separate immutable approval
record; it does not modify this proposal. S19 becomes active only after the
manifest, phase router, contracts, and active protocol are rotated to the
approved digest and protocol sync/check passes.

## References

- Rejected review: `evidence/S18/reviews/artifact-review.rejected.md`
- Stop receipt: `evidence/S18/reviews/review-stop.json`
- S18 active/stopped protocol:
  `next-prompt-protocols/active/2026-07-31-S18-exact-production-live-requalification.md`
- Predecessor Macro Delta:
  `next-prompt-protocols/macro-deltas/2026-07-28-scopa-production-live-run-hardening.md`
- Manifest: `next-prompt-protocols/manifest.json`
- Official npm lockfile documentation:
  `https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/`
- Official npm shrinkwrap command:
  `https://docs.npmjs.com/cli/v11/commands/npm-shrinkwrap/`
