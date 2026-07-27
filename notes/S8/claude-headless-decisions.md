# S8 Claude Code Headless Integration Decisions

Date: 2026-07-27

## Installed integration, shared enforcement

The root package exports `@heart-ai-foundation/scopa/claude` and includes the
Claude integration in the packed artifact. The live driver imports that
installed integration and launches the installed `scopa-mcp` adapter; it does
not use a monorepo-relative launcher or bridge.

The provider adapter adds no mutation policy. Claude receives only the six
SCOPA MCP tools, and `scopa_write_file` still reaches the S2 trusted dispatcher
through the S7 bridge. Claude's prose and final JSON have no scope or
completion authority.

## Startup race and streaming input

Claude Code starts explicit `--mcp-config` servers asynchronously. Sending a
positional prompt immediately produced an init event with no tools and a
pending SCOPA server; Claude then imitated tool calls in prose. The normalizer
rejected that run, so it did not become false evidence.

The reviewed launcher now uses `--input-format stream-json` and holds the first
user message for one second. The resulting init event reports the SCOPA server
connected and exactly six model-callable `mcp__scopa__*` tools before
inference. The delay, 120-second process timeout, 20 MiB capture cap, 12-turn
limit, and USD 0.20 budget are part of every receipt.

## Closed Claude surface

The invocation uses strict explicit MCP configuration, an empty ordinary
setting-source list, no Chrome, no IDE flag, no plugin directory, disabled
skills/slash commands, `dontAsk`, a SCOPA-only tool namespace, and explicit
denial of ordinary mutation, shell, search, task, and agent tools. Dangerous
permission bypass flags are forbidden.

Claude 2.1.170 still reports five built-in agent definitions. They are not
model-callable because `Agent` and `Task` are absent from the tool inventory.
Their exact names are pinned as drift-sensitive evidence, tested negatively,
and represented as a disabled capability. The public proof says
`allModelCallableToolsScopaOnly`; it does not say all built-in definitions are
absent.

## Identity and normalization

The launcher pins Claude Code 2.1.170 and rejects drift. It records requested
model alias `sonnet` and observes `claude-sonnet-4-6` in the init stream.
Neither value is provider-signed provenance.

The normalizer permits only reviewed init, thinking-token, assistant,
tool-result, rate-limit, and terminal events. It binds every operational wire
call, argument, result, error bit, and order to the validated SCOPA transcript.
Claude sometimes wraps final JSON in one Markdown fence despite the system
instruction; that form is accepted only as one isolated object and remains
cross-checked against the transcript's terminal state.

## Partial assurance is intentional

Provider API/network traffic, managed policy, auto-memory discovery, and
session metadata remain outside SCOPA. In particular,
`--no-session-persistence` prevented resumable conversation content but Claude
2.1.170 still wrote a small `ai-title` JSONL record in its user project store.
Those active uncontrolled routes mechanically require `partial` assurance.

This is a tool-boundary integration, not an operating-system sandbox or a
claim that Claude has no ambient provider-side behavior.

## Evidence handling and outside review

The exact 492,401-byte live proof is retained in the private project evidence
home at
`llm-memories/projects/scopa/evidence/S8/claude-live-proof.raw.json`. The
repository publishes the same proof with only environment-specific temporary
and user-store roots replaced. Its publication receipt binds the raw bytes by
SHA-256 and declares that no semantic field changed.

The independent Codex review first issued a HOLD for an unconstrained agent
inventory and premature README rotation claim. Both findings were remediated.
A second restricted-sandbox check verified the changes but could not run four
filesystem/process suites. The final reviewer used a disposable copy with
normal local process permissions, reproduced every gate, and issued
`ACCEPT S8`. Retaining the HOLD history is part of the evidence, not noise to
remove.
