# SCOPA Codex integration

The root package exports `@heart-ai-foundation/scopa/codex`, a headless Codex
launcher, JSONL normalizer, and Claude/Codex behavior-parity verifier for the
shared `scopa-mcp` bridge.

The reviewed profile pins Codex CLI `0.146.0` and model request `gpt-5.4`. It
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

When usage ceilings are supplied, the runtime also fails closed with
`usage-limit` if input, output, reasoning, or combined reported usage exceeds
the bound. Cached input is retained as separate provider telemetry and is not
double-counted when `input_tokens` already includes it.

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
and the profile-declared `codex-mcp-client@0.146.0` identity is not
provider-signed provenance.

## S16 production-live hardening

The installed integration exports `createCodexLivePolicy`,
`validateCodexLivePolicy`, `assertCodexProviderAuthorized`,
`codexPolicyUsageLimits`, and `createCodexAllowedEnvironment`. The policy
binds the exact client/model/MCP/native surface, four approved scenarios,
per-run and aggregate usage bounds, evidence custody, cleanup requirements,
and stop conditions.

The S16 attempt used a `providerGate: "authorized"` policy under the exact
2026-07-29 conversation approval. After the pre-provider stop, the committed
policy returned to `closed-pending-explicit-approval`. The authorization helper
accepts only an exact digest-bound approval date, principal approval,
private-destination approval, four scenarios, and aggregate allowance.

The first production attempt stopped during the local version probe before
provider launch because the installed client had advanced to `0.146.0` while
the candidate still pinned `0.145.0`. The hardened result now distinguishes a
reserved intent from a provider launch and preserves the exact pre-provider
terminal state. That stopped attempt does not authorize a replay.

The fresh S16-v2 posture is a separate authorization with policy ID
`S16-v2-production-live-v1`, the second S16 scenario revision, policy digest
`c159b0f24c78e3625fa385eb8f9c13c5375d7d130ca19deeae1ea555eb313d95`,
and evidence alias `SCOPA_PRIVATE_EVIDENCE_ROOT/S16R2`. It retains the same
four scenarios and resource ceilings and stops on the first failure. Its
execution stopped after one correct clean result because the isolated client
store exceeded the custody audit bound. Three calls were not launched, the
result is non-qualifying, and the v2 gate is closed against replay.

The stopped S16-v3 continuation used policy ID
`S16-v3-production-live-v1`, the third S16 scenario revision, and evidence
alias `SCOPA_PRIVATE_EVIDENCE_ROOT/S16R3`. It contains only denied,
false-green, and cold-restart. Denied completed correctly, but qualification
stopped at the former 64-entry client-store audit bound. One call was consumed,
two were not launched, and replay is prohibited.

The closed S16-v4 continuation uses policy ID
`S16-v4-production-live-v1`, the fourth S16 scenario revision, and evidence
alias `SCOPA_PRIVATE_EVIDENCE_ROOT/S16R4`. It contains only false-green and
cold-restart, permits at most two one-turn calls if separately approved, and
reduces aggregate ceilings to 240,000 input, 8,000 output, and 252,000 total
tokens. Its current gate authorizes zero provider calls.

From a SCOPA source checkout with development scripts installed, the
provider-free installed-artifact probe is:

```sh
npm run probe:s16:deterministic -- \
  --output /trusted/public/s16-deterministic-result.json
```

In a source checkout it invokes only the dedicated deterministic S16 fault
client, never `codex`. The 21-scenario corpus covers clean, denied,
false-green, restart/repeat, version, MCP, model, client-schema, native-route,
tool and output-schema drift, provider refusal/rate pressure, timeout with
ignored termination, early EOF,
malformed JSONL, usage/capture limits, and orphan cleanup. The fault process
receives only an explicit synthetic environment allowlist.

The separately opt-in production command is:

```sh
npm run probe:s16:live -- \
  --policy "$COMMITTED_APPROVED_S16_POLICY_FILE" \
  --private-root /trusted/private/s16
```

It requires a clean committed candidate and an exact committed approved
policy; the original S16 fixture is closed and will refuse provider execution.
For an approved source-checkout campaign, substitute its exact fixture path for
the policy placeholder. The runner routes each supported policy to a distinct
public namespace, copies the current Codex session credential into an isolated
temporary home, verifies login without printing identity, runs at most one
fresh Codex process per approved scenario, audits client-store residue after
each call, enforces per-run and aggregate token ceilings, publishes only
privacy-clean derivatives, and removes the isolated home and repositories.
Client-store traversal is streaming and fails closed above 4,096 entries.
Files through 2 MiB are content-hashed; larger files are metadata-audited,
ambiguous oversized baselines are rejected before provider traffic, and any
unexpected post-run store change rejects qualification.
