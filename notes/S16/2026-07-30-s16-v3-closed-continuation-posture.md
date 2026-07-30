# S16-v3 approved continuation posture

## Decision

S16-v2 is preserved as a stopped, non-replayable one-call campaign. Its three
unlaunched calls are not carried forward as residual authorization.

S16-v3 is a distinct approved continuation with:

- policy ID: `S16-v3-production-live-v1`
- scenario version: `S16.v3`
- evidence alias: `SCOPA_PRIVATE_EVIDENCE_ROOT/S16R3`
- scenarios: denied, false-green, cold-restart
- maximum provider invocations: 3
- maximum turns: 1 per run
- timeout: 180 seconds per run
- capture: 20 MiB per run
- tokens per run: 120,000 input; 4,000 output; 2,000 reasoning; 126,000 total
- campaign tokens: 360,000 input; 12,000 output; 378,000 total
- private evidence: mode `0600`, 25 MiB per run, retained for 168 hours
- stop: first drift, privacy, accounting, cleanup, polarity, or
  provider-boundary failure
- replay: prohibited

## Approval and gate

On 2026-07-30 the principal explicitly approved this exact posture and its
fresh private destination. The descriptor-bound provider gate is `authorized`
for at most the three enumerated one-turn calls. The queue must stop on the
first failure, cannot replay a call or the predecessor campaign, and must be
closed after this single execution attempt.

The separate SCOPA experiment remains out of scope and untouched.
