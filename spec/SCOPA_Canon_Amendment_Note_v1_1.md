---
title: "Canon Amendment Note: SCOPA"
entity: heart
type: compliance
tags:
  - compliance
  - forensic-methdologies
  - agentic-workflow-forensics
  - scopa
  - scopa-canon-amendment
---

# Canon Amendment Note: SCOPA

**Protocol and Runtime Distinction, Ratification of the Three-Boundary Frame, and Kernel/Profile Separation**

**Document Classification:** Foundation Canon Amendment (Pattern A)
**Version:** 1.1
**Effective Date:** July 26, 2026
**Supersedes:** SCOPA Canon Amendment Note v1.0 (same date, unpublished)
**Publisher:** Heart AI Foundation (Oregon Domestic Nonprofit Public Benefit Corporation, Registry 257267493)
**Principal Author:** Dylan D. Mobley, ORCID 0009-0002-3560-3955
**Amends:** Agentic Workflow Forensics Field Definition; Next-Prompt Protocol operational canon
**Companion:** SCOPA Kernel Specification v0.1

---

## Summary

This note records three amendments to Agentic Workflow Forensics canon. None retires a mechanism, and none retires a name.

1. **Protocol and runtime are distinguished.** Next-Prompt Protocol remains the canonical protocol. SCOPA is the runtime that enforces it.
2. **The Three-Boundary Frame is ratified as a grouping layer** above the eight control surfaces. No surface is retired, renamed, or merged.
3. **Kernel and profile are separated.** The published kernel carries no Heart-specific attestation vocabulary. Heart primitives compose above it.

---

## Amendment 1: Protocol and Runtime Distinction

**Change.** Next-Prompt Protocol v2.4 remains the canonical protocol under that name. **SCOPA** (Scope, Completion, and Operational Persistence for Agents) names the executable runtime that enforces the protocol. The relationship is that of a specification to its reference implementation.

**Correction of the prior draft.** Version 1.0 of this note retired Next-Prompt Protocol as a public name. That was an overcorrection, and it rested on a conflation. Next-Prompt Protocol had been carrying two roles at once: the name of a documented practice with a scaffold convention, and the intended name of an installable runtime. The four defects identified in the prior draft apply only to the second role.

- Naming the mechanism rather than the contribution is a defect in a product name and an accuracy in a protocol name.
- "Protocol" reading as a document to interpret is a defect for something a developer installs and correct for something a developer follows.
- "Prompt" encoding a superseded unit of work matters for a runtime governing multi-hour sessions and does not invalidate the historical protocol under which real work was performed.
- Acronym collision affects discoverability of a distributed package and does not affect a corpus document.

Splitting the roles keeps what worked and repairs only what failed.

**Citation rule.** Work performed under the protocol is cited as Next-Prompt Protocol with its version. SCOPA is cited when the subject is the runtime, its kernel, or its conformance requirements. Historical corpora retain the protocol name under which the work was actually governed. Renaming a protocol retroactively would break the citation trail of work already performed and recorded under it.

**Consequence for work in progress.** The Software Quality Journal manuscript on reconstructability as a software quality governance property lists Next-Prompt Protocol v2.4 as its related protocol and scores a corpus governed under that protocol. That reference is correct as written and requires no change. SCOPA may appear in that manuscript only as a discussion-level instrument addressing which gaps persist after continuity governance is introduced, and never as evidence, since the runtime has no runs.

**Scaffold convention unchanged.** The `next-prompt-protocols/` directory structure, the manifest and slice-lock contracts, the active-protocol section set, the slice classes, the loop taxonomy, and the rotation procedure remain canonical under their existing names.

---

## Amendment 2: The Three-Boundary Frame

**Change.** SCOPA is described through three architectural invariants.

| Boundary | Question it answers |
|---|---|
| **Scope** | What may the agent change? |
| **Completion** | What must be proven before the work may stop? |
| **Continuity** | What verified state may survive rotation or compaction? |

**Relationship to existing canon.** The three boundaries **group** the eight control surfaces. They do not replace, compete with, or supersede them. Boundaries are the invariants. Surfaces are the mechanisms that enforce those invariants.

**Rationale.** The boundary decomposition explains why slice lock, verification gates, stop conditions, and rotation belong to one runtime rather than standing as four unrelated features in a list. It supplies an explanatory layer that the surface enumeration alone did not provide.

**Constraint on future use.** Any proposal to retire, rename, or merge a control surface on the grounds of the boundary frame is out of order under this amendment. The frame explains the surfaces. It does not govern them.

---

## Amendment 3: Kernel and Profile Separation

**Change.** The published SCOPA kernel is entity-neutral. It carries no Heart-specific attestation vocabulary. Intent Attestation Tokens, the Governance Trust Envelope, and Structural Behavioral Attestation are recorded as **implementation primitives, not kernel primitives**, and compose above the kernel as a profile.

**Rationale.** Two independent arguments converge.

- An open standard that requires vendor-specific vocabulary is not adoptable by parties outside that vendor. Requiring Heart attestation terminology in the kernel would make a Foundation standard Heart-specific, which defeats the purpose of publishing it.
- Each primitive required extension to fit the single-principal coding-agent case. A primitive that must be extended to fit a role is evidence of the wrong primitive for that role, not an invitation to extend it.

**Mechanism that preserves composition.** The kernel provides signing and anchoring that are algorithm-agnostic, with an algorithm identifier carried per record, and permits downstream implementations to define their own record profiles. Heart implementations may therefore emit attestation-shaped records, run conformance attestation, and carry records inside a governance envelope, without any adopter of the kernel inheriting that vocabulary.

**Entity consequence.** This sharpens rather than weakens the Dual-Entity Boundary Doctrine. The Foundation publishes a generic kernel. Heart implementation profiles sit above it. The commercial interpretive layer sits above those.

---

## Vocabulary Separation Rule

Two tier vocabularies now exist and must not be conflated.

| Vocabulary | Range | Measures |
|---|---|---|
| CGP Tier Framework | Tier 0 through Tier 5 | Governance install depth across a project or organization |
| SCOPA Depth Levels | L0 through L3 | Evidentiary depth of a single run |

The two are orthogonal. A run at any Depth Level may occur under any CGP Tier, and neither implies the other.

---

## What Remains Unchanged

- The Continuity-Governed Prompting prime directive: continue from verified state, not memory.
- The Agentic Workflow Forensics field definition and its maturity ladder.
- The eight control surfaces, in name, count, and definition.
- Next-Prompt Protocol v2.4 in name, version, scaffold, and procedure.
- The Agentic Reconstructability Method as the reverse branch.
- The Agent Workflow Reconstructability Score and its nine dimensions.
- The CGP Tier Framework.
- The Dual-Entity Boundary Doctrine.

---

## Deferred and Noted

**Shared envelope across forward and reverse branches.** The design intent recorded during specification work is that one run-record envelope serves both the forward branch, where boundaries are populated by enforcement, and the reverse branch, where they are populated by reconstruction from external evidence, distinguished by a provenance flag and per-surface attribution confidence. SCOPA Kernel Specification v0.1 does not implement the reverse branch. This note records the intent and defers ratification until reverse-branch tooling is specified.

---

## Source of Truth

Once the reference implementation is published, the package types and tests become the executable source of truth for runtime mechanics. Prose canon supplies rationale and cites a package version. Where prose and implementation diverge, the pinned implementation version governs, and the divergence is itself a finding.

Protocol canon remains prose. Next-Prompt Protocol v2.4 governs the practice whether or not the runtime is installed.

---

## Revision Note

Version 1.1 corrects Amendment 1. Version 1.0 retired Next-Prompt Protocol as a public name, which would have broken the citation trail of work already governed and recorded under it, including an active manuscript that scores a corpus by that protocol. The correction distinguishes the protocol from the runtime rather than replacing one with the other. Amendments 2 and 3 are unchanged. The vocabulary separation rule is new in this version.

---

*Heart AI Foundation. Published at heartaifoundation.org.*
