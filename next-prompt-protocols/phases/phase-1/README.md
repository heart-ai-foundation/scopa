# Phase 1 Foundation

Current commit reference: `08a914f`
Current active protocol: `active/2026-07-26-S3-legibility.md`

## Scope

Block A foundation work. Build observe-mode legibility and coverage that never overstates unobserved activity. S3 must close before publication.

## Active objective

> Build the reconstructability scorer, observe-mode runner,
> declared-versus-observed gap reporter, coverage readout, and initial
> coding-agent profile. Produce a boundary map from a real session whose
> boundaries were not declared in advance.

## Files in play

- `README.md`
- `package.json`
- `next-prompt-protocols/**`
- `packages/conformance/**`
- `packages/journal/**`
- `packages/legibility/**`
- `fixtures/S3/**`
- `notes/S3/**`
- `runs/S3/**`
- `evidence/S3/**`

## Non-goals

- No forensic-reconstruction claim for activity observe mode did not see
- No inference that an unexercised path or effect is absent
- No enforcement changes, signing, anchoring, INFER provider integration, or CASE/UCO export
- No community profile catalog beyond the initial coding-agent profile
- No npm publication or public release until S3 acceptance closes v0.1
- No effect categories outside the canonical Macro Delta and Kernel Specification
- No queue entries that are not sourced from the canonical Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `npm run test:s3`
- `npm test`
- `npm run protocol:check`
- Observe mode journals without enforcing.
- An undeclared real agent session produces a deterministic boundary map.
- Manual inspection agrees with the map for the events actually observed.
- Declared-versus-observed gaps are findings, not silent normalization.
- Coverage labels unexercised paths as `not-observed`, never `not-present`.
- Reconstructability scoring is derived from explicit journal completeness
  signals and cannot be presented as a forensic reconstruction.
- S0, S1, and S2 release gates remain green.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
