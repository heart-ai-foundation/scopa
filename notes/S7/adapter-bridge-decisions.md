# S7 Model-Neutral Adapter Bridge Decisions

Date: 2026-07-27

## One transport, one policy boundary

SCOPA exposes one local `scopa-mcp` stdio server for provider launchers. The
bridge owns protocol parsing and transcript collection, but mutation policy
remains exclusively in the S2 reference host and dispatcher. Adapter source
contains no filesystem-write, process, network, or plugin primitive.

The bridge implements the stable MCP 2025-11-25 newline-delimited JSON-RPC
transport and negotiates the compatible 2025-06-18, 2025-03-26, and
2024-11-05 versions. Messages are capped at 1 MiB, handled sequentially, and
must complete the initialize/initialized lifecycle. Duplicate request IDs,
unknown tools, unsupported methods, and malformed arguments fail before tool
execution.

## SDK dependency decision

The current monolithic MCP SDK was evaluated rather than assumed. Version
1.29.0 fixed high-severity SDK issues but pulled an unused HTTP adapter with a
moderate path-traversal advisory. The audit-suggested 1.24.3 line removed that
dependency but remained affected by high-severity cross-client and ReDoS
advisories. No audit-clean monolithic line satisfied this local stdio use.

S7 therefore implements the small official stdio/lifecycle/tools subset
directly. The result adds no production dependency, and `npm audit` reports
zero vulnerabilities. Wire-level tests, not handwritten claims, establish
interoperability.

## Tool and read boundaries

The six tools are orientation, repository-contained read, governed write,
completion check, assurance matrix, and transcript. `scopa_write_file` calls
only `createReferenceAgentHost().invoke()`. The bridge does not expose a raw
tool-name pass-through.

Read is repository-contained, resolves symlinks before use, requires a regular
file, and caps output at 512 KiB. This is a confidentiality hardening above
the mutation-focused S2 path boundary. It inherits the documented local
topology threat model; SCOPA does not claim OS-level TOCTOU resistance against
a separately privileged concurrent process.

## Assurance is relative and computed

`scopa.capability-matrix.v1` covers every advertised bridge tool and requires
explicit entries for native filesystem write, process execution, network, and
extensions. An active uncontrolled capability mechanically computes
`partial`; a matrix claiming `full` in that state is rejected.

The S7 fixture's `full` result applies only to the deterministic stream-only
fake agent described by that matrix. It is not a claim about Claude Code,
Codex, arbitrary MCP clients, or the operating system. S8 and S9 must inventory
their real native surfaces and cannot reuse the fake-agent matrix.

## Identity and transcript claims

The launcher supplies the request and model label; the MCP initialize exchange
supplies the actual client name/version. The matrix subject must match that
client. Model provenance is explicitly `launcher-declared`, not
provider-attested.

`scopa.adapter-transcript.v1` is closed and canonical-JSON-safe. It binds the
session identities to ordered calls, results, denials, protocol errors, and
the final stop state. Validation rejects missing, reordered, duplicated,
unknown, non-canonical, and false-green outcome changes. The S7 transcript is
validated evidence, not a signature or timestamp.
