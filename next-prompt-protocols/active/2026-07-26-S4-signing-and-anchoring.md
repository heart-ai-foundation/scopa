# S4 — Signing and Anchoring

**Class:** `arc`
**Module:** `depth`
**Crosses:** [`journal`]
**Advances contracts:** [`D1`, `D2`, `D3`, `D4`]
**Compound:** false

## Why this exists

S3 can explain a locally sealed session, but a party outside that host cannot
yet verify who signed it, what strength of key backed the signature, when an
external authority saw the commitment, or exactly which model invocation an
INFER record represents. S4 adds those bindings without upgrading any claim
beyond the evidence actually present.

## Next objective

Build algorithm-identified signatures over sealed journal commitments, honest
device-key-class representation, optional externally verifiable timestamp
receipts, and offline-verifiable INFER pins. Produce a self-contained packet
that a fresh verifier can validate without executing the original workflow or
calling the model provider.

## Descriptor rung check

Executable unlock: a verifier that never ran SCOPA validates a signed packet,
checks its optional authority-backed timestamp, and replays its pinned INFER
result offline.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: signer/verifier ports, key-class claims, timestamp receipt
  verification, INFER pins, and a standalone packet verifier.
- New uncertainty reduced: whether local tamper evidence can become portable
  third-party evidence without overstating identity, hardware backing, time, or
  provider provenance.
- Validation: independent signature verification, authority-chain timestamp
  validation, offline INFER replay, tamper fixtures, and accumulated release
  gate.
- Consecutive metadata/decision slice check: `pass`; S3 delivered runtime
  observation and executable evidence verification.
- Status-report alternative: insufficient because the value gate is an
  independently executable verification packet.

## Productivity mix

- Runtime behavior: 60%
- Contract/test code: 35%
- Metadata/docs: 5%

## Slice queue

This queue is materialized from the canonical Macro Delta and creates no
independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S0 | Conformance harness | Build detectors before guarded features | Injected faults fail | Faults fail and clean controls pass | `completed` |
| S1 | Sealed core | Build the replayable sealed journal and pure core | Two runtimes produce byte-identical records | S0, cross-runtime, mutation, truncation, and ACT-suppression checks | `completed` |
| S2 | Enforcement loop | Make SCOPA useful to a developer | Real blocked write and refused completion | Live agent session and cold resume | `completed` |
| S3 | Legibility | Explain observed boundaries honestly | Undeclared real session produces a boundary map | Manual comparison and coverage honesty | `completed` |
| S4 | Signing and anchoring | Enable third-party verification | Independent verification succeeds | Signature, timestamp, and offline INFER replay | `active` |
| S5 | Interop export | Integrate with existing forensic tooling | CASE verifier passes | CASE validation and round trip | `deferred` |

## Files in play

- `packages/depth/**`
- `packages/journal/**` only for the minimal commitment seam
- `packages/conformance/**` only to retain S4 in the release gate
- `fixtures/S4/**`
- `package.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S4/**`
- `runs/S4/**`
- `evidence/S4/**`

## Validation speed option

- Fast slice-local command: `npm run test:s4`
- Existing runtime gate: `npm run test:s3`
- Broad-suite policy: `npm test` retains all S0–S3 tests and probes.
- Independent policy: the acceptance packet must be verified from a fresh
  process that did not generate the signing key or run the original workflow.

## Non-goals

- No claim that a software key is hardware-backed, device-bound, or
  human-identity-bound.
- No requirement that signing or external timestamp services be online for
  ordinary local execution.
- No post-quantum signature implementation; algorithm agility is required.
- No provider re-call during INFER replay and no provider-signed provenance
  claim without a provider-issued artifact.
- No CASE/UCO export or S5 work.
- No npm publication or public release without a separate principal request.
- No effect categories or queue entries outside the canonical Macro Delta and
  Kernel Specification.

## Evidence

This arc slice requires all three evidence surfaces:

- `notes/S4/` — signing domain, key classes, timestamp trust, and INFER pin
  decisions.
- `runs/S4/` — focused, independent-verifier, offline-replay, and release
  commands.
- `evidence/S4/` — self-contained signed packets, timestamp receipts, and
  reviewer-facing verification results.

## Acceptance

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

## Closeout

**Result:** complete.

- Focused S4 suite: 6 passed, 0 failed.
- Full release gate: 70 passed, 0 failed; all S0–S3 gates and conformance
  controls remained green.
- A self-contained packet binds a verified four-record journal commitment,
  ordered INFER pins, Ed25519 key identity, and an honest software
  key-possession-only class under `SCOPA-COMMITMENT-SIGNATURE-v1`.
- Each packet pin is referenced exactly once by a sealed `INFER` journal
  record. Both retained results replay offline without a provider call.
- A fresh process verified the packet without the signing private key or
  original workflow.
- The external FreeTSA receipt verified its nonce, message imprint, token
  signature, actual CMS signer certificate, relying-party-pinned signer
  fingerprint, and caller-supplied trust chain at the authority time.
- Revocation remains explicitly `not-checked`; the packet makes no
  long-term-validation claim.
- Independent `gpt-5.6-terra` review first issued `HOLD` on INFER linkage and
  timestamp-authority policy. After remediation, its fresh retest returned
  `ACCEPT` with no blockers and independently passed the 70-test release gate.
- Evidence: `notes/S4/`, `runs/S4/`, and `evidence/S4/`.
- Non-goals remained intact. No post-quantum implementation, CASE/UCO export,
  npm publication, or public release occurred.
- S5 remains deferred because no external CASE consumer has been identified.
