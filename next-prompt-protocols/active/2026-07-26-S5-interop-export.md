# S5 — CASE/UCO Interop Export

**Class:** `arc`
**Module:** `interop`
**Crosses:** [`depth`]
**Advances contracts:** [`I1`, `I2`]
**Compound:** false

## Why this exists

S4 produces a portable, independently verifiable SCOPA evidence packet, but
existing forensic graph consumers do not understand its native structure.
S5 is now actionable because the CASE community's external `case_validate`
consumer has been identified and exercised locally: pinned `case-utils 0.17.0`
accepted a conforming CASE 1.4.0 graph and rejected a malformed Relationship.

## Next objective

Export a verified SCOPA packet as deterministic CASE/UCO 1.4.0 JSON-LD without
distorting the frozen effect categories or upgrading SCOPA's evidence claims.
Preserve the exact native packet for byte-identical round trip, validate the
graph with the independent CASE validator, and make its meaning legible to a
reviewer unfamiliar with SCOPA.

## Descriptor rung check

Executable unlock: a CASE consumer loads and validates a SCOPA evidence graph,
while SCOPA recovers and independently verifies the exact signed packet
embedded in that graph.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: deterministic JSON-LD exporter, explicit category mapping,
  exact packet round trip, independent validator command, fixtures, and CI
  wiring.
- New uncertainty reduced: whether SCOPA evidence can enter a standard forensic
  graph without losing its native proof or misrepresenting an effect.
- Validation: focused export tests, pinned `case_validate`, exact round trip,
  accumulated release gate, and unfamiliar-reviewer assessment.
- Consecutive metadata/decision slice check: `pass`; S4 delivered a signed
  runtime packet, and the activation preflight executed a real external
  validator.
- Status-report alternative: insufficient because the value gate is an
  executable CASE/UCO artifact consumed outside SCOPA.

## Productivity mix

- Runtime behavior: 50%
- Contract/test code: 40%
- Metadata/docs: 10%

## Slice queue

This queue is materialized from the canonical Macro Delta and creates no
independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S0 | Conformance harness | Build detectors before guarded features | Injected faults fail | Faults fail and clean controls pass | `completed` |
| S1 | Sealed core | Build the replayable sealed journal and pure core | Two runtimes produce byte-identical records | S0, cross-runtime, mutation, truncation, and ACT-suppression checks | `completed` |
| S2 | Enforcement loop | Make SCOPA useful to a developer | Real blocked write and refused completion | Live agent session and cold resume | `completed` |
| S3 | Legibility | Explain observed boundaries honestly | Undeclared real session produces a boundary map | Manual comparison and coverage honesty | `completed` |
| S4 | Signing and anchoring | Enable third-party verification | Independent verification succeeds | Signature, timestamp, and offline INFER replay | `completed` |
| S5 | Interop export | Integrate with existing forensic tooling | CASE validator passes | CASE validation, exact round trip, and unfamiliar review | `active` |

## Files in play

- `packages/interop/**`
- `packages/depth/**` only to consume or minimally expose the packet verifier
- `packages/conformance/**` only to retain S5 in the release gate
- `fixtures/S5/**`
- `.github/workflows/**`
- `package.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S5/**`
- `runs/S5/**`
- `evidence/S5/**`

## Validation speed option

- Fast slice-local command: `npm run test:s5`
- External consumer command:
  `case_validate --built-version case-1.4.0 <export.jsonld>`
- Existing runtime gate: `npm run test:s4`
- Broad-suite policy: `npm test` retains all S0–S4 tests and probes.
- Independent policy: external validation must use pinned `case-utils 0.17.0`
  in an environment separate from the JavaScript exporter.

## Non-goals

- No claim of CASE 1.5.0 conformance while the pinned external validator ships
  ontology builds only through CASE 1.4.0.
- No claim that CASE validation verifies SCOPA signatures, timestamps, model
  provenance, key backing, or human identity.
- No narrowing or renaming of the frozen SCOPA effect categories to force an
  apparent ontology match.
- No replacement of the native signed packet with a lossy graph projection.
- No new effect categories or changes to S0–S4 guarantees.
- No runtime network requirement for export, round trip, or installed
  `case_validate` operation.
- No npm publication or public release without a separate principal request.
- No queue entries outside the canonical Macro Delta.

## Evidence

This arc slice requires all three evidence surfaces:

- `notes/S5/` — mapping choices, ontology-version pin, and claim boundaries.
- `runs/S5/` — focused, external-validator, round-trip, release, and reviewer
  records.
- `evidence/S5/` — deterministic CASE JSON-LD export, validation result, and
  round-trip comparison.

## Acceptance

- `npm run test:s5`
- `npm test`
- `npm run protocol:check`
- Exported JSON-LD validates with `case-utils 0.17.0` and its bundled
  `case-1.4.0` ontology under default strict severity handling.
- A deliberately malformed CASE Relationship is rejected by that validator.
- Every frozen SCOPA effect category maps one-to-one to a UCO Action carrying
  its original category as an explicit SCOPA tag.
- CASE Identity, Tool, and Relationship nodes describe cryptographic identity,
  runtime tooling, and graph edges without implying a human performer or
  provider attestation.
- The exact native packet bytes round-trip from JSON-LD and pass the S4 packet
  verifier with caller-supplied timestamp trust policy.
- Repeated export of the same packet produces byte-identical JSON-LD.
- Unknown, duplicate, missing, or category-distorting graph mappings fail
  closed on round trip.
- A reviewer unfamiliar with SCOPA can identify what happened, which tool
  recorded it, what was signed, and the limits of the evidence without a
  separate translation guide.
- S0–S4 release gates remain green.
