# Next Prompt Protocols

This is the canonical handoff target for project work. The manifest currently has no active protocol.

Current commit reference: `5b861fe`

Active protocol: `none`
Active protocol class: `unset`
Active protocol compound: `false`

## Current State

No active protocol. The canonical SCOPA S0-S5 Macro Delta queue is complete.

Module progress:
- conformance: 3/3 (100%)
- kernel-core: 4/4 (100%)
- journal: 5/5 (100%)
- enforcement: 4/4 (100%)
- agent-surface: 3/3 (100%)
- legibility: 4/4 (100%)
- depth: 4/4 (100%)
- interop: 2/2 (100%)
Arc total: 29/29 (100%)

## Queued Work

Use `queued/` for protocol queues that are not active yet. A queued protocol should become active only when the remaining work is executable and locally verifiable.

## Handoff Workflow

When a new active protocol is selected:

1. Move it into `active/`.
2. Set `manifest.active_protocol` to the active-relative path.
3. Run `node tools/sync-protocols.mjs --commit <sha>`.
4. Run `node tools/sync-protocols.mjs --check`.

## Current Phase

- `Phase 3 Interop`

## Scope Boundaries

- No active scope boundaries are declared.
