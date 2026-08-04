# Next Prompt Protocols

This is the canonical handoff target for project work. The manifest currently has no active protocol.

Current commit reference: `e765db3`

Active protocol: `none`
Active protocol class: `arc`
Active protocol compound: `false`

## Current State

S34-S36 Boundary Doctor Adoption Wedge complete; BD1-BD3 satisfied; no active implementation protocol and future release remains closed.

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
- production-live-requalification: 3/3 (100%)
- workflow-boundary-map: 5/5 (100%)
- boundary-doctor: 3/3 (100%)
- gate-process-custody: 3/3 (100%)
Arc total: 83/84 (99%)

## Queued Work

Use `queued/` for protocol queues that are not active yet. A queued protocol should become active only when the remaining work is executable and locally verifiable.

## Handoff Workflow

When a new active protocol is selected:

1. Move it into `active/`.
2. Set `manifest.active_protocol` to the active-relative path.
3. Run `node tools/sync-protocols.mjs --commit <sha>`.
4. Run `node tools/sync-protocols.mjs --check`.

## Current Phase

- `Phase 12 Boundary Doctor Adoption Wedge`

## Scope Boundaries

- `package.json`
- `package-lock.json`
- `SCOPA_AGENT.md`
- `.github/workflows/case-validation.yml`
- `production-bundle.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/release-readiness/**`
- `packages/enforcement/**`
- `packages/conformance/**`
- `packages/cli/**`
- `packages/agent-surface/**`
- `packages/workflow-boundary-map/**`
- `packages/boundary-doctor/**`
- `fixtures/S29/**`
- `fixtures/S30/**`
- `fixtures/S31/**`
- `fixtures/S32/**`
- `fixtures/S33/**`
- `fixtures/S34/**`
- `fixtures/S35/**`
- `fixtures/S36/**`
- `notes/S29/**`
- `runs/S29/**`
- `evidence/S29/**`
- `notes/S34/**`
- `notes/S35/**`
- `notes/S36/**`
- `runs/S34/**`
- `runs/S35/**`
- `runs/S36/**`
- `evidence/S34/**`
- `evidence/S35/**`
- `evidence/S36/**`
- `fixtures/S20/**`
- `fixtures/S23/**`
- `fixtures/S24/**`
- `fixtures/S25/**`
- `fixtures/S26/**`
- `fixtures/S26R1/**`
- `fixtures/S26R2/**`
- `fixtures/S26R3/**`
- `fixtures/S27/**`
- `fixtures/S28/**`
- `fixtures/R1/**`
- `runs/S26R1/**`
- `runs/S26R2/**`
- `runs/S26R3/**`
- `packages/live-run/test/s26r2-scenario-binding-remediation.test.js`
- `packages/live-run/test/s26r3-canonical-evidence-projection-remediation.test.js`
- `next-prompt-protocols/**`
- `notes/S20/**`
- `runs/S20/**`
- `evidence/S20/**`
- `evidence/S21/**`
- `evidence/S22/**`
- `evidence/S23/**`
- `evidence/S24/**`
- `evidence/S25/**`
- `evidence/S26/**`
- `evidence/S26R1/**`
- `evidence/S26R2/**`
- `evidence/S26R3/**`
- `evidence/S27/**`
- `evidence/S28/**`
- `evidence/R1/**`
- `RELEASE_NOTES.md`
- `evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md`
