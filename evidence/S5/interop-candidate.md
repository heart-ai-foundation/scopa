# S5 CASE/UCO interoperability evidence

Status: accepted

Contracts exercised:

- I1: every frozen SCOPA effect category has an exact generic UCO Action
  mapping, with Identity, Tool, and Relationship semantics explicitly bounded.
- I2: the committed export conforms under the independent CASE Utilities
  validator's bundled CASE 1.4.0 ontology and strict severity policy.

Primary evidence:

- `scopa-case-export.jsonld` — deterministic CASE/UCO graph containing the
  exact signed S4 packet.
- `scopa-case-export-generation.json` — generation and native verification
  report.
- `case-validation.json` — positive independent-validator result.
- `invalid-relationship-validation.json` — expected nonconformance result for
  the malformed Relationship control.
- `../../runs/S5/round-trip-report.json` — exact packet recovery and S4
  verification report.
- `../../notes/S5/interop-decisions.md` — complete mapping and claim-boundary
  rationale.
- `../../runs/S5/2026-07-26-outside-model-final-retest.md` — fresh independent
  acceptance after adversarial remediation.

Artifact properties:

- JSON-LD SHA-256:
  `cb54ceaf93247517455547404fb68ca95aa9883c123a163e425d27af38d3fbc7`
- native packet SHA-256:
  `f30c9fa735b0a9f76de71eeefa135f6fbf5967b62d36666aa16771cf0653bfcd`
- CASE/UCO version: 1.4.0
- external consumer: `case-utils 0.17.0`
- external result: `Conforms: True`
- exact native packet recovered: true
- S4 signature and required FreeTSA timestamp policy verified: true

Claim boundaries:

- CASE conformance is graph conformance, not SCOPA cryptographic verification.
- The UCO Identity is a signing-key identifier, not a human, device,
  organization, account, or provider identity.
- The SCOPA Tool records journal Actions; the graph does not imply SCOPA
  performed every underlying external operation.
- A generic UCO Action preserves the ten-category ABI without inventing
  narrower ontology facts.
- The embedded native packet remains the proof; the graph is an interoperable,
  lossless projection.

Review history:

- Initial outside review returned `HOLD` because an enumerable `__proto__`
  property could disappear in the direct verifier's canonical comparison.
- A fresh retest returned `HOLD` after finding that a hostile Array prototype
  could override graph counting.
- The final fresh retest confirmed both attacks and adjacent container tricks
  fail closed without invoking hostile methods, reran all required gates, and
  returned `ACCEPT`.
