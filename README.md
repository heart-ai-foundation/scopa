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
S2 Enforcement Loop, S3 Legibility, and S4 Signing and Anchoring are complete.
S5 Interop Export remains deferred under the canonical Macro Delta until an
external CASE consumer is identified. The package remains private; publication
requires a separate principal request.

Start with:

1. `next-prompt-protocols/.slice-lock.json`
2. `next-prompt-protocols/manifest.json`
3. `next-prompt-protocols/macro-deltas/2026-07-26-scopa-kernel-build.md`
4. `next-prompt-protocols/role-context.md`
5. `next-prompt-protocols/active/2026-07-26-S4-signing-and-anchoring.md`

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

Suffix truncation is detected against an external chain commitment. S4 can
bind that commitment into a portable signed packet with an optional
authority-backed timestamp.

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

## Legibility

S3 completes the v0.1 runtime with:

- post-tool observe mode that never gates tool execution;
- a profile-bound coding-agent observation journal;
- deterministic boundary maps derived from verified journal chains;
- declared-versus-observed findings;
- per-operation coverage that says `not-observed`, never `not-present`;
- capture-gap reporting for schema, duplicate-ID, and journal failures; and
- an integer boundary-event completeness score tied to a host-owned attempted
  event counter.

The score describes only captured boundary-event completeness. It is not a
forensic reconstruction score, and the host counter is explicitly reported as
host-supplied. S4 can sign the resulting journal commitment but does not turn
an unauthenticated host counter into provider or hardware evidence.

## Signing and anchoring

S4 adds:

- Ed25519 signatures over a versioned dCBOR commitment-and-INFER-pin payload;
- closed software, platform-keystore, and hardware-backed key classes;
- required external attestation verification for stronger-than-software
  claims;
- nonce-bearing RFC 3161 requests over the complete signature envelope;
- HTTPS timestamp transport and OpenSSL verification against roots supplied by
  the relying party;
- explicit timestamp-required verification policy to prevent silent
  downgrade;
- retained, hash-bound INFER responses for provider-free replay; and
- a standalone fresh-process packet verifier.

The acceptance evidence includes both an ephemeral local test TSA and a real
FreeTSA receipt whose actual CMS signer-certificate fingerprint is pinned by
the relying party. Every INFER pin is referenced by a sealed journal record. A
software key proves possession only. The real Codex model ID is labeled a
requested alias, not an immutable snapshot; a content-addressed deterministic
fixture exercises the immutable-snapshot pin. Neither is provider-signed
provenance.

Run the gates:

```sh
npm test
npm run test:s1
npm run test:s2
npm run test:s3
npm run test:s4
npm run test:cross-runtime
npm run test:lockdown
npm run probe:s2
npm run probe:s3
npm run probe:s4
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
