# SCOPA model-neutral adapter host

`scopa-mcp` exposes the trusted SCOPA host over local MCP stdio. It implements
the stable 2025-11-25 newline-delimited JSON-RPC transport directly and accepts
the compatible 2025-06-18, 2025-03-26, and 2024-11-05 revisions during
initialization.

The bridge advertises six tools:

| Tool | Effect | Route |
| --- | --- | --- |
| `scopa_orientation` | `OBSERVE` | Stop evaluator plus compact orientation |
| `scopa_read_file` | `OBSERVE` | Repository-contained, single-link regular-file read capped at 512 KiB |
| `scopa_write_file` | `MUTATE` | Trusted SCOPA dispatcher |
| `scopa_check` | `OBSERVE` | Immutable real gate runner |
| `scopa_assurance` | `OBSERVE` | Validated capability/bypass matrix |
| `scopa_transcript` | `OBSERVE` | Closed operational transcript snapshot |

No filesystem mutation, process, network, or plugin primitive exists in the
adapter runtime. The only mutation handler calls
`createReferenceAgentHost().invoke()`. The bridge is a tool-boundary
enforcement host, not an operating-system sandbox.

Governed writes require descriptor-directory binding through `/proc/self/fd`
or `/dev/fd`. A host without either facility fails closed with scope denial
instead of reopening an authorized path by name.

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
- Read/write paths are capped at 4096 UTF-8 bytes before transcript admission
  or filesystem resolution; rejected values are not echoed.
- Unknown tools, unsupported methods, malformed calls, duplicate IDs, and
  messages over 1 MiB fail before tool execution.
- The newline decoder caps its frame-accumulation state at 1 MiB before
  parsing or complete-line buffering; excess bytes are discarded through the
  next frame boundary.
- A session accepts at most 2048 unique request IDs, and string IDs are at
  most 256 UTF-8 bytes. Once exhausted, new IDs receive a stable server-limit
  error and are not retained.
- Callers outside the sequential stdio loop may hold at most three tool calls
  in flight. Excess calls receive JSON-RPC `-32000` before bridge execution;
  capacity is reclaimed after every result or error.
- The transcript retains at most 1024 events and 4 MiB of canonical event
  payload, including reserved result capacity. Calls that cannot reserve a
  truthful call/result pair fail before tool execution; excess protocol errors
  remain bounded on the wire and are not retained.
- Stdio response writes honor stream backpressure before another frame is
  processed, preventing a non-reading client from creating an unbounded output
  queue.
- Scope and completion failures are MCP tool errors with correction-bearing
  structured results.
- `scopa_check` returns `isError: true` whenever `canStop` is false.

The `scopa.adapter-transcript.v1` snapshot captures launcher request,
launcher-declared model label, actual MCP client identity, negotiated protocol,
ordered operational calls/results, denials, protocol errors, and terminal
state. Parse and size errors after initialization are recorded without
retaining hostile frame content. The transcript inspection call is
intentionally excluded from the snapshot it returns. S7 transcripts are
validated records, not signatures or provider attestations.

When the launcher receives `--evidence-journal <outside-repository-path>`, it
uses the S17 dual-channel evidence contract. The host writes one canonical,
mode-`0600`, no-replace full journal before returning `scopa_transcript`.
Agent-facing `scopa_check`, `scopa_assurance`, and `scopa_transcript` results
are compact digest-bound views capped at 16 KiB; failed gates may include at
most 2 KiB of combined output preview. Missing, overwritten, reordered, or
digest-conflicting journal evidence fails closed.

## Standards and dependency decision

The transport follows the official MCP
[2025-11-25 transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports),
[lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle),
and [tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
contracts. SCOPA does not ship the monolithic MCP SDK: as reviewed on
2026-07-27, no release line was audit-clean across both the SDK advisories and
its unused HTTP dependency. The local subset is deliberately small,
dependency-free, and covered at the wire level.
