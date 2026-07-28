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

SCOPA `0.2.0-dev.1` is a private developer-preview candidate. S0-S12 are
complete: conformance, sealed core, enforcement, legibility, signing and
anchoring, CASE/UCO export, local distribution, the model-neutral MCP bridge,
and separately evidenced Claude Code and Codex integrations with
machine-readable behavior parity, source-free consumer qualification, and
proof/distribution hardening. S13 is adversarially requalifying one exact
private candidate. The package and repository remain private; publication
requires a separate principal request.

Start with:

1. `docs/QUICKSTART.md`
2. `packages/cli/README.md`
3. `packages/adapter-host/README.md`
4. `docs/THREAT_MODEL.md`
5. `docs/CLAIMS.md`

## Developer CLI

S6 packages the runtime behind one `scopa` command. During the private
developer preview, build and install a local tarball rather than resolving a
registry package:

```sh
npm pack
npm install --ignore-scripts \
  /path/to/heart-ai-foundation-scopa-0.2.0-dev.1.tgz
```

In a repository with a closed slice definition:

```sh
scopa init --definition scopa.slice-definition.json
scopa status
scopa check
scopa run --request-json \
  '{"name":"write_file","arguments":{"path":"src/example.js","content":"ok"}}'
scopa verify --packet evidence.json
```

Every command except `--help` returns one versioned JSON result. `status`
observes a blocked slice without changing it; `check` exits nonzero when a
real gate fails; and `init` is idempotent but refuses conflicting or aliased
control state. `run` is a raw trusted-host call for local operation, not yet a
model adapter. See `packages/cli/README.md` for its exit-code contract and
timestamp-verification options.

## Model-neutral bridge

The installed package also exposes `scopa-mcp`, a local MCP stdio server with
six closed tools for orientation, contained reads, governed writes, real stop
checks, assurance inspection, and transcript inspection:

```sh
scopa-mcp \
  --repo /path/to/repository \
  --session-file /trusted/session.json \
  --matrix-file /trusted/capability-matrix.json
```

All mutations reach the existing SCOPA dispatcher; the bridge runtime has no
independent filesystem-write, process, network, or plugin primitive. Its
machine-readable matrix downgrades any active uncontrolled capability to
partial assurance. See `packages/adapter-host/README.md` for schemas, protocol
revisions, threat boundaries, and launcher requirements.

## Claude Code integration

The installed package exports `@heart-ai-foundation/scopa/claude`. Its reviewed
profile pins Claude Code 2.1.170, waits for the strict explicit MCP server
before sending streaming input, and exposes exactly the six
`mcp__scopa__*` tools observed in Claude's initialization event. It caps each
run at 12 turns, USD 0.20, 120 seconds, and 20 MiB of captured output.

The live S8 proof covers an allowed write, a correction-bearing denied escape,
a failing completion gate that remains blocked, and a cold restart in a fresh
Claude/bridge process. Assurance is deliberately `partial`: provider network,
managed policy, auto-memory discovery, and a small Claude session-title
metadata write remain uncontrolled. See
`packages/integrations/claude/README.md` for the API and non-claims.

## Codex integration

The installed package also exports `@heart-ai-foundation/scopa/codex`. Its
reviewed profile pins Codex CLI 0.145.0 and `gpt-5.4`, resets the MCP map to
one required SCOPA server, disables 28 native feature surfaces, ignores user
config and exec rules, uses ephemeral JSONL execution with a read-only native
sandbox, and schema-binds the final response.

Codex requires explicit unattended preapproval for the destructive-annotated
`scopa_write_file` tool. That narrow approval does not enable native mutation:
the call still reaches the SCOPA dispatcher and its scope lock. The live S9
proof passes allowed work, denied scope, false-green refusal, and cold restart,
and the machine parity report passes all four outcomes against Claude.

Assurance remains `partial`. Provider network, managed policy,
skill/instruction discovery, CLI-owned metadata, and the native filesystem
boundary remain outside SCOPA. See `packages/integrations/codex/README.md` for
the API, exact controls, and non-claims.

## Developer-preview release candidate

S10 adds the approved Apache-2.0, DCO/no-CLA, private-tarball posture; security,
governance, versioning, threat-model, and claim-boundary documents; published
JSON Schemas; and a source-free consumer probe.

The consumer installs the exact tarball, runs the six-tool model-neutral
adapter, proves an allowed write and an escaping-write denial, obtains the real
terminal state, verifies a retained signed packet with caller-supplied trust,
and confirms that an exit-7 fixture remains blocked:

```sh
npm run audit:s10:policy
npm run probe:s10:consumer -- --output /trusted/private-consumer-proof.json
```

See `docs/QUICKSTART.md`, `docs/THREAT_MODEL.md`, and `docs/CLAIMS.md`. These
surfaces are candidate evidence, not npm publication, production
authorization, formal certification, or full Claude/Codex assurance.

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

## CASE/UCO interoperability

S5 projects a verified S4 evidence packet into a deterministic CASE/UCO 1.4.0
graph:

- each journal record becomes a UCO Action carrying its exact frozen SCOPA
  category and effect kind;
- Tool, cryptographic-key Identity, and directional Relationship nodes make
  the recording structure legible without implying a human performer,
  provider attestation, or device identity; and
- the exact native packet is embedded with a SHA-256 digest for byte-identical
  recovery and independent S4 verification.

The graph is checked by pinned `case-utils 0.17.0` against its bundled
`case-1.4.0` ontology. CASE validation checks graph conformance; it does not
verify SCOPA cryptography or provenance. See `packages/interop/README.md` for
both required verification paths.

Run the gates:

```sh
npm test
npm run test:s1
npm run test:s2
npm run test:s3
npm run test:s4
npm run test:s5
npm run test:s6
npm run test:s7
npm run test:s8
npm run probe:s8:live
npm run test:cross-runtime
npm run test:lockdown
npm run probe:s2
npm run probe:s3
npm run probe:s4
npm run validate:case:s5
npm run protocol:check
```

The cross-runtime gate uses pinned Node and Deno runtimes. Two processes from
the same runtime do not satisfy it.

## Publisher

Heart AI Foundation publishes the specification and reference implementation.
The public kernel remains entity-neutral; Heart-specific semantics compose
above it through profiles.

## Canon

The protocol canon is maintained by Heart AI Foundation outside the consumer
artifact. The installed runtime's reviewable contract is carried by
`schemas/`, `docs/CLAIMS.md`, and `docs/THREAT_MODEL.md`.

## Build governance

The repository uses Next-Prompt Protocol v2.4. The SCOPA Macro Delta is the sole
queue authority for S0-S5. Discovered work must fit the active slice, be
deferred, or be ratified through an explicit Macro Delta amendment.
