# S27 — Compressed Release-Consistency Review

**Class:** `arc`
**Module:** `production-live-requalification`
**Crosses:** [`dependency-closure-identity`, `gate-process-custody`]
**Advances contracts:** [`PLQ2`]
**Compound:** false
**Status:** active; deterministic review ACCEPT; hosted gate pending; provider-off; release-closed

## Why this exists

S26R3 accepted the unchanged exact candidate through both supported production
clients. One remaining review should detect mixed evidence generations or
release overclaim without repeating three broad reviews whose underlying
artifact and runtime checks are already bound.

## Next objective

Hold the exact ACCEPT receipt while its evidence commit completes hosted
qualification. After a green hosted gate, S28 still requires separate protocol
activation and cannot execute a release.

## Descriptor rung check

Executable unlock: a deterministic S27 receipt can make the accepted S26R3
packet eligible for a separately activated S28 decision. Narrative review
alone cannot unlock S28.

## Anti-ceremony gate

- Classification: `executable release-consistency review`.
- Changed fact checked: S26R3 is the first accepted live campaign after two
  runner defects; its public evidence and approval closure must agree exactly.
- Checks retained: evidence custody, single-use closure, installed identity,
  cleanup, budgets, privacy, and claim boundaries.
- Repetition removed: three role reports, provider replay, rebuild campaign,
  cold restart, soak, and review-of-review.
- Status-report alternative: insufficient because it would not reject mixed or
  tampered evidence generations.

## Productivity mix

- Consistency checker and adversarial validation: 80%
- Receipt and protocol closeout: 20%

## Files in play

- `fixtures/S27/**`
- `evidence/S27/**`
- `packages/release-readiness/test/s27-release-consistency.test.js`
- `packages/live-run/test/s26r3-canonical-evidence-projection-remediation.test.js`
- `next-prompt-protocols/**`

## Evidence

- Review plan: `fixtures/S27/release-consistency-plan.json`
- Review receipt: `evidence/S27/release-consistency-review.json`
- Provider-off run: `evidence/S27/provider-off-run.json`

## Non-goals

- No provider call, historical replay, new review role, soak, or candidate change.
- No experiment, publication, release, tag, version, deployment, or announcement.
- No S28 activation or release decision.

## Acceptance

- Exact S24, S25, and S26R3 inputs are hash-bound.
- Four-part installed production identity is consistent.
- Approval, authorized matrix, campaign, consumption, and closeout are consistent.
- Both production results stayed successful, bounded, clean, and privacy-safe.
- Release posture and assurance claims remain closed and partial.
- Every adversarial drift class returns REJECT.
- Exactly one review receipt returns ACCEPT with no findings.
- Focused, protocol, accumulated, and hosted gates pass provider-off.

## Stop condition

Stop on identity, evidence, approval, cleanup, budget, privacy, claim, protocol,
or hosted drift; on any material finding; on provider intent; or on unrelated
change. S28 requires separate activation after S27 acceptance.
