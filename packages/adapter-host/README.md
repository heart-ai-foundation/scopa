# SCOPA model-neutral adapter host

`scopa-mcp` exposes the trusted SCOPA host over local MCP stdio. It implements
the stable 2025-11-25 newline-delimited JSON-RPC transport directly and accepts
the compatible 2025-06-18, 2025-03-26, and 2024-11-05 revisions during
initialization.

The bridge advertises six tools:

| Tool | Effect | Route |
| --- | --- | --- |
| `scopa_orientation` | `OBSERVE` | Stop evaluator plus compact orientation |
| `scopa_read_file` | `OBSERVE` | Repository-contained, regular-file read capped at 512 KiB |
| `scopa_write_file` | `MUTATE` | Trusted SCOPA dispatcher |
| `scopa_check` | `OBSERVE` | Immutable real gate runner |
| `scopa_assurance` | `OBSERVE` | Validated capability/bypass matrix |
| `scopa_transcript` | `OBSERVE` | Closed operational transcript snapshot |

No filesystem mutation, process, network, or plugin primitive exists in the
adapter runtime. The only mutation handler calls
`createReferenceAgentHost().invoke()`. The bridge is a tool-boundary
enforcement host, not an operating-system sandbox.

## Launch

Initialize the repository with `scopa init`, then supply two launcher-owned
documents:

```sh
scopa-mcp \
  --repo /path/to/repository \
  --session-file /trusted/session.json \
  --matrix-file /trusted/capability-matrix.json
```

The session uses `scopa.adapter-session.v1` and records a launcher-declared
request, agent/model label, and explicit non-attestation provenance. The
matrix uses `scopa.capability-matrix.v1`; it must enumerate the SCOPA tool
surface plus native filesystem-write, process, network, and extension
capabilities. Any active `uncontrolled` route mechanically computes
`assurance: "partial"` and a false `"full"` claim is rejected.

The MCP client's `clientInfo` must equal the matrix subject. This binds the
matrix to the launcher actually opening the connection. Provider adapters
must create their own inventories rather than reuse the deterministic fake
agent's matrix.

Launcher configuration failures write one
`scopa.launcher-error.v1` JSON envelope to stderr and exit with status `2`.
The default envelope uses closed error codes and does not include stack traces,
input values, source locations, or absolute paths. Local maintainers can opt
into a diagnostic stack for troubleshooting by setting
`SCOPA_DEBUG_ERRORS=1`; diagnostic output must not be captured as public
evidence or shared without review.

## Protocol behavior

- Initialization and `notifications/initialized` are ordered strictly.
- Request IDs are unique for the connection.
- Tool arguments are closed JSON schemas.
- Unknown tools, unsupported methods, malformed calls, duplicate IDs, and
  messages over 1 MiB fail before tool execution.
- Scope and completion failures are MCP tool errors with correction-bearing
  structured results.
- `scopa_check` returns `isError: true` whenever `canStop` is false.

The `scopa.adapter-transcript.v1` snapshot captures launcher request,
launcher-declared model label, actual MCP client identity, negotiated protocol,
ordered operational calls/results, denials, protocol errors, and terminal
state. The transcript inspection call is intentionally excluded from the
snapshot it returns. S7 transcripts are validated records, not signatures or
provider attestations.

## Standards and dependency decision

The transport follows the official MCP
[2025-11-25 transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports),
[lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle),
and [tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
contracts. SCOPA does not ship the monolithic MCP SDK: as reviewed on
2026-07-27, no release line was audit-clean across both the SDK advisories and
its unused HTTP dependency. The local subset is deliberately small,
dependency-free, and covered at the wire level.
