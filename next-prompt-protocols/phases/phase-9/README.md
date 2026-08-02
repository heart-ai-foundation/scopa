# Phase 9 S26r1 Failure Evidence Remediation

Current commit reference: `dde7c13`
Current active protocol: `active/2026-08-01-S26R1-failure-evidence-remediation.md`

## Scope

Preserve stopped S26 and ensure every future returned live result is privately retained before qualification, without provider replay or unrelated change.

## Active objective

> Prove that the distinct S26R1 runner retains every returned result before
> qualification, freeze the new closed matrix, and obtain local and hosted
> provider-off qualification. Do not execute the matrix without separate exact
> approval.

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
- `runs/S26R1/**`
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
- No S26 replay and no provider traffic in S26R1 without a separate exact-matrix-digest approval
- No cold-restart replay, repeated sustained soak, sequential review protocols, review-of-review slice, or release-execution slice without evidence-driven reopening or exact principal authority
- No queue entries outside the exact approved R1 Exact-Byte Qualification Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- Historical S26 bytes and stop evidence remain exact.
- The returned run is durably retained before every success assertion.
- Rejected runs remain private and diagnosable.
- Collision or write failure stops without overwrite or false green.
- S26R1 matrix is closed and exact; provider calls authorized are zero.
- Focused, accumulated, protocol, and hosted gates pass.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
