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

## Approval, execution, and stop

On 2026-07-30 the principal explicitly approved this exact posture and its
fresh private destination. Exact candidate
`f7e5f13777f3998dff65f3c004c658488a9afa0b` passed local installed,
deterministic, policy, dependency, and release gates plus hosted run
`30522116030`.

The denied scenario consumed one provider call and completed with expected
stop polarity, bounded usage, and process cleanup. Campaign qualification then
stopped because the isolated Codex client store exceeded the 64-entry audit
bound. False-green and cold-restart were not launched. The gate has returned to
`closed-pending-explicit-approval`; this campaign is non-qualifying and cannot
be replayed.

The separate SCOPA experiment remains out of scope and untouched.
