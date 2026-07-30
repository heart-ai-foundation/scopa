# S16-v2 approved production-live posture

## Authority

The principal explicitly approved the fresh S16-v2 production-live posture on
2026-07-29 after the original S16 attempt stopped before provider launch. This
is a distinct authorization, not a replay.

## Exact boundaries

- policy ID: `S16-v2-production-live-v1`
- scenario version: `S16.v2`
- policy digest:
  `c159b0f24c78e3625fa385eb8f9c13c5375d7d130ca19deeae1ea555eb313d95`
- client: Codex CLI `0.146.0`
- requested model: `gpt-5.4`, launcher-declared
- scenarios: clean, denied, false-green, cold-restart
- maximum provider invocations: 4
- maximum turns: 1 per run
- timeout: 180 seconds per run
- capture: 20 MiB per run
- tokens per run: 120,000 input; 4,000 output; 2,000 reasoning; 126,000 total
- campaign tokens: 480,000 input; 16,000 output; 504,000 total
- private evidence: fresh `S16R2` namespace, mode `0600`, 25 MiB per run,
  retained for 168 hours
- stop: first drift, privacy, accounting, cleanup, polarity, or
  provider-boundary failure
- replay: prohibited

The separate SCOPA experiment remains out of scope and untouched.

## Execution status

The campaign later stopped after the first provider call when the isolated
Codex client store exceeded its 2 MiB content-hash audit bound. The clean
scenario itself returned the expected polarity through only the six SCOPA
tools, but the campaign is non-qualifying. Three calls were not launched and
no replay is authorized.
