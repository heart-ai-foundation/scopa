# S3 — Legibility

**Class:** `arc`
**Module:** `legibility`
**Crosses:** [`journal`]
**Advances contracts:** [`L1`, `L2`, `L3`, `L4`]
**Compound:** false

## Why this exists

SCOPA now seals effects and enforces declared scope, but a developer should not
need a complete declaration before receiving value. S3 adds an observe-only
path that learns boundaries from executed journal records while reporting the
limits of what was actually observed.

## Next objective

Build the reconstructability scorer, observe-mode runner,
declared-versus-observed gap reporter, coverage readout, and initial
coding-agent profile. Produce a boundary map from a real session whose
boundaries were not declared in advance.

## Descriptor rung check

Executable unlock: an undeclared real agent session becomes a machine-checkable
boundary map with explicit observation coverage.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: scorer, observe runner, gap/coverage evaluator, and
  coding-agent profile.
- New uncertainty reduced: whether useful boundary discovery can remain honest
  about unexercised paths and incomplete reconstruction.
- Validation: several observed sessions, manual-inspection comparison,
  unexercised-path fixtures, and the accumulated release gate.
- Consecutive metadata/decision slice check: `pass`; S2 delivered a runtime
  enforcement host.
- Status-report alternative: insufficient because S3 must generate a real
  boundary map and executable coverage result.

## Productivity mix

- Runtime behavior: 55%
- Contract/test code: 30%
- Metadata/docs: 15%

## Slice queue

This queue is materialized from the canonical Macro Delta and creates no
independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S0 | Conformance harness | Build detectors before guarded features | Injected faults fail | Faults fail and clean controls pass | `completed` |
| S1 | Sealed core | Build the replayable sealed journal and pure core | Two runtimes produce byte-identical records | S0, cross-runtime, mutation, truncation, and ACT-suppression checks | `completed` |
| S2 | Enforcement loop | Make SCOPA useful to a developer | Real blocked write and refused completion | Live agent session and cold resume | `completed` |
| S3 | Legibility | Explain observed boundaries honestly | Undeclared real session produces a boundary map | Manual comparison and coverage honesty | `active` |
| S4 | Signing and anchoring | Enable third-party verification | Independent verification succeeds | Signature, timestamp, and offline INFER replay | `proposed` |
| S5 | Interop export | Integrate with existing forensic tooling | CASE verifier passes | CASE validation and round trip | `deferred` |

## Files in play

- `packages/legibility/**`
- `packages/journal/**` only for the minimal observation seam
- `packages/conformance/**` only to retain S3 in the release gate
- `fixtures/S3/**`
- `package.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S3/**`
- `runs/S3/**`
- `evidence/S3/**`

## Validation speed option

- Fast slice-local command: `npm run test:s3`
- Existing runtime gate: `npm run test:s2`
- Broad-suite policy: `npm test` retains all S0–S2 tests and probes.
- Session policy: at least one boundary map must come from a real agent session,
  not a hand-authored fixture.

## Non-goals

- No claim that observe mode reconstructs activity it did not observe.
- No inference that an unexercised path or effect was absent.
- No enforcement changes, signing, anchoring, INFER provider integration, or
  CASE/UCO export.
- No community profile catalog beyond the initial coding-agent profile.
- No npm publication or public v0.1 release until S3 acceptance closes.
- No effect categories or queue entries outside the canonical Macro Delta and
  Kernel Specification.

## Evidence

This arc slice requires all three evidence surfaces:

- `notes/S3/` — scoring, observation, coverage, and claim-boundary decisions.
- `runs/S3/` — focused, live-session, manual-comparison, and release commands.
- `evidence/S3/` — produced boundary maps, coverage outputs, and reviewer-facing
  manual-inspection comparisons.

## Acceptance

- `npm run test:s3`
- `npm test`
- `npm run protocol:check`
- Observe mode journals without enforcing.
- An undeclared real agent session produces a deterministic boundary map.
- Manual inspection agrees with the map for the events actually observed.
- Declared-versus-observed gaps are findings, not silent normalization.
- Coverage labels unexercised paths as `not-observed`, never `not-present`.
- Reconstructability scoring is derived from explicit journal completeness
  signals and cannot be presented as a forensic reconstruction.
- S0, S1, and S2 release gates remain green.

## Closeout

**Result:** complete.

- Focused S3 suite: 10 passed, 0 failed.
- Full release gate: 64 passed, 0 failed; all S0–S2 gates and clean/fault
  conformance probes remained green.
- Two actual filesystem sessions produced deterministic boundary maps that
  matched independent host traces, including one schema-constrained
  `gpt-5.6-terra` plan executed by the trusted host.
- The model-session evidence retains the Codex JSONL stream and a hash-bound
  local client receipt. It explicitly does not claim provider-signed
  provenance.
- Embedded sealed records, commitment, and host summary independently
  recompute the model-session map, score, and ordered trace.
- Invalid classification, duplicate IDs, and append failures became visible
  capture gaps without gating successful tool execution.
- Declared-versus-observed differences are explicit findings, and unexercised
  operations are only `not-observed`, never absent.
- The 10,000-basis-point result is labeled boundary-event completeness only;
  it is not a forensic reconstruction claim, and the host counter remains
  unauthenticated until S4.
- Independent `gpt-5.6-terra` review first issued `HOLD` on provenance,
  replayability, and trace precision. After evidence hardening, its fresh
  retest returned `ACCEPT` with no blockers.
- Evidence: `notes/S3/`, `runs/S3/`, and `evidence/S3/`.
- Non-goals remained intact; no signing, anchoring, CASE export, npm
  publication, or public release occurred.
