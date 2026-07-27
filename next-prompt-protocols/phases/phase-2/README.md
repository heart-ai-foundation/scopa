# Phase 2 Depth

Current commit reference: `29ed965`
Current active protocol: `active/2026-07-26-S4-signing-and-anchoring.md`

## Scope

Block B depth work. Add portable signing, honest key-class claims, optional authority-backed timestamps, and offline-verifiable INFER pins.

## Active objective

> Build algorithm-identified signatures over sealed journal commitments, honest
> device-key-class representation, optional externally verifiable timestamp
> receipts, and offline-verifiable INFER pins. Produce a self-contained packet
> that a fresh verifier can validate without executing the original workflow or
> calling the model provider.

## Files in play

- `README.md`
- `package.json`
- `next-prompt-protocols/**`
- `packages/conformance/**`
- `packages/journal/**`
- `packages/depth/**`
- `fixtures/S4/**`
- `notes/S4/**`
- `runs/S4/**`
- `evidence/S4/**`

## Non-goals

- No claim that software keys are hardware-backed, device-bound, or human-identity-bound
- No mandatory signing or timestamp service for ordinary local execution
- No post-quantum signature implementation; retain algorithm agility
- No provider re-call during INFER replay or provider-signed claim without provider evidence
- No CASE/UCO export or S5 implementation
- No npm publication or public release without a separate principal request
- No effect categories outside the canonical Macro Delta and Kernel Specification
- No queue entries that are not sourced from the canonical Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `npm run test:s4`
- `npm test`
- `npm run protocol:check`
- Every signature identifies its algorithm and binds the sealed commitment
  under a versioned signing domain.
- Key classes are closed, explicit, and cannot imply backing stronger than the
  supplied evidence.
- External timestamping is optional; when present, its message imprint,
  signature, signer certificate, and trust chain verify independently.
- INFER pins bind provider, snapshot, prompt hash, parameters, response hash,
  and retained response bytes.
- Offline INFER replay verifies the retained result without provider access.
- A fresh verifier validates the complete packet without the signing private
  key or original execution environment.
- Tampering with commitment, signature metadata, key class, timestamp receipt,
  INFER parameters, or retained output fails closed.
- S0–S3 release gates remain green.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
