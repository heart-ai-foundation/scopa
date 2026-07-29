# Phase 6 Production Live Run Hardening

Current commit reference: `5c70f34`
Current active protocol: `active/2026-07-28-S15-claude-production-live-run-edge-campaign.md`

## Scope

Production-like live-run edge hardening only: establish shared process and evidence custody, exercise Claude and Codex independently, stress sustained recovery and cleanup, then requalify one exact private candidate.

## Active objective

> Build and execute a bounded Claude Code headless edge campaign against the
> exact installed SCOPA candidate. Freeze an explicit per-run account, network,
> model, tool, time, turn, token/cost, evidence-retention, and cleanup policy
> before any provider call. Prove every live scenario locally with deterministic
> fault controls first, then run only the approved live subset and remediate only
> reproduced provider-boundary defects.
>
> Activation of this protocol does not itself start provider traffic. The
> provider gate remains closed until the complete run policy is materialized and
> validated.

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/live-run/**`
- `packages/integrations/claude/**`
- `packages/adapter-host/**`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `fixtures/S15/**`
- `next-prompt-protocols/**`
- `notes/S15/**`
- `runs/S15/**`
- `evidence/S15/**`

## Non-goals

- No npm publication, GitHub Release, repository visibility change, deployment, customer use, public announcement, certification, or trademark claim
- No SCOPA-RV1 experiment protocol, fixture, allocation, ground-truth, analyst, scoring, statistical, preregistration, confirmatory, or publication work
- No Codex provider campaign before S16
- No real Claude provider call before a complete per-run account, network, model, tool, time, turn, token or cost, evidence-retention, and cleanup policy is closed
- No customer repository, customer data, production deployment, or uncontrolled mutation
- No new public CLI command, bin, provider integration, tool, effect category, trust class, or assurance level
- No operating-system sandbox or full-provider-assurance claim
- No weakening or removal of the six-tool adapter, scope dispatcher, verifier, known-failing fixtures, hostile corpora, or independently useful free functionality
- No credential value, authorization header, raw environment map, provider raw session, private root, customer content, screenshot, token fragment, or rotation secret in repository evidence
- No rewrite of historical S8-S14 evidence
- No queue entries outside the authorized Production Live-Run Hardening Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- A complete closed per-run policy is validated before provider execution.
- The exact installed candidate, Claude client version, requested model alias,
  profile, tool matrix, scenario version, limits, and environment policy bind
  every run.
- Deterministic controls cover the existing four scenarios plus
  version/tool/model drift, refusal, rate event, timeout, ignored termination,
  early EOF, malformed event, capture limit, and budget stop.
- The approved real Claude subset preserves the same terminal polarity as its
  deterministic controls.
- Repeated sessions leave no resumable provider content, credential, private
  path, cross-run control state, temporary residue, or orphan process.
- Claude remains `partial`; favorable prose cannot assert completion.
- Public evidence is deterministic, collision-safe, private-root free, and
  binds bounded private evidence.
- `npm run test:s15`
- `npm run test:s8`
- `npm run test:s14`
- `npm run probe:s12:installed`
- `npm test`
- `npm audit --audit-level=low`
- `npm run protocol:check`
- Hosted deterministic CI passes.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
