# S38 — Runtime-Owned Task Bootstrap

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** [`enforcement`, `adapter-host`, `distribution`]
**Advances contracts:** [`AX2`]
**Compound:** false
**Status:** active; provider-off implementation only

## Why this exists

The one-file agent protocol currently makes the agent author a slice definition,
capability matrix, and authority document before it can begin work. The
developer no longer writes those files, but the product has merely transferred
setup complexity into a long prompt. S38 moves the repetitive, security-
sensitive construction into validated runtime code.

## Next objective

Add one atomic begin-slice operation available through the CLI and MCP host. It
must accept an explicit structured task boundary from the agent—outcome,
allowed repository paths, real gate argv arrays, non-goals, and a named client
profile—then prevalidate the complete transaction, create default-closed
authority and honest capability declarations, initialize SCOPA, run the gates,
and return the actual boundary map. No developer-authored policy files and no
natural-language policy inference.

## Descriptor rung check

Executable unlock: one tool call in a clean repository must replace three
hand-authored control documents and produce the same hardened lock, denial,
gate, and map semantics.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: validated begin-slice contract, atomic runtime
  transaction, CLI command, MCP tool, and hostile bootstrap corpus.
- New uncertainty reduced: whether simplification can remove setup artifacts
  without inventing scope, authority, or assurance.
- Validation: no-write malformed cases, closed defaults, explicit client
  profiles, allow/deny polarity, gate results, conflicting-state refusal, and
  CLI/MCP parity.
- Consecutive metadata/decision slice check: pass.
- Status-report alternative: insufficient; runtime-owned construction does not
  exist.

## Productivity mix

- Runtime behavior: 55%
- Contract/test code: 40%
- Metadata/docs: 5%

## Files in play

- `packages/adoption-experience/**`
- `packages/cli/**`
- `packages/adapter-host/**`
- `packages/enforcement/**` only for unavoidable shared validation
- `schemas/**`
- `fixtures/S38/**`
- `package.json`
- `production-bundle.json`
- `notes/S38/**`
- `runs/S38/**`
- `evidence/S38/**`
- `next-prompt-protocols/**`

## Non-goals

- No parsing of task prose into allowed paths, commands, authority, or client
  capabilities.
- No external authority status other than default-closed `authority-required`
  or evidence-backed `disabled`; no claim that SCOPA controls external action.
- No silent reuse or overwrite of conflicting `.scopa/` state.
- No discovered command execution; only caller-supplied validated gate argv.
- No provider call, network probe, package installation, assistant config,
  telemetry, account, release, publication, or external-system action.
- No full assurance for a profile with an active native bypass.

## Evidence

Commit the slice trio under `notes/S38/`, `runs/S38/`, and `evidence/S38/`.
Evidence must bind the public begin request, generated internal documents,
terminal map, malformed no-write corpus, CLI/MCP parity, and exact gate result.

## Acceptance

- `npm run test:s38`
- `npm run test:s35`
- `npm run test:s37`
- `npm run test:s7`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- One begin request in a clean repository creates only validated SCOPA state,
  returns the actual terminal map, and requires no caller-authored file.
- Malformed scope, escaping paths, shell-shaped gates, unknown profiles,
  conflicting state, and incomplete input fail before mutation.
- External authority defaults closed, active native bypasses remain
  uncontrolled, and assurance cannot exceed the selected profile evidence.
- CLI and MCP expose the same request and result semantics.

## Stop condition

Stop on inferred policy, hidden authority, prevalidation breach, conflicting-
state overwrite, shell execution, false gate success, profile overclaim,
developer-authored policy requirement, provider/network intent, or weakening
of existing Doctor lock semantics.

