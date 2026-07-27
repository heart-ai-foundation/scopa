# Phase 4 Developer Preview

Current commit reference: `9191256`
Current active protocol: `active/2026-07-27-S6-installable-developer-surface.md`

## Scope

Developer-preview work: installable local distribution, a model-neutral agent bridge, separately evidenced Claude Code and Codex integrations, and private release-candidate validation.

## Active objective

> Create a locally packable SCOPA distribution with one `scopa` CLI that can
> initialize a clean repository, report orientation and stop state, run declared
> checks through the existing enforcement surface, and verify retained evidence.
> Prove it by installing the packed artifact into a fresh fixture repository
> that contains no SCOPA source.

## Files in play

- `packages/cli/**`
- `packages/conformance/**`
- `fixtures/S6/**`
- `package.json`
- `package-lock.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S6/**`
- `runs/S6/**`
- `evidence/S6/**`

## Non-goals

- No Claude Code, Codex, MCP, hook, or plugin integration in S6
- No change to the frozen effect taxonomy, journal encoding, enforcement semantics, signed packet, or CASE mapping
- No registry lookup requirement or dependency on a published SCOPA package
- No npm publication, public repository, public release, or production installation
- No final trademark, package-name, license, or contribution-model claim
- No silent overwrite of existing project files
- No shell-string command execution; preserve argv-based gate execution
- No claim that an installed CLI alone makes an agent adapter conforming
- No queue entries outside the authorized Developer Preview Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `npm run test:s6`
- `npm test`
- `npm run protocol:check`
- `npm pack` produces an installable local artifact with an explicit file
  allowlist and no private keys, temporary receipts, or historical run logs.
- A fresh temporary repository installs only that artifact and its declared
  dependencies; no import resolves into the SCOPA source checkout.
- `scopa init` creates a closed, versioned configuration without overwriting
  existing files and is idempotent on an unchanged repository.
- `scopa status`, `scopa check`, `scopa run`, and `scopa verify` expose stable
  JSON result forms and meaningful zero/nonzero exit codes.
- A deliberately failing verification gate cannot be converted to success by
  output text or an agent assertion.
- Path, gate, and evidence errors fail closed with correction-bearing output.
- S0-S5 release gates remain green.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
