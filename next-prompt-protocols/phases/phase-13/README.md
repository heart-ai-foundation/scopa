# Phase 13 Instant Value And Organic Distribution

Current commit reference: `ad3f31c`
Current active protocol: `active/2026-08-05-S41-provider-off-pr-distribution.md`

## Scope

Reduce SCOPA to an insight-first, one-prompt developer journey and add local, truthful, provider-off distribution surfaces without weakening assurance semantics or authorizing publication, release, provider, hosted, customer, telemetry, deployment, or external-system action.

## Active objective

> Add a provider-off local GitHub Action and read-only pull-request workflow that
> validate an optional Boundary Card and write a sanitized job summary. The
> default workflow must use read-only permissions and never execute PR-declared
> commands. An optional PR comment surface must require explicit enablement, a
> token supplied by the caller, and full-commit-pinned trusted action code.

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

- `npm run test:s41`
- `npm run test:s40`
- `npm run test:s33`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Default pull-request workflow declares only `contents: read`, persists no
  checkout credential, performs no package install, and executes no card gate.
- Valid cards produce sanitized count/digest summaries; missing cards remain
  explicitly unknown; malformed, oversized, aliased, or hostile cards fail
  before summary publication.
- PR comments require literal opt-in, a caller token, a pull-request event, and
  documentation requiring full-commit-pinned trusted action code.
- Fork fixtures expose no secret or write route, and all untrusted values remain
  data rather than workflow commands or executable script.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
