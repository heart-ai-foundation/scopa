# S17.3 concurrency and sustained cleanup

The MCP handler now admits at most three concurrent tool calls. Three is the
closed maximum supported by the transcript's four-MiB event budget and one-MiB
per-result reservation. A fourth simultaneous call receives JSON-RPC `-32000`
before bridge execution. Admission is released through a `finally` boundary,
including error paths.

The deterministic matrix proves exact request/result pairing for concurrent
bridge work and successful capacity reclamation after saturation. A twelve-
session slow-reader soak sends 288 pings through one-byte output high-water
marks while checking bounded buffering, clean per-session request-ID reuse,
unchanged repository inventory, and stable Linux descriptor counts.

Ten repeated live-process custody cycles cover clean exits and detected orphan
children. Every process-group ledger reports `groupGone`; the existing S14
regression independently rechecks descendant PIDs after timeout, output
pressure, and orphan cleanup. No provider process or provider traffic is used.
