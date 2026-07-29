# SCOPA Codex integration

The root package exports `@heart-ai-foundation/scopa/codex`, a headless Codex
launcher, JSONL normalizer, and Claude/Codex behavior-parity verifier for the
shared `scopa-mcp` bridge.

The reviewed profile pins Codex CLI `0.145.0` and model request `gpt-5.4`. It
uses `codex exec` with strict configuration, ignored user config and exec
rules, ephemeral session handling, a read-only native sandbox, disabled web
search, a fixed output schema, and 28 explicit feature disables. The MCP map
is reset, plugin/app sources are disabled, and a preflight inventory must
contain exactly one required `scopa` stdio server with the six SCOPA tools.

SCOPA marks writes destructive. Codex therefore requires an explicit
per-tool `approve` policy for `scopa_write_file` in unattended mode. That
preapproval applies only to the trusted SCOPA MCP tool; it does not enable a
native write, shell, patch, plugin, hook, browser, web, app, skill, or agent
route. The write remains subject to SCOPA's dispatcher and scope lock.

```js
import {
  createCodexCapabilityMatrix,
  createCodexSession,
  runCodexSession,
} from '@heart-ai-foundation/scopa/codex';

const result = await runCodexSession({
  repoRoot,
  adapterCli,
  prompt,
  installedArtifact,
  scenario: {
    id: 'example',
    version: '1',
  },
  session: createCodexSession({
    sessionId: 'example',
    request: prompt,
  }),
  capabilityMatrix: createCodexCapabilityMatrix({}),
});
```

`adapterCli` must resolve to the installed `scopa-mcp` adapter CLI. The target
repository must already contain initialized SCOPA control state.
`installedArtifact` must be an exact
`scopa.installed-artifact-identity.v1` value containing the source commit,
package name/version, tarball SHA-256, and npm SHA-512 integrity.

Version, inventory, execution, and normalization all use the shared live-run
custody contract. Every outcome returns `result.terminal`; timeout, output
exhaustion, abnormal exit, signal, spawn failure, version drift, inventory
drift, normalization failure, and incomplete cleanup cannot issue a
completion state. The supervisor owns a dedicated POSIX process group,
performs bounded `SIGTERM`/`SIGKILL` cleanup, and retains at most 20 MiB of
combined output.

The receipt binds the exact artifact, requested model, profile, inventory,
capability matrix, scenario, limits, and sanitized environment policy through
safe values or digests. It contains no raw argument, prompt, environment,
repository/control path, or provider-output value.

The normalizer accepts only the observed thread/turn lifecycle, one exact
skill-budget warning when present, reasoning telemetry, the final schema-bound
agent message, and paired calls to the six `scopa` MCP tools. It rejects native
command execution, file changes, web activity, hidden MCP servers, unknown
errors, missing results, wire/transcript disagreement, and a final status that
conflicts with SCOPA's terminal state.

The installed `compareAgentProofs` export compares the four shared
Claude/Codex outcomes while retaining provider-specific capability gaps. From
a SCOPA source checkout with contributor scripts installed,
`npm run verify:s9:parity` runs the corresponding retained evidence command.

## Assurance boundary

The reviewed Codex profile is deliberately `partial`, not `full`. Provider
network traffic, admin-managed requirements, skill and instruction discovery,
CLI authentication/cache/log metadata, and the native filesystem boundary
remain outside SCOPA. The native sandbox is read-only, and native file-change
events are rejected from accepted proof, but the operating-system sandbox is
a separate enforcement layer and is not represented as SCOPA mediation.

`--ephemeral` suppresses rollout persistence; it does not promise that every
CLI-owned metadata store is untouched. Model identity is launcher-declared,
and the observed `codex-mcp-client@0.145.0` handshake is not provider-signed
provenance.
