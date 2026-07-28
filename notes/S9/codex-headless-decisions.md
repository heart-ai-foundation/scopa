# S9 Codex headless decisions

Date: 2026-07-27

## Pinned surfaces

- Codex CLI is pinned to `0.145.0`; any drift stops before inference.
- The requested model is `gpt-5.4`. Identity remains launcher-declared.
- The observed MCP client handshake is
  `codex-mcp-client@0.145.0` over MCP `2025-06-18`.
- The installed tarball, not the SCOPA source checkout, supplies both the
  integration entry and `scopa-mcp` bridge to live sessions.
- Runs are bounded to 180 seconds and 20 MiB of combined output each.

## Closed per-run profile

The launcher uses `codex exec`, `--strict-config`,
`--ignore-user-config`, `--ignore-rules`, `--ephemeral`,
`--sandbox read-only`, JSONL output, and a fixed final JSON Schema.
`approval_policy="never"` prevents an unattended run from opening native
approval prompts.

The MCP table is reset before adding one required `scopa` stdio server.
Plugins, apps, and remote-plugin surfaces are disabled, so the preflight
`codex mcp list --json` inventory resolves to exactly one server. Its
`enabled_tools` list is the six S7 SCOPA tools.

Codex treats destructive MCP annotations specially. The first clean probe
correctly cancelled `scopa_write_file` because the server default was `auto`
and exec mode could not ask a user. The reviewed profile now sets
`mcp_servers.scopa.tools.scopa_write_file.approval_mode="approve"`.
This is a narrow preauthorization of the trusted dispatcher entry, not a
dangerous sandbox or approval bypass; scope is still decided by SCOPA.

Twenty-eight feature flags disable apps, auth elicitation, browser variants,
code-mode host, computer use, goals, guardian approval, hooks, image
generation, in-app browser, memories, multi-agent variants, network proxy,
personality, plugins, remote/plugin sharing, shell snapshot, shell and unified
exec, skill dependency installation and search, MCP elicitation, tool
suggestion, and workspace dependency discovery. Top-level web search is
`disabled`.

## Evidence binding

Codex JSONL does not expose a Claude-style initialization tool inventory.
S9 therefore binds three independent surfaces:

1. the exact generated MCP profile and feature denylist in the receipt;
2. the preflight one-server inventory;
3. fail-closed JSONL normalization which accepts only paired calls to the six
   SCOPA tools and cross-checks their arguments, results, order, client
   identity, and terminal state against `scopa_transcript`.

The only tolerated error item is Codex 0.145.0's exact initial skill-budget
warning. A reasoning telemetry item is accepted only as the exact closed
`id`, `type`, and text-only shape. Any command-like reasoning field, native
command, file-change, web, app, collaboration, hidden MCP, unknown warning,
incomplete call, changed result, or false terminal claim invalidates the
proof.

## Assurance

Assurance remains `partial`. Provider network, admin policy,
skill/instruction discovery, CLI session/auth/cache/log state, and the native
filesystem boundary are not SCOPA-controlled. The native sandbox is
read-only, shell/process features are disabled, and native item events are
rejected, but an OS sandbox is still a distinct control rather than a SCOPA
effect.

Claude and Codex pass the same four behavior outcomes. Their provider-specific
uncontrolled capability IDs remain separate in the parity report.
