# Phase 3 Interop

Current commit reference: `66bdd60`
Current active protocol: `active/2026-07-26-S5-interop-export.md`

## Scope

Export signed SCOPA packets as deterministic CASE/UCO 1.4.0 JSON-LD and prove conformance plus exact native round trip.

## Active objective

> Export a verified SCOPA packet as deterministic CASE/UCO 1.4.0 JSON-LD without
> distorting the frozen effect categories or upgrading SCOPA's evidence claims.
> Preserve the exact native packet for byte-identical round trip, validate the
> graph with the independent CASE validator, and make its meaning legible to a
> reviewer unfamiliar with SCOPA.

## Files in play

- `.github/workflows/**`
- `README.md`
- `package.json`
- `next-prompt-protocols/**`
- `packages/conformance/**`
- `packages/depth/**`
- `packages/interop/**`
- `fixtures/S5/**`
- `notes/S5/**`
- `runs/S5/**`
- `evidence/S5/**`

## Non-goals

- No claim that software keys are hardware-backed, device-bound, or human-identity-bound
- No mandatory signing or timestamp service for ordinary local execution
- No post-quantum signature implementation; retain algorithm agility
- No provider re-call during INFER replay or provider-signed claim without provider evidence
- No CASE 1.5.0 conformance claim while the pinned validator supports through CASE 1.4.0
- No claim that CASE validation verifies SCOPA cryptography or provenance
- No distortion of frozen SCOPA effect categories to force an ontology match
- No lossy replacement of the native signed packet by its graph projection
- No npm publication or public release without a separate principal request
- No effect categories outside the canonical Macro Delta and Kernel Specification
- No queue entries that are not sourced from the canonical Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

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

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
