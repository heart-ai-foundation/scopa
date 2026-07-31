# S17.2 crash/resume idempotency

SCOPA exposes four frozen ACT durability checkpoints to a deterministic fault
harness: `reservation-durable`, `fulfillment-returned`, `receipt-durable`, and
`journal-durable`. The observer receives only frozen lifecycle metadata and is
not wired through any agent or provider surface.

A restart before the durable receipt cannot determine whether the external
mutation occurred. The persistent reservation therefore remains closed and
raises `SCOPA_ACT_PENDING` with disposition `reconciliation-required`; retry
does not call the shell. A restart after the durable receipt repairs the
journal from its sealed recovery record. A restart after the durable journal
replays that journal. Both paths return the original fulfillment without
calling the mutation shell again.

The matrix injects a failure at every checkpoint, reconstructs the ledger and
journal objects to model process restart, retries twice, and independently
counts the mutation-shell action. Every case produces no more than one action
and either a recovered canonical record or an explicit reconciliation stop.
No provider traffic is involved.
