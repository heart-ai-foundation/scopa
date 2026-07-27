# Next Prompt Protocols

This is the canonical handoff target for project work. The manifest currently has no active protocol.

Current commit reference: `ede5d9b`

Active protocol: `none`
Active protocol class: `unset`
Active protocol compound: `false`

## Current State

No active protocol. S5 remains deferred pending an external CASE consumer and principal direction.

Module progress:
- conformance: 3/3 (100%)
- kernel-core: 4/4 (100%)
- journal: 5/5 (100%)
- enforcement: 4/4 (100%)
- agent-surface: 3/3 (100%)
- legibility: 4/4 (100%)
- depth: 4/4 (100%)
- interop: 0/2 (0%)
Arc total: 27/29 (93%)

## Queued Work

Use `queued/` for protocol queues that are not active yet. A queued protocol should become active only when the remaining work is executable and locally verifiable.

## Handoff Workflow

When a new active protocol is selected:

1. Move it into `active/`.
2. Set `manifest.active_protocol` to the active-relative path.
3. Run `node tools/sync-protocols.mjs --commit <sha>`.
4. Run `node tools/sync-protocols.mjs --check`.

## Current Phase

- `Phase 2 Depth`

## Scope Boundaries

- No active scope boundaries are declared.
