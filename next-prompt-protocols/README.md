# Next Prompt Protocols

This is the canonical handoff target for project work. Use this folder to make future agents behave the same way, apply context in the same order, and stay within the same scope boundaries.

Current commit reference: `6dc99fc`

Active protocol class: `arc`
Active protocol compound: `false`
Active protocol module: `production-live-requalification`
Advances contracts: `DCI3, PLQ1`

## Slice Class

Every active protocol declares one class:

- `arc`: planned multi-slice work. Requires descriptor rung check, productivity mix, evidence, non-goals, acceptance, and a slice queue when multiple slices are visible.
- `spike`: exploratory work. Requires descriptor rung check, non-goals, acceptance, and evidence with `runs/` minimum.
- `hotfix`: concrete bug or unblock with a known fix. Requires acceptance and evidence with `runs/` minimum.

Class adjusts the thinking ceremony only. Worktree isolation and commit-after-each-slice rules still apply.

## Compound Slice Rule

Compound slices are allowed only when `**Compound:** true` names one approved pattern: `paired-diff`, `shared-gate`, or `refactor-then-use`.

Compound slices use one acceptance gate, one evidence set, and one closeout, but each sub-slice keeps its own non-goals row. Hard cap: three sub-slices. Combining only for speed is not a valid reason.

## Module Tags

Every active protocol declares:

- `**Module:**` — the owning module for the slice.
- `**Crosses:**` — other modules intentionally touched by the slice.
- `**Advances contracts:**` — module exit contracts advanced or satisfied by the slice.

Module tags are structural metadata, not a folder hierarchy. They let the protocol check module ownership, boundary slices, and contract progress without creating another required nesting level.

Module progress:
- conformance: 3/3 (100%)
- kernel-core: 4/4 (100%)
- journal: 5/5 (100%)
- enforcement: 4/4 (100%)
- agent-surface: 3/3 (100%)
- legibility: 4/4 (100%)
- depth: 4/4 (100%)
- interop: 2/2 (100%)
- distribution: 3/3 (100%)
- adapter-host: 3/3 (100%)
- claude-adapter: 3/3 (100%)
- codex-adapter: 3/3 (100%)
- release-readiness: 3/3 (100%)
- proof-integrity: 3/3 (100%)
- distribution-hardening: 3/3 (100%)
- release-requalification: 3/3 (100%)
- live-run-custody: 4/4 (100%)
- claude-live-hardening: 3/3 (100%)
- codex-live-hardening: 3/3 (100%)
- operational-resilience: 4/4 (100%)
- dependency-closure-identity: 2/3 (67%)
- production-live-requalification: 0/3 (0%)
Arc total: 69/73 (95%)

## Descriptor Rung Stop Rule

Descriptor rungs are complete when they restate blockers that are already named by an earlier descriptor instead of unlocking a new executable test or runtime decision.

A descriptor-only slice is allowed only when it directly enables one of these:

- a helper or validator that runtime or test code can call,
- a test-controlled probe,
- a packet or command handoff attempt,
- a replay activation path,
- a runtime consumer boundary,
- a production-off invariant that must be proven before runtime code changes.

Do not draft or rotate approval/review/inspection/archive/summary/closeout descriptor rungs as standalone progress. If a proposed slice cannot name the executable test, probe, handoff, activation path, or runtime boundary it unlocks, choose a runtime seam instead.

Each active protocol should state its expected mix of runtime behavior, contract/test code, and metadata/docs. If the expected runtime behavior is `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action rather than another metadata-only descriptor rung.

## Slice Queue Canon

Use a slice queue when an active protocol contains several follow-on slices. The queue is canonical for repeated multi-slice loops because it makes continuation an explicit decision after each slice.

A slice queue should include:

- the ordered candidate slices,
- the purpose of each slice,
- the value gate that justifies doing it now,
- the focused validation gate,
- the current status: `queued`, `active`, `done`, `blocked`, `dropped`, or `deferred`.

Queue discipline:

- Commit and push after each completed queue slot when the active protocol requires slice commits.
- Before starting the next slot, verify the previous slot changed runtime behavior, test coverage, production guardrails, or decision clarity. If it only added ceremony, stop and report.
- Reorder, split, collapse, defer, or drop queued slots when evidence shows a smaller or clearer path.
- Stop and ask before continuing if the queue becomes mostly descriptor-only, if validation cost is not proportional to the change, or if the next slot does not unlock a concrete executable step.
- Draft the next protocol from the remaining queue only after closeout states what changed, what did not move, and what evidence justifies continuing.

## How an agent must apply context

Read in this order:

1. `.slice-lock.json`
2. `manifest.json`
3. `macro-deltas/2026-07-31-scopa-bundled-production-closure-hardening.md`
4. `role-context.md`
5. `phases/phase-7/README.md`
6. `active/2026-07-31-S20-bundled-exact-candidate-freeze.md`
7. `completed/2026-07-31-S19-v2-bundled-production-closure-enforcement.md`
8. `completed/2026-07-31-S19-publishable-dependency-closure-enforcement-stopped.md`
9. `completed/2026-07-31-S18-exact-production-live-requalification-stopped.md`
10. `completed/2026-07-31-S17-sustained-operational-resilience.md`
11. `completed/2026-07-29-S16-codex-production-live-run-edge-campaign.md`
12. `completed/2026-07-28-S15-claude-production-live-run-edge-campaign.md`
13. `completed/2026-07-28-S14-shared-live-run-custody-and-supervision.md`
14. `completed/2026-07-28-S13-fresh-agent-adversarial-release-requalification.md`
15. `completed/2026-07-28-S12-installed-surface-launcher-privacy-ci-hardening.md`
16. `completed/2026-07-27-S11-proof-contract-and-redaction-convergence.md`
17. `completed/2026-07-27-S10-developer-preview-release-candidate.md`
18. `completed/2026-07-27-S9-codex-headless-integration-and-parity.md`
19. `completed/2026-07-27-S8-claude-code-headless-integration.md`
20. `completed/2026-07-27-S7-model-neutral-adapter-bridge.md`
21. `completed/2026-07-27-S6-installable-developer-surface.md`
22. `completed/2026-07-26-S5-interop-export.md`
23. `completed/2026-07-26-S4-signing-and-anchoring.md`
24. `completed/2026-07-26-S3-legibility.md`
25. `completed/2026-07-26-S2-enforcement-loop.md`
26. `completed/2026-07-26-S0-conformance-harness.md`
27. `completed/2026-07-26-S1-sealed-core.md`

If a fact is not in those files or the code, verify it locally before acting.

## Folder layout

- `active/` contains the single protocol that should be used for the next implementation slice.
- `completed/` contains protocols that have already been consumed or superseded.
- `slice-queue.md`, when present, records candidate future slices without making them active.
- `phases/` contains phase-specific readme files and constraints.
- `manifest.json` is the machine-readable source of truth for the current handoff state.
- `.slice-lock.json` is the slice lockfile that must match the manifest and active protocol.
- `role-context.md` is the distilled behavior summary taken from the role bibles.

## Handoff workflow

When a slice is complete, write the companion artifacts under `..`:

- a note in `notes/` describing the change and the non-goals that stayed intact,
- a run record in `runs/` capturing the exact commands, working directory, result status, and source commit,
- an evidence JSON in `evidence/` summarizing the slice, modified files, ABI additions, and verification results.

After the artifacts are written, update the protocol state from the repo tip:

- run `node tools/sync-protocols.mjs --commit $(git rev-parse --short=8 HEAD)`,
- run `node tools/sync-protocols.mjs --check`,
- do not hand off until `README.md`, `phases/phase-7/README.md`, `manifest.json`, and `.slice-lock.json` are in sync.

## Current phase

- `Phase 7 Dependency Closed Release Requalification`

## Current active objective

> Build one new exact candidate from the clean S19-v2 closeout commit. Prove two
> clean packs are byte-identical and npm 10 and npm 11 empty-cache installs
> reproduce the exact reviewed payload with zero network, privacy, credential,
> license, policy, advisory, or matrix finding.

## Behavior rules

- Be specific. Do not infer broader work from a narrow prompt.
- Do not spin on assumptions when the next step is explicit.
- If the active protocol and the code disagree, stop and report the mismatch.
- If `.slice-lock.json`, `manifest.json`, or the active protocol disagree, stop and report the mismatch.
- New active protocols must include `**Class:**` and `**Compound:**` headers.
- New active protocols must include `**Module:**`, `**Crosses:**`, and `**Advances contracts:**` headers.
- Keep the current scope narrow until the current slice is verified and documented.
- Use the exact verification commands listed in the active protocol.
- Run this folder's sync check before handing off: `node tools/sync-protocols.mjs --check` or `npm run protocol:check`

## Scope boundaries

These protocols are specific to:

- `package.json`
- `package-lock.json`
- `.github/workflows/case-validation.yml`
- `production-bundle.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `packages/cli/**`
- `fixtures/S20/**`
- `next-prompt-protocols/**`
- `notes/S20/**`
- `runs/S20/**`
- `evidence/S20/**`
- `evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md`

Treat every manifest non-goal as closed unless principal direction or a ratified Macro Delta amendment changes it.

## Where to start for the current slice

Start with:

- `phases/phase-7/README.md`
- `active/2026-07-31-S20-bundled-exact-candidate-freeze.md`
