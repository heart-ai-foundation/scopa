# S18.2 closed OBSERVE hardening v3

The v2 Codex cold-restart result remains rejected and its approval remains
consumed. Hardening instead introduces a forward-only semantic sequence
contract for a fresh run. The contract preserves the canonical tool sequence
and permits one bounded exception: at most one additional successful
`scopa_check`, after the canonical check and before the transcript, whose
schema, slice, status, stop decision, condition, failed gates, and lock hash
are identical to the canonical observation.

Hostile regressions prove rejection of mutation, read, assurance, and
transcript repetition; reordered or incomplete canonical sequences; more than
one extra check; errored checks; semantic drift; malformed stop states; and
policy widening. The S16 live-hardening suite remains green.

The closed v3 continuation retains the two accepted Claude derivatives by
SHA-256 and plans exactly two fresh Codex calls, clean then cold-restart. It
authorizes zero provider calls. Exact matrix digest:
`3b40b83dfa80c0f4e25e9c2a6dd7fff995caf1c32c842fd54436f1eb48a5e5c4`.
Fresh principal approval, no longer than one day and binding the external
S18V3 private destination, is required before provider intent.
