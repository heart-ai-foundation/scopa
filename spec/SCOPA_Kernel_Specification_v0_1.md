---
title: SCOPA Kernel Specification
entity: heart
type: spec
tags:
  - compliance
  - forensic-methdologies
  - agentic-workflow-forensics
  - scopa
  - scopa-kernel-spec
---

# SCOPA Kernel Specification

**Scope, Completion, and Operational Persistence for Agents**

**Document Classification:** Foundation Technical Specification (Pattern A)
**Version:** 0.1
**Register:** Build
**Effective Date:** July 26, 2026
**Publisher:** Heart AI Foundation (Oregon Domestic Nonprofit Public Benefit Corporation, Registry 257267493)
**Canonical URI:** https://heartaifoundation.org/scopa/v0.1
**Principal Author:** Dylan D. Mobley, ORCID 0009-0002-3560-3955
**Implements:** Next-Prompt Protocol v2.4. SCOPA is the executable runtime; the protocol remains canonical under its own name.
**Companion:** SCOPA Canon Amendment Note v1.1 (July 26, 2026)

---

## 1. Purpose and Scope

SCOPA is an open enforcement runtime for bounded, verifiable autonomous coding work. It sits underneath AI coding agents and holds boundaries the agent cannot argue past.

SCOPA is the executable runtime for Next-Prompt Protocol v2.4. The protocol governs the practice whether or not the runtime is installed. The runtime enforces mechanically what the protocol specifies in prose.

The Heart AI Foundation publishes SCOPA as an open standard with a reference implementation. Commercial products built on SCOPA belong to separate entities under the Dual-Entity Boundary Doctrine. This specification governs the kernel only.

**Design posture.** SCOPA is an enforcement runtime, not a practice. Prompts are suggestions the model follows probabilistically. A permission system is not. SCOPA supplies the permission system.

**Operating assumptions.** One forensic principal. One kernel instance across that principal's devices. No distributed consensus, no replication across mutually distrusting parties, no database requirement, no chain.

**Two users, not one.** The human principal installs SCOPA and sets intent. The agent operates under SCOPA continuously and must orient, comply, and recover many times per session. Section 8 governs the agent-facing surface.

---

## 2. The Three Boundaries

SCOPA controls three architectural invariants.

| Boundary | Question it answers |
|---|---|
| **Scope** | What may the agent change? |
| **Completion** | What must be proven before the work may stop? |
| **Continuity** | What verified state may survive rotation or compaction? |

The three boundaries **group** the eight HEART control surfaces. They do not replace them. Boundaries are the invariants; surfaces are the mechanisms that enforce those invariants. This decomposition explains why scope lock, verification gates, stop conditions, and rotation belong to one runtime rather than standing as four unrelated features.

---

## 3. Core Doctrine

**3.1 Continue from verified state, not memory.** The prime directive inherited from Continuity-Governed Prompting. Every action begins from state the kernel verified, never from conversational recollection.

**3.2 The model proposes, the kernel disposes.** Model output enters as a proposal, passes a deterministic gate, and seals into the journal as evidence. The model assists inside the locked slice and never holds authority over the method.

**3.3 Replay-determinism, not re-execution determinism.** SCOPA guarantees that the same journal produces the same outputs on any device, at any later date. It does not guarantee that re-running a workflow live reproduces the original result, because model inference is non-deterministic at the source even at temperature zero. The sealed response is the anchor. Re-execution is expected to diverge, and that divergence is recorded reality rather than error.

**3.4 Enforcement does not depend on cooperation.** A well-behaved agent reads status and stays inside the slice, which is efficient. Boundaries hold through the agent's tool-call surface regardless of intent, which is correct.

---

## 4. Effect Taxonomy (Frozen ABI)

### 4.1 Membership function

An operation becomes a journaled effect when any one condition holds:

1. It observes something the core cannot compute (time, entropy, external state, model output, human judgment).
2. It changes something outside the core, or cannot be undone.
3. The record must preserve it (who, what, when, from which source).

Operations satisfying none of these stay pure inside the core.

### 4.2 The closed category set

The category enum is **frozen**. Payload schemas are open and versioned. New forensic methodologies add workflows and payload schemas, never categories.

**OBSERVE (non-deterministic reads; replayed from journal; safe to re-run)**

| Category | Purpose | Pinned at capture |
|---|---|---|
| `CLOCK` | Observe wall or monotonic time | Observed value |
| `ENTROPY` | Observe randomness | Generated value |
| `SOURCE.INGEST` | Read raw external evidence | Content hash of bytes |
| `SOURCE.EXTRACT` | Derive structured content from ingested bytes | Source hash, extractor identity, version, config, output hash |
| `INFER` | Invoke a non-deterministic model | Provider, model snapshot, system-prompt hash, params, response, response hash |
| `TOOL.QUERY` | Read-only external call | Request and response |

**ACT (authority-bearing; irreversible; replay-suppressed)**

| Category | Purpose | Pinned at capture |
|---|---|---|
| `TOOL.COMMAND` | External call that changes the world | Request, receipt, idempotency key |
| `EMIT` | Commit output across the boundary | Artifact and hash |
| `SIGN` | Exercise principal signing authority | Payload hash, key reference, algorithm identifier |

**PRINCIPAL (authority root)**

| Category | Purpose | Pinned at capture |
|---|---|---|
| `DECISION` | Obtain the principal's judgment, approval, or go-signal | Principal identity, question, answer, time, binding |

### 4.3 Rules that close the boundary

- **DECISION stands alone.** Every other effect exercises a granted capability. DECISION defers upward to the authority source and is the only effect that may grant or revoke capabilities mid-run.
- **EXTRACT never floats free.** Extracted content carries its source hash and extractor pin. Non-deterministic extraction (vision-model OCR and similar) routes through `INFER` and seals the response.
- **Untrusted-data marking.** Everything `SOURCE` ingests carries an untrusted-data tag. `INFER` reads tagged content as data and never as instruction.
- **Run boundary, not process boundary.** Reading another sealed record is a `SOURCE` effect pinned by that record's root hash. Reading the current run's own journal is internal pure state.
- **Streaming is shell-side.** `INFER` seals the finalized completion once. Partial tokens are never journaled as separate events.
- **Nesting scopes, it does not extend.** Sub-workflows yield the same categories. Effects carry workflow scope plus sequence.

---

## 5. Execution Model

### 5.1 Structure

The kernel core is a pure generator. It performs no input or output. It yields effect descriptors. An outer shell fulfills each descriptor, seals the request and result into the journal, and returns the result.

```
result = none
loop:
  effect = core.next(result)        // pure control flow
  if effect == DONE: break
  assertCapability(effect)          // Scope Boundary enforced here
  result = shell.fulfill(effect)    // the only impure operation
  journal.append(seal(seq, effect, result, hashes))
```

### 5.2 Replay

Replay substitutes a shell that returns `journal[seq].result`. The core cannot distinguish live execution from replay, because it only ever observed recorded events.

- **OBSERVE effects** return journaled values.
- **ACT effects** are suppressed. Completed world-changing actions never re-fire. Idempotency keys guard the window between performing and sealing.
- **DECISION effects** return the recorded answer. The principal is not asked again.

### 5.3 Verification and version pinning

Each journal pins the kernel version and script registry hash that produced it. A workflow is reconstructable exactly when its journal replays to its sealed outputs under its pinned version. Divergence is a finding: either the record was altered or an effect escaped the boundary.

---

## 6. Technical Substrate

Every layer is pure JavaScript with no native dependency, which is what makes the device claim true rather than aspirational.

| Layer | Selection | Rationale |
|---|---|---|
| Serialization | `cborg` (deterministic CBOR) | Deterministic by default, Uint8Array-native, integer and bigint safe |
| Export serialization | `jsonld.js` with CASE context | Interchange only, at the boundary |
| Hashing and signing | `@noble/hashes`, `@noble/ed25519` | Runs on Node, Deno, Bun, and browsers; deterministic RFC 8032 signatures |
| Crypto agility | `@noble/post-quantum` (ML-DSA) | Same family; every signed record carries an algorithm identifier |
| Confinement | SES `lockdown()` plus Compartments, policy by LavaMoat | Removes ambient authority structurally; converts silent effect leaks into loud failures |
| Persistence | Append-only port | Floor adapter is one append-only file; OPFS, IndexedDB, and SQLite-WASM are optional adapters |
| Transport | Endo CapTP | Object-capability RPC from headless kernel to thin client without a bespoke protocol |

**Persistence port surface:** `append(bytes) -> offset`, `read(offset)`, `iterate()`, `head()`. The hash chain lives in the records, so the store requires nothing beyond append and read.

**Device matrix.** The kernel runs as a headless service. On Monako Glass (MonoOS, Buildroot Linux, Lua app layer with a per-app memory ceiling) the kernel runs on the Linux base and the Lua surface is a thin client. E-ink and other constrained Linux targets follow the same pattern. Desktop, NucBox, CI, and browser run the identical kernel because nothing in the stack is platform-specific.

---

## 7. Kernel and Profile Separation

The kernel is entity-neutral. It carries no vendor-specific attestation vocabulary, and adopting SCOPA requires no allegiance to any publisher's terminology.

Implementations layer their own semantics above the kernel through **profiles**.

**A profile may define:**

- Record shape and additional metadata carried alongside the sealed envelope.
- Attestation semantics, including what a signature is taken to assert.
- Transport envelope and channel policy between kernel and client surfaces.
- Anchoring policy, including which records reach an external witness and through which authority.
- Additional payload schemas within existing effect categories.

**A profile may not:**

- Add, remove, or rename an effect category. The enum is frozen (Section 4).
- Weaken replay-suppression of ACT effects.
- Relocate gate definition outside the locked slice.
- Bypass untrusted-data marking on ingested content.
- Substitute its own verification for Slice 0 conformance.

**Enabling mechanism.** Every signed record carries an algorithm identifier, and the envelope reserves extension points for profile-defined fields. Profiles therefore attach without kernel modification, and a kernel verifier can validate the chain of a profiled record without understanding the profile.

**Rationale.** An open standard requiring vendor vocabulary is not adoptable outside that vendor. Separating kernel from profile keeps the published standard generic while permitting arbitrarily specific implementations above it. See SCOPA Canon Amendment Note v1.1, Amendment 3.

---

## 8. Agent-Facing Surface

The agent is a first-class user. These rules exist because an agent orients dozens of times per session and cannot re-read prose to learn where it stands.

- **One orientation call.** A single command returns active slice, allowed paths, non-goals, gate status, and stop condition in compact structured form, small enough to call every turn.
- **Errors carry the correction.** A denial states the boundary, the allowed set, and the legitimate path forward, including how to propose a slice amendment.
- **Small verb set.** Few enough operations that the agent holds them in working context.
- **One re-readable state file.** After a crash, a context boundary, or a fresh session, the agent reads one file and knows exactly where it stands. This is rotation, and it replaces continuing from a narrative summary.
- **Convention over configuration.** Infer the gate from the repository where possible so the first run requires no configuration.
- **Gate definition lives inside the locked slice.** Changing a gate is not an ordinary edit. It requires the principal through a `DECISION`. Without this rule the loop self-certifies.

**Integration point.** Enforcement binds at the agent's pre-tool-use hook surface, after the agent decides which tool to call and before the tool runs.

---

## 9. Observe Mode and Coverage

Surface identification must never be a prerequisite for value. SCOPA runs with enforcement disabled and journaling enabled.

After several runs the journal answers what the user could not articulate: which files this workflow touches, where model output crossed into an irreversible action, which steps carry no verification gate, and where runs ended without a stop condition firing.

**Declared versus observed.** Once the user declares boundaries, SCOPA compares the declaration against the journal. A boundary declared and not enforced is a finding, not a configuration error. This is declared authority versus runtime authority turned on the governance layer itself.

**Profiles** ship starting boundary maps for common shapes (coding agent on a repository, research agent, data pipeline) so nobody begins from blank.

**Coverage honesty.** Observe mode sees only the paths that ran. Rare branches, especially error and recovery paths, will not appear. Coverage reports state **not observed** rather than not present.

---

## 10. Depth Levels

Governance works standalone. Evidentiary capability is opt-in depth.

| Level | Contents | Who uses it |
|---|---|---|
| L0 | Governance loop, no cryptography | Most users, most of the time |
| L1 | Sealed hash-chained journal | Runs that must be reconstructable later |
| L2 | Signed records plus optional external anchoring | Runs that must convince an outside party |
| L3 | CASE/UCO export | Runs headed to a regulator or court |

**Disambiguation.** Depth Levels measure the evidentiary depth of a single run and are written L0 through L3. They are distinct from the Continuity-Governed Prompting Tier Framework, which measures governance install depth across a project or organization and is written Tier 0 through Tier 5. The two are orthogonal. A run at any Depth Level may occur under any CGP Tier, and neither implies the other.

Signing and anchoring are algorithm-agnostic and carry an algorithm identifier per record. Downstream implementations may define their own record profiles above the kernel. The kernel itself requires no vendor-specific attestation vocabulary.

Verification is free at every level, permanently. A sealed packet must be replayable and verifiable by a third party who never ran SCOPA. If verification ever requires the product, the thesis collapses.

---

## 11. Pitfalls and Mitigations

| Pitfall | Consequence | Mitigation |
|---|---|---|
| Effect leakage (hidden clock, randomness, or file read) | Journal incomplete; replay diverges silently | SES lockdown removes ambient authority; libraries take vetted shims with injected journaled values; replay-equivalence test detects |
| `TOOL.COMMAND` double-execution | Real-world action performed twice | ACT effects replay-suppressed as a hard invariant; idempotency key per command |
| Cache bypasses the journal | Values enter from the world unrecorded | Caches live in the shell; every miss that touches the world is a fresh effect; the core holds no cache |
| Agent weakens the gate under pressure | False-green relocated to the governance layer | Gate definition sits inside the locked slice; changes require a principal `DECISION` |
| Extraction non-determinism | Same bytes yield different structured output | Extractor identity, version, and config pinned; non-deterministic extractors route through `INFER` |
| Indirect prompt injection through ingested evidence | Adversary-authored content steers the model | OBSERVE and ACT separation; untrusted-data marking; authority enters only through `DECISION` |
| Model retirement | Pinned model no longer callable | Sealed response is the evidence; **model no longer reproducible** is a recordable non-reconstructability cause |
| Schema and prose desync | Kernel continues from a stale spec | Package types and tests are the executable source of truth under SemVer; canon cites a package version |
| Journal growth from large evidence | Chain becomes unwieldy | Content addressing: the journal stores hashes, bytes live in a content-addressed store |
| Replay across kernel versions | Divergence misread as tampering | Core version pinned in the journal; run the historical core or migrate explicitly |
| Pure-JS constant-time limits | Timing exposure in signing | Strong cases route to hardware-backed keys; software keys are the declared floor |
| Overclaiming from a quick scan | A fast pass reads as a reconstruction | CGP Tier and attribution boundary encoded in every run record automatically |

---

## 12. Slice Construction

**Slice 0. Conformance tests, written before the features they guard.**
Replay-equivalence: re-fold the pure core over any sealed journal and fail loudly on divergence. This single test is the determinism proof, the leak detector, and the tamper detector. Untrusted-data containment: prove `SOURCE` content cannot reach `INFER` as instruction. Both gate every release.

**Slice 1. Sealed core.**
Effect taxonomy types, dCBOR run-record envelope, append-only file adapter, hash-chain sealer, all under SES lockdown.

**Slice 2. Enforcement loop.**
Slice lock and allowed-path enforcement, verification gate runner, stop-condition evaluator, rotation state file, orientation call.

**Slice 3. Legibility.**
Reconstructability scorer, observe mode, coverage readout, starting profiles.

**Slice 4 (v0.2). Depth.**
Signing layer with device key classes, external timestamp anchoring, `INFER` model pinning, CASE/UCO export.

**Release gate.** No slice ships until Slice 0 passes against it.

---

## 13. Entity Boundary

The Heart AI Foundation publishes SCOPA, the specification, and the reference implementation. The kernel is Foundation-bound so the method survives any future transformation of a commercial entity. HeartCore Ventures LLC builds interpretive and commercial products above SCOPA. The two never merge.

---

## 14. Open Items

1. `github.com/scopa` organization availability remains unconfirmed. The registry check rate-limited.
2. Trademark clearance for SCOPA in relevant technology classes requires counsel review.
3. Effect-interception completeness across the extractor and tool surface is empirical. Gaps are found by running, guarded by Slice 0.
4. CASE/UCO mapping from SCOPA effect categories to Action, Identity, Tool, and Relationship objects requires one mapping pass and a context file.

---

*Heart AI Foundation. Published as an open standard at heartaifoundation.org.*
