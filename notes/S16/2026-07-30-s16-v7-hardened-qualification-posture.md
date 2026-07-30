# S16-v7 hardened qualification posture

## Decision

S16-v7 is a fresh, closed-by-default continuation for the hardened Codex
runtime custody model at source commit `7a6c358`. It is not a replay of the
stopped S16-v6 clean call and does not reuse that call's private evidence.

The principal approved preparation of this exact posture on 2026-07-30:

- policy ID: `S16-v7-production-live-v1`
- scenario version: `S16.v7`
- ordered scenarios: `clean`, then `cold-restart`
- private evidence alias: `SCOPA_PRIVATE_EVIDENCE_ROOT/S16R7`
- maximum provider invocations: 2; one turn and 180 seconds per run
- per-run token ceiling: 120,000 input, 4,000 output, 2,000 reasoning, and
  126,000 total; campaign ceiling: 240,000 input, 8,000 output, and 252,000
  total
- capture ceiling: 20 MiB; private evidence: mode `0600`, 25 MiB per run,
  retained for 168 hours

Each scenario receives a fresh disposable Codex runtime home. The identity
boundary is checked before and after the run; bounded client state is private
to that home and teardown is verified before the next scenario begins.

## Gate

The committed policy digest is
`a8c6a0e7502d1618bcae72ef04079d5d3ab7e7ea47e2591339bddf464cfaa24d`.
Its provider gate is `closed-pending-explicit-approval`: this posture
preparation authorizes no provider traffic. A later explicit authorization
must bind this exact policy digest, the fresh private S16R7 destination, and
the two-call stop-on-first-failure execution before any live request.

The separate RC1 experiment remains out of scope.
