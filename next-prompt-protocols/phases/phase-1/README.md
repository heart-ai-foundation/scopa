# Phase 1 Foundation

Current commit reference: `f6dc629`
Current active protocol: `active/2026-07-26-S1-sealed-core.md`

## Scope

Block A foundation work. Build the sealed deterministic core and journal under lockdown before the enforcement loop. No publication is permitted.

## Active objective

> Build the effect taxonomy types, deterministic dCBOR envelope, hash-chain
> sealer, append-only adapter, content-addressed blob boundary, and generator
> execution loop under lockdown. Enforce ACT replay suppression with idempotency
> keys.

## Files in play

- `.gitignore`
- `README.md`
- `package.json`
- `spec/**`
- `next-prompt-protocols/**`
- `packages/conformance/**`
- `packages/kernel-core/**`
- `packages/journal/**`
- `fixtures/**`
- `notes/S1/**`
- `runs/S1/**`
- `evidence/S1/**`

## Non-goals

- No npm publication or public release before S3 closes v0.1
- No production agent enforcement or live tool-boundary interception in S1
- No slice-lock write enforcement, completion evaluator, orientation surface, or cold-resume state
- No signing, device-key claim, anchoring, INFER provider integration, or CASE/UCO export
- No effect categories outside the canonical Macro Delta and Kernel Specification
- No queue entries that are not sourced from the canonical Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `node --test packages/conformance/test/*.test.js`
- `node --test packages/kernel-core/test/*.test.js packages/journal/test/*.test.js`
- `npm test`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- The same workflow encoded and sealed by two independent runtimes produces
  byte-identical records.
- Hash-chain verification accepts the clean chain and rejects mutation and
  truncation.
- The append-only file adapter satisfies the persistence-port suite.
- Content-addressed blobs are stored outside the chain and resolve by digest.
- Schema and kernel versions are pinned in every record.
- A repeated ACT idempotency key is suppressed before a second execution.
- The generator core passes the S0 replay-equivalence and escaped-effect gates
  under lockdown.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
