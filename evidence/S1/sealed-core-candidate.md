# S1 sealed-core evidence

Status: accepted and complete

The executable evidence establishes:

- a closed ten-category effect ABI enforced both at execution and journal
  import/sealing boundaries;
- strict deterministic dCBOR and byte-identical Node/Deno records;
- schema, kernel, script-digest, run, scope, sequence, and predecessor pins;
- clean-chain acceptance plus mutation and suffix-truncation rejection;
- append-only memory and single-writer file persistence ports;
- content-addressed blobs published atomically outside the chain;
- cross-process atomic ACT claims;
- durable sealed ACT recovery after a simulated journal-append crash;
- multi-effect resume that replays a sealed OBSERVE prefix without calling the
  shell and then repairs the pending ACT at its original chain position;
- suppression of a completed ACT in a later run; and
- SES denial of time, entropy, network, process, timers, console, and
  non-portable numeric authority.

The honest boundary is that S1 does not authenticate the external commitment,
serialize general multi-writer journals, or reconstruct arbitrary cold
workflows. Those capabilities remain assigned to S2 and S4.

Independent outside-model result: final `ACCEPT`, 19 focused tests passed.
