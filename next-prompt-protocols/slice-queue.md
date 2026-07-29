# SCOPA Slice Queue

**Authority:** `macro-deltas/2026-07-28-scopa-production-live-run-hardening.md`
**Rule:** This file materializes the canonical Macro Delta. It does not create
or authorize independent queue entries.

| Slot | Slice | Module | Objective | Value gate | Validation gate | Dependencies | Stop/defer condition | Evidence path | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S14 | Shared live-run custody and supervision | `live-run-custody` | Replace duplicated launcher supervision with one bounded process, terminal, identity, and evidence contract | Every deterministic terminal class is closed, exact-bound, cleanup-proven, and privacy-safe | Fault clients, process-group cleanup, identity/evidence hostility, S8/S9 regression | S13 and ratified production live-run Macro Delta | Stop on raw secret retention, unbounded output/error, orphan process, ambiguous terminal outcome, sourceful resolution, or evidence overwrite | `evidence/S14/` | `active` |
| S15 | Claude production live-run edge campaign | `claude-live-hardening` | Exercise current Claude Code through real and deterministic provider edge paths | Real/fault outcomes agree on polarity, cleanup, partial assurance, and non-retention | Core scenarios plus drift, refusal, rate, timeout, truncation, capture/budget, repeat runs | S14 and closed Claude account/network/budget policy | Stop on drift, uncontrolled mutation, privacy event, spend violation, false green, or failed cleanup | `evidence/S15/` | `queued` |
| S16 | Codex production live-run edge campaign | `codex-live-hardening` | Exercise current Codex through the same bounded outcome contract | Real/fault outcomes agree on polarity, cleanup, partial assurance, and non-retention | Core scenarios plus drift, refusal, timeout, truncation, usage/capture, repeat runs | S15 and closed Codex account/network/budget policy | Stop on drift, uncontrolled mutation, privacy event, usage violation, false green, or failed cleanup | `evidence/S16/` | `queued` |
| S17 | Sustained recovery, concurrency, and cleanup hardening | `operational-resilience` | Stress operational sequences instead of isolated live sessions | No duplicate action, stale state, pairing loss, unbounded growth, residue, or silent parity drift | Crash/resume, concurrent calls, ceilings, slow reader, repeated soak, cleanup, parity | S15 and S16 | Stop on duplicate mutation, unbounded state, lost pairing, stale reuse, residue, or unexplained divergence | `evidence/S17/` | `queued` |
| S18 | Exact production-live requalification | `production-live-requalification` | Bind one exact candidate to the full production-like matrix and sustained soak | Exact matrix and three fresh reviews pass without critical/high/medium finding | Clean candidate, full live matrix, soak, audit/privacy, reviews, hosted CI | S17 and closed provider policies | Stop on candidate drift, uncontrolled spend, policy breach, privacy event, instability, false green, or contrary verdict | `evidence/S18/` | `queued` |

S0-S13 remain completed under their governing Macro Deltas. Only S14 is
active. The separately running SCOPA experiment and public release remain
outside this queue.
