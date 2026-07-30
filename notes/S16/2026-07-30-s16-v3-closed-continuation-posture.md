# S16-v3 closed continuation posture

## Decision

S16-v2 is preserved as a stopped, non-replayable one-call campaign. Its three
unlaunched calls are not carried forward as residual authorization.

S16-v3 is a distinct proposed continuation with:

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

## Gate

The provider gate is `closed-pending-explicit-approval`. This posture and its
private destination require explicit principal approval after exact-candidate
qualification. Drafting and deterministic validation do not authorize a
provider request.

The separate SCOPA experiment remains out of scope and untouched.
