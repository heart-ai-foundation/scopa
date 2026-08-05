# Phase 14 Legible Value And Organic Adoption

Current commit reference: `4643cb3`
Current active protocol: `active/2026-08-05-S44-human-first-command-output.md`

## Scope

Make the observations SCOPA already computes readable at first contact, report observed changes outside the lock without claiming to have prevented them, and open the public discovery and consultation surfaces, without weakening assurance semantics or authorizing publication, release, provider, hosted, customer, telemetry, deployment, or external-system action.

## Active objective

> Render `doctor`, `begin`, `check`, and `status` as concise human text by default
> when standard output is a terminal-facing invocation, and make `--format
> markdown` emit Markdown rather than JSON-wrapped Markdown. Preserve every
> existing canonical envelope, schema, and exit code behind explicit
> `--format json`.

## Files in play

- `package.json`
- `package-lock.json`
- `production-bundle.json`
- `SCOPA_AGENT.md`
- `README.md`
- `docs/**`
- `schemas/**`
- `examples/**`
- `packages/cli/**`
- `packages/boundary-doctor/**`
- `packages/workflow-boundary-map/**`
- `packages/agent-surface/**`
- `packages/adapter-host/**`
- `packages/integrations/**`
- `packages/enforcement/**`
- `packages/release-readiness/**`
- `packages/adoption-experience/**`
- `packages/launcher/**`
- `.github/actions/scopa-boundary-check/**`
- `.github/workflows/scopa-boundary-check.yml`
- `fixtures/S37/**`
- `fixtures/S38/**`
- `fixtures/S39/**`
- `fixtures/S40/**`
- `fixtures/S41/**`
- `fixtures/S42/**`
- `fixtures/S43/**`
- `notes/S37/**`
- `notes/S38/**`
- `notes/S39/**`
- `notes/S40/**`
- `notes/S41/**`
- `notes/S42/**`
- `notes/S43/**`
- `runs/S37/**`
- `runs/S38/**`
- `runs/S39/**`
- `runs/S40/**`
- `runs/S41/**`
- `runs/S42/**`
- `runs/S43/**`
- `evidence/S37/**`
- `evidence/S38/**`
- `evidence/S39/**`
- `evidence/S40/**`
- `evidence/S41/**`
- `evidence/S42/**`
- `evidence/S43/**`
- `next-prompt-protocols/**`

## Non-goals

- No npm publication, GitHub Release, tag, marketplace listing, deployment, public announcement, repository visibility change, or release execution
- No provider/model call, production-live call, experiment use, customer repository, customer data, or external-system mutation
- No telemetry, analytics, account, hosted dashboard, proprietary verifier, paid truth source, hidden lead capture, or remotely loaded report asset
- No operating-system sandbox, full-agent-control, safety, security, compliance, readiness, certification, or favorable generic risk-score claim
- No natural-language policy inference presented as explicit developer authority and no silent permission grant for credentials, network, browser, publication, deployment, or external systems
- No user-global assistant configuration mutation by default and no destructive overwrite of existing project or assistant configuration
- No weakening of canonical JSON, explicit unknowns, scope dispatch, gate execution, process-tree custody, verifier behavior, hostile fixtures, or independently useful free functionality
- No credential value, authorization header, raw environment map, private root, customer content, prompt, raw gate output, token fragment, or secret in public or shareable evidence
- No rewrite of historical evidence or assurance transfer from public 0.3.0 to changed Phase 13 bytes
- No PR comment or other GitHub write without an explicit opt-in workflow and least-privilege permission
- No support claim for an assistant client that has not passed its named fixture and installed-surface qualification
- No docs-only, marketing-only, approval-only, review-of-review, or closeout queue slot; every slot must change executable behavior or validate a concrete product claim

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `npm run test:s44`
- `npm run test:s37`
- `npm run test:s34`
- `npm run test:s36`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- For each of `doctor`, `begin`, `check`, `status`: `--format json` output is
  byte-identical to the 0.4.0 envelope for the same input and state.
- `doctor --format markdown` emits Markdown as its own output with no JSON
  envelope and no escaped newline sequences.
- Exit codes are unchanged, including `check` returning 4 while completion gates
  are blocked and `status` returning 0 while observing blocked state.
- Default human output for each command is at most 20 nonblank lines, states the
  actual completion and assurance result, and never presents an unknown or
  absent surface favorably.
- Every human statement is traceable to a field in the corresponding canonical
  envelope; the renderer introduces no claim of its own.
- Every command example in `README.md` and `docs/**` matches actual output under
  the docs exact-output corpus.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
