# S26R1 — Failure-Evidence Remediation

**Class:** `hotfix`
**Module:** `production-live-requalification`
**Crosses:** [`live-run-custody`, `claude-live-hardening`, `codex-live-hardening`]
**Advances contracts:** [`PLQ2`, `PLQ3`]
**Compound:** false
**Status:** active; deterministic remediation complete; provider-closed

## Why this exists

S26 stopped when Claude did not reach normalized success. The runner then
discarded the returned result because it asserted qualification before writing
the private journal. Codex was correctly skipped and the approval was consumed.

## Next objective

Prove that the distinct S26R1 runner retains every returned result before
qualification, freeze the new closed matrix, and obtain local and hosted
provider-off qualification. Do not execute the matrix without separate exact
approval.

## Anti-ceremony gate

- Classification: `defect remediation`.
- Concrete defect: a real non-qualifying returned result was not journaled.
- Executable unlock: future failures become diagnosable without replay.
- Validation: adversarial rejected-result, accepted-result, collision, and
  retention-failure tests.
- Status-report alternative: insufficient because the faulty ordering would
  recur on the next non-qualifying result.

## Files in play

- `fixtures/S26R1/**`
- `evidence/S26R1/**`
- `packages/live-run/test/s26r1-failure-evidence-remediation.test.js`
- `next-prompt-protocols/**`

## Acceptance

- Historical S26 bytes and stop evidence remain exact.
- The returned run is durably retained before every success assertion.
- Rejected runs remain private and diagnosable.
- Collision or write failure stops without overwrite or false green.
- S26R1 matrix is closed and exact; provider calls authorized are zero.
- Focused, accumulated, protocol, and hosted gates pass.

## Evidence

- Closed provider-off matrix: `evidence/S26R1/closed-production-live-matrix.json`
- Macro approval: `evidence/S26R1/macro-delta-approval.json`
- Provider-off run: `runs/S26R1/provider-off-remediation.json`
- Historical stop inputs: `evidence/S26/stop.json` and
  `evidence/S26/consumed-approvals.json`
- Private raw evidence remains outside the repository; this remediation creates
  no provider evidence.

## Stop condition

Stop on any provider intent, S26 mutation, missing failure journal, overwrite,
false green, privacy leak, unrelated change, or hosted failure. A later live run
requires a separate exact-digest approval.
