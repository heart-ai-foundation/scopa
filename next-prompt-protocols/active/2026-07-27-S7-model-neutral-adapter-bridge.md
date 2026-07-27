# S7 — Model-Neutral Adapter Bridge

**Class:** `arc`
**Module:** `adapter-host`
**Crosses:** [`enforcement`, `agent-surface`, `conformance`]
**Advances contracts:** [`AH1`, `AH2`, `AH3`]
**Compound:** false

## Why this exists

The installed CLI proves a consumer boundary, but supported coding agents
still need one shared transport into SCOPA's trusted host. If each provider
owns different policy or mutation logic, successful demos cannot establish a
common enforcement contract or honest parity.

## Next objective

Expose the trusted SCOPA host through a model-neutral bridge suitable for
headless coding agents. Prove with a deterministic fake agent that reads,
allowed mutations, denied mutations, and stop-state checks cross only the
bridge, while every request, agent/CLI identity, tool outcome, effect, and
terminal state is captured in a closed structured transcript.

## Descriptor rung check

Executable unlock: an agent-neutral process transport exposes a finite tool
inventory backed by the existing SCOPA dispatcher and completion evaluator,
with a machine-readable assurance matrix describing every known native
capability and bypass.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: bridge transport, closed tool schemas, transcript
  collector, launcher contract, assurance schema, and fake-agent driver.
- New uncertainty reduced: whether Claude and Codex can share one trusted
  mutation and completion contract without provider-specific security logic.
- Validation: protocol-level clean/fault exchanges, hostile tool calls, direct
  bypass attempts, transcript completeness, capability-matrix negative
  controls, and the accumulated release gate.
- Consecutive metadata/decision slice check: `pass`; S6 delivered an installed
  runtime boundary, and S7 delivers an executable agent transport.
- Status-report alternative: insufficient because only adversarial calls over
  the real bridge can reveal transport-created authority.

## Productivity mix

- Runtime behavior: 55%
- Contract/test code: 35%
- Metadata/docs: 10%

## Slice queue

This queue is materialized from the authorized Developer Preview Macro Delta
and creates no independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S6 | Installable developer surface | Package SCOPA behind one safe CLI | Clean repository installs the tarball and runs core commands | Pack/install harness, CLI contracts, overwrite refusal, accumulated gate | `completed` |
| S7 | Model-neutral adapter bridge | Give supported agents one trusted mutation boundary | Fake agent reaches allowed, denied, and stop states only through the bridge | Hostile tool calls, bypass attempts, transcript and matrix checks | `active` |
| S8 | Claude Code headless integration | Exercise the bridge with Claude through strict tool configuration | Claude is blocked out of scope and refused false-green while an allowed task completes | Headless clean/fault runs, cold resume, outside review | `queued` |
| S9 | Codex headless integration and parity | Exercise the same contract with Codex and compare outcomes | Codex satisfies the Claude behavior contract or reports a parity gap | Headless clean/fault runs, parity report, outside review | `queued` |
| S10 | Developer-preview release candidate | Prove adoption outside the build repository | Unfamiliar consumer installs, runs, and independently verifies the candidate | Consumer quickstart, policy audit, hosted gate, independent review | `queued` |

## Files in play

- `packages/adapter-host/**`
- `packages/conformance/**` only to register the S7 suite in the accumulated
  release gate
- `fixtures/S7/**`
- `package.json`
- `package-lock.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S7/**`
- `runs/S7/**`
- `evidence/S7/**`

## Validation speed option

- Fast slice-local command: `npm run test:s7`
- Live bridge command: start the packaged stdio bridge in a temporary
  repository and drive its advertised protocol from the deterministic fake
  agent.
- Upstream fixture policy: consume the S2 dispatcher, completion evaluator,
  and orientation APIs without duplicating their historical tests.
- Broad-suite policy: `npm test` retains all S0-S6 tests and fault probes.

## Non-goals

- No real Claude Code or Codex invocation in S7.
- No provider-specific policy, prompt-obedience guard, or model-based
  authorization decision.
- No native shell, patch, filesystem, subprocess, plugin, or network mutation
  capability exposed outside the SCOPA dispatcher.
- No change to the frozen effect taxonomy, journal encoding, enforcement
  semantics, signed packet, CASE mapping, or S6 CLI contract.
- No claim that a later provider adapter has full assurance unless its native
  capabilities are closed or explicitly labeled.
- No npm publication, public repository, public release, or production
  installation.
- No final license, contribution, naming, or trademark decision.
- No queue entries outside the authorized Developer Preview Macro Delta.

## Evidence

This arc slice requires all three evidence surfaces:

- `notes/S7/` — bridge boundary, transport, transcript, and assurance-schema
  decisions.
- `runs/S7/` — focused protocol exchanges, hostile calls, bypass attempts,
  accumulated release gate, and protocol check.
- `evidence/S7/` — tool inventory, canonical structured transcript,
  capability/bypass matrix, and fake-agent outcome report.

## Acceptance

- `npm run test:s7`
- `npm test`
- `npm run protocol:check`
- The bridge exposes a finite, schema-validated tool inventory whose mutation
  handlers reach only the trusted SCOPA dispatcher.
- A deterministic fake agent can read orientation, request one allowed
  mutation, receive a correction-bearing denial for one blocked mutation, and
  observe both passing and blocked stop states solely through the bridge.
- Unknown tools, malformed arguments, duplicate request identifiers, and
  unsupported protocol methods fail closed without mutation.
- Direct mutation bypass attempts either fail or are represented as an
  explicit uncontrolled capability that prevents a full-assurance claim.
- One closed transcript records the request, declared model and CLI identity,
  ordered tool calls and results, effects, denials, and terminal stop state.
- Transcript validation rejects missing, reordered, duplicated, or unknown
  security-relevant fields.
- A machine-readable capability/bypass matrix covers every advertised and
  known native capability and computes an honest `full` or `partial`
  assurance result.
- The transport does not execute shell strings or create an unjournaled
  mutation path.
- S0-S6 release gates remain green.
