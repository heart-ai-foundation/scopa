# SCOPA Slice Queue

**Authority:** `macro-deltas/2026-07-31-scopa-bundled-production-closure-hardening.md`
**Rule:** This file materializes the canonical Macro Delta. It does not create
or authorize independent queue entries.

| Slot | Slice | Module | Objective | Value gate | Validation gate | Dependencies | Stop/defer condition | Evidence path | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S19-v2 | Bundled production-closure enforcement | `dependency-closure-identity` | Carry and independently bind all reviewed production bytes | Empty-cache installs cannot fetch or substitute dependency code | npm 10/11, unreachable registry, byte/graph hostility, license inventory | Exact-digest approval | Stop on incomplete bundle, fetch, npm drift, unsafe surface, or false green | `evidence/S19-v2/` | `completed` |
| S20 | Bundled exact-candidate freeze | `production-live-requalification` | Bind package, closure, bundle, install, policies, clients, and deterministic matrix | Two clean packs and installs are identical | clean pack/install, matrix, protocol, accumulated and hosted gates | S19-v2 and clean closeout commit | Stop on identity drift, network, privacy, license, advisory, or matrix failure | `evidence/S20/` | `active` |
| S21 | Fresh candidate production-live matrix | `production-live-requalification` | Obtain fresh Claude/Codex evidence for the exact bundled candidate | No assurance or approval transfer | separately approved exact calls only | S20 and separate exact call approval | Stop before launch without approval or on any custody/policy failure | `evidence/S21/` | `queued and provider-closed` |
| S22 | Sustained bundled-closure soak | `dependency-closure-identity` | Repeat empty-cache installs and runtime polarity | No registry/cache moment can masquerade as stability | graph/tree ledger, audit/license/privacy/cleanup | S21 | Stop on fetch, drift, advisory, privacy, residue, or resource growth | `evidence/S22/` | `queued` |
| S23 | Fresh exact-identity reviews and closeout | `production-live-requalification` | Three unfamiliar roles reproduce four-part identity claims | Three ACCEPT verdicts and zero critical/high/medium findings | consistency, protocol, local, hosted, no-publication gates | S22 | Stop on contrary verdict, identity mismatch, or unadjudicated finding | `evidence/S23/` | `queued` |

S0-S18 and the stopped S19 attempt remain immutable under their governing
Macro Deltas. S19-v2 is complete and S20 is the only active slice. The
separately running SCOPA experiment and all publication/release actions remain
outside this queue.
