# Phase 3 Interop

Current commit reference: `5b861fe`
Current active protocol: `none`

## Scope

Phase 3 is complete. Signed SCOPA packets export as deterministic CASE/UCO
1.4.0 JSON-LD with external conformance and exact native round trip.

## Completed objective

S5 closed the canonical S0-S5 Macro Delta queue. Its artifact passes pinned
CASE validation, preserves every frozen category mapping, recovers and
verifies the exact signed S4 packet, and passed unfamiliar outside-model
review after adversarial remediation.

## Files in play

No active scope boundaries are declared.

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

## Verification record

- `npm run test:s5`: 6/6
- `npm test`: 76/76
- `case_validate` positive control: `Conforms: True`
- malformed Relationship control: `Conforms: False`
- exact signed native-packet recovery: pass
- final fresh outside-model verdict: `ACCEPT`

## Slice lock

- `.slice-lock.json`

## Stop condition

The canonical S0-S5 Macro Delta queue is complete. New work requires principal
direction and a new or amended Macro Delta.
