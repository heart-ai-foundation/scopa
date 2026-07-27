# SCOPA

SCOPA is an open enforcement runtime for bounded, verifiable autonomous coding
work. It mechanically enforces Next-Prompt Protocol v2.4 across three
boundaries:

- **Scope:** what may the agent change?
- **Completion:** what must be proven before work may stop?
- **Continuity:** what verified state may survive rotation or compaction?

Next-Prompt Protocol remains the canonical protocol. SCOPA is its executable
reference implementation.

## Status

SCOPA is pre-release Foundation work. S0 Conformance Harness, S1 Sealed Core,
and S2 Enforcement Loop are complete. S3 Legibility is active under the
canonical Macro Delta. The package is private and no publication is permitted
before S3 closes v0.1.

Start with:

1. `next-prompt-protocols/.slice-lock.json`
2. `next-prompt-protocols/manifest.json`
3. `next-prompt-protocols/macro-deltas/2026-07-26-scopa-kernel-build.md`
4. `next-prompt-protocols/role-context.md`
5. `next-prompt-protocols/active/2026-07-26-S3-legibility.md`

## Sealed core

S1 provides:

- the frozen ten-category effect ABI;
- a pure synchronous generator loop separated from the impure shell;
- a strict integer-only dCBOR application subset using RFC 8949 deterministic
  ordering, NFC text, duplicate-key rejection, and canonical decode checks;
- SHA-256 hash-chained records with schema, kernel, script, run, and scope pins;
- append-only memory and single-writer file adapters;
- content-addressed external blob storage;
- atomic filesystem ACT reservations that prevent competing processes from
  claiming the same key, sealed recovery receipts that bridge completion to
  journal append, and suppression across later runs; and
- SES Compartments with ambient time, entropy, network, process, console, and
  non-portable numeric authority removed.

Suffix truncation is detected against an external chain commitment. Until S4
adds signing and anchoring, that commitment is integrity input—not an
independently authenticated statement.

The file journal adapter is intentionally single-writer in S1. ACT key claims
are cross-process atomic, but general multi-writer journal serialization is not
yet provided. If a process dies after an ACT
returns but before its sealed recovery receipt is durable, the pending claim
fails closed for operator reconciliation rather than risking a duplicate ACT.

## Enforcement loop

S2 provides:

- a hashed, closed-schema slice lock;
- a reference agent-host process that owns its mutation implementation;
- serialized canonical path enforcement, followed by topology revalidation,
  before registered mutation tools execute;
- symlink, hard-link, repository-escape, topology-change, and undeclared-path
  denial;
- correction-bearing denial payloads;
- gate-definition amendment only through a bound DECISION verified by a
  trusted principal adapter;
- real argv-based verification gates with sanitized environments, bounded
  output, timeouts, and repository-contained working directories;
- machine-checkable stop state and false-green completion refusal;
- one compact orientation response; and
- atomically persisted, hash-verified cold-resume state.

The trusted host must make the enforced dispatcher its exclusive mutation path
and classify every registered tool as `OBSERVE` or `MUTATE`. The included
reference host does this with a fixed tool registry and a separate process
boundary. This is a tool-boundary runtime, not an operating-system sandbox.
Integrations that expose an unguarded mutation channel are non-conforming.

The local threat model assumes no separately privileged process concurrently
rewrites repository topology after SCOPA's final revalidation. Agent-originated
mutation calls are serialized. Deployments with mutually untrusted local
processes require OS isolation or an inode-pinned mutation adapter; SCOPA does
not imply TOCTOU resistance outside that boundary. Codex hooks are useful
defense in depth but are not, by themselves, a conforming enforcement host.

Run the gates:

```sh
npm test
npm run test:s1
npm run test:s2
npm run test:cross-runtime
npm run test:lockdown
npm run probe:s2
npm run protocol:check
```

The cross-runtime gate uses pinned Node and Deno runtimes. Two processes from
the same runtime do not satisfy it.

## Publisher

Heart AI Foundation publishes the specification and reference implementation.
The public kernel remains entity-neutral; Heart-specific semantics compose
above it through profiles.

## Canon

- `spec/SCOPA_Kernel_Specification_v0_1.md`
- `spec/SCOPA_Canon_Amendment_Note_v1_1.md`

## Build governance

The repository uses Next-Prompt Protocol v2.4. The SCOPA Macro Delta is the sole
queue authority for S0-S5. Discovered work must fit the active slice, be
deferred, or be ratified through an explicit Macro Delta amendment.
