# Phase 4 Developer Preview

Current commit reference: `ce763f1`
Current active protocol: `active/2026-07-27-S7-model-neutral-adapter-bridge.md`

## Scope

Developer-preview work: installable local distribution, a model-neutral agent bridge, separately evidenced Claude Code and Codex integrations, and private release-candidate validation.

## Active objective

> Expose the trusted SCOPA host through a model-neutral bridge suitable for
> headless coding agents. Prove with a deterministic fake agent that reads,
> allowed mutations, denied mutations, and stop-state checks cross only the
> bridge, while every request, agent/CLI identity, tool outcome, effect, and
> terminal state is captured in a closed structured transcript.

## Files in play

- `packages/adapter-host/**`
- `packages/conformance/**`
- `fixtures/S7/**`
- `package.json`
- `package-lock.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S7/**`
- `runs/S7/**`
- `evidence/S7/**`

## Non-goals

- No real Claude Code or Codex invocation in S7
- No provider-specific policy, prompt-obedience guard, or model-based authorization decision
- No native shell, patch, filesystem, subprocess, plugin, or network mutation capability exposed outside the SCOPA dispatcher
- No change to the frozen effect taxonomy, journal encoding, enforcement semantics, signed packet, CASE mapping, or S6 CLI contract
- No full-assurance provider claim unless native capabilities are closed or explicitly labeled
- No npm publication, public repository, public release, or production installation
- No final trademark, package-name, license, or contribution-model claim
- No shell-string command execution or unjournaled mutation transport
- No queue entries outside the authorized Developer Preview Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `npm run test:s7`
- `npm test`
- `npm run protocol:check`
- The bridge exposes a finite, schema-validated tool inventory whose mutation
  handlers reach only the trusted SCOPA dispatcher.
- A deterministic fake agent can read orientation, request one allowed
  mutation, receive a correction-bearing denial for one blocked mutation, and
  observe both passing and blocked stop states solely through the bridge.
- Unknown tools, malformed arguments, duplicate request identifiers, and
  unsupported protocol methods fail closed without mutation.
- Direct mutation bypass attempts either fail or are represented as an
  explicit uncontrolled capability that prevents a full-assurance claim.
- One closed transcript records the request, declared model and CLI identity,
  ordered tool calls and results, effects, denials, and terminal stop state.
- Transcript validation rejects missing, reordered, duplicated, or unknown
  security-relevant fields.
- A machine-readable capability/bypass matrix covers every advertised and
  known native capability and computes an honest `full` or `partial`
  assurance result.
- The transport does not execute shell strings or create an unjournaled
  mutation path.
- S0-S6 release gates remain green.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
