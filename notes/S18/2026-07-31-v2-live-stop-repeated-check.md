# S18.2 v2 live stop: repeated Codex check

The approved v2 campaign consumed its exact four-call allowance. Claude clean
and cold-restart passed. Codex clean passed. Codex cold-restart completed with
the expected satisfied terminal, candidate, client, model, MCP-only surface,
usage bounds, and process cleanup, but issued `scopa_check` twice. The frozen
scenario contract permits it once, so exact transcript validation rejected the
fourth run.

No replay is authorized. Total Claude cost was
`0.09679750000000001` USD against the `0.40` campaign ceiling. Codex campaign
usage was 114494 total tokens against the 252000 ceiling. All process groups
are gone; disposable repositories, temporary controller state, and isolated
Codex runtime homes were deleted. Three complete public derivatives are
retained. The rejected fourth run remains bound to mode-0600 private intent,
inflight, and store-audit evidence.

This is an evidence-contract edge, not a false success: repeating an
idempotent read-only gate check may be harmless, but the approved contract did
not authorize post-hoc relaxation. S18.2 remains active pending a fresh
hardening posture; the v2 allowance is closed.
The committed consumed-approval registry makes this closure executable: the
controller rejects both historical approval digests before client launch even
when a caller supplies a new custody root.
