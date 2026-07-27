# S0 — Conformance Harness

**Class:** `arc`
**Module:** `conformance`
**Crosses:** [`kernel-core`]
**Advances contracts:** [`C1`, `C2`, `C3`]
**Compound:** false

## Why this exists

SCOPA's determinism and containment claims are only as strong as the detector
that can falsify them. The Macro Delta therefore requires the conformance
harness before any guarded runtime feature.

## Next objective

Build the replay-equivalence and untrusted-data containment harnesses before the
features they guard. The harness must fail on deliberately injected
non-deterministic behavior and instruction leakage, then pass on clean controls.

## Descriptor rung check

- Executable unlock: a test harness that fails on injected divergence and
  instruction leakage and becomes the release gate for every later slice.

This is executable validation work, not a descriptor rung.

## Anti-ceremony gate

- Classification: `test/validation`
- Executable change: conformance harness, fault-injection fixtures, golden
  records, and release-gate wiring.
- New uncertainty reduced: whether SCOPA can detect the effect leakage and
  instruction leakage its later guarantees depend upon.
- Validation: deliberately faulty fixtures fail; clean fixtures pass.
- Consecutive metadata/decision slice check: `pass`.
- Status-report alternative: insufficient because the uncertainty is empirical
  and requires executable falsification.

## Productivity mix

- Runtime behavior: 0%
- Contract/test code: 90%
- Metadata/docs: 10%

S1 must move into runtime behavior after this single detector-first slice.

## Slice queue

The queue is materialized from the Macro Delta; it is not independently
authored here.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S0 | Conformance harness | Build the detectors before guarded features | An injected non-deterministic call fails | Faults fail and clean controls pass | `active` |
| S1 | Sealed core | Build the replayable sealed journal and pure core | Cross-runtime records are byte-identical | S0 plus cross-runtime and replay-suppression checks | `proposed` |
| S2 | Enforcement loop | Make SCOPA useful to a developer | Real blocked write and refused completion | Live agent session and cold resume | `proposed` |
| S3 | Legibility | Explain observed boundaries honestly | Undeclared real session produces a boundary map | Manual comparison and coverage honesty | `proposed` |
| S4 | Signing and anchoring | Enable third-party verification | Independent verification succeeds | Signature, timestamp, and offline INFER replay | `proposed` |
| S5 | Interop export | Integrate with existing forensic tooling | CASE verifier passes | CASE validation and round trip | `deferred` |

## Files in play

- `packages/conformance/**`
- `packages/kernel-core/**` only for the minimal pure-core seam required by
  synthetic workflows and injected-fault fixtures
- `fixtures/**`
- `package.json`
- `next-prompt-protocols/**`
- `notes/S0/**`
- `runs/S0/**`
- `evidence/S0/**`

## Validation speed option

- Fast slice-local command:
  `node --test packages/conformance/test/*.test.js`
- Active-slice tests: `packages/conformance/test/*.test.js`
- Upstream fixture policy: use minimal synthetic workflows; S0 must not build
  the S1 sealed core by stealth.
- Broad-suite policy: `npm test` is the release gate and must exercise the
  known-failing fault fixtures plus clean controls.

## Non-goals

- No production agent enforcement.
- No complete journal, persistence adapter, signing, anchoring, INFER provider,
  or CASE/UCO implementation.
- No new effect categories.
- No npm publication or public v0.1 release.
- No independent queue entries outside the Macro Delta.

## Evidence

This slice commits all three evidence surfaces:

- `notes/S0/` — decisions, surprises, and ruled-out options.
- `runs/S0/` — raw validation logs, one command per timestamped file.
- `evidence/S0/` — golden records and reviewer-facing fault-injection results.

## Acceptance

- `node --test packages/conformance/test/*.test.js`
- `npm test`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Injected divergence and instruction leakage are observed failing for the
  expected reasons.
- Clean controls pass.
- The release gate invokes both harnesses.

## Closeout

**Result:** complete.

- Focused tests: 14 passed, 0 failed.
- Release gate: 14 passed, 0 failed; both test files enumerated and all four
  clean/fault probes independently checked.
- Generated coverage: 256 replay workflows and 256 provenance DAGs.
- Clean replay probe: exit `0`.
- Injected hidden-effect replay probe: expected exit `1`, divergence reported
  at `$.output.value`, `$.emitted[0].value`, and `$.unexpectedEffects`.
- Clean containment probe: exit `0`.
- Injected instruction-leak probe: expected exit `1`, origin `source-1`
  reported at `infer-1:extract-1`.
- Adversarial regressions: Date divergence, spoofed replay consumption,
  cancelling hidden effects, provenance laundering, alternate schema fields,
  malformed graphs, and duplicate call IDs are covered.
- Independent model: `gpt-5.6-terra` issued an initial hold, all findings were
  resolved, and its final frozen-worktree verdict was `ACCEPT`.
- Protocol check: passed.
- Syntax and JSON validation: passed.
- Evidence: `notes/S0/`, `runs/S0/`, and `evidence/S0/`.
- Non-goals: all preserved.

S0 proves the declared synthetic fault detectors. Its escaped-effect detector
operates through the explicit synthetic reporting seam. It does not claim
structural ambient-authority removal, real effect interception, or live-agent
enforcement; those remain S1 and S2 work.
