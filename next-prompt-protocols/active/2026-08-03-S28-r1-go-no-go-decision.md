# S28 — R1 GO/NO-GO Decision

**Class:** `arc`
**Module:** `production-live-requalification`
**Crosses:** [`dependency-closure-identity`, `release-readiness`, `gate-process-custody`]
**Advances contracts:** [`PLQ3`]
**Compound:** false
**Status:** active; eligibility PASS; decision PENDING; hosted qualification pending; release closed

## Why this exists

S26R3 accepted the exact candidate and S27 returned an executable ACCEPT with
zero findings. S28 converts those exact facts into one principal decision
boundary without adding another hardening or review campaign.

## Next objective

Compute and host-qualify one exact R1 eligibility projection, freeze a closed
GO/NO-GO posture, and present its digest for an explicit principal decision.

## Descriptor rung check

Executable unlock: only a machine-checked eligibility projection can make the
exact candidate decision-ready. Narrative confidence cannot open the decision
posture.

## Anti-ceremony gate

- Classification: `final eligibility projection and principal decision`.
- New uncertainty: whether every accepted closeout and release boundary agrees
  on the same exact candidate at decision time.
- Repetition removed: provider calls, outside reviews, rebuilds, soaks,
  release-readiness reviews, and review-of-review.
- One output: an exact closed posture followed by one GO or NO-GO decision.

## Productivity mix

- Eligibility validator and adversarial tests: 70%
- Exact decision posture and evidence: 20%
- Protocol closeout: 10%

## Files in play

- `fixtures/S28/**`
- `evidence/S28/**`
- `packages/release-readiness/test/s28-r1-decision.test.js`
- `packages/release-readiness/test/s27-release-consistency.test.js`
- `evidence/S27/closeout.json`
- `next-prompt-protocols/**`

## Evidence

- Eligibility plan: `fixtures/S28/r1-eligibility-plan.json`
- Eligibility receipt: `evidence/S28/r1-eligibility.json`
- Closed decision posture: `evidence/S28/closed-r1-decision-posture.json`
- Principal decision: absent until exact explicit authority is received

## Local qualification

- Eligibility contracts: PLQ1 PASS, PLQ2 PASS, PLQ3 PASS
- Eligibility blockers: zero
- Focused S28 tests: 7 passed, 0 failed
- Accumulated release gate: 256 passed, 1 skipped, 0 failed
- Provider, experiment, publication, and release traffic: zero
- Hosted qualification: pending

## Non-goals

- No provider call, replay, model review, soak, rebuild, or remediation.
- No release, publication, tag, version, deployment, announcement, or visibility change.
- No inferred principal decision and no release execution after GO.

## Acceptance

- Exact S24-S27 and candidate inputs are hash-bound.
- PLQ2 and PLQ3 eligibility conditions pass or fail closed with a named reason.
- Adversarial identity, closeout, hosted, finding, traffic, privacy, and claim drift reject.
- Closed posture decision is `PENDING`, release authorization is false, and its digest is exact.
- Focused, protocol, accumulated, and hosted gates pass.
- One subsequent principal GO or NO-GO binds only the exact posture digest.

## Stop condition

Stop on ineligibility, mixed evidence, false green, inferred decision, provider
intent, release action, unrelated change, or hosted failure. GO remains only
eligibility for a separately authorized release action.
