# Phase 9 S26r2 Scenario Binding Remediation

Current commit reference: `2b759c4`
Current active protocol: `active/2026-08-02-S26R2-scenario-binding-remediation.md`

## Scope

Preserve stopped S26R1 and bind each future runtime scenario exactly to its SCOPA session/transcript identity, without provider replay or unrelated change.

## Active objective

> Hold the exact provider-closed S26R2 matrix after proving one
> session/runtime-scenario binding for each provider, adversarial mismatch
> rejection, and preserved evidence ordering. Do not execute the matrix without
> later exact approval.

## Files in play

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
- `fixtures/S26/**`
- `fixtures/S26R1/**`
- `fixtures/S26R2/**`
- `runs/S26R1/**`
- `runs/S26R2/**`
- `packages/live-run/test/s26r2-scenario-binding-remediation.test.js`
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
- `evidence/S27/**`
- `evidence/S28/**`
- `evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md`

## Non-goals

- No npm publication, GitHub Release, repository visibility change, deployment, customer use, public announcement, certification, or trademark claim
- No SCOPA-RV1 experiment protocol, fixture, allocation, ground-truth, analyst, scoring, statistical, preregistration, confirmatory, or publication work
- No replay, reclassification, scoring, provider run, or candidate claim for the retained SCOPA-RC1 pilot implementation note
- No provider traffic in S19-v2, S20, S22, or S23 and no S21 traffic without a separate fresh exact candidate-bound approval
- No transfer of the rejected S18 candidate, provider approval, live assurance, or reviewer verdict to the replacement candidate
- No dependency upgrade, fork, patch, minimization, or rewrite
- No proprietary verifier, online activation, telemetry, or paid truth source
- No customer repository, customer data, production deployment, or uncontrolled mutation
- No new public CLI command, bin, provider integration, tool, effect category, trust class, or assurance level
- No operating-system sandbox or full-provider-assurance claim
- No weakening or removal of the six-tool adapter, scope dispatcher, verifier, known-failing fixtures, hostile corpora, or independently useful free functionality
- No credential value, authorization header, raw environment map, provider raw session, private root, customer content, screenshot, token fragment, or rotation secret in repository evidence
- No rewrite of historical evidence
- No S26 or S26R1 replay and no provider traffic in S26R2 without a separate exact-matrix-digest approval
- No cold-restart replay, repeated sustained soak, sequential review protocols, review-of-review slice, or release-execution slice without evidence-driven reopening or exact principal authority
- No queue entries outside the exact approved R1 Exact-Byte Qualification Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- Historical S26R1 bytes, custody, stop, and consumed approval remain exact.
- Runtime scenario ID exactly equals the SCOPA session/transcript ID.
- Matrix scenario remains the `clean` classification.
- Any identifier or version mismatch rejects deterministically.
- Retain-before-validate and cleanup contracts do not regress.
- S26R2 matrix is closed; provider calls authorized are zero.
- Focused, accumulated, protocol, privacy, and hosted gates pass.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
