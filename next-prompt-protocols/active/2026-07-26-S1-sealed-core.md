# S1 — Sealed Core

**Class:** `arc`
**Module:** `kernel-core`
**Crosses:** [`journal`]
**Advances contracts:** [`K1`, `K2`, `K3`, `K4`, `J1`, `J2`, `J3`, `J4`, `J5`]
**Compound:** false

## Why this exists

Every later SCOPA boundary depends on a journal that seals identically on every
device and a core that cannot perform a hidden effect. S0 established the
detectors; S1 must now build the smallest real runtime they can guard.

## Next objective

Build the effect taxonomy types, deterministic dCBOR envelope, hash-chain
sealer, append-only adapter, content-addressed blob boundary, and generator
execution loop under lockdown. Enforce ACT replay suppression with idempotency
keys.

## Descriptor rung check

- Executable unlock: a real workflow becomes a replayable, verifiable,
  byte-identical sealed journal across two independent runtimes.

This is runtime implementation, not a descriptor rung.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: public category types, pure generator core, journal codec,
  sealer, persistence port and file adapter, blob addressing, lockdown policy,
  and ACT suppression.
- New uncertainty reduced: whether SCOPA's core can remain deterministic and
  authority-free while producing portable sealed evidence.
- Validation: S0 remains green, independent runtimes emit identical bytes,
  mutations and truncation fail verification, and a second ACT execution is
  suppressed.
- Consecutive metadata/decision slice check: `pass`; S0 was executable
  conformance work.
- Status-report alternative: insufficient because the value gate requires a
  running sealed workflow.

## Productivity mix

- Runtime behavior: 70%
- Contract/test code: 25%
- Metadata/docs: 5%

## Slice queue

This queue is materialized from the canonical Macro Delta and creates no
independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S0 | Conformance harness | Build detectors before guarded features | Injected faults fail | Faults fail and clean controls pass | `completed` |
| S1 | Sealed core | Build the replayable sealed journal and pure core | Two runtimes produce byte-identical records | S0, cross-runtime, mutation, truncation, and ACT-suppression checks | `active` |
| S2 | Enforcement loop | Make SCOPA useful to a developer | Real blocked write and refused completion | Live agent session and cold resume | `proposed` |
| S3 | Legibility | Explain observed boundaries honestly | Undeclared real session produces a boundary map | Manual comparison and coverage honesty | `proposed` |
| S4 | Signing and anchoring | Enable third-party verification | Independent verification succeeds | Signature, timestamp, and offline INFER replay | `proposed` |
| S5 | Interop export | Integrate with existing forensic tooling | CASE verifier passes | CASE validation and round trip | `deferred` |

## Files in play

- `packages/kernel-core/**`
- `packages/journal/**`
- `packages/conformance/**` only for S1 integration into the existing gate
- `fixtures/**`
- `package.json`
- `next-prompt-protocols/**`
- `notes/S1/**`
- `runs/S1/**`
- `evidence/S1/**`

## Validation speed option

- Fast slice-local command: `node --test packages/kernel-core/test/*.test.js packages/journal/test/*.test.js`
- Existing detector gate: `node --test packages/conformance/test/*.test.js`
- Broad-suite policy: `npm test` must enumerate every package test and retain
  all S0 clean/fault probes.
- Cross-runtime policy: compare the exact encoded bytes from two genuinely
  independent runtimes. Two Node processes do not satisfy the value gate.
- Dependency policy: stop if a required dependency cannot execute under
  lockdown and no vetted shim exists.

## Non-goals

- No production agent enforcement or live tool-boundary interception.
- No slice-lock write enforcement, completion evaluator, orientation surface,
  or cold-resume state from S2.
- No signing, device-key claim, external timestamp anchoring, or INFER provider
  pinning.
- No CASE/UCO export.
- No npm publication or public v0.1 release.
- No effect categories or queue entries outside the canonical Macro Delta and
  Kernel Specification.

## Evidence

This arc slice requires all three evidence surfaces:

- `notes/S1/` — codec, lockdown, dependency, and authority-boundary decisions.
- `runs/S1/` — raw S0, cross-runtime, verification, and suppression command
  results with runtime identities.
- `evidence/S1/` — byte/hash comparison, chain verification, mutation and
  truncation findings, persistence-port proof, and ACT replay-suppression proof.

## Acceptance

- `node --test packages/conformance/test/*.test.js`
- `node --test packages/kernel-core/test/*.test.js packages/journal/test/*.test.js`
- `npm test`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- The same workflow encoded and sealed by two independent runtimes produces
  byte-identical records.
- Hash-chain verification accepts the clean chain and rejects mutation and
  truncation.
- The append-only file adapter satisfies the persistence-port suite.
- Content-addressed blobs are stored outside the chain and resolve by digest.
- Schema and kernel versions are pinned in every record.
- A repeated ACT idempotency key is suppressed before a second execution.
- The generator core passes the S0 replay-equivalence and escaped-effect gates
  under lockdown.
