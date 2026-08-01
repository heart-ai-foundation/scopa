---
title: "Macro Delta: 2026-07-31: SCOPA Bundled Production-Closure Hardening"
entity: heart
type: compliance
tags:
  - compliance
  - forensic-methodologies
  - agentic-workflow-forensics
  - scopa
  - macro-delta
  - bundled-dependencies
  - dependency-closure
---

# Macro Delta: 2026-07-31: SCOPA Bundled Production-Closure Hardening

**Status:** PROPOSED — no implementation authority until a separate principal
approval record binds this document's exact SHA-256
**Document Classification:** Bundled Production-Closure Recovery Plan
**Format:** Macro Delta, per Next-Prompt Protocol v2.4
**Project:** SCOPA (Scope, Completion, and Operational Persistence for Agents)
**Publisher:** Heart AI Foundation
**Phase:** Phase 7 — Dependency-Closed Release Requalification
**Window:** `f3ab975` → `46da921` (S19 ratification and stopped attempt)
**Author:** Codex, under principal direction
**Trigger:** npm 10.9.7 retained but did not enforce the packed consumer
shrinkwrap, firing the ratified S19 stop condition
**Predecessor:** `2026-07-31-scopa-dependency-closure-identity-hardening.md`
**Baseline:** `46da921b9eb180429268bee0b34f44af2e129771` on private
`heart-ai-foundation/scopa`
**Principal authorization:** pending exact-digest approval
**Date:** July 31, 2026

---

## Authority boundary

This proposal becomes the sole recovery authority for S19-v2 through S23 only
when a separate principal approval record binds the exact file SHA-256. The
principal's instruction to draft a principal-approved posture authorizes this
proposal artifact, not implementation against unhashed or mutable text.

If ratified, this proposal supersedes only the failed shrinkwrap enforcement
mechanism. It preserves the predecessor's six open contracts, no-assurance-
transfer rule, later slice gates, and release prohibitions. It authorizes the
minimum packaging, manifest, verifier, schema, fixture, test, and evidence
changes needed to make the complete production dependency payload an immutable
part of the SCOPA tarball and installed identity.

S19-v2, S20, and S22 require zero provider calls. S21 remains closed until a
separate exact candidate-bound approval names every call, client, model,
sequence, budget, expiry, and custody destination. This proposal authorizes no
npm publication, GitHub Release, visibility change, deployment, customer use,
public announcement, formal certification, trademark exclusivity, or
customer-data processing.

## Where we are

The first S19 design produced a candidate with a packed and retained
`npm-shrinkwrap.json`, but a source-free npm 10.9.7 install selected
`fast-uri@3.1.5` instead of the approved `3.1.4`. S19 stopped before npm 11,
removed the failed implementation, retained a green 172-test baseline, and
left DCI1-DCI3 and PLQ1-PLQ3 open. The stop receipt is
`evidence/S19/shrinkwrap-enforcement-stop.json` with canonical receipt digest
`277e6a2eb4a0ca5953a23c59eeb5d49c9f1005804d6fd0207aff462127e03295`.

The recovery seam is narrower than the original design: vendor the reviewed
production payload into the candidate using npm's documented
`bundledDependencies` package surface, bind every bundled byte and dependency
edge in a canonical manifest, prove empty-cache installation cannot consult or
substitute registry content, and independently attest the installed payload.

## Governing decisions

- The candidate declares exactly the reviewed direct production dependencies
  in `bundledDependencies`; `bundleDependencies` is treated as an equivalent
  npm spelling but SCOPA emits one canonical spelling only.
- The bundle is staged from `npm ci --omit=dev --ignore-scripts` against the
  reviewed source lock. It is never assembled from an ambient developer
  `node_modules` tree.
- The complete transitive production payload is physically present beneath
  the packed `package/node_modules/` tree. Missing descendants fail the pack
  gate even when npm could fetch them.
- A canonical bundle manifest binds every production package path, exact name,
  version, dependency edge, source resolution and integrity from reviewed lock
  state, plus every packed regular-file path, byte length, executable bit, and
  SHA-256. Generated installer links are modeled separately and may not stand
  in for package bytes.
- Tarball SHA-256, canonical production-closure SHA-256, bundled-payload tree
  SHA-256, and installed-payload tree SHA-256 remain distinct receipt fields.
- The independent installed probe derives identity from installed bytes and
  package metadata. It does not trust the candidate's manifest merely because
  the manifest is present.
- Source-free qualification begins with an empty npm cache and an empty
  consumer root, disables lifecycle scripts, audit, and funding requests, and
  makes the configured registry unreachable. A successful install must require
  zero registry or other external network requests.
- npm 10 and npm 11 on supported Node 22 environments must independently
  install the same exact payload. Neither a pre-populated cache nor source
  checkout may satisfy the gate.
- Hostile cases remove, mutate, add, transplant, rename, or permission-change
  bundled files and packages; alter manifest edges or hashes; inject dev-only
  packages; add lifecycle hooks, symlinks, native addons, local paths, git
  sources, uncontrolled URLs, or registry-fetched fallbacks; and attempt stale
  manifest or whole-subtree substitution. Every case fails closed.
- Current SCOPA production dependencies remain exact and unchanged. Bundling
  is not permission to upgrade, fork, patch, minimize, or rewrite third-party
  code.
- License and notice inventory is emitted from the exact bundled payload and
  checked before candidate qualification. A missing or incompatible licensing
  record stops the slice.
- The candidate remains a normal free npm-compatible package. No paid service,
  proprietary verifier, online activation, telemetry, or consultation-only
  truth source becomes necessary to verify it.
- Historical S18/S19 candidate bytes, approvals, provider receipts, and review
  verdicts remain immutable test-design inputs only; none can satisfy the new
  candidate's gates.

## Blocks

### Block M2: Bundled production-closure enforcement

| Field | Value |
|---|---|
| Block goal | Make every installed production dependency byte an immutable, independently verified part of the candidate |
| Modules | `dependency-closure-identity`, `release-readiness`, `distribution-hardening`, `conformance` |
| Slice count | 1 (S19-v2) |
| Stop boundary | Stop on incomplete bundling, any install-time fetch, npm-version drift, payload/manifest mismatch, dev contamination, unsafe package surface, licensing gap, or false green |
| Production policy | Provider-closed; empty-cache and unreachable-registry qualification; zero external network |
| Evidence policy | Canonical closure, packed payload inventory, installed-byte attestation, network-denial receipt, hostile mutation corpus |

### Block N: New exact candidate

| Field | Value |
|---|---|
| Block goal | Freeze new bytes whose package, bundled closure, installed payload, policies, and deterministic matrix are one identity |
| Modules | `production-live-requalification`, `dependency-closure-identity`, `release-readiness`, `conformance` |
| Slice count | 1 (S20) |
| Stop boundary | Stop on nondeterministic pack, identity drift, source inheritance, privacy finding, advisory, licensing defect, or false green |
| Production policy | Zero provider traffic; private candidate only |
| Evidence policy | New candidate manifest and qualification receipt; all rejected candidates remain immutable history |

### Block O: Fresh production-live requalification

| Field | Value |
|---|---|
| Block goal | Exercise the new exact bundled candidate through fresh Claude and Codex calls without evidence or approval transfer |
| Modules | `production-live-requalification`, `live-run-custody`, `claude-live-hardening`, `codex-live-hardening` |
| Slice count | 1 (S21) |
| Stop boundary | Stop before launch without a separate exact approval; then stop on identity drift, budget, privacy, cleanup, false green, or any unapproved call |
| Production policy | Closed matrix first; explicit principal approval required for exact provider calls |
| Evidence policy | Fresh private custody and privacy-clean public derivatives bound to the new package/closure/bundle/install identity |

### Block P: Sustained bundled-closure soak and audit

| Field | Value |
|---|---|
| Block goal | Prove repeated empty-cache installs cannot fetch, substitute, or drift from the approved bundled payload |
| Modules | `dependency-closure-identity`, `operational-resilience`, `release-readiness`, `conformance` |
| Slice count | 1 (S22) |
| Stop boundary | Stop on network attempt, graph/tree drift, advisory, privacy event, survivor, stale state, resource growth, or false green |
| Production policy | Provider-closed; one separately bounded current registry advisory audit may inspect the reviewed source lock, not alter the candidate |
| Evidence policy | Multi-cycle closure/bundle/install ledger, resource/cleanup receipt, audit, licensing, and privacy results |

### Block Q: Fresh bundled-identity reviews

| Field | Value |
|---|---|
| Block goal | Obtain unfamiliar artifact, evidence, and runtime verdicts against the same new package/closure/bundle/install identity |
| Modules | `production-live-requalification`, `dependency-closure-identity`, `release-readiness`, `conformance` |
| Slice count | 1 (S23) |
| Stop boundary | Stop on any critical/high/medium finding, contrary verdict, identity mismatch, or unadjudicated low |
| Production policy | Provider-closed reviews; no publication or release decision |
| Evidence policy | Three exact-byte reports, cross-review consistency, protocol/local/hosted gates, no-publication receipt |

## Module map and exit contracts

The six Phase 7 contracts remain open and retain their IDs. On ratification,
their verification language rotates from publishable-shrinkwrap enforcement to
the bundled-payload mechanism without declaring progress.

| Module | Exit contracts |
|---|---|
| `dependency-closure-identity` | DCI1 every candidate carries a canonical production closure and complete bundled payload whose package graph and file bytes are independently bound with no dev nodes; DCI2 npm 10/11 empty-cache installs reproduce exactly the approved closure and installed payload with zero fetches while missing, mutated, transplanted, extra, stale, or substituted states fail closed; DCI3 qualification, live, soak, and review evidence bind package, closure, bundled-payload, and installed-payload digests without collapsing them into one claim |
| `production-live-requalification` | PLQ1 one new dependency-closed bundled candidate passes the full frozen production-like matrix and sustained soak; PLQ2 three fresh artifact, evidence, and runtime reviewers return ACCEPT with no critical/high/medium finding and every low adjudicated; PLQ3 dependency, licensing, privacy, credential, protocol, local, and hosted gates remain green and establish only eligibility for a separate release decision |

## Proposed slice queue

### S19-v2: Bundled production-closure enforcement

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `dependency-closure-identity` |
| Crosses | `release-readiness`, `distribution-hardening`, `conformance` |
| Advances contracts | DCI1, DCI2, DCI3 |
| Objective | Generate, pack, install, and independently verify one canonical bundled production payload |
| Purpose | npm did not enforce a dependency's packed shrinkwrap, so the candidate must carry the reviewed dependency bytes it executes |
| Value gate | npm 10 and npm 11 install identical reviewed bytes from the tarball with empty caches and an unreachable registry, while every payload, graph, manifest, and fallback mutation fails closed |
| Validation gate | deterministic clean staging, complete transitive bundle, closure/file manifest, two npm versions, empty-cache network denial, independent installed-byte comparison, hostile corpus, licensing, package privacy, accumulated gate |
| Likely artifacts | bundle staging tool, canonical closure and file manifest, installed-byte attestor, hostile fixtures, license inventory, focused tests |
| Dependencies | Principal approval of this document's exact SHA-256 |
| Stop or defer condition | Stop for a new principal decision if npm omits or rewrites bundled bytes, attempts a fetch, produces version-specific installed payloads, or if exact byte equivalence cannot be independently established |
| Evidence path | `evidence/S19-v2/` with approval, bundle, install, network-denial, and hostile-corpus receipts |
| Status | `queued pending exact-digest ratification` |

**Descriptor-rung check.** Unlocks an executable, offline install identity that
closes the reproduced dependency-substitution finding.

**Anti-ceremony gate.** Classification: `implementation`; package contents and
install behavior change and must survive hostile byte-level tests.

### S20: Bundled exact-candidate freeze

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `production-live-requalification` |
| Crosses | `dependency-closure-identity`, `release-readiness`, `conformance` |
| Advances contracts | DCI3, PLQ1 |
| Objective | Build one new candidate and bind package, closure, bundled payload, installed payload, policies, clients, and deterministic matrix |
| Value gate | Two clean packs are byte-identical and npm 10/11 empty-cache installs reproduce the exact payload with zero fetch, privacy, credential, license, policy, or advisory finding |
| Validation gate | clean pack, manifest, offline installs, full deterministic matrix, accumulated gate, protocol check, hosted CI |
| Dependencies | S19-v2 complete and clean source commit |
| Stop or defer condition | Stop on any identity drift, nondeterminism, network attempt, dependency mismatch, false green, privacy, licensing, or advisory result |
| Evidence path | `evidence/S20/` with the new exact candidate qualification |
| Status | `queued` |

### S21: Fresh candidate production-live matrix

S21 retains the predecessor's exact separate-approval boundary. The closed
matrix binds package, closure, bundled-payload, and installed-payload digests.
No provider call is authorized by ratifying this document.

### S22: Sustained bundled-closure soak and audits

S22 repeats bounded empty-cache, unreachable-registry installs and runtime
polarity. Every cycle records the same four-part identity, zero fetches,
resource ceilings, cleanup, audit, licensing, and privacy results.

### S23: Fresh exact-identity reviews and closeout

S23 obtains three unfamiliar artifact, evidence, and runtime reviews against
the same bytes. Completion establishes eligibility for a separate release
decision only; it authorizes no publication.

## Slice arc

| # | Slice/event | Commit | Result | Assurance transfer permitted? |
|---|---|---|---|---|
| 1 | Dependency-closure proposal | `f3ab975` | exact-digest proposal | no |
| 2 | S19-S23 ratification | `50730fb` | six contracts opened/reopened | no |
| 3 | S19 shrinkwrap attempt | stopped evidence | npm 10 installed unapproved compatible transitive bytes | no |
| 4 | S19 stop checkpoint | `46da921` | failed approach removed; baseline and hosted gate green | no |

## Trajectory check

| Original goal | Current direction | Assessment |
|---|---|---|
| Exact candidate identity | Bind dependency code bytes inside the candidate rather than depend on nested lock enforcement | aligned recovery |
| Free developer runtime | Ship dependencies with the free package and keep verification local | preserved |
| Evidence-grade claims | Separate package, graph, bundled-byte, and installed-byte digests | strengthened |
| Downstream consultation | Offer implementation help without making verification proprietary | preserved |

## Cumulative scope audit

| Added surface | Why required | Status |
|---|---|---|
| Bundled dependency staging | npm 10 disproved nested shrinkwrap enforcement | proposed, bounded |
| Byte-level payload manifest | graph identity alone does not identify executed code | proposed, bounded |
| Offline network-denial qualification | proves install cannot substitute registry content | proposed, bounded |
| License inventory | redistribution changes require explicit package-compliance evidence | proposed, bounded |
| Runtime features, UI, service, telemetry | unrelated to reproduced defect | excluded |

## Non-goal preservation

| Non-goal | State | Evidence |
|---|---|---|
| No provider traffic in S19-v2/S20/S22 | PRESERVED | explicit authority and stop boundaries |
| No experiment crossover | PRESERVED | production release-requalification scope only |
| No dependency upgrade or patching | PRESERVED | exact current versions; separate authority required |
| No proprietary or paid verifier | PRESERVED | all manifests, fixtures, and validators remain free |
| No publication or release | PRESERVED | excluded from authority |
| No historical assurance transfer | PRESERVED | every new candidate gate is fresh |

## Forbidden-surface audit

| Surface | State | Control |
|---|---|---|
| Registry substitution during install | APPROACHED BY FAILED DESIGN | empty cache, unreachable registry, zero-request receipt |
| Ambient `node_modules` inheritance | NOT PERMITTED | clean staging from reviewed lock only |
| Lifecycle execution | NOT PERMITTED | `--ignore-scripts` plus manifest rejection |
| Native/platform-specific payload | NOT PERMITTED IN THIS POSTURE | reject addon/binary/platform selectors; fresh decision if encountered |
| Symlink/path traversal or special files | NOT PERMITTED | canonical path/type scanner and hostile corpus |
| Credential/private topology leakage | NOT PERMITTED | tarball and evidence privacy scans |
| Provider/release action | NOT APPROACHED | separately closed authorities |

## Cost trajectory

S19-v2 adds no provider cost and no hosted service. Candidate size will grow by
the exact production dependency payload; size, file count, and unpacked size
must be measured and bounded in evidence. Any material distribution-cost or
platform-compatibility change stops for principal review rather than being
normalized as an implementation detail.

## Verification health

| Metric | Current | Required next state |
|---|---|---|
| Accumulated discovered tests | 172/172 green | remain green plus focused S19-v2 cases |
| Phase 7 contracts | 0/6 satisfied | remain open until executable evidence exists |
| Hosted stop checkpoint | run `30673459143` green | proposal and implementation commits each hosted green |
| Provider calls under recovery posture | 0 | remain 0 until separately approved S21 |
| External install requests | 0 during stopped attempt | demonstrably 0 with empty cache in S19-v2 |

**Test-count growth policy:** add only cases that distinguish bundled-payload
identity, network denial, unsafe archive surfaces, npm-version parity, or a
known false-green. Reuse the accumulated release gate for historical behavior.

## Open questions / tensions

1. **npm bundle transformation.** npm may normalize archive or installed
   metadata. The canonical comparison must model only declared deterministic
   transformations; any unexplained byte difference stops S19-v2.
2. **Redistribution obligations.** Exact license and notice inventory must be
   reviewed from the bundled payload. Missing evidence is a hard stop, not a
   documentation follow-up.
3. **Package size.** Bundling intentionally trades package size for immutable
   offline identity. The measured delta is reported before candidate freeze.
4. **S21 provider budget.** No call count, model, client, amount, or execution
   window is authorized here; those remain an exact later decision.
5. **Release decision.** Successful S23 establishes eligibility only.

## Continue / pause / pivot recommendation

**Recommendation:** PAUSE FOR EXACT-DIGEST RATIFICATION, then CONTINUE with
S19-v2 only.

The next executable seam is to prove the candidate physically carries every
reviewed production byte and installs it identically under npm 10 and 11 with
an empty cache and no reachable registry. S20-S23 remain queued behind that
proof.

## Program stop conditions

- This proposal is edited after its approved digest instead of superseded.
- Any production dependency or descendant is absent from the packed payload.
- Installation attempts registry or other external network access.
- npm 10 and npm 11 produce different production package or byte identities.
- Packed or installed bytes cannot be mapped deterministically without an
  unexplained exclusion or normalization.
- A dev package, lifecycle hook, native addon, unsafe link, special file,
  local/git dependency, credential, private topology, or uncontrolled URL
  enters the candidate.
- License or notice evidence is missing, incompatible, or ambiguous.
- Package, closure, bundled-payload, or installed-payload identity drifts
  without an explicit failing outcome.
- Historical evidence or approval is used to satisfy a new-candidate gate.
- Any provider process launches without fresh exact S21 approval.
- Any critical/high/medium fresh-review finding or contrary verdict occurs.
- Publication, release, visibility, deployment, customer, announcement,
  certification, or trademark action is attempted.

## Ratification gate

Approval must name this document's exact SHA-256 and authorize only S19-v2
through S23 under the boundaries above. Ratification creates a separate
immutable approval record; it does not modify this proposal. Only then may the
manifest, Phase 7 router, contracts, and active protocol rotate from the
stopped shrinkwrap mechanism to bundled production-closure enforcement.

## References

- S19 stop receipt: `evidence/S19/shrinkwrap-enforcement-stop.json`
- S19 stop note: `notes/S19/2026-07-31-shrinkwrap-enforcement-stop.md`
- Active stopped protocol:
  `next-prompt-protocols/active/2026-07-31-S19-publishable-dependency-closure-enforcement.md`
- Predecessor Macro Delta:
  `next-prompt-protocols/macro-deltas/2026-07-31-scopa-dependency-closure-identity-hardening.md`
- Manifest: `next-prompt-protocols/manifest.json`
- Official npm `bundledDependencies` documentation:
  `https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#bundleddependencies`
- Official npm pack documentation:
  `https://docs.npmjs.com/cli/v11/commands/npm-pack/`
