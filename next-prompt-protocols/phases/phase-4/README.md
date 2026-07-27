# Phase 4 Developer Preview

Current commit reference: `8be70bd`
Current active protocol: `active/2026-07-27-S9-codex-headless-integration-and-parity.md`

## Scope

Developer-preview work: installable local distribution, a model-neutral agent bridge, separately evidenced Claude Code and Codex integrations, and private release-candidate validation.

## Active objective

> Run a pinned Codex CLI non-interactively through the installed S7 bridge in a
> fresh fixture repository. Reproduce S8's allowed-write, blocked-scope,
> false-green-refusal, and cold-restart outcomes, then publish a machine-readable
> Claude/Codex parity report and retain every provider-specific assurance gap.

## Files in play

- `packages/integrations/codex/**`
- `fixtures/S9/**`
- `package.json`
- `package-lock.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S9/**`
- `runs/S9/**`
- `evidence/S9/**`

## Non-goals

- No dangerous sandbox or approval bypass, unbounded workspace, or claim that a Codex-native mutation route is SCOPA-mediated
- No reliance on Codex prompt obedience for scope or completion enforcement
- No mutation of the SCOPA source checkout by a live model
- No provider-attested identity or immutable-model-snapshot claim
- No full-assurance claim while native shell, patch, process, network, managed policy, plugin, hook, skill, session, or another route remains active and uncontrolled
- No change to Claude adapter behavior, S0-S8 semantics, or the frozen effect taxonomy
- No npm publication, public repository, public release, or production installation
- No final trademark, package-name, license, or contribution-model claim
- No queue entries outside the authorized Developer Preview Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `npm run test:s9`
- `npm run probe:s9:live`
- `npm run verify:s9:parity`
- `npm test`
- `npm run protocol:check`
- The launcher records an exact Codex CLI version and rejects unreviewed
  version drift.
- Headless launch uses `codex exec` with JSON events, an explicit repository,
  bounded runtime/output, isolated MCP configuration, a reviewed sandbox, no
  dangerous bypass, and a recorded settings/hooks/plugins/skills inventory.
- The observed model-callable surface and every Codex-native shell, patch,
  write, network, hook, plugin, skill, setting, MCP, subprocess, session, and
  admin route are classified in the capability matrix.
- A clean live session writes one allowed file through `scopa_write_file`,
  calls the real stop gate, and returns a valid SCOPA transcript.
- A fault session attempts an out-of-scope write, receives
  `SCOPA_SCOPE_DENIED`, and does not create the target.
- A failing gate remains `canStop: false`; model prose cannot convert it into
  completed evidence.
- A fresh second Codex/bridge process in the same fixture reorients from
  persisted SCOPA state without relying on prior process memory.
- Raw event normalization fails on unknown security events, missing tool
  results, altered call ordering, or a claimed result inconsistent with the
  SCOPA terminal state.
- A machine-readable parity report compares the four Codex outcomes with the
  committed S8 Claude public proof and exposes, rather than hides, any gap.
- Known uncontrolled Codex routes force `partial` assurance.
- A non-Codex outside reviewer reproduces deterministic gates, inspects live
  and parity evidence, and issues an explicit accept/hold verdict.
- S0-S8 release gates remain green.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
