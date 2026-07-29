# SCOPA Claude Code integration

The root package exports `@heart-ai-foundation/scopa/claude`, a headless
Claude Code launcher and strict stream normalizer for the shared `scopa-mcp`
bridge.

The reviewed profile pins Claude Code `2.1.220`, delays its streaming user
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
  createClaudeLivePolicy,
  createClaudeSession,
  runClaudeSession,
} from '@heart-ai-foundation/scopa/claude';

const livePolicy = createClaudeLivePolicy();
const result = await runClaudeSession({
  repoRoot,
  adapterCli,
  prompt,
  installedArtifact,
  livePolicy,
  scenario: {
    id: 'example',
    version: '1',
  },
  session: createClaudeSession({
    sessionId: 'example',
    request: prompt,
  }),
  capabilityMatrix: createClaudeCapabilityMatrix({}),
});
```

`adapterCli` must resolve to the installed `scopa-mcp` adapter CLI. The target
repository must already contain initialized SCOPA control state.
`installedArtifact` must be an exact
`scopa.installed-artifact-identity.v1` value containing the source commit,
package name/version, tarball SHA-256, and npm SHA-512 integrity.

Every launcher outcome returns `result.terminal` rather than representing
timeout, output exhaustion, abnormal exit, version drift, or normalization
failure only as an exception. The shared live-run supervisor bounds combined
capture at 20 MiB, owns a dedicated POSIX process group, attempts `SIGTERM`,
escalates to `SIGKILL`, and verifies that the group is gone. A zero process
exit still has `canStop: false` until the Claude normalizer binds the real
SCOPA terminal state.

The receipt stores digests of arguments, input, profile, capability matrix,
and sanitized environment policy. It does not store prompt text, argument
values, raw environment values, repository/control roots, or provider output.

The normalizer fails closed on a changed CLI/model/tool inventory, unknown
security event, unknown tool, incomplete result, wire/transcript mismatch, or
final status inconsistent with the real SCOPA stop state. Claude's final text
has no enforcement authority.

## Assurance boundary

The reviewed Claude profile is deliberately `partial`, not `full`. Provider
network traffic, managed policy, auto-memory discovery, and Claude's bounded
session-title metadata write remain outside SCOPA. In particular,
`--no-session-persistence` suppresses resumable conversation content, but
reviewed clients may still write a small `ai-title` JSONL record in the user
project store. The S15 campaign classifies and removes only its exact
run-specific project directories.

Model identity remains launcher-declared and the observed model string is a
CLI event, not provider-signed provenance. SCOPA is a tool-boundary runtime,
not an operating-system sandbox.

## S15 remedial campaign

The production remedial runner is a repository-maintainer qualification tool,
not a default package or CI action. In a source checkout, it accepts only the
committed S15R2 policy, requires a clean committed candidate, and permits
exactly two provider invocations with a USD 0.40 aggregate ceiling: direct
scope denial followed by a fresh-process read from the same disposable
repository.

```sh
npm run probe:s15:remedial-live -- \
  --policy <committed-s15r2-policy> \
  --private-root /path/outside/the/repository
```

The runner has no resume option. Any pre-existing invocation intent, recovery
journal, private result, public result, or campaign result causes refusal
before the corresponding provider request. A failure stops the campaign; a
third request requires a new policy and new principal authority.
