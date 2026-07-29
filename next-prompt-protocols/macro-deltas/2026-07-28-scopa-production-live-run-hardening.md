---
title: "Macro Delta: 2026-07-28: SCOPA Production Live-Run Hardening"
entity: heart
type: compliance
tags:
  - compliance
  - forensic-methodologies
  - agentic-workflow-forensics
  - scopa
  - macro-delta
  - production-live-run
  - edge-hardening
---

# Macro Delta: 2026-07-28: SCOPA Production Live-Run Hardening

**Status:** RATIFIED — governs S14-S18; S14 is the initial active slice
**Document Classification:** Production Live-Run Hardening Build Plan
**Format:** Macro Delta, per Next-Prompt Protocol v2.4
**Project:** SCOPA (Scope, Completion, and Operational Persistence for Agents)
**Publisher:** Heart AI Foundation
**Phase:** Phase 6 — Production Live-Run Hardening
**Window:** `ef44d18` → `3ac0173` (S11-S13 hardening and queue closeout)
**Author:** Codex, under principal direction
**Trigger:** principal-approved post-S13 production live-run edge hardening
**Predecessor:** `2026-07-27-scopa-adversarial-release-hardening.md`
**Baseline:** `3ac017374b2faad4132f2a087f6ef01e03b64067` on private
`heart-ai-foundation/scopa`
**Principal authorization:** 2026-07-28
**Principal scope clarification:** production live-run testing is the main
focus; the separately running SCOPA experiment is outside this queue
**Date:** July 28, 2026

---

## Authority boundary

This immutable Macro Delta is the sole implementation authority for S14-S18,
with S14 as the only initially active slice. It authorizes production-like
live-run testing and the narrow runtime hardening required by reproduced edge
failures. It does not authorize customer production use.

The separate SCOPA prospective reconstructability experiment is not part of
this queue. This Macro Delta does not implement or modify its experimental
protocol, fixtures, allocation, ground truth, analyst workflow, scoring,
statistical analysis, preregistration, confirmatory runs, or publication
package.

This Macro Delta does not authorize npm publication, a GitHub Release,
repository visibility change, deployment, public announcement, formal
certification, trademark exclusivity, or customer-data processing.

## Where we are

SCOPA completed S0-S13 with all 53 declared contracts satisfied. One exact
private candidate passed source-free installation, 119 accumulated tests,
proof/schema parity, package/privacy checks, three fresh independent reviews,
credential remediation, and the final hosted gate. Its existing Claude Code
and Codex live probes each exercise four bounded scenarios: allowed work,
scope denial, false-green refusal, and cold restart.

The remaining distance to a world-class developer offering is operational.
The live launchers duplicate process supervision and do not yet retain one
closed, bounded, independently reviewable outcome across timeout, abnormal
exit, output exhaustion, malformed or truncated streams, provider refusal,
rate pressure, process-tree cleanup, repeated sessions, and sustained state
pressure. Those edge paths must be exercised with real provider clients and
safe deterministic fault doubles before any release decision.

## Why this exists

S13 established that one exact artifact is internally coherent and survives
hostile source-free review. Production-like use adds a different uncertainty:
the process, provider, session, and recovery boundary may fail between an
admitted action and final evidence closure.

This Macro Delta converts that uncertainty into an ordered queue:

1. establish shared bounded live-run process and evidence custody;
2. run and harden Claude Code under real edge conditions;
3. run and harden Codex under the same outcome contract;
4. stress cross-client recovery, concurrency, resource, and cleanup behavior;
5. requalify one exact candidate through a sustained live matrix and fresh
   review.

## Governing decisions

- Production live-run testing uses disposable, non-customer repositories.
- Real provider clients are admitted only through explicit network, account,
  model-request, tool, time, turn, token, and cost policies.
- Credential values, authorization headers, environment dumps, token
  fragments, provider session content, and private filesystem roots never
  enter repository evidence.
- Raw provider evidence is private, mode-restricted, bounded, and retained
  only when needed for verification. Repository evidence is collision-safe
  and non-sensitive.
- The installed tarball, not a source import, is the runtime under live test.
- Every run binds source commit, candidate digest, package integrity, client
  version, requested model alias, adapter profile, capability matrix, scenario
  version, environment policy, and outcome.
- A requested model alias is not a provider-attested immutable snapshot.
- Claude Code and Codex remain `partial`; successful live behavior does not
  transfer assurance or establish an operating-system sandbox.
- Live success is never inferred from favorable model prose. Machine gate,
  filesystem, transcript, process, and cleanup evidence govern.
- Timeout, output limit, provider refusal, client crash, malformed stream,
  tool drift, and budget exhaustion are first-class terminal outcomes rather
  than discarded orchestration errors.
- A live-run supervisor must terminate the complete launched process group,
  enforce a bounded grace period, escalate when required, drain bounded
  output, and verify cleanup.
- Repeated or resumed work may not duplicate an admitted mutation or convert
  an unresolved state into completion.
- Provider-backed tests are opt-in and never become an unguarded default CI
  dependency. Deterministic fault tests remain the required merge gate.
- Remediation is limited to a reproduced live-run containment, custody,
  recovery, resource, privacy, drift, or false-green defect.
- The free verifier, schemas, fixtures, and independently useful enforcement
  remain available without a consulting product.
- Consultation may sell expert deployment, profile design, evidence review,
  and reconstructability assessment; it may not sell exclusive access to
  truth or verification.
- Public release remains a separate principal decision after S18.

## Blocks

### Block I: Live-Run Custody

| Field | Value |
|---|---|
| Block goal | Give Claude and Codex one closed, bounded process-supervision and evidence-custody contract before more live traffic is admitted |
| Modules | `live-run-custody`, `claude-adapter`, `codex-adapter`, `adapter-host`, `release-readiness`, `conformance` |
| Slice count | 1 (S14) |
| Stop boundary | Stop on raw secret retention, unbounded output/error detail, orphaned process, ambiguous terminal outcome, sourceful runtime resolution, or evidence overwrite |
| Production policy | Deterministic process doubles only; no provider call required to close S14 |
| Evidence policy | `arc` class; fault matrix, process-cleanup proof, private/public evidence proof, installed-artifact binding |

### Block J: Provider-Specific Live Edges

| Field | Value |
|---|---|
| Block goal | Exercise current Claude Code and Codex clients independently against the shared custody contract and harden only reproduced provider-boundary defects |
| Modules | `claude-live-hardening`, `codex-live-hardening`, `live-run-custody`, `adapter-host`, `conformance` |
| Slice count | 2 (S15-S16) |
| Stop boundary | Stop on capability drift, uncontrolled mutation, secret or private-path capture, provider cost/budget violation, false-green state, or inability to cleanly terminate a run |
| Production policy | Explicitly approved provider traffic in disposable repositories with bounded budgets |
| Evidence policy | `arc` class; deterministic fault corpus plus separately retained real-provider receipts |

### Block K: Sustained Operational Resilience

| Field | Value |
|---|---|
| Block goal | Prove that interruption, resume, concurrency, resource ceilings, and repeated sessions remain bounded without cross-run contamination |
| Modules | `operational-resilience`, `live-run-custody`, `adapter-host`, `enforcement`, `journal`, `conformance` |
| Slice count | 1 (S17) |
| Stop boundary | Stop on duplicate mutation, transcript pairing loss, unbounded growth, stale state reuse, orphaned process, incomplete cleanup, or silent cross-client divergence |
| Production policy | Deterministic chaos first; bounded provider spot checks only after local polarity is proven |
| Evidence policy | `arc` class; interruption matrix, concurrency/ceiling results, cleanup ledger, parity report |

### Block L: Exact Production-Live Requalification

| Field | Value |
|---|---|
| Block goal | Bind one exact private candidate to a sustained production-like scenario matrix and fresh independent review |
| Modules | `production-live-requalification`, `operational-resilience`, `claude-live-hardening`, `codex-live-hardening`, `release-readiness`, `conformance` |
| Slice count | 1 (S18) |
| Stop boundary | Stop on any critical/high/medium finding, candidate mismatch, false green, credential/privacy event, uncontrolled spend, soak instability, or contrary outside verdict |
| Production policy | Private qualification only; no registry, visibility, deployment, customer, or announcement action |
| Evidence policy | `arc` class; exact candidate, bounded soak, live receipts, fresh reviews, audit, hosted gate |

## Module map and exit contracts

| Module | Exit contracts |
|---|---|
| `live-run-custody` | LC1 every launcher result has one closed bounded terminal envelope for success, exit, signal, timeout, output limit, spawn failure, version drift, inventory drift, and normalization failure; LC2 process-group termination uses bounded grace/escalation and proves no child survives; LC3 each receipt binds exact installed artifact, client/profile/matrix/scenario, limits, and environment policy without retaining secret values; LC4 raw evidence is atomically mode-restricted and public evidence is deterministic, collision-safe, and private-root free |
| `claude-live-hardening` | CLH1 every live session capability-probes the exact Claude client/model/tool surface and fails closed on unknown drift; CLH2 real Claude runs preserve correct polarity across allowed, denied, false-green, restart, timeout, rate-pressure, refusal, truncation, and capture-limit outcomes; CLH3 repeated Claude sessions retain partial assurance and leave no resumable content, credential, private path, cross-run state, or orphan process |
| `codex-live-hardening` | CXH1 every live session capability-probes the exact Codex client/model/MCP/native surface and fails closed on unknown drift; CXH2 real Codex runs preserve correct polarity across allowed, denied, false-green, restart, timeout, refusal, truncation, usage/capture limits, and tool drift; CXH3 repeated Codex sessions retain partial assurance and leave no auth/session residue, credential, private path, cross-run state, or orphan process |
| `operational-resilience` | OR1 interruption after admitted mutation resumes idempotently or stops for reconciliation without duplicate action; OR2 concurrent calls, session ceilings, transcript ceilings, and output backpressure preserve pairing and finite memory; OR3 normal, failed, bounded, and interrupted runs clean temporary files/processes and cannot reuse stale control state; OR4 cross-client parity reports shared outcomes and provider-specific differences without transferring assurance |
| `production-live-requalification` | PLQ1 one exact installed candidate passes the frozen production-like scenario matrix and sustained bounded soak; PLQ2 fresh artifact, evidence, and runtime reviewers return ACCEPT with no critical/high/medium finding and all low findings adjudicated; PLQ3 dependency, privacy, credential, protocol, local, and hosted gates remain green and close only eligibility for a separate release decision |

Completion means satisfied contracts over declared contracts. It does not
mean production deployment, publication, or provider certification.

## Proposed slice queue

### S14: Shared live-run custody and supervision

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `live-run-custody` |
| Crosses | `claude-adapter`, `codex-adapter`, `adapter-host`, `release-readiness`, `conformance` |
| Advances contracts | LC1, LC2, LC3, LC4 |
| Objective | Replace duplicated launcher supervision with one installed-artifact-aware, process-group-safe, bounded outcome and evidence contract |
| Purpose | Real edge campaigns are not trustworthy while timeout, output exhaustion, abnormal exit, and parse failure escape as unrelated exceptions or can leave uncertain child/evidence state |
| Value gate | Deterministic child-process doubles reproduce every terminal class, cleanup is independently observed, and public/private receipts bind the exact installed artifact without protected values |
| Validation gate | Success, nonzero exit, signal, timeout, ignored TERM, output ceiling, spawn error, version drift, inventory drift, malformed/truncated stream, evidence collision, output-path alias, and orphan-child controls |
| Likely artifacts | shared supervisor, terminal schema, private evidence writer, installed identity binding, fault clients, focused tests |
| Dependencies | S13 closeout and principal ratification of this Macro Delta |
| Stop or defer condition | Stop if the abstraction weakens provider-specific validation, stores raw environment secrets, changes public CLI behavior, or cannot prove process-tree cleanup |
| Evidence path | `evidence/S14/` with fault matrix, cleanup receipt, identity binding, and privacy proof |
| Status | `active` |

**Descriptor-rung check.** Unlocks safe real-provider edge campaigns by making
every launcher failure a bounded, inspectable runtime outcome.

**Anti-ceremony gate.** Classification: `implementation`; shared process and
evidence behavior plus injected failure tests dominate.

### S15: Claude production live-run edge campaign

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `claude-live-hardening` |
| Crosses | `live-run-custody`, `adapter-host`, `conformance` |
| Advances contracts | CLH1, CLH2, CLH3 |
| Objective | Exercise the current pinned Claude Code headless surface through real and deterministic failure paths, then remediate only reproduced boundary defects |
| Purpose | The existing four-scenario proof does not cover provider refusal, rate pressure, partial streams, termination, output pressure, repeated-session cleanup, or live capability drift |
| Value gate | A bounded real Claude campaign and deterministic fault corpus agree on terminal polarity, cleanup, partial assurance, and non-retention |
| Validation gate | Existing four scenarios plus version/tool/model drift, refusal, rate event, timeout, ignored termination, early EOF, malformed event, capture limit, budget stop, repeated sessions, cleanup, and public-proof scan |
| Likely artifacts | expanded Claude scenario matrix, live receipt schema, drift probe, normalization/supervision fixes, provider-safe evidence |
| Dependencies | S14 and an explicit per-run Claude account/network/budget policy |
| Stop or defer condition | Stop before provider execution if credentials, account scope, allowed network, maximum spend, or retained-evidence policy is not closed |
| Evidence path | `evidence/S15/` with bounded public summary and private raw receipt references |
| Status | `queued` |

**Descriptor-rung check.** Unlocks a production-like Claude reliability claim
over enumerated edge outcomes.

**Anti-ceremony gate.** Classification: `test/validation` with permitted
narrow implementation fixes.

### S16: Codex production live-run edge campaign

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `codex-live-hardening` |
| Crosses | `live-run-custody`, `adapter-host`, `conformance` |
| Advances contracts | CXH1, CXH2, CXH3 |
| Objective | Exercise the current pinned Codex headless surface through the same bounded outcome contract and remediate only reproduced boundary defects |
| Purpose | The existing proof does not cover provider refusal, partial JSONL, termination, usage/output pressure, live MCP/native-surface drift, repeated-session cleanup, or auth/session residue |
| Value gate | A bounded real Codex campaign and deterministic fault corpus agree on terminal polarity, cleanup, partial assurance, and non-retention |
| Validation gate | Existing four scenarios plus version/inventory/schema/model drift, refusal, timeout, ignored termination, early EOF, malformed item, usage/capture limits, tool drift, repeated sessions, cleanup, and public-proof scan |
| Likely artifacts | expanded Codex scenario matrix, live receipt schema, capability probe, normalization/supervision fixes, provider-safe evidence |
| Dependencies | S15 parity baseline and an explicit per-run Codex account/network/budget policy |
| Stop or defer condition | Stop before provider execution if credentials, account scope, allowed network, usage bound, or retained-evidence policy is not closed |
| Evidence path | `evidence/S16/` with bounded public summary and private raw receipt references |
| Status | `queued` |

**Descriptor-rung check.** Unlocks an independently bounded Codex reliability
claim and a meaningful cross-client comparison.

**Anti-ceremony gate.** Classification: `test/validation` with permitted
narrow implementation fixes.

### S17: Sustained recovery, concurrency, and cleanup hardening

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `operational-resilience` |
| Crosses | `live-run-custody`, `adapter-host`, `enforcement`, `journal`, `conformance` |
| Advances contracts | OR1, OR2, OR3, OR4 |
| Objective | Stress interruption, resume, concurrent tool traffic, finite session state, backpressure, repeated runs, and cleanup across both live integrations |
| Purpose | Single short sessions cannot expose duplicate-action, stale-state, pairing, resource-growth, or cleanup failures that emerge across operational sequences |
| Value gate | Deterministic chaos and bounded provider spot checks preserve idempotency, transcript pairing, finite memory, clean state, and honest cross-client differences |
| Validation gate | Crash points around admitted mutations and evidence closure, duplicate resume, concurrent calls, 2048-ID ceiling, transcript count/byte ceilings, slow reader, repeated-run soak, temp/process scan, stale-control transplant, and parity |
| Likely artifacts | chaos controller, repeat/soak runner, cleanup verifier, cross-client edge parity report, narrow runtime fixes |
| Dependencies | S15 and S16 |
| Stop or defer condition | Stop on duplicate mutation, unbounded growth, lost event pairing, unexplained client divergence, stale state reuse, or incomplete cleanup |
| Evidence path | `evidence/S17/` with interruption, resource, cleanup, and parity receipts |
| Status | `queued` |

**Descriptor-rung check.** Unlocks confidence in sustained and interrupted
operation rather than isolated demonstration runs.

**Anti-ceremony gate.** Classification: `test/validation` with runtime fault
injection and permitted narrow fixes.

### S18: Exact production-live requalification

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `production-live-requalification` |
| Crosses | `operational-resilience`, `claude-live-hardening`, `codex-live-hardening`, `release-readiness`, `conformance` |
| Advances contracts | PLQ1, PLQ2, PLQ3 |
| Objective | Build one exact private candidate and requalify its full production-like live matrix through bounded soak, fresh review, and hosted gates |
| Purpose | The hardening arc closes only when unfamiliar reviewers reproduce live custody, provider edge polarity, sustained recovery, and package/privacy claims from exact installed bytes |
| Value gate | Exact candidate and scenario hashes remain consistent across soak and three fresh reviews, with no critical/high/medium finding |
| Validation gate | Clean deterministic pack/install, full local matrix, bounded Claude/Codex runs, sustained soak, dependency/privacy/credential scan, three reviews, protocol check, and hosted CI |
| Likely artifacts | candidate manifest, live qualification matrix, bounded private/public receipts, soak summary, three reports, exact-consistency and hosted receipts |
| Dependencies | S17 and separately confirmed provider budgets/network policies |
| Stop or defer condition | Stop on candidate drift, uncontrolled spend, provider policy breach, privacy event, instability, false green, critical/high/medium finding, or contrary verdict |
| Evidence path | `evidence/S18/` with exact candidate, live matrix, reviews, and hosted result |
| Status | `queued` |

**Descriptor-rung check.** Unlocks eligibility for a separate private release
decision based on production-like evidence.

**Anti-ceremony gate.** Classification: `test/validation` with executable
installed consumers and live clients.

## Slice arc

Predecessor hardening window, oldest first:

| # | Slice | Terminal commit | Primary result | Non-goals all held? |
|---|---|---|---|---|
| 1 | S11 proof contract and redaction convergence | `f83b3c1` | PI1-PI3 satisfied | yes |
| 2 | S12 installed surface, launcher, privacy, and CI hardening | `9c2623f` | DH1-DH3 satisfied | yes |
| 3 | S13 fresh-agent adversarial release requalification | `3ac0173` | RQ1-RQ3 satisfied; 53/53 total | yes |

Run records:

- `runs/S11/2026-07-27-validation.md`
- `runs/S12/2026-07-28-validation.md`
- `runs/S13/2026-07-28-validation.md`

## Trajectory check

**Original goal:** deliver a free, independently useful SCOPA enforcement
runtime whose scope, completion, continuity, evidence, and supported adapter
claims are mechanically verifiable. Source:
`next-prompt-protocols/macro-deltas/2026-07-27-scopa-developer-preview.md`,
“Why this exists” and “Governing decisions.”

**Current direction:** test the exact installed runtime through real Claude and
Codex operational failure paths, harden only reproduced edge defects, and
retain verifiable evidence without implying publication or production use.

**Drift assessment:** NONE.

Production-like fault testing deepens the existing adapter and runtime
boundaries. It does not add a provider, product domain, experiment, paid
verification dependency, or customer deployment.

## Cumulative scope audit

| Addition | Slice/window | Justified by | In authorized arc? |
|---|---|---|---|
| Shared bounded process/evidence supervisor | S14 | duplicated live launcher failure paths and principal live-run directive | yes |
| Expanded Claude live edge matrix | S15 | current four-scenario coverage gap | yes |
| Expanded Codex live edge matrix | S16 | current four-scenario coverage gap | yes |
| Cross-client chaos, soak, and cleanup harness | S17 | sustained operational uncertainty | yes |
| Exact production-live requalification | S18 | principal world-class evidence standard | yes |

No experiment protocol, statistical, publication, customer, or deployment
surface is added.

## Non-goal preservation

| Window | Non-goal | Status | Notes |
|---|---|---|---|
| S11-S13 | No npm publication, release, visibility change, deployment, customer use, or announcement | PRESERVED | Repository and candidate remain private |
| S11-S13 | No false full assurance for Claude or Codex | PRESERVED | Both remain `partial` |
| S11-S13 | No weakening of free verification or known-failure behavior | PRESERVED | Source-free verifier and hostile controls remain |
| S14-S18 | No SCOPA-RV1 experiment implementation or execution | PRESERVED BY AUTHORITY | Separate workstream is explicitly excluded |
| S14-S18 | No customer repository, credential, or private infrastructure in test fixtures/evidence | PRESERVED BY AUTHORITY | Stop condition if crossed |
| S14-S18 | No publication or production deployment | PRESERVED BY AUTHORITY | Separate principal decision remains required |

No non-goal is classified `VIOLATED`.

## Forbidden-surface audit

| Forbidden surface | Source | Status | Notes |
|---|---|---|---|
| SCOPA-RV1 experiment protocol, fixtures, allocation, ratings, analysis, or confirmatory data | Principal clarification 2026-07-28 | NOT APPROACHED | Separate experiment already runs elsewhere |
| npm or public release | S13 closeout | NOT APPROACHED | Private qualification only |
| Repository visibility change | S13 closeout | NOT APPROACHED | Repository remains private |
| Production/customer deployment | S13 closeout | NOT APPROACHED | Disposable non-customer repositories only |
| Raw credentials or provider secrets in evidence | Security boundary | NOT APPROACHED | Boolean/config-name evidence only |
| Operating-system sandbox or full-provider assurance claim | Threat model | NOT APPROACHED | Claude/Codex stay `partial` |
| Paid dependency for verification | Open-core boundary | NOT APPROACHED | Free verifier remains authoritative |

## Cost trajectory

No project-wide cost ceiling is defined. Every provider-backed slice must set
and retain a per-run, per-slice, timeout, turn, token/usage where available,
and spend ceiling before network execution. Exceeding any ceiling is a stop
condition, not a reason to rerun silently.

## Verification health

| Metric | Start of window | End of window | Delta |
|---|---|---|---|
| Accumulated discovered tests | 111 | 119 | +8 |
| Satisfied/declared contracts | 44/44 | 53/53 | +9 / +9 |
| Rejected exact candidates retained | 0 | 6 | +6 |
| Final accepted independent reviews | 0/3 | 3/3 | +3 |
| Regression incidents on pushed `main` | 0 | 0 | 0 |
| Final `sync-protocols --check` failures | 0 | 0 | 0 |
| Known npm vulnerabilities | 0 | 0 | 0 |

**Observed regressions:** none on pushed `main`. S13 retained every rejected
candidate and remediated only reproduced proof, transport, package,
evidence-binding, or filesystem-boundary defects.

**Test-count growth policy:** S14-S17 must add one fault-injection assertion
for every new terminal or cleanup branch. S18 is primarily validation and must
not inflate counts with duplicate assertions.

## Open questions / tensions

None block S14. Before S15 or S16 makes a provider call, the run record must
close the exact account, network allowlist, requested model, maximum spend,
time/turn/usage bounds, evidence retention, and cleanup policy. Missing policy
defers the live call without blocking deterministic local work.

## Continue / pause / pivot recommendation

**Recommendation:** CONTINUE.

Start with the deterministic shared custody layer. It changes executable
failure behavior and makes later real-provider results reviewable. Rotate to a
provider-specific slice only after S14 proves bounded termination, cleanup,
identity binding, and privacy-safe evidence.

## Program stop conditions

- Any provider credential, authorization header, token fragment, private
  environment value, customer content, or uncontrolled private path appears
  in repository or public evidence.
- A launched process or descendant survives declared cleanup.
- A timeout, output bound, signal, parse failure, or abnormal exit can be
  misreported as success or loses its terminal evidence.
- An admitted mutation repeats after interruption or resume.
- Transcript pairing, resource ceilings, backpressure, or state isolation
  fails under sustained load.
- Capability, tool, model-request, client, adapter, or matrix drift proceeds
  without an explicit compatible rule.
- A provider-backed run exceeds its recorded network, time, turn, usage, or
  cost ceiling.
- Claude Code or Codex is described as `full`, an immutable provider snapshot,
  or operating-system confinement.
- A customer repository, credential-bearing fixture, private infrastructure,
  or non-authorized network target enters the live matrix.
- The separate SCOPA experiment is modified, duplicated, or used as this
  queue's evidence source.
- A fresh reviewer returns a critical, high, or medium finding at S18.
- npm publication, release, visibility change, deployment, customer action,
  announcement, formal certification, or trademark claim is proposed without
  separate principal authority.
- Two consecutive slices produce no executable fault coverage, runtime
  correction, or production-boundary proof.

## Ratification and rotation

Principal ratification on 2026-07-28 authorizes this materialization:

1. this file is the immutable governing Macro Delta;
2. the manifest adds five modules and seventeen open contracts;
3. the canonical queue contains S14-S18;
4. S14 is drafted from this queue and activated at baseline `3ac0173`;
5. S15-S18 remain queued and non-authoritative until prior closeout; and
6. provider-backed execution remains opt-in at the relevant slice, never an
   automatic consequence of ratification.

Every completed slice must leave the required `notes/`, `runs/`, and
`evidence/` trio and pass focused, accumulated, protocol, privacy, and hosted
gates before rotation.

## References

- Predecessor Macro Delta:
  `next-prompt-protocols/macro-deltas/2026-07-27-scopa-adversarial-release-hardening.md`
- S13 completed protocol:
  `next-prompt-protocols/completed/2026-07-28-S13-fresh-agent-adversarial-release-requalification.md`
- S13 validation:
  `runs/S13/2026-07-28-validation.md`
- S13 closeout:
  `llm-memories/projects/scopa/evidence/2026-07-28-S13-fresh-agent-adversarial-release-requalification-closeout.md`
- Claude live integration:
  `packages/integrations/claude/`
- Codex live integration:
  `packages/integrations/codex/`
- Model-neutral adapter:
  `packages/adapter-host/`
- Current threat model:
  `docs/THREAT_MODEL.md`
- Principal scope clarification:
  `llm-memories/projects/scopa/evidence/2026-07-28-production-live-run-hardening-ratification.md`
