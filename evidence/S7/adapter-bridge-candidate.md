# S7 Model-Neutral Adapter Bridge Candidate

## Reviewer result

The installed package now provides `scopa-mcp`, a dependency-free local MCP
stdio bridge. A fresh consumer installation initialized the server, discovered
six closed tools, wrote an allowed file through the SCOPA dispatcher, rejected
an escaping write before execution, ran the real stop gate, and returned a
validated transcript.

## Executable boundary

- MCP revisions: 2025-11-25, 2025-06-18, 2025-03-26, and 2024-11-05
- Transport: local newline-delimited JSON-RPC stdio only
- Advertised mutation: `scopa_write_file` only
- Mutation implementation: trusted S2 reference-host dispatcher only
- Native mutation/process/network/plugin primitive in adapter source: none
- Incoming message cap: 1 MiB
- Repository read cap: 512 KiB

Hostile `shell` and `apply_patch` tool names, an unsupported mutation method,
duplicate request ID, unknown fields, and malformed mutation arguments all
failed before execution. A gate exiting 7 produced `isError: true`,
`canStop: false`, and a blocked terminal transcript.

## Assurance and evidence

The fixture capability matrix has ten entries: six advertised SCOPA tools and
four disabled native capability classes. It computes `full` only for the
deterministic stream-only fake agent. A negative control with active
uncontrolled network computes `partial`; retaining a `full` claim is rejected.

`fake-agent-proof.json` contains the exact advertised inventory, allowed and
denied outcomes, capability matrix, and 12-event structured transcript. Its
agent/model label is launcher-declared, not provider-attested. The artifact is
not signed in S7.

## Limits

This proves the shared bridge contract, not Claude Code or Codex conformance,
OS sandboxing, provider identity, or resistance to a separately privileged
concurrent local process. Provider-specific native capability closure and
outside review belong to S8 and S9. No package or repository was published.
