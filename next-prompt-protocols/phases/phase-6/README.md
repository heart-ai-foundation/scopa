# Phase 6 Production Live Run Hardening

Current commit reference: `6297c85`
Current active protocol: `active/2026-07-31-S17-sustained-operational-resilience.md`

## Scope

Production-like live-run edge hardening only: establish shared process and evidence custody, exercise Claude and Codex independently, stress sustained recovery and cleanup, then requalify one exact private candidate.

## Active objective

> Build a deterministic operational-resilience harness that first proves
> canonical full-journal/compact-response equivalence and bounded transcript
> responses, then exercises crash/resume idempotency, concurrency and
> backpressure, repeated cleanup, and cross-client parity. Provider spot checks
> remain closed unless deterministic polarity is complete and a later exact
> policy is separately approved.

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/live-run/**`
- `packages/integrations/codex/**`
- `packages/adapter-host/**`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `fixtures/S16/**`
- `fixtures/S16R2/**`
- `fixtures/S16R3/**`
- `fixtures/S16R4/**`
- `fixtures/S16R5/**`
- `fixtures/S16R6/**`
- `fixtures/S16R7/**`
- `next-prompt-protocols/**`
- `notes/S16/**`
- `runs/S16/**`
- `evidence/S16/**`
- `evidence/S16R2/**`
- `evidence/S16R3/**`
- `evidence/S16R4/**`
- `evidence/S16R5/**`
- `evidence/S16R6/**`
- `evidence/S16R7/**`
- `packages/journal/**`
- `packages/enforcement/**`
- `packages/integrations/claude/**`
- `fixtures/S17/**`
- `notes/S17/**`
- `runs/S17/**`
- `evidence/S17/**`
- `evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md`

## Non-goals

- No npm publication, GitHub Release, repository visibility change, deployment, customer use, public announcement, certification, or trademark claim
- No SCOPA-RV1 experiment protocol, fixture, allocation, ground-truth, analyst, scoring, statistical, preregistration, confirmatory, or publication work
- No replay, reclassification, scoring, provider run, or candidate claim for the retained SCOPA-RC1 pilot implementation note
- No provider spot check before deterministic S17 polarity is proven and a fresh exact account, network, model, tool, resource, evidence-retention, and cleanup policy is separately approved
- No reuse or inference of Claude account, behavior, tool, persistence, or assurance evidence as Codex evidence
- No customer repository, customer data, production deployment, or uncontrolled mutation
- No new public CLI command, bin, provider integration, tool, effect category, trust class, or assurance level
- No operating-system sandbox or full-provider-assurance claim
- No weakening or removal of the six-tool adapter, scope dispatcher, verifier, known-failing fixtures, hostile corpora, or independently useful free functionality
- No credential value, authorization header, raw environment map, provider raw session, private root, customer content, screenshot, token fragment, or rotation secret in repository evidence
- No rewrite of historical S8-S15 evidence
- No queue entries outside the authorized Production Live-Run Hardening Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- Canonical full-journal and compact-response views have a verified one-to-one
  semantic binding; digest, order, truncation, and incomplete-state tampering
  fail closed.
- Session, transcript, assurance, and output ceilings remain finite under
  concurrency and slow-reader pressure.
- Every admitted-mutation crash point resumes idempotently or stops for
  reconciliation without duplicate action.
- Normal, failed, bounded, and interrupted runs leave no stale control state,
  temporary file, descriptor, or process survivor.
- Cross-client parity reports shared outcomes and provider-specific
  differences without assurance transfer.
- `npm run test:s17`
- `npm run test:s14`
- `npm run test:s15`
- `npm run test:s16`
- `npm run protocol:check`
- `npm test`
- Hosted deterministic CI passes.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
