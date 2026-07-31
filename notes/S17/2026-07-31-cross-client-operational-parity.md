# S17.4 cross-client operational parity

The legacy S9 parity report remains the default and byte-compatible. An
opt-in operational-v2 report binds the exact retained Claude and Codex proof
objects, makes the four shared outcomes and six-tool surface explicit, and
records model, MCP client, assurance, and uncontrolled-capability differences
as typed machine-readable entries.

Assurance is bound independently to each capability-matrix digest and subject.
The report declares `transferable: false`; attaching the Claude matrix to a
Codex proof or the Codex matrix to a Claude proof creates an
`assuranceBinding` gap. Report tampering fails its structural digest, while a
recomputed report digest still fails source-proof reconstruction.

The retained evidence reports shared behavior parity with both integrations
remaining independently `partial`. This does not claim provider equivalence,
full assurance, or evidence transfer. No provider traffic was used.
