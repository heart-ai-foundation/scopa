# Phase 6 Production Live Run Hardening

Current commit reference: `3ac0173`
Current active protocol: `active/2026-07-28-S14-shared-live-run-custody-and-supervision.md`

## Scope

Production-like live-run edge hardening only: establish shared process and evidence custody, exercise Claude and Codex independently, stress sustained recovery and cleanup, then requalify one exact private candidate.

## Active objective

> Implement a shared live-run custody layer used by both installed integrations.
> It must supervise a process group through bounded success and failure states,
> return one closed terminal envelope, bind the installed candidate and runtime
> policy, store private evidence atomically with restrictive permissions, and
> derive deterministic public evidence through the existing collision-safe
> publication boundary.
>
> Use deterministic process doubles to exercise the edge matrix. S14 makes no
> real provider call.

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/live-run/**`
- `packages/integrations/claude/**`
- `packages/integrations/codex/**`
- `packages/adapter-host/**`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `fixtures/S14/**`
- `next-prompt-protocols/**`
- `notes/S14/**`
- `runs/S14/**`
- `evidence/S14/**`

## Non-goals

- No npm publication, GitHub Release, repository visibility change, deployment, customer use, public announcement, certification, or trademark claim
- No real Claude, Codex, OpenAI, Anthropic, or other provider call in S14
- No SCOPA-RV1 experiment protocol, fixture, allocation, ground-truth, analyst, scoring, statistical, preregistration, confirmatory, or publication work
- No new public CLI command, bin, provider integration, tool, effect category, trust class, or assurance level
- No operating-system sandbox or full-provider-assurance claim
- No weakening or removal of the six-tool adapter, scope dispatcher, verifier, known-failing fixtures, hostile corpora, or independently useful free functionality
- No credential value, authorization header, raw environment map, provider raw session, private root, customer content, screenshot, token fragment, or rotation secret in repository evidence
- No rewrite of historical S8-S13 evidence
- No queue entries outside the authorized Production Live-Run Hardening Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- Shared supervision is actually used by both Claude and Codex run paths.
- Every declared terminal class has a deterministic positive or negative
  control and a closed bounded envelope.
- Timeout and output-limit tests terminate a descendant that ignores graceful
  shutdown and independently prove no process survives.
- Nonzero exit, signal, spawn failure, version drift, inventory drift,
  malformed stream, and truncated stream cannot issue a success or completion
  state.
- Receipts bind source commit, installed package digest/integrity, client
  version, requested model, profile, capability matrix, scenario, limits, and
  environment-policy digest.
- No receipt retains a credential value, authorization header, raw
  environment map, uncontrolled provider content, or private root.
- Private evidence writes are atomic, alias-safe, mode-restricted, and refuse
  overwrite or collision.
- Public evidence is deterministic, binds private bytes, changes only
  designated fields, and passes the package privacy scanner.
- `npm run test:s14`
- `npm run test:s8`
- `npm run test:s9`
- `npm run probe:s12:installed`
- `npm test`
- `npm run protocol:check`
- Hosted CI passes.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
