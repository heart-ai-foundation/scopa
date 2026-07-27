# SCOPA Claude Code integration

The root package exports `@heart-ai-foundation/scopa/claude`, a headless
Claude Code launcher and strict stream normalizer for the shared `scopa-mcp`
bridge.

The reviewed profile pins Claude Code `2.1.170`, delays its streaming user
input until the explicit MCP server can initialize, and accepts only the six
`mcp__scopa__*` tools. It disables ordinary setting sources, skills and slash
commands, Chrome, IDE activation, and resumable session content; caps the run
at 12 turns, USD 0.20, 120 seconds, and 20 MiB of captured output; and never
uses a dangerous permission bypass.

Claude's init event also names five built-in agent definitions. Their exact
inventory is pinned as drift-sensitive evidence, while the model-callable
inventory contains neither `Agent` nor `Task`; those definitions therefore
have no execution route in this profile.

```js
import {
  createClaudeCapabilityMatrix,
  createClaudeSession,
  runClaudeSession,
} from '@heart-ai-foundation/scopa/claude';

const result = await runClaudeSession({
  repoRoot,
  adapterCli,
  prompt,
  session: createClaudeSession({
    sessionId: 'example',
    request: prompt,
  }),
  capabilityMatrix: createClaudeCapabilityMatrix({}),
});
```

`adapterCli` must resolve to the installed `scopa-mcp` adapter CLI. The target
repository must already contain initialized SCOPA control state.

The normalizer fails closed on a changed CLI/model/tool inventory, unknown
security event, unknown tool, incomplete result, wire/transcript mismatch, or
final status inconsistent with the real SCOPA stop state. Claude's final text
has no enforcement authority.

## Assurance boundary

The reviewed Claude profile is deliberately `partial`, not `full`. Provider
network traffic, managed policy, auto-memory discovery, and Claude 2.1.170's
observed session-title metadata write remain outside SCOPA. In particular,
`--no-session-persistence` suppresses resumable conversation content but did
not suppress a small `ai-title` JSONL record in the user project store during
the live proof.

Model identity remains launcher-declared and the observed model string is a
CLI event, not provider-signed provenance. SCOPA is a tool-boundary runtime,
not an operating-system sandbox.
