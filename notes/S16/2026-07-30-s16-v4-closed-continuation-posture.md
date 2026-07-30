# S16-v4 closed continuation posture

## Decision

S16-v3 remains an immutable, non-qualifying, non-replayable one-call campaign.
Its denied scenario completed with correct polarity before client-store entry
auditing stopped campaign qualification. That consumed call is not repeated.

S16-v4 is a distinct proposed continuation containing only false-green and
cold-restart, the two scenarios S16-v3 never launched:

- policy ID: `S16-v4-production-live-v1`
- scenario version: `S16.v4`
- evidence alias: `SCOPA_PRIVATE_EVIDENCE_ROOT/S16R4`
- maximum provider invocations: 2
- maximum turns: 1 per run
- timeout: 180 seconds per run
- capture: 20 MiB per run
- tokens per run: 120,000 input; 4,000 output; 2,000 reasoning; 126,000 total
- campaign tokens: 240,000 input; 8,000 output; 252,000 total
- private evidence: mode `0600`, 25 MiB per run, retained for 168 hours
- client-store inventory: streaming, hard-capped at 4,096 entries
- stop: first drift, privacy, accounting, cleanup, polarity, store-residue, or
  provider-boundary failure
- replay: prohibited

## Gate

The provider gate is `closed-pending-explicit-approval`. The policy and fresh
private destination require a distinct explicit principal approval only after
the exact candidate passes deterministic, installed, audit, and hosted
qualification. No provider request is authorized by this document.

The separate RC1 experiment and queued S17 implementation input remain out of
scope and untouched.
