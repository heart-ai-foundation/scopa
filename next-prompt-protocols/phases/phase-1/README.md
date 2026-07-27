# Phase 1 Foundation

Current commit reference: `3a93ee2`
Current active protocol: `active/2026-07-26-S0-conformance-harness.md`

## Scope

Block A foundation work. Build the conformance detector before the sealed core and enforcement loop. No publication is permitted.

## Active objective

> Build the replay-equivalence and untrusted-data containment harnesses before the
> features they guard. The harness must fail on deliberately injected
> non-deterministic behavior and instruction leakage, then pass on clean controls.

## Files in play

- `.gitignore`
- `README.md`
- `package.json`
- `spec/**`
- `next-prompt-protocols/**`
- `packages/conformance/**`
- `packages/kernel-core/**`
- `fixtures/**`
- `notes/S0/**`
- `runs/S0/**`
- `evidence/S0/**`

## Non-goals

- No npm publication or public release before S3 closes v0.1
- No production agent enforcement in S0
- No sealed journal implementation beyond the minimal seams required by S0 fixtures
- No signing, anchoring, INFER provider integration, or CASE/UCO export
- No effect categories outside the canonical Macro Delta and Kernel Specification
- No queue entries that are not sourced from the canonical Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `node --test packages/conformance/test/*.test.js`
- `npm test`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Injected divergence and instruction leakage are observed failing for the
  expected reasons.
- Clean controls pass.
- The release gate invokes both harnesses.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
