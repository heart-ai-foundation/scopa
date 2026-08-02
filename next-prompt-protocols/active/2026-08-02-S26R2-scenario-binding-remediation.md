# S26R2 — Scenario-Binding Remediation

**Class:** `hotfix`
**Module:** `production-live-requalification`
**Crosses:** [`live-run-custody`, `claude-live-hardening`, `codex-live-hardening`]
**Advances contracts:** [`PLQ2`, `PLQ3`]
**Compound:** false
**Status:** active; deterministic remediation complete; provider-closed

## Why this exists

S26R1 correctly retained the Claude result before qualification. That evidence
showed successful model work and complete cleanup, but the runner supplied
runtime scenario `clean` while the SCOPA transcript was bound to session
`S26R1-claude-clean`. The integration correctly rejected the unequal identity.

## Next objective

Hold the exact provider-closed S26R2 matrix after proving one
session/runtime-scenario binding for each provider, adversarial mismatch
rejection, and preserved evidence ordering. Do not execute the matrix without
later exact approval.

## Anti-ceremony gate

- Classification: `defect remediation`.
- Concrete defect: a real structurally successful call was falsely rejected by
  inconsistent runner identifiers.
- Executable unlock: supported clients can be qualified against the intended
  transcript identity without weakening normalization.
- Validation: exact and adversarial mismatch tests for both provider bindings.
- Status-report alternative: insufficient because the runner would recreate
  the same mismatch on the next call.

## Files in play

- `fixtures/S26R2/**`
- `evidence/S26R2/**`
- `runs/S26R2/**`
- `packages/live-run/test/s26r2-scenario-binding-remediation.test.js`
- `next-prompt-protocols/**`

## Acceptance

- Historical S26R1 bytes, custody, stop, and consumed approval remain exact.
- Runtime scenario ID exactly equals the SCOPA session/transcript ID.
- Matrix scenario remains the `clean` classification.
- Any identifier or version mismatch rejects deterministically.
- Retain-before-validate and cleanup contracts do not regress.
- S26R2 matrix is closed; provider calls authorized are zero.
- Focused, accumulated, protocol, privacy, and hosted gates pass.

## Evidence

- Closed provider-off matrix: `evidence/S26R2/closed-production-live-matrix.json`
- Macro approval: `evidence/S26R2/macro-delta-approval.json`
- Provider-off run: `runs/S26R2/provider-off-remediation.json`
- Historical inputs: `evidence/S26R1/stop.json`,
  `evidence/S26R1/consumed-approvals.json`, and the S26R1 runner
- Private S26R1 raw evidence remains outside the repository and is not replayed.

## Stop condition

Stop on provider intent, historical mutation, scenario/session mismatch,
accepted drift, retention regression, privacy leak, false green, unrelated
change, or hosted failure. Any later live run requires separate exact approval.
