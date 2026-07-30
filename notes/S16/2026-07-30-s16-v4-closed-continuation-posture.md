# S16-v4 approved continuation posture

## Decision

S16-v3 remains an immutable, non-qualifying, non-replayable one-call campaign.
Its denied scenario completed with correct polarity before client-store entry
auditing stopped campaign qualification. That consumed call is not repeated.

S16-v4 is a distinct approved continuation containing only false-green and
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

## Approval and gate

On 2026-07-30 the principal explicitly approved this exact posture and fresh
private destination. The digest-bound gate is `authorized` for at most the two
enumerated one-turn calls in one stop-first-failure attempt. It cannot replay
S16-v3 or any S16-v4 call and must be closed after this execution attempt.

The separate RC1 experiment and queued S17 implementation input remain out of
scope and untouched.
