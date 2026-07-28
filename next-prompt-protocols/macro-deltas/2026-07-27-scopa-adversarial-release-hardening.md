---
title: "Macro Delta: 2026-07-27: SCOPA Adversarial Release Hardening"
entity: heart
type: compliance
tags:
  - compliance
  - forensic-methodologies
  - agentic-workflow-forensics
  - scopa
  - macro-delta
  - release-hardening
---

# Macro Delta: 2026-07-27: SCOPA Adversarial Release Hardening

**Status:** RATIFIED — governs S11-S13; S11 is the initial active slice
**Document Classification:** Adversarial Hardening Build Plan (Pattern A)
**Format:** Macro Delta, per Next-Prompt Protocol v2.4
**Project:** SCOPA (Scope, Completion, and Operational Persistence for Agents)
**Publisher:** Heart AI Foundation
**Phase:** proposed Phase 5 — Adversarial Release Hardening
**Window:** `9191256` → `ef44d18` (S6-S10 plus post-closeout review)
**Author:** Codex, for principal review
**Trigger:** principal request after post-S10 three-agent adversarial `HOLD`
**Predecessor:** `2026-07-27-scopa-developer-preview.md`
**Baseline:** `ef44d18` on private `heart-ai-foundation/scopa`
**Principal authorization:** 2026-07-27
**Date:** July 27, 2026

---

## Authority boundary

This immutable Macro Delta is the sole implementation authority for S11-S13,
with S11 as the only initially active slice. It does not reopen S10 or permit
work outside the active slice's manifest scope.

It does not authorize npm publication, a GitHub Release, repository visibility
change, public announcement, production deployment, formal certification,
trademark exclusivity, or customer use.

## Where we are

SCOPA completed the authorized S0-S10 kernel and private developer-preview
queues at 44/44 declared contracts. The exact S10 tarball remains
byte-verified and its accepted proof remains valid. A fresh three-agent
post-closeout review found no containment escape, signature bypass, credential
value, or false-green completion, but confirmed two medium
release-readiness defects: runtime proof validation is weaker than the
published JSON Schemas, and generic proof redaction can alter a colliding
semantic value while claiming no semantic change. Broader release is on
`HOLD`; the next work must consolidate these boundaries rather than add
features.

## Why this exists

S10 proved one exact clean artifact. The post-closeout campaign tested the
reusable validation and publication machinery under adversarial inputs. It
showed that an exact proof can be valid while the generic APIs around that
proof still admit schema drift or unsafe redaction semantics.

This Macro Delta converts the retained `HOLD` into an ordered hardening queue:

1. converge runtime and published proof contracts;
2. harden the shipped consumer/error/CI surface;
3. rebuild and independently requalify the exact candidate.

## Governing decisions

- S10 remains historically complete; its evidence is not rewritten.
- The accepted S10 artifact is a baseline input, not a release authorization.
- Medium findings RR-01 and RR-02 block broader release until corrected and
  independently retested.
- Fixes must fail closed and must not weaken any S0-S10 scope, completion,
  continuity, signature, trust-policy, or known-failure behavior.
- Runtime validators and published schemas must have one mechanically checked
  acceptance language.
- Public proof publication must redact only designated private fields and must
  detect or reject semantic collisions.
- Shipped package scripts, bins, exports, fixtures, and documentation must
  describe the same consumer surface.
- Default launcher errors must be bounded and machine-readable; diagnostic
  stacks must be opt-in.
- Contributor-specific path sentinels must not ship in the consumer artifact.
- GitHub Actions runtime-deprecation warnings must be resolved using
  authoritative supported action versions at implementation time.
- Credential rotation from the separate private S10 diagnostic incident is an
  external prerequisite for final requalification, never a repository secret.
- Public release remains a separate principal action after this queue closes.

## Blocks

### Block F: Proof Contract Convergence

| Field | Value |
|---|---|
| Block goal | Make runtime proof validation, published schemas, and proof publication accept exactly the intended states and reject semantic drift |
| Modules | `proof-integrity`, `release-readiness`, `conformance` |
| Slice count | 1 (S11) |
| Stop boundary | Stop if any false-green proof, schema/runtime disagreement, redaction collision, or hard-coded semantic-change assertion remains |
| Production policy | Local deterministic fixtures only; no publication |
| Evidence policy | `arc` class; differential corpus, collision corpus, raw/public receipts, and fresh-agent review |

### Block G: Distribution Surface Hardening

| Field | Value |
|---|---|
| Block goal | Make every shipped command intentional, every default launcher error bounded, and the package/CI surface free of contributor-specific or deprecated implementation residue |
| Modules | `distribution-hardening`, `adapter-host`, `distribution`, `conformance` |
| Slice count | 1 (S12) |
| Stop boundary | Stop if an advertised installed command is broken, a default error leaks stacks/absolute paths, private contributor identity remains in package bytes, or CI retains action-runtime deprecation warnings |
| Production policy | Exact local tarball in disposable repositories only |
| Evidence policy | `arc` class; inventory contract, installed-command matrix, hostile launcher fixtures, package scan, and hosted CI |

### Block H: Adversarial Requalification

| Field | Value |
|---|---|
| Block goal | Rebuild the candidate from a clean commit and obtain independent agreement that exact behavior, generic validation, publication, package, and claim boundaries hold |
| Modules | `release-requalification`, `proof-integrity`, `distribution-hardening`, `conformance` |
| Slice count | 1 (S13) |
| Stop boundary | Stop on any critical/high/medium finding, proof mismatch, sourceful resolution, credential prerequisite failure, or contrary outside verdict |
| Production policy | Private candidate evaluation only; no registry, release, visibility, deployment, or customer action |
| Evidence policy | `arc` class; exact artifact, source-free proof, mutation corpus, three fresh-agent reports, dependency audit, and hosted gate |

## Module map and exit contracts

| Module | Exit contracts |
|---|---|
| `proof-integrity` | PI1 runtime validators and published JSON Schemas agree over the full positive/negative corpus; PI2 non-empty/unique/cardinality/numeric and closed-field constraints fail identically; PI3 public proof redaction is field-specific, collision-aware, and mechanically reports semantic change |
| `distribution-hardening` | DH1 every shipped bin/export/script either runs from an installed tarball or is absent from the consumer contract; DH2 package bytes contain no contributor-specific home/path sentinel and default launcher failures expose no stack or absolute install path; DH3 hosted CI uses supported action runtimes and has no action-runtime deprecation warning |
| `release-requalification` | RQ1 an exact clean candidate passes source-free install, governed adapter, known-failure, signature, schema, redaction, package, and error-surface corpora; RQ2 three fresh isolated reviewers reproduce the claims and return `ACCEPT` with no critical/high/medium finding; RQ3 dependency audit, credential-rotation confirmation, protocol check, and hosted gate pass before the queue closes |

Completion is satisfied exit contracts over declared exit contracts. It does
not imply permission to publish.

## Proposed slice queue

### S11: Proof contract and redaction convergence

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `proof-integrity` |
| Crosses | `release-readiness`, `conformance` |
| Advances contracts | PI1, PI2, PI3 |
| Objective | Eliminate runtime/schema disagreement and make proof publication preserve or explicitly reject semantics under collision |
| Purpose | A proof surface is not trustworthy if two official validators accept different languages or redaction can silently alter a valid field |
| Value gate | One differential corpus returns identical accept/reject results through runtime validators and published schemas; collision inputs cannot produce a false `semanticFieldsChanged: false` receipt |
| Validation gate | Empty/duplicate arrays, zero/negative bounds, unknown/missing fields, fabricated aggregate states, exact accepted proof, overlapping roots, substrings, placeholder injection, semantic collisions, and deterministic publication bytes |
| Likely artifacts | authoritative validation helpers, schema-parity runner, mutation fixtures, field-specific redactor, semantic comparison, focused tests |
| Dependencies | S10 closeout, post-S10 adversarial report, principal ratification of this Macro Delta |
| Stop or defer condition | Stop if the fix special-cases only the reported examples, weakens closed schemas, or changes the accepted S10 proof without an explicit migration record |
| Evidence path | `evidence/S11/` with corpus manifest, parity receipt, collision receipt, and outside review |
| Status | `active` |

**Descriptor-rung check.** Unlocks a single executable acceptance language for
proof validation and publication.

**Anti-ceremony gate.** Classification: `implementation`; executable
validator/redactor behavior and hostile tests dominate.

### S12: Installed surface, launcher, privacy, and CI hardening

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `distribution-hardening` |
| Crosses | `adapter-host`, `distribution`, `conformance` |
| Advances contracts | DH1, DH2, DH3 |
| Objective | Reconcile shipped commands with package contents, make launcher failures structured, remove contributor-specific path residue, and clear CI action-runtime warnings |
| Purpose | A developer-preview package must not advertise broken contributor commands or disclose local build topology through ordinary failure paths |
| Value gate | A fresh installed-command matrix proves every retained bin/export/script works from tarball-only content, while hostile launcher inputs return closed stack-free envelopes |
| Validation gate | Package inventory, omitted-fixture negative control, bin/export/script matrix, invalid session/matrix/config documents, absolute-path scan, credential-pattern scan, supported GitHub action-runtime check, and accumulated gate |
| Likely artifacts | consumer/contributor script split, package allowlist adjustment, structured launcher-error schema, privacy scan, CI action updates, installed-artifact tests |
| Dependencies | S11 |
| Stop or defer condition | Stop if consumer functionality or public verification is removed merely to make the matrix green, or if errors become less diagnostic without an explicit opt-in debug path |
| Evidence path | `evidence/S12/` with installed-command matrix, package scan, hostile error transcript, and hosted CI receipt |
| Status | `queued` |

**Descriptor-rung check.** Unlocks a coherent, privacy-clean installed package
whose documented commands and default errors are consumer-safe.

**Anti-ceremony gate.** Classification: `implementation`.

### S13: Fresh-agent adversarial release requalification

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `release-requalification` |
| Crosses | `proof-integrity`, `distribution-hardening`, `conformance` |
| Advances contracts | RQ1, RQ2, RQ3 |
| Objective | Rebuild an exact private candidate and requalify it through source-free hostile corpora and three fresh isolated reviewers |
| Purpose | Hardening is complete only when unfamiliar consumers reproduce the corrected generic boundaries from candidate bytes rather than source context |
| Value gate | Three fresh reviewers independently install the exact artifact, reproduce proof/package/runtime controls, and issue `ACCEPT` with no critical/high/medium finding |
| Validation gate | Clean pack/install, validator/schema parity corpus, redaction collision corpus, CLI/MCP boundary corpus, installed-command matrix, signature/trust tampering, known-failing fixture, dependency audit, credential-rotation confirmation, full local gate, and hosted CI |
| Likely artifacts | new candidate manifest, raw/private and redacted/public proofs, adversarial corpus receipt, three structured outside reviews, closeout record |
| Dependencies | S12 and confirmation that affected S10 diagnostic credentials were rotated |
| Stop or defer condition | Stop on any proof mismatch, unsafe redaction, schema drift, broken shipped command, containment escape, signature bypass, false-green state, unrotated credential, or contrary reviewer verdict |
| Evidence path | `evidence/S13/` with exact artifact receipt, consumer proof, mutation results, outside reviews, and hosted run |
| Status | `queued` |

**Descriptor-rung check.** Unlocks a requalified candidate after the exact
adversarial defects are eliminated.

**Anti-ceremony gate.** Classification: `test/validation` with executable
source-free consumers.

## Slice arc

Predecessor Developer Preview window, oldest first:

| # | Slice | Feature/evidence commit | LOC delta | Tests added | Non-goals all held? |
|---|---|---|---|---|---|
| 1 | S6 installable developer surface | `ce763f1` | +1395 / -6 | +7 | yes |
| 2 | S7 model-neutral adapter bridge | `f36950a` | +2724 / -16 | +7 | yes |
| 3 | S8 Claude Code headless integration | `8be70bd` | +12070 / -6 | +6 | yes |
| 4 | S9 Codex headless parity | `76a82a9` | +10720 / -2 | +8 | yes |
| 5 | S10 developer-preview candidate | `6ecc581` | +4418 / -25 | +7 | yes, with post-closeout verification gaps |

Run records:

- `runs/S6/2026-07-27-validation.md`
- `runs/S7/2026-07-27-validation.md`
- `runs/S8/2026-07-27-validation.md`
- `runs/S9/2026-07-27-validation.md`
- `runs/S10/2026-07-27-validation.md`

## Trajectory check

**Original goal:** deliver a free, independently useful SCOPA enforcement
runtime whose scope, completion, continuity, evidence, and supported adapter
claims are mechanically verifiable. Source:
`next-prompt-protocols/macro-deltas/2026-07-27-scopa-developer-preview.md`,
“Why this exists” and “Governing decisions.”

**Current direction:** pause broader release and harden the reusable proof,
publication, installed-package, launcher, privacy, and CI surfaces exposed by
post-closeout adversarial testing.

**Drift assessment:** NONE.

The proposed work narrows claims and strengthens existing release boundaries.
It adds no product capability, provider integration, deployment surface, or
paid dependency.

## Cumulative scope audit

| Addition | Slice/window | Justified by | In authorized arc? |
|---|---|---|---|
| Local tarball CLI and package | S6 | Developer Preview Macro Delta Block C | yes |
| Model-neutral MCP bridge | S7 | Developer Preview Macro Delta Block D | yes |
| Claude and Codex launch/evidence profiles | S8-S9 | Principal-authorized integration targets | yes |
| Proof schemas, redactor, release policies, public fixtures | S10 | Developer Preview Macro Delta Block E | yes |
| Validator/schema differential corpus | S11 | RR-01 adversarial finding | yes — ratified hardening queue |
| Collision-aware publication corpus | S11 | RR-02 adversarial finding | yes — ratified hardening queue |
| Installed-command/error/privacy/CI hardening | S12 | retained low findings and hosted warning | yes — ratified hardening queue |
| Three-agent adversarial requalification | S13 | principal-requested adversarial standard | yes — ratified hardening queue |

The four additions are bounded corrections to existing surfaces, not
new product subsystems.

## Non-goal preservation

| Window | Non-goal | Status | Notes |
|---|---|---|---|
| S6-S10 | No npm publication, public repository, GitHub Release, or production deployment | PRESERVED | Repository and candidate remain private |
| S6-S10 | No prompt-obedience claim for scope or completion | PRESERVED | Real dispatcher and gate states remain authoritative |
| S7-S10 | No full assurance transfer to Claude or Codex | PRESERVED | Both remain `partial` |
| S8-S10 | No hidden native provider routes | PRESERVED | Capability matrices retain uncontrolled routes |
| S10 | No source-checkout or private-evidence dependency in quickstart | PRESERVED | Elevated disposable retest passed from tarball |
| S10 | No contributor-private path in consumer bytes | NEAR-MISS | Detection sentinels embed a contributor username but no captured path or secret |
| S10 | No false-green proof/publication claim | NEAR-MISS | Exact proof is valid; generic validator/redactor APIs admit unsafe synthetic states |
| S6-S10 | No removal of independently useful free verification | PRESERVED | Verifier and fixtures remain in the package |
| S11-S13 | No new features or integrations during hardening | PRESERVED BY AUTHORITY | Stop condition if crossed |

No non-goal is classified `VIOLATED`.

## Forbidden-surface audit

| Forbidden surface | Source | Status | Notes |
|---|---|---|---|
| npm or public release without separate authority | Developer Preview Macro Delta | NOT APPROACHED | Package remains private |
| Repository visibility change | Developer Preview Macro Delta | NOT APPROACHED | GitHub repository remains private |
| Production/customer deployment | Developer Preview Macro Delta | NOT APPROACHED | Disposable fixtures only |
| OS-sandbox or formal-certification claim | S10 claim boundary | NOT APPROACHED | Explicit non-claims retained |
| Paid dependency for truth or verification | Open-core boundary | NOT APPROACHED | Local verifier remains free |
| Full assurance claim for Claude/Codex | Adapter assurance decision | NOT APPROACHED | Both remain `partial` |
| Semantic alteration hidden by publication receipt | S10 proof boundary | APPROACHED | RR-02 reproduces generic collision; exact S10 proof did not collide |
| Runtime acceptance broader than published schema | S10 schema boundary | APPROACHED | RR-01 reproduces divergence |
| Credential material in candidate/repository | S10 security boundary | NOT APPROACHED | Scans found no credential value |
| Unsafe operator credential handling | Private S10 incident record | APPROACHED | Rotation remains required outside repository |

No forbidden surface is classified `CROSSED` in the candidate artifact.

## Cost trajectory

n/a — no project cost ceiling is defined.

S10's two recorded Claude Sonnet outside reviews used explicit per-run budget
caps and together cost approximately USD 0.81. The proposed hardening queue
must retain bounded outside-model budgets and record actual spend.

## Verification health

| Metric | Start of window | End of window | Delta |
|---|---|---|---|
| Accumulated deterministic/integration tests | 76 | 111 | +35 |
| Satisfied/declared contracts | 29/29 | 44/44 | +15 / +15 |
| Regression incidents on pushed `main` | 0 | 0 | 0 |
| Slice trio completeness | 0/5 | 5/5 | +5 |
| Final `sync-protocols --check` failures | 0 | 0 | 0 |
| Known npm vulnerabilities | 0 | 0 | 0 |

**Observed regressions:** no pushed-main regression. One artifact-ordering defect
was caught before final proof. Post-closeout testing found RR-01 and RR-02 in
generic release-readiness APIs while confirming the exact accepted proof.

**Test-count growth velocity:** seven tests per predecessor slice on average.
S11-S12 must add hostile differential tests proportional to every corrected
branch; S13 is validation-only and must not inflate counts with duplicate
assertions.

## Open questions / tensions

1. **Installed script posture.** Recommended default: retain the public bins,
   exports, fixtures, and verifier, but remove contributor-only test/probe
   scripts from the consumer package unless all of their dependencies are
   intentionally shipped.
2. **Credential rotation confirmation.** Values must never enter the
   repository. S13 closeout should require only a provider-side confirmation
   that the affected Slack, OpenRouter, and Valyu credentials were rotated and
   old values invalidated.
3. **Public-release timing.** Remains outside this Macro Delta. Successful S13
   requalification would make a candidate eligible for a separate publication
   decision, not publish it.

## Continue / pause / pivot recommendation

**Recommendation:** PAUSE TO CONSOLIDATE.

Do not broaden distribution or add features. Execute the narrow S11-S13
hardening queue one active slice at a time and require every slice to close a
reproduced adversarial uncertainty. After S13, return to the principal for a
separate publication decision.

## Program stop conditions

- Runtime and published-schema validators disagree on any corpus entry.
- A public-proof transformation changes a non-designated field or falsely
  reports semantic equivalence.
- Any installed advertised command depends on omitted package content.
- Default launcher errors expose stacks, absolute build/install topology, or
  uncontrolled input.
- Candidate bytes contain contributor-specific home paths or credential
  values.
- A scope escape, signature/trust bypass, false-green completion, or
  known-failure acceptance appears.
- Fresh reviewers disagree or report a critical/high/medium finding.
- Credential rotation is unconfirmed at S13 closeout.
- npm publication, public release, visibility change, deployment, customer
  action, formal certification, or trademark claim is proposed without
  separate principal authority.
- Two consecutive slices produce no executable correction, hostile test, or
  consumer-boundary proof.

## Ratification and rotation

Principal ratification on 2026-07-27 authorizes this materialization:

1. this file is the immutable governing Macro Delta;
2. the manifest declares three module definitions and nine open contracts;
3. the canonical queue contains S11-S13;
4. S11 is drafted from this queue and activated at baseline `ef44d18`;
5. S12-S13 remain queued and non-authoritative until prior closeout.

Every completed slice must leave the required `notes/`, `runs/`, and
`evidence/` trio and pass local plus hosted gates before rotation.

## References

- Predecessor Macro Delta:
  `next-prompt-protocols/macro-deltas/2026-07-27-scopa-developer-preview.md`
- Final S10 protocol:
  `next-prompt-protocols/completed/2026-07-27-S10-developer-preview-release-candidate.md`
- S10 validation:
  `runs/S10/2026-07-27-validation.md`
- S10 candidate evidence:
  `evidence/S10/candidate-report.md`
- Final outside review:
  `evidence/S10/outside-review.final.json`
- Post-S10 adversarial report:
  `llm-memories/projects/scopa/evidence/2026-07-27-post-S10-fresh-agent-adversarial-review.md`
- Private diagnostic incident:
  `llm-memories/projects/scopa/evidence/S10/2026-07-27-diagnostic-secret-exposure.md`
- Current manifest:
  `next-prompt-protocols/manifest.json`
