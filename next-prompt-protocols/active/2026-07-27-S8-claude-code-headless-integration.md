# S8 — Claude Code Headless Integration

**Class:** `arc`
**Module:** `claude-adapter`
**Crosses:** [`adapter-host`, `enforcement`, `conformance`]
**Advances contracts:** [`CL1`, `CL2`, `CL3`]
**Compound:** false

## Why this exists

The S7 bridge proves a provider-neutral contract with a deterministic client,
but a real coding agent may retain built-in tools, settings, hooks, plugins,
session storage, subprocess routes, or other native authority. Claude Code's
headless MCP support makes those routes testable rather than hypothetical.

## Next objective

Run Claude Code non-interactively against live SCOPA fixtures with an explicit,
reproducible MCP and tool surface. Prove that Claude completes an allowed task,
receives a correction-bearing scope denial, cannot assert completion over a
failing gate, and can orient after a cold adapter restart. Publish the raw and
normalized transcripts plus an assurance matrix that preserves every route
which could not be closed.

## Descriptor rung check

Executable unlock: a pinned Claude Code CLI launches in print mode with only
the explicit SCOPA MCP server exposed to the model and produces reproducible
clean, fault, and cold-restart evidence.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: strict Claude launcher, ephemeral configuration
  generator, capability inventory, stream transcript normalizer, live fixture
  driver, and bypass controls.
- New uncertainty reduced: whether Claude Code can use the common bridge
  without silently retaining a second model-controlled mutation route.
- Validation: pinned CLI receipt, real headless clean/fault sessions,
  built-in-tool absence, strict MCP inventory, blocked scope, false-green
  refusal, cold restart, accumulated gate, and non-Claude outside review.
- Consecutive metadata/decision slice check: `pass`; S7 delivered a real
  transport, and S8 delivers a live external-agent boundary.
- Status-report alternative: insufficient because only a real Claude session
  reveals its resolved tool surface and event behavior.

## Productivity mix

- Runtime behavior: 45%
- Contract/test code: 40%
- Metadata/docs: 15%

## Slice queue

This queue is materialized from the authorized Developer Preview Macro Delta
and creates no independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S6 | Installable developer surface | Package SCOPA behind one safe CLI | Clean repository installs the tarball and runs core commands | Pack/install harness, CLI contracts, overwrite refusal, accumulated gate | `completed` |
| S7 | Model-neutral adapter bridge | Give supported agents one trusted mutation boundary | Fake agent reaches allowed, denied, and stop states only through the bridge | Hostile tool calls, bypass attempts, transcript and matrix checks | `completed` |
| S8 | Claude Code headless integration | Exercise the bridge with Claude through strict tool configuration | Claude is blocked out of scope and refused false-green while an allowed task completes | Headless clean/fault runs, cold resume, outside review | `active` |
| S9 | Codex headless integration and parity | Exercise the same contract with Codex and compare outcomes | Codex satisfies the Claude behavior contract or reports a parity gap | Headless clean/fault runs, parity report, outside review | `queued` |
| S10 | Developer-preview release candidate | Prove adoption outside the build repository | Unfamiliar consumer installs, runs, and independently verifies the candidate | Consumer quickstart, policy audit, hosted gate, independent review | `queued` |

## Files in play

- `packages/integrations/claude/**`
- `fixtures/S8/**`
- `package.json`
- `package-lock.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S8/**`
- `runs/S8/**`
- `evidence/S8/**`

## Validation speed option

- Fast deterministic command: `npm run test:s8`
- Live command: `npm run probe:s8:live`
- Upstream policy: consume the packaged S7 bridge and its committed schema
  fixtures; do not duplicate the fake-agent implementation.
- Live-model policy: run only in a fresh temporary fixture repository, cap
  turns and budget, and retain raw stream JSON plus exact CLI/config receipts.
- Broad-suite policy: `npm test` retains all S0-S7 tests and fault probes.

## Non-goals

- No `--dangerously-skip-permissions`,
  `--allow-dangerously-skip-permissions`, built-in mutation tool, Chrome, IDE,
  plugin, hook, skill, project MCP, user MCP, or unbounded additional
  directory.
- No reliance on Claude prompt obedience for scope or completion enforcement.
- No mutation of the SCOPA source checkout by a live model.
- No provider-attested identity or immutable-model-snapshot claim; record the
  requested model and observed CLI events honestly.
- No full-assurance claim while provider network, admin policy, or another
  native route remains active and uncontrolled.
- No Codex adapter implementation in S8; Codex may perform read-only outside
  review.
- No change to S0-S7 semantics or the frozen effect taxonomy.
- No npm publication, public repository, public release, or production
  installation.
- No queue entries outside the authorized Developer Preview Macro Delta.

## Evidence

This arc slice requires all three evidence surfaces:

- `notes/S8/` — Claude flag, settings, MCP, identity, resume, and assurance
  decisions.
- `runs/S8/` — deterministic tests, exact CLI receipt, clean/fault/cold live
  commands, accumulated gate, protocol check, and non-Claude outside review.
- `evidence/S8/` — generated MCP/settings inputs, raw Claude stream JSON,
  normalized behavior result, SCOPA transcript, capability matrix, cold
  restart proof, and reviewer verdict.

## Acceptance

- `npm run test:s8`
- `npm run probe:s8:live`
- `npm test`
- `npm run protocol:check`
- The launcher records the exact Claude Code version and rejects an
  unreviewed version drift.
- Headless launch uses print mode, structured stream output, bounded turns and
  budget, strict explicit MCP configuration, no Chrome/IDE, no session
  persistence, no dangerous permission bypass, and no built-in model tools.
- The observed Claude initialization inventory contains the six intended
  `mcp__scopa__*` tools and no built-in mutation, shell, patch, notebook,
  browser, plugin, or unapproved MCP tool.
- A clean live session reads the fixture, writes one allowed file only through
  `scopa_write_file`, calls the real stop gate, and returns a valid SCOPA
  transcript.
- A fault session attempts an out-of-scope write, receives
  `SCOPA_SCOPE_DENIED`, and does not create the target.
- A failing gate remains `canStop: false` and Claude's final result does not
  convert it into completed evidence.
- A fresh second Claude/bridge process in the same fixture reorients from
  persisted SCOPA state without relying on prior process memory.
- Raw stream normalization fails on unknown security events, missing tool
  results, altered call ordering, or a claimed success inconsistent with the
  SCOPA terminal state.
- The Claude capability matrix covers built-ins, MCP sources, settings,
  hooks, plugins, skills, subprocesses, network, session persistence, Chrome,
  IDE, and admin policy; known uncontrolled routes force `partial`.
- A non-Claude outside reviewer reproduces the deterministic gates, inspects
  live evidence and non-claims, and issues an explicit accept/hold verdict.
- S0-S7 release gates remain green.
