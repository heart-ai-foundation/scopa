---
title: "Macro Delta: 2026-07-26: SCOPA Kernel Foundation and Depth Blocks"
entity: heart
type: compliance
tags:
  - compliance
  - forensic-methdologies
  - agentic-workflow-forensics
  - scopa
  - macro-delta
---

# Macro Delta: 2026-07-26: SCOPA Kernel Foundation and Depth Blocks

**Document Classification:** Foundation Build Plan (Pattern A)
**Format:** Macro Delta, per Next-Prompt Protocol v2.4 Section 10.5
**Project:** SCOPA (Scope, Completion, and Operational Persistence for Agents)
**Publisher:** Heart AI Foundation
**Governs:** SCOPA Kernel Specification v0.1
**Scaffold root:** `next-prompt-protocols/`
**Date:** July 26, 2026

---

## Why this exists

SCOPA Kernel Specification v0.1 defines the runtime. This Macro Delta converts that specification into an ordered queue of slices that can each be drafted into an active protocol.

The build is arranged so the hardest empirical risk is instrumented before any feature that could hide it, and so the runtime becomes useful to a developer at the end of Block A rather than at the end of the program.

---

## Blocks

### Block A: Foundation

| Field | Value |
|---|---|
| Block goal | A working enforcement loop that blocks out-of-scope writes and refuses false-green completion |
| Modules | `conformance`, `kernel-core`, `journal`, `enforcement` |
| Slice count | 3 (S0, S1, S2) |
| Stop boundary | Stop after S2 if the enforcement loop cannot block a real out-of-scope write in a real repository |
| Production policy | No publication. Local development only. No npm publish before S3 completes. |
| Evidence policy | `arc` class throughout. All three evidence surfaces required per slice. |

### Block B: Legibility and Depth

| Field | Value |
|---|---|
| Block goal | The runtime explains what it observed, and can seal a run so an outside party can verify it |
| Modules | `legibility`, `depth`, `interop` |
| Slice count | 3 (S3, S4, S5) |
| Stop boundary | Stop after S3 if observe mode cannot produce a boundary map from a real agent session |
| Production policy | S3 completes v0.1 and permits first publication. S4 and S5 constitute v0.2. |
| Evidence policy | `arc` class throughout. All three evidence surfaces required per slice. |

---

## Module map and exit contracts

| Module | Exit contracts |
|---|---|
| `conformance` | C1 replay-equivalence harness fails on injected divergence; C2 untrusted-data containment harness fails on injected instruction leakage; C3 both wired as release gate |
| `kernel-core` | K1 effect category types frozen and exported; K2 pure generator performs no input or output under lockdown; K3 execution loop yields, fulfills, and seals; K4 ACT replay-suppression enforced with idempotency keys |
| `journal` | J1 dCBOR envelope encodes deterministically across runtimes; J2 hash chain seals and verifies; J3 append-only file adapter satisfies the persistence port; J4 content addressing separates blobs from chain; J5 schema version and kernel version pinned per record |
| `enforcement` | E1 slice lock and allowed-path enforcement block writes at the tool-call boundary; E2 verification gate executes real commands and rejects asserted success; E3 stop-condition evaluator returns a checkable state; E4 gate definition is immutable without a principal DECISION |
| `agent-surface` | A1 orientation call returns compact status; A2 denials carry the allowed set and the amendment path; A3 rotation state file permits cold resume |
| `legibility` | L1 reconstructability score computes from journal completeness; L2 observe mode journals without enforcing; L3 declared-versus-observed gap reported as a finding; L4 coverage distinguishes not observed from not present |
| `depth` | D1 signing layer with algorithm identifier per record; D2 device key classes recorded and never overstated; D3 external timestamp anchoring optional and verifiable; D4 INFER pins provider, snapshot, prompt hash, params |
| `interop` | I1 effect categories map to CASE Action, Identity, Tool, and Relationship; I2 export validates against the CASE context |

Module completion is satisfied exit contracts over declared exit contracts. It measures progress through this arc, not production readiness.

---

## Slice queue

### S0: Conformance harness

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `conformance` |
| Crosses | `kernel-core` |
| Advances contracts | C1, C2, C3 |
| Objective | Build the replay-equivalence and untrusted-data containment harnesses before the features they guard |
| Purpose | The determinism guarantee is only as good as its detector. Building the detector first means every later slice ships against a live test rather than an intention. |
| Value gate | A deliberately injected non-deterministic call fails the harness |
| Validation gate | Property-based generation over synthetic workflows plus golden-record snapshots; both harnesses fail on injected faults and pass on clean input |
| Likely artifacts | Test harness, fault-injection fixtures, golden records, release-gate wiring |
| Dependencies | None. This is the first slice. |
| Stop or defer condition | Stop if the harness cannot detect an injected effect leak, since every downstream determinism claim depends on it |
| Evidence path | `evidence/S0/` with fault-injection results and golden-record baselines |
| Status | `ready` |
| Last updated | 2026-07-26 |

**Descriptor-rung check.** Unlocks an executable test that fails on divergence.
**Anti-ceremony gate.** Classification: `test/validation`. Reduces the largest uncertainty in the program.
**Productivity mix.** Runtime 0, contract/test 90, metadata 10.

---

### S1: Sealed core

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `kernel-core` |
| Crosses | `journal` |
| Advances contracts | K1, K2, K3, K4, J1, J2, J3, J4, J5 |
| Objective | Effect taxonomy types, deterministic envelope, hash-chain sealer, append-only adapter, execution loop, all under lockdown |
| Purpose | Everything above depends on a journal that seals identically on every device and a core that cannot perform a hidden effect |
| Value gate | The same workflow sealed on two runtimes produces byte-identical records |
| Validation gate | S0 harness passes; cross-runtime encoding comparison; ACT replay-suppression verified by attempting a second execution |
| Likely artifacts | Category types, envelope codec, sealer, persistence port and file adapter, generator loop, lockdown configuration and dependency policy |
| Dependencies | S0 |
| Stop or defer condition | Stop if a required dependency cannot run under lockdown and no vetted shim exists, since ambient authority defeats the determinism claim. Defer content addressing if journal size proves immaterial at this stage. |
| Evidence path | `evidence/S1/` with cross-runtime hash comparison and replay-suppression proof |
| Status | `proposed` |
| Last updated | 2026-07-26 |

**Descriptor-rung check.** Unlocks a replayable sealed journal from a real workflow.
**Anti-ceremony gate.** Classification: `implementation`.
**Productivity mix.** Runtime 70, contract/test 25, metadata 5.

---

### S2: Enforcement loop

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `enforcement` |
| Crosses | `agent-surface` |
| Advances contracts | E1, E2, E3, E4, A1, A2, A3 |
| Objective | Slice lock, allowed-path enforcement, verification gate runner, stop-condition evaluator, orientation call, rotation state file |
| Purpose | This is the slice where SCOPA becomes useful. A developer running an agent feels scope enforcement and refused false-green completion immediately. |
| Value gate | A real coding agent is blocked from writing outside the declared slice, and a claimed completion is refused because the gate command actually failed |
| Validation gate | Live agent session against a real repository; out-of-scope write blocked at the pre-tool-use boundary; asserted completion rejected; cold resume from the rotation file after a context clear |
| Likely artifacts | Slice lock enforcement, path boundary, gate runner, stop-condition evaluator, orientation command, rotation state file, agent hook integration |
| Dependencies | S1 |
| Stop or defer condition | Stop if the gate definition can be modified from inside the slice without a principal DECISION, since a self-certifying gate reproduces false-green at the governance layer. Stop if enforcement depends on agent cooperation rather than the tool-call boundary. |
| Evidence path | `evidence/S2/` with live session transcript, blocked-write record, refused-completion record, cold-resume proof |
| Status | `proposed` |
| Last updated | 2026-07-26 |

**Descriptor-rung check.** Unlocks a blocked write and a refused completion in a live agent session.
**Anti-ceremony gate.** Classification: `runtime guard`.
**Productivity mix.** Runtime 65, contract/test 30, metadata 5.

---

### S3: Legibility

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `legibility` |
| Crosses | `journal` |
| Advances contracts | L1, L2, L3, L4 |
| Objective | Reconstructability scorer, observe mode, declared-versus-observed reporting, coverage readout, starting profiles |
| Purpose | Boundary identification must never be a prerequisite for value. Observe mode lets a user start with zero configuration and learn their own boundaries from what actually ran. |
| Value gate | Observe mode produces a boundary map from a real agent session that the user did not declare in advance |
| Validation gate | Run observe mode across several sessions; confirm the produced map matches manual inspection; confirm coverage reports not observed rather than not present for unexercised paths |
| Likely artifacts | Scorer, observe-mode runner, gap reporter, coverage readout, profile definitions |
| Dependencies | S2 |
| Stop or defer condition | Stop if the score or coverage readout can be read as a forensic reconstruction, since a quick scan presented as reconstruction is the overclaiming failure. Defer community profiles beyond the initial coding-agent profile. |
| Evidence path | `evidence/S3/` with produced boundary maps and manual-inspection comparison |
| Status | `proposed` |
| Last updated | 2026-07-26 |

**Descriptor-rung check.** Unlocks a boundary map generated from an undeclared real session.
**Anti-ceremony gate.** Classification: `implementation`.
**Productivity mix.** Runtime 55, contract/test 30, metadata 15.

**Milestone.** S3 closes v0.1. First publication permitted after this slice.

---

### S4: Signing and anchoring

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `depth` |
| Crosses | `journal` |
| Advances contracts | D1, D2, D3, D4 |
| Objective | Signing layer with device key classes, external timestamp anchoring, INFER model pinning |
| Purpose | Raises a sealed run from locally tamper-evident to externally verifiable, which is what a run needs when it must convince someone outside the principal |
| Value gate | A third party who never ran SCOPA verifies a signed and anchored record |
| Validation gate | Independent verification of a signed record; timestamp verified against the issuing authority chain; INFER record replays without re-calling the provider |
| Likely artifacts | Signer port, key class recording, RFC 3161 client, anchoring policy, model-pin capture |
| Dependencies | S3 |
| Stop or defer condition | Stop if a record can imply stronger key backing than it holds, since overstated binding is worse than none. Defer post-quantum signatures; the algorithm identifier is the requirement, not the algorithm. |
| Evidence path | `evidence/S4/` with independent verification transcript and anchor receipts |
| Status | `proposed` |
| Last updated | 2026-07-26 |

**Descriptor-rung check.** Unlocks third-party verification of a sealed run without SCOPA installed.
**Anti-ceremony gate.** Classification: `implementation`.
**Productivity mix.** Runtime 60, contract/test 35, metadata 5.

---

### S5: Interop export

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `interop` |
| Crosses | `depth` |
| Advances contracts | I1, I2 |
| Objective | Map effect categories to CASE and UCO objects and export through a CASE context |
| Purpose | Turns a SCOPA packet into a record that existing forensic tooling already reads, which is the difference between evidence from a bespoke tool and evidence in the interchange format |
| Value gate | An exported packet validates against the CASE conformance verifier |
| Validation gate | CASE verifier passes; round-trip preserves the chain; a reviewer unfamiliar with SCOPA reads the export without a translation guide |
| Likely artifacts | Category-to-CASE mapping, context file, exporter, verifier wiring in continuous integration |
| Dependencies | S4 |
| Stop or defer condition | Defer if no external party has requested an interchange format, since export without a consumer is speculative. Stop if the mapping requires distorting an effect category to fit. |
| Evidence path | `evidence/S5/` with verifier output and round-trip comparison |
| Status | `deferred` |
| Last updated | 2026-07-26 |

**Descriptor-rung check.** Unlocks a packet that passes an external conformance verifier.
**Anti-ceremony gate.** Classification: `implementation`.
**Productivity mix.** Runtime 50, contract/test 40, metadata 10.

---

## Program stop conditions

Beyond the per-slice conditions above, stop and report when:

- The S0 harness passes while a known injected fault is present. The detector is broken, and every claim resting on it is unproven.
- Two consecutive slices produce no executable runtime change.
- Effect interception gaps appear faster than they close across S1 and S2, indicating the boundary taxonomy is incomplete rather than merely unimplemented.
- Publication is proposed before S3 closes.
- Any slice would relocate gate definition outside the locked slice.

---

## Rotation

Per Next-Prompt Protocol v2.4 Section 10, each completed slice is moved to `completed/`, the next active protocol is drafted from this Macro Delta, the manifest is updated, and `.slice-lock.json` is regenerated by tooling. This document is the drafting source for every active protocol in the program.

A CONTINUITY document is written at any context boundary that interrupts a slice. The slice remains the recovery unit; the block is the planning unit.

---

*Heart AI Foundation. Governs SCOPA Kernel Specification v0.1.*
