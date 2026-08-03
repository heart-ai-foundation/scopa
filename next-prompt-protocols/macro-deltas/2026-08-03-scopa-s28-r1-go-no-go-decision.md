# SCOPA S28 R1 GO/NO-GO Decision Macro Delta

**Status:** principal-approved for activation on 2026-08-02 America/Los_Angeles / 2026-08-03 UTC
**Provider posture:** closed
**Release posture:** closed pending an explicit principal GO or NO-GO decision; GO does not execute release

## Trigger

S26R3 accepted the exact S25 candidate through both supported production
clients. Compressed S27 returned one executable ACCEPT verdict with zero
findings and passed its local, protocol, privacy, candidate-identity, and hosted
gates. The only remaining R1 queue action is a durable eligibility projection
and principal decision.

## Objective

1. bind the exact S24-S27 closeouts, candidate identity, live campaign, S27
   review receipt, and final hosted gates;
2. compute one deterministic R1 eligibility projection that either permits a
   principal decision or names the failed contract;
3. freeze a closed decision posture with an exact digest; and
4. obtain one explicit principal `GO` or `NO-GO` decision against that digest.

## Decision semantics

- `GO`: the exact candidate is eligible for a later separately authorized R1
  release action.
- `NO-GO`: release remains closed and the decision names the failed contract or
  unresolved concern.

Neither outcome publishes, tags, versions, deploys, announces, or changes
repository visibility.

## Authorized files

- `fixtures/S28/**`
- `evidence/S28/**`
- `packages/release-readiness/test/s28-r1-decision.test.js`
- the S27 historical-path compatibility assertion required by protocol rotation
- `evidence/S27/closeout.json`
- `next-prompt-protocols/**`
- the SCOPA evidence-home companion note

## Acceptance

- PLQ2 and PLQ3 inputs are exact-byte bound and machine checked.
- Eligibility is false on candidate, closeout, hosted, finding, traffic,
  privacy, protocol, dependency, license, approval, cleanup, or claim drift.
- The closed posture contains no inferred principal decision and authorizes no release.
- The exact decision digest is committed and host-qualified before presentation.
- One later explicit decision can bind only that digest and exact candidate.

## Non-goals

- No provider call, model review, replay, soak, rebuild campaign, or remediation.
- No candidate, package, dependency, runtime, API, client, model, or version change.
- No publication, release, tag, deployment, announcement, certification, or
  repository visibility change.
- No release-execution protocol inside S28.

## Stop conditions

Stop on any ineligible projection, digest mismatch, material finding, false
green, provider intent, inferred decision, release action, unrelated change, or
hosted failure. A failed eligibility projection produces NO-GO eligibility; it
is never patched within S28.

## Approval boundary

The instruction to proceed authorizes S28 activation, deterministic eligibility
work, and a closed exact decision posture. It does not authorize the principal
decision itself or any release action.
