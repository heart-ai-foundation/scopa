# Architecture

SCOPA is a local tool-boundary runtime. It does not attempt to replace the
operating system, container, provider, or developer workstation. Its job is to
make a bounded set of agent effects and completion claims mechanically
reviewable.

## Components

| Component | Responsibility |
| --- | --- |
| Slice lock | Canonicalizes and hashes the developer's scope, gates, and stop condition |
| Effect kernel | Advances a deterministic generator over closed effect categories |
| Trusted host | Owns the registered tool implementations and routes mutations through SCOPA |
| Path boundary | Resolves, authorizes, parent-binds, and revalidates mutation targets |
| Gate runner | Executes bounded argv commands and returns machine stop state |
| Continuity store | Persists hash-bound orientation and rotation state |
| Journal and evidence | Records deterministic effects, commitments, signatures, and optional timestamp anchors |
| MCP adapter | Exposes the trusted host as six local stdio tools |
| Provider launchers | Apply client-specific controls and normalize Claude/Codex event streams |

## Request flow

```text
agent or operator
      |
      v
CLI / MCP adapter ---- capability matrix
      |
      v
trusted host ---- slice lock
      |
      +---- OBSERVE ---- contained read / orientation / check
      |
      +---- MUTATE ---- authorize path ---- revalidate topology ---- write
      |
      v
versioned result + transcript + optional evidence journal
```

Only registered host tools participate in this boundary. If an integration
also exposes an uncontrolled shell, patch primitive, filesystem API, plugin,
or browser, its capability matrix must say so and its assurance becomes
`partial`.

## Scope enforcement

Version 1 path rules are exact files or directory subtrees ending in `/**`.
SCOPA resolves the requested path through its existing ancestor, rejects
repository escape and unexpected topology, binds the authorized parent by
filesystem identity, and revalidates immediately before mutation. Existing
hard-linked files are rejected. Governed writes require a descriptor-backed
directory route through `/proc/self/fd` or `/dev/fd`; hosts without either fail
closed.

The trusted-host assumption matters: SCOPA serializes agent-originated
mutation calls, but a separately privileged local process can still race or
replace resources outside the measured boundary. Use OS isolation when local
processes do not trust one another.

## Completion enforcement

Gates run as argv arrays with no shell, within repository-contained working
directories. The runner limits each output stream, applies the declared
timeout, owns a dedicated POSIX process group, escalates termination from
`SIGTERM` to `SIGKILL`, and verifies descendant disappearance.

The stop evaluator returns a versioned state containing every gate outcome,
failed gate IDs, the slice-lock hash, and `canStop`. Provider text and adapter
final messages cannot change this state.

## Continuity

Continuity is not a conversation transcript. SCOPA retains compact,
hash-verified orientation and rotation records tied to the active lock and
last verified state. Conflicting, transplanted, or malformed control state is
rejected instead of guessed or silently repaired.

## Evidence layers

SCOPA separates evidence depth from adapter assurance:

- deterministic journals establish ordered runtime effects;
- signatures establish possession of a signing key;
- optional RFC 3161 anchors add a relying-party-verified time assertion;
- CASE/UCO exports improve interoperability but do not replace native
  cryptographic verification; and
- live-run receipts bind exact artifacts, policies, limits, and sanitized
  execution outcomes.

Raw provider output and credentials belong in private custody. Public evidence
contains only defined derivatives and bindings. See [Threat model](THREAT_MODEL.md)
and [Claims](CLAIMS.md).

## Integration boundary

`scopa-mcp` contains no independent mutation route. Claude Code and Codex
launchers sit outside it and add provider-specific process, inventory, usage,
and normalization controls. Those clients retain native or provider-managed
surfaces outside SCOPA, so their assurance remains `partial` even when a
bounded run succeeds.
