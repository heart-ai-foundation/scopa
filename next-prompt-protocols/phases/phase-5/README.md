# Phase 5 Adversarial Hardening

Current commit reference: `ef44d18`
Current active protocol: `active/2026-07-27-S11-proof-contract-and-redaction-convergence.md`

## Scope

Adversarial release hardening only: converge proof validation and publication, reconcile the installed consumer/error/CI surface, then independently requalify one exact private candidate.

## Active objective

> Create one mechanically checked proof-validation language across the runtime
> and published schemas. Enforce closed fields, non-empty and unique arrays,
> positive package cardinalities, safe paths, and aggregate invariants. Replace
> generic recursive substitution with field-specific publication that rejects
> or explicitly reports collisions and computes semantic preservation from the
> actual before/after proof.

## Files in play

- `packages/release-readiness/**`
- `schemas/**`
- `fixtures/S11/**`
- `package.json`
- `package-lock.json`
- `next-prompt-protocols/**`
- `notes/S11/**`
- `runs/S11/**`
- `evidence/S11/**`

## Non-goals

- No npm publication, GitHub Release, public repository, visibility change, deployment, customer use, public announcement, certification, or trademark claim
- No rewrite of S10 historical proof, candidate bytes, acceptance, or closeout
- No weakening of a published closed-schema, cardinality, uniqueness, numeric, path, aggregate, or false-green constraint
- No generic whole-document replacement of path-like values
- No new product feature, provider integration, effect category, mutation route, or adapter-assurance claim
- No credential value or credential-rotation evidence in the repository
- No claim that partial Claude or Codex assurance is full enforcement
- No hiding of provider-specific uncontrolled capability routes
- No removal of known-failing fixtures, public verifier capability, or independently useful free functionality
- No change to S0-S9 runtime semantics or the frozen effect taxonomy
- No S12 or S13 implementation before prior closeout and protocol rotation
- No queue entries outside the authorized Adversarial Release Hardening Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `npm run test:s11`
- `npm run probe:s11:parity`
- `npm run test:s10`
- `npm test`
- `npm audit`
- `npm run protocol:check`
- The exact accepted S10 proof remains valid without editing its retained
  evidence.
- Every positive and negative corpus entry returns the same result through
  runtime and published-contract validation.
- Empty or duplicate adapter tool names, empty or duplicate verified/non-claim
  arrays, zero or negative package cardinalities, unknown or missing fields,
  invalid paths, and fabricated aggregate states fail closed.
- Redaction modifies only the designated environment roots in the public proof.
- Root collisions with assurance labels, claims, package metadata, filenames,
  tool names, placeholders, substrings, or overlapping roots cannot produce a
  valid receipt that falsely reports semantic preservation.
- `semanticFieldsChanged` is computed from a defined semantic projection and
  is never hard-coded.
- Raw source bytes and the public proof remain digest-bound and deterministic.
- PI1, PI2, and PI3 are independently reviewable and satisfied.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
