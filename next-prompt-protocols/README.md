# Next Prompt Protocols

This is the canonical handoff target for project work. The manifest currently has no active protocol.

Current commit reference: `d2e5770`

Active protocol: `none`
Active protocol class: `arc`
Active protocol compound: `false`

## Current State

Phase 15 is complete: S52 and S53 are closed, FH1 and FH2 are satisfied, and the fresh installed-agent pass found no product finding at any severity. Pause before any new implementation, merge, release, publication, provider traffic, experiment use, or external-system action.

Module progress:
- conformance: 3/3 (100%)
- kernel-core: 4/4 (100%)
- journal: 5/5 (100%)
- enforcement: 5/5 (100%)
- agent-surface: 3/3 (100%)
- legibility: 4/4 (100%)
- depth: 4/4 (100%)
- interop: 2/2 (100%)
- distribution: 3/3 (100%)
- adapter-host: 3/3 (100%)
- claude-adapter: 3/3 (100%)
- codex-adapter: 3/3 (100%)
- release-readiness: 4/4 (100%)
- proof-integrity: 3/3 (100%)
- distribution-hardening: 3/3 (100%)
- release-requalification: 3/3 (100%)
- live-run-custody: 4/4 (100%)
- claude-live-hardening: 3/3 (100%)
- codex-live-hardening: 3/3 (100%)
- operational-resilience: 4/4 (100%)
- dependency-closure-identity: 2/3 (67%)
- production-live-requalification: 3/3 (100%)
- adoption-experience: 13/13 (100%)
- workflow-boundary-map: 5/5 (100%)
- boundary-doctor: 4/4 (100%)
- gate-process-custody: 3/3 (100%)
Arc total: 99/100 (99%)

## Queued Work

Use `queued/` for protocol queues that are not active yet. A queued protocol should become active only when the remaining work is executable and locally verifiable.

## Handoff Workflow

When a new active protocol is selected:

1. Move it into `active/`.
2. Set `manifest.active_protocol` to the active-relative path.
3. Run `node tools/sync-protocols.mjs --commit <sha>`.
4. Run `node tools/sync-protocols.mjs --check`.

## Current Phase

- `Phase 15 First Time Production Hardening`

## Scope Boundaries

- `package.json`
- `package-lock.json`
- `production-bundle.json`
- `SCOPA_AGENT.md`
- `README.md`
- `docs/**`
- `schemas/**`
- `examples/**`
- `packages/cli/**`
- `packages/boundary-doctor/**`
- `packages/workflow-boundary-map/**`
- `packages/agent-surface/**`
- `packages/adapter-host/**`
- `packages/integrations/**`
- `packages/enforcement/**`
- `packages/release-readiness/**`
- `packages/adoption-experience/**`
- `packages/launcher/**`
- `.github/actions/scopa-boundary-check/**`
- `.github/workflows/scopa-boundary-check.yml`
- `fixtures/S37/**`
- `fixtures/S38/**`
- `fixtures/S39/**`
- `fixtures/S40/**`
- `fixtures/S41/**`
- `fixtures/S42/**`
- `fixtures/S43/**`
- `fixtures/S44/**`
- `fixtures/S45/**`
- `fixtures/S46/**`
- `fixtures/S47/**`
- `fixtures/S48/**`
- `fixtures/S49/**`
- `fixtures/S50/**`
- `fixtures/S52/**`
- `fixtures/S53/**`
- `notes/S37/**`
- `notes/S38/**`
- `notes/S39/**`
- `notes/S40/**`
- `notes/S41/**`
- `notes/S42/**`
- `notes/S43/**`
- `notes/S44/**`
- `notes/S45/**`
- `notes/S46/**`
- `notes/S47/**`
- `notes/S48/**`
- `notes/S49/**`
- `notes/S50/**`
- `notes/S52/**`
- `notes/S53/**`
- `runs/S37/**`
- `runs/S38/**`
- `runs/S39/**`
- `runs/S40/**`
- `runs/S41/**`
- `runs/S42/**`
- `runs/S43/**`
- `runs/S44/**`
- `runs/S45/**`
- `runs/S46/**`
- `runs/S47/**`
- `runs/S48/**`
- `runs/S49/**`
- `runs/S50/**`
- `runs/S52/**`
- `runs/S53/**`
- `evidence/S37/**`
- `evidence/S38/**`
- `evidence/S39/**`
- `evidence/S40/**`
- `evidence/S41/**`
- `evidence/S42/**`
- `evidence/S43/**`
- `evidence/S44/**`
- `evidence/S45/**`
- `evidence/S46/**`
- `evidence/S47/**`
- `evidence/S48/**`
- `evidence/S49/**`
- `evidence/S50/**`
- `evidence/S52/**`
- `evidence/S53/**`
- `next-prompt-protocols/**`
