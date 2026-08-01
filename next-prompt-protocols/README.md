# Next Prompt Protocols

This is the canonical handoff target for project work. The manifest currently has no active protocol.

Current commit reference: `395a7e34`

Active protocol: `none`
Active protocol class: `unset`
Active protocol compound: `false`

## Current State

The approved process-tree cleanup Macro Delta is complete. No production-live call is authorized; any next queue requires fresh principal approval.

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
- production-live-requalification: 1/3 (33%)
- gate-process-custody: 3/3 (100%)
Arc total: 73/76 (96%)

## Queued Work

Use `queued/` for protocol queues that are not active yet. A queued protocol should become active only when the remaining work is executable and locally verifiable.

## Handoff Workflow

When a new active protocol is selected:

1. Move it into `active/`.
2. Set `manifest.active_protocol` to the active-relative path.
3. Run `node tools/sync-protocols.mjs --commit <sha>`.
4. Run `node tools/sync-protocols.mjs --check`.

## Current Phase

- `Phase 8 Process Tree Cleanup Hardening`

## Scope Boundaries

- `package.json`
- `package-lock.json`
- `.github/workflows/case-validation.yml`
- `production-bundle.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/release-readiness/**`
- `packages/enforcement/**`
- `packages/conformance/**`
- `packages/cli/**`
- `fixtures/S20/**`
- `fixtures/S23/**`
- `fixtures/S24/**`
- `fixtures/S25/**`
- `next-prompt-protocols/**`
- `notes/S20/**`
- `runs/S20/**`
- `evidence/S20/**`
- `evidence/S21/**`
- `evidence/S22/**`
- `evidence/S23/**`
- `evidence/S24/**`
- `evidence/S25/**`
- `evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md`
