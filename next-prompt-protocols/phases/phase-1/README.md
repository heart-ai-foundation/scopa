# Phase 1 Foundation

Current commit reference: `20079cc`
Current active protocol: `active/2026-07-26-S2-enforcement-loop.md`

## Scope

Block A foundation work. Build and falsify the enforcement loop against real tool-boundary writes, completion gates, and cold resume. No publication is permitted.

## Active objective

> Build slice-lock and allowed-path enforcement, a real verification-gate runner,
> checkable stop-condition evaluator, compact orientation call, denial payloads,
> and cold-resume rotation state.

## Files in play

- `.gitignore`
- `README.md`
- `package.json`
- `spec/**`
- `next-prompt-protocols/**`
- `packages/conformance/**`
- `packages/enforcement/**`
- `packages/agent-surface/**`
- `fixtures/**`
- `notes/S2/**`
- `runs/S2/**`
- `evidence/S2/**`

## Non-goals

- No npm publication or public release before S3 closes v0.1
- No operating-system sandbox claim; S2 binds at the trusted host tool-call boundary
- No alternate unguarded mutation tool in a conforming host integration
- No self-verified principal DECISION or agent-writable rotation state
- No signing, device-key claim, anchoring, INFER provider integration, or CASE/UCO export
- No effect categories outside the canonical Macro Delta and Kernel Specification
- No queue entries that are not sourced from the canonical Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- A real agent write outside the declared allowed paths is blocked before the
  tool executes.
- A claimed completion is refused because a configured command actually fails.
- Stop state is machine-checkable and gate mutation fails closed.
- Orientation and denial payload contracts pass.
- Rotation state restores the slice after a cold context clear.
- S0 and S1 release gates remain green.
- `npm run protocol:check`.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
