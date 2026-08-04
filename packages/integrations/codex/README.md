# SCOPA Codex integration

The root package exports `@heart-ai-foundation/scopa/codex`, a headless Codex
launcher, JSONL normalizer, and Claude/Codex behavior comparator for the shared
`scopa-mcp` bridge.

## Reviewed profile

The current profile pins Codex CLI `0.146.0` and requested model `gpt-5.4`. It:

- runs `codex exec` with ignored user configuration and exec rules;
- uses ephemeral session handling and a read-only native sandbox;
- disables web search and 28 reviewed native feature surfaces;
- resets the MCP map to one required SCOPA stdio server;
- rejects plugin, app, hidden MCP, native command, file-change, and web routes;
- binds the final response to an exact output schema; and
- requires the six-tool SCOPA inventory before execution.

SCOPA marks governed writes as destructive. Unattended Codex therefore needs a
narrow preapproval for `scopa_write_file`. That approval enables only the
trusted MCP tool; the request still passes through SCOPA's dispatcher and slice
lock. It does not enable native shell, patch, filesystem, web, plugin, hook,
browser, app, skill, or agent mutation.

## API

```js
import {
  createCodexCapabilityMatrix,
  createCodexSession,
  runCodexSession,
} from '@heart-ai-foundation/scopa/codex';

const prompt = 'Make the bounded change and stop only when scopa_check passes.';

const result = await runCodexSession({
  repoRoot,
  adapterCli,
  prompt,
  installedArtifact,
  scenario: { id: 'example', version: '1' },
  session: createCodexSession({
    sessionId: 'example',
    request: prompt,
  }),
  capabilityMatrix: createCodexCapabilityMatrix({}),
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
- the capability matrix describes the actual Codex surface.

## Terminal and usage contract

Version, inventory, execution, normalization, capture, and cleanup use the
shared live-run custody layer. Every outcome returns `result.terminal`.
Timeout, output exhaustion, abnormal exit, signal, spawn failure, drift,
normalization failure, and incomplete cleanup cannot issue a completion state.

Optional usage ceilings fail closed when provider-reported input, output,
reasoning, or total usage exceeds a bound. Cached input remains separate
telemetry and is not double-counted when the provider's input total already
includes it.

Receipts bind the exact artifact, requested model, profile, inventory, matrix,
scenario, limits, and sanitized environment policy. They contain no raw
prompt, argument, environment, repository path, or provider-output value.

The normalizer accepts only the reviewed lifecycle, paired SCOPA tool calls,
bounded reasoning telemetry, and final schema-bound message. It rejects native
execution, file changes, web activity, unknown tools or errors, missing
results, transcript disagreement, and final status inconsistent with SCOPA.

## Assurance boundary

Codex assurance is `partial`. Provider network, managed requirements,
instruction and skill discovery, authentication/cache/log metadata, and the
native filesystem boundary remain outside SCOPA. The read-only native sandbox
is a separate control; it is not represented as SCOPA mediation.

`--ephemeral` suppresses rollout persistence but does not promise every
client-owned store is untouched. The requested model and client identity are
launcher evidence, not provider-signed provenance.

## Behavior comparison

`compareAgentProofs` compares shared Claude/Codex outcomes while retaining
provider-specific capability gaps. It never transfers assurance. Attaching a
Claude matrix to Codex, or the reverse, is a parity failure.

## Provider-backed qualification

Default tests use deterministic fault clients and never launch Codex. Historical
campaign policies are retained evidence, not reusable authority. A new live
qualification must independently bind the client, account boundary, model,
MCP/native inventory, usage limits, environment allowlist, evidence custody,
client-store audit, retention, and cleanup posture.

See [Integration guide](../../../docs/INTEGRATIONS.md),
[Threat model](../../../docs/THREAT_MODEL.md), and
[Claims](../../../docs/CLAIMS.md).
