# S26R3 — Canonical Evidence-Projection Remediation

**Class:** `hotfix`
**Module:** `production-live-requalification`
**Crosses:** [`live-run-custody`, `claude-live-hardening`]
**Advances contracts:** [`PLQ2`, `PLQ3`]
**Compound:** false
**Status:** active; deterministic remediation complete; provider-closed

## Why this exists

S26R2 received a normalized Claude result, then failed before writing it because
the runner sent fractional USD accounting directly through SCOPA's canonical
JSON encoder. The supported Claude evidence path already converts that value to
an exact plain-decimal string, but the runner bypassed it.

## Next objective

Hold the exact S26R3 closed matrix and its provider-off qualification evidence.
No production call is authorized. A later live run requires separate principal
approval of the exact matrix digest and prospective approval digest.

## Anti-ceremony gate

- Classification: `defect remediation`.
- Concrete defect: a real returned result could not be retained because the
  wrong representation crossed the canonical evidence boundary.
- Executable unlock: fractional provider accounting becomes durable without
  weakening canonical JSON or replaying the lost call.
- Validation: decimal boundary, malformed-value, retention, and collision tests.
- Status-report alternative: insufficient because another successful Claude
  return would fail at the same write.

## Files in play

- `fixtures/S26R3/**`
- `evidence/S26R3/**`
- `runs/S26R3/**`
- `packages/live-run/test/s26r3-canonical-evidence-projection-remediation.test.js`
- `next-prompt-protocols/**`

## Acceptance

- Historical S26R2 bytes, intent, stop, and consumed approval remain exact.
- Installed-candidate projection passes before provider intent.
- Fractional cost becomes an exact decimal string in private and public evidence.
- Malformed cost fails closed; canonical JSON remains strict.
- Write-before-qualification, no-replace, mode, scenario, and cleanup controls remain intact.
- S26R3 matrix is closed; provider calls authorized are zero.
- Focused, accumulated, protocol, privacy, and hosted gates pass.

## Evidence

- Closed matrix: `evidence/S26R3/closed-production-live-matrix.json`
- Macro approval: `evidence/S26R3/macro-delta-approval.json`
- Provider-off run: `runs/S26R3/provider-off-remediation.json`
- Historical inputs: `evidence/S26R2/stop.json`,
  `evidence/S26R2/consumed-approvals.json`, and the S26R2 runner
- Private S26R2 intent remains outside the repository and is not replayed.

## Stop condition

Stop on provider intent, historical mutation, projection drift, malformed-cost
acceptance, overwrite, retention regression, privacy leak, false green,
unrelated change, or hosted failure. Later live use requires exact approval.
