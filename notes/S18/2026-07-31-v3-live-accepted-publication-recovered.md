# S18.2 v3 live accepted with provider-free publication recovery

The approved v3 campaign consumed exactly two Codex calls. Clean and
cold-restart both reached succeeded terminals with `canStop: true`, exact
Codex 0.146.0 and `gpt-5.4`, canonical tool sequences, zero extra OBSERVE
calls, fresh runtime state, and complete process-group cleanup. Aggregate
usage was 103405 of 252000 tokens.

The controller completed run and campaign validation and wrote the canonical
mode-0600 private campaign. It then stopped while copying the first accepted
public derivative because a Node `Buffer` was passed to a writer that accepts
strings or canonical JSON values. The public directory existed but remained
empty. This was a publication-only defect; it did not alter provider execution,
normalization, sequence validation, usage accounting, or cleanup.

The approval was registered as consumed before any corrective work. No replay
occurred. A provider-free recovery bound private campaign SHA-256
`a3730bfb8a1c525f1ab94bce8136358776eacf7627f0b0b55121c6d939578c89`,
clean public SHA-256
`a5b9843f29dafb03efdfff260dd5e00692a629ce084c9632b31b84b1bf3e03e3`,
and cold-restart public SHA-256
`d432abbd2b3082b8dc4b41aa662bd787b264eeb1172acdeb5da3e7f6b580d262`.
It re-normalized both retained raw streams, reapplied the frozen semantic
policy, verified the private evidence hashes, confirmed no controller temporary
root remained, scanned public bytes for privacy findings, and published the
exact staged derivatives.

Recovery receipt SHA-256:
`16f6ce9577828aae3a56879aedc63e8675df40595ea298b3ce09e49e1c4f4d77`.
The controller copy bug is fixed for future use. S18.2 is complete and S18.3
is active.
