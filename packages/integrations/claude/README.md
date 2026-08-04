# SCOPA Claude Code integration

The root package exports `@heart-ai-foundation/scopa/claude`, a headless Claude
Code launcher and strict stream normalizer for the shared `scopa-mcp` bridge.

Use this integration when SCOPA should start the reviewed Claude profile,
enforce finite execution limits, normalize its event stream, and bind the
result to the real SCOPA stop state. If another host already owns Claude's
lifecycle, connect it to `scopa-mcp` directly and publish an accurate
capability matrix instead.

## Reviewed profile

The current profile:

- pins Claude Code `2.1.220`;
- waits for the explicit MCP server before sending input;
- accepts only the six `mcp__scopa__*` tools;
- disables ordinary settings, skills, slash commands, Chrome, IDE activation,
  and resumable conversation content;
- limits a run to 12 turns, USD 0.20, 120 seconds, and 20 MiB of capture; and
- never uses a dangerous permission bypass.

Client or tool-inventory drift fails closed. Reviewed initialization events may
name built-in agent definitions, but the callable inventory contains no
`Agent` or `Task` route.

## API

```js
import {
  createClaudeCapabilityMatrix,
  createClaudeLivePolicy,
  createClaudeSession,
  runClaudeSession,
} from '@heart-ai-foundation/scopa/claude';

const prompt = 'Make the bounded change and stop only when scopa_check passes.';

const result = await runClaudeSession({
  repoRoot,
  adapterCli,
  prompt,
  installedArtifact,
  livePolicy: createClaudeLivePolicy(),
  scenario: { id: 'example', version: '1' },
  session: createClaudeSession({
    sessionId: 'example',
    request: prompt,
  }),
  capabilityMatrix: createClaudeCapabilityMatrix({}),
});

if (!result.terminal.canStop) {
  throw new Error(`SCOPA did not authorize completion: ${result.terminal.kind}`);
}
```

Requirements:

- `repoRoot` is an initialized SCOPA repository;
- `adapterCli` resolves to the installed `scopa-mcp` entry point;
- `installedArtifact` is a validated
  `scopa.installed-artifact-identity.v1` containing source commit, package
  name/version, tarball SHA-256, and npm integrity; and
- the capability matrix describes the actual launcher surface.

## Terminal contract

Every run returns a terminal envelope. Timeout, capture exhaustion, abnormal
exit, signal, client drift, inventory drift, normalization failure, usage
failure, and incomplete cleanup are terminal outcomes rather than ambiguous
exceptions.

The supervisor owns a dedicated POSIX process group, applies bounded
`SIGTERM`/`SIGKILL` escalation, and verifies that descendants are gone. A zero
client exit cannot produce `canStop: true` until the normalizer binds the real
SCOPA stop state.

Receipts retain digests of input, profile, matrix, arguments, artifact, and
sanitized environment policy. They do not retain raw prompts, argument values,
environment values, repository roots, or provider output.

## Assurance boundary

Claude assurance is `partial`. Provider network, managed policy, auto-memory
discovery, and bounded client-owned metadata writes remain outside SCOPA.
`--no-session-persistence` suppresses resumable conversation content but is not
a promise that every Claude-owned store is untouched.

The observed model string is launcher evidence, not provider-signed provenance.
SCOPA is a tool-boundary runtime, not an OS sandbox.

## Provider-backed qualification

Provider calls are never made by default tests or CI. Historical campaign
fixtures and approvals are retained evidence, not reusable authority. A new
live qualification must independently bind the exact client, account boundary,
model request, tool inventory, time/turn/cost limits, evidence custody,
retention, and cleanup policy.

See [Integration guide](../../../docs/INTEGRATIONS.md),
[Threat model](../../../docs/THREAT_MODEL.md), and
[Claims](../../../docs/CLAIMS.md).
