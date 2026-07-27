# SCOPA Slice Queue

**Authority:** `macro-deltas/2026-07-26-scopa-kernel-build.md`
**Rule:** This file materializes the canonical Macro Delta. It does not create
or authorize independent queue entries.

| Slot | Slice | Module | Objective | Value gate | Validation gate | Dependencies | Stop/defer condition | Evidence path | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S0 | Conformance harness | `conformance` | Build replay-equivalence and untrusted-data containment harnesses before the features they guard | A deliberately injected non-deterministic call fails the harness | Property-based synthetic workflows and golden records; injected faults fail and clean input passes | None | Stop if the harness cannot detect an injected effect leak | `evidence/S0/` | `completed` |
| S1 | Sealed core | `kernel-core` | Build effect types, deterministic envelope, hash chain, append-only adapter, execution loop, and lockdown | The same workflow sealed on two runtimes produces byte-identical records | S0 passes; cross-runtime encoding comparison; ACT replay suppression | S0 | Stop if a required dependency cannot run under lockdown and no vetted shim exists | `evidence/S1/` | `completed` |
| S2 | Enforcement loop | `enforcement` | Build slice lock, path enforcement, verification gate, stop evaluator, orientation call, and rotation state | A real agent is blocked outside the slice and a false-green completion is refused | Live agent session, blocked write, rejected completion, and cold resume | S1 | Stop if the gate can self-modify or enforcement depends on agent cooperation | `evidence/S2/` | `completed` |
| S3 | Legibility | `legibility` | Build scoring, observe mode, gap reporting, coverage, and starting profiles | Observe mode produces an undeclared boundary map from a real session | Several observed sessions compared with manual inspection | S2 | Stop if the output can be mistaken for a forensic reconstruction | `evidence/S3/` | `completed` |
| S4 | Signing and anchoring | `depth` | Add signing, key classes, timestamp anchoring, and INFER pinning | A third party verifies a signed and anchored record | Independent signature and timestamp verification; offline INFER replay | S3 | Stop if key backing can be overstated; defer post-quantum signatures | `evidence/S4/` | `completed` |
| S5 | Interop export | `interop` | Map effects to CASE/UCO and export through a CASE context | An exported packet passes the external CASE verifier | CASE verifier, round trip, and unfamiliar-reviewer legibility | S4 | Stop if mapping distorts a category | `evidence/S5/` | `active` |

S5 is active after principal direction and a successful preflight of pinned
`case-utils 0.17.0` against its bundled CASE 1.4.0 ontology.
