# Phase 8 Process Tree Cleanup Hardening

Current commit reference: `4de55e2a`
Current active protocol: `active/2026-08-01-S24-gate-process-tree-custody.md`

## Scope

Close the reproduced gate descendant-survivor defect, then build and provider-off qualify entirely new candidate bytes without assurance transfer.

## Active objective

> Run every gate in an isolated process group; on timeout or output-limit pressure
> terminate the complete group with bounded SIGTERM/SIGKILL escalation; verify
> group disappearance before returning; detect successful parents that leave a
> descendant; and fail closed when custody cannot be established.

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
- `next-prompt-protocols/**`
- `notes/S20/**`
- `runs/S20/**`
- `evidence/S20/**`
- `evidence/S21/**`
- `evidence/S22/**`
- `evidence/S23/**`
- `evidence/S24/**`
- `evidence/S25/**`
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
- No queue entries outside the exact approved Process-Tree Cleanup Hardening Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- Timeout kills a signal-ignoring descendant process group.
- Output pressure kills the complete group and returns a failed gate.
- A successful parent that leaves a descendant is detected and cleaned.
- The runner waits for verified group disappearance and fails closed on cleanup
  ambiguity.
- Existing gate-result schema, output accounting, and allow/deny polarity remain
  compatible.
- Focused, accumulated, protocol, and hosted gates pass.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
