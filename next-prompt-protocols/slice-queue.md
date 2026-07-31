# SCOPA Slice Queue

**Authority:** `macro-deltas/2026-07-28-scopa-production-live-run-hardening.md`
**Rule:** This file materializes the canonical Macro Delta. It does not create
or authorize independent queue entries.

| Slot | Slice | Module | Objective | Value gate | Validation gate | Dependencies | Stop/defer condition | Evidence path | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S14 | Shared live-run custody and supervision | `live-run-custody` | Replace duplicated launcher supervision with one bounded process, terminal, identity, and evidence contract | Every deterministic terminal class is closed, exact-bound, cleanup-proven, and privacy-safe | Fault clients, process-group cleanup, identity/evidence hostility, S8/S9 regression | S13 and ratified production live-run Macro Delta | Stop on raw secret retention, unbounded output/error, orphan process, ambiguous terminal outcome, sourceful resolution, or evidence overwrite | `evidence/S14/` | `completed` |
| S15 | Claude production live-run edge campaign | `claude-live-hardening` | Exercise current Claude Code through real and deterministic provider edge paths | Real/fault outcomes agree on polarity, cleanup, partial assurance, and non-retention | Core scenarios plus drift, refusal, rate, timeout, truncation, capture/budget, repeat runs | S14 and closed Claude account/network/budget policy | Stop on drift, uncontrolled mutation, privacy event, spend violation, false green, or failed cleanup | `evidence/S15/` | `completed` |
| S16 | Codex production live-run edge campaign | `codex-live-hardening` | Exercise current Codex through the same bounded outcome contract | Real/fault outcomes agree on polarity, cleanup, partial assurance, and non-retention | Core scenarios plus drift, refusal, timeout, truncation, usage/capture, repeat runs | S15 and closed Codex account/network/budget policy | Stop on drift, uncontrolled mutation, privacy event, usage violation, false green, or failed cleanup | `evidence/S16/` | `completed` |
| S17 | Sustained recovery, concurrency, and cleanup hardening | `operational-resilience` | Stress operational sequences instead of isolated live sessions | No duplicate action, stale state, pairing loss, unbounded growth, residue, or silent parity drift | Crash/resume, concurrent calls, ceilings, slow reader, repeated soak, cleanup, parity | S15 and S16 | Stop on duplicate mutation, unbounded state, lost pairing, stale reuse, residue, or unexplained divergence | `evidence/S17/` | `active` |
| S18 | Exact production-live requalification | `production-live-requalification` | Bind one exact candidate to the full production-like matrix and sustained soak | Exact matrix and three fresh reviews pass without critical/high/medium finding | Clean candidate, full live matrix, soak, audit/privacy, reviews, hosted CI | S17 and closed provider policies | Stop on candidate drift, uncontrolled spend, policy breach, privacy event, instability, false green, or contrary verdict | `evidence/S18/` | `queued` |

S0-S16 remain completed under their governing Macro Deltas. Only S17 is
active. The separately running SCOPA experiment and public release remain
outside this queue.

## Queued S17 implementation input

`evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md` is a
bound, non-scored engineering input to S17's existing transcript-ceiling and
resource-growth work. Its retained SHA-256 is
`dd6e4a5d8490297519ababc41886560385b7e13989ba3d1227d9731dac8f5dc4`.
Its dual-channel evidence contract is queued for deterministic implementation
only after the active S16 resource defect is closed. The note does not add a
queue slot, change the ratified Macro Delta, authorize a provider call, replay
the RC1 pilot, or place experiment protocol, fixture, allocation, scoring,
statistical, or publication work in this queue.

Before any later candidate posture, the S17 implementation must prove
canonical full-journal/compact-response equivalence, digest and ordering
tamper rejection, bounded check/transcript/assurance responses, no-overwrite
and incomplete-journal failure, cleanup, host-only reconstruction, and the
unchanged six-tool inventory.
