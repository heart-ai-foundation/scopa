# Next Prompt Protocols

This is the canonical handoff target for project work. Use this folder to make future agents behave the same way, apply context in the same order, and stay within the same scope boundaries.

Current commit reference: `c512fec3`

Active protocol class: `arc`
Active protocol compound: `false`
Active protocol module: `release-requalification`
Advances contracts: `RQ1, RQ2, RQ3`

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
- release-requalification: 0/3 (0%)
Arc total: 50/53 (94%)

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
3. `macro-deltas/2026-07-27-scopa-adversarial-release-hardening.md`
4. `role-context.md`
5. `phases/phase-5/README.md`
6. `active/2026-07-28-S13-fresh-agent-adversarial-release-requalification.md`
7. `completed/2026-07-28-S12-installed-surface-launcher-privacy-ci-hardening.md`
8. `completed/2026-07-27-S11-proof-contract-and-redaction-convergence.md`
9. `completed/2026-07-27-S10-developer-preview-release-candidate.md`
10. `completed/2026-07-27-S9-codex-headless-integration-and-parity.md`
11. `completed/2026-07-27-S8-claude-code-headless-integration.md`
12. `completed/2026-07-27-S7-model-neutral-adapter-bridge.md`
13. `completed/2026-07-27-S6-installable-developer-surface.md`
14. `completed/2026-07-26-S5-interop-export.md`
15. `completed/2026-07-26-S4-signing-and-anchoring.md`
16. `completed/2026-07-26-S3-legibility.md`
17. `completed/2026-07-26-S2-enforcement-loop.md`
18. `completed/2026-07-26-S0-conformance-harness.md`
19. `completed/2026-07-26-S1-sealed-core.md`

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
- do not hand off until `README.md`, `phases/phase-5/README.md`, `manifest.json`, and `.slice-lock.json` are in sync.

## Current phase

- `Phase 5 Adversarial Hardening`

## Current active objective

> Build and retain one exact private candidate from a clean commit, run the full
> source-free hostile corpus against those bytes, and assign three fresh isolated
> reviewers to attack artifact/distribution, evidence/proof, and runtime/
> containment boundaries. Require each reviewer to issue a structured `ACCEPT`
> with no critical, high, or medium finding before closeout.

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
- `README.md`
- `CONTRIBUTING.md`
- `docs/**`
- `.github/**`
- `packages/release-readiness/**`
- `packages/adapter-host/**`
- `packages/cli/src/command.js`
- `packages/cli/README.md`
- `packages/cli/test/cli.test.js`
- `packages/interop/README.md`
- `packages/integrations/codex/README.md`
- `packages/legibility/README.md`
- `fixtures/S10/consumer-client.mjs`
- `schemas/**`
- `fixtures/S13/**`
- `next-prompt-protocols/**`
- `notes/S13/**`
- `runs/S13/**`
- `evidence/S13/**`

Treat every manifest non-goal as closed unless principal direction or a ratified Macro Delta amendment changes it.

## Where to start for the current slice

Start with:

- `phases/phase-5/README.md`
- `active/2026-07-28-S13-fresh-agent-adversarial-release-requalification.md`
