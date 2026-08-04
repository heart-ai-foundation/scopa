# S32 — Portable Assessment Interoperability

**Class:** `arc`
**Module:** `workflow-boundary-map`
**Crosses:** [`interop`, `distribution`, `release-readiness`]
**Advances contracts:** [`WBM4`]
**Compound:** false
**Status:** completed; WBM4 satisfied; provider, experiment, publication,
release, and customer use remained closed

## Why this exists

Workflow maps become a durable open standard only when developers can validate,
compare, and export them without sending repository or customer content to a
hosted service. This is also the legitimate consulting handoff: the same free,
portable artifact is available to every verifier.

## Next objective

Implement offline semantic comparison and a sanitized assessment packet with a
single provider-off CLI surface and independent verification against expected maps.

## Descriptor rung check

Executable unlock: S32 creates the portable input consumed by independent
review and S33 adversarial qualification.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: comparison, sanitizer, packet validator/verifier, CLI, and hostility tests.
- New uncertainty reduced: whether maps can leave a repository without leaking raw workflow content or requiring paid truth.
- Validation: deterministic round trip, regression polarity, redaction corpus, and network-denial proof.
- Consecutive metadata/decision check: pass.
- Status-report alternative: insufficient; portability requires executable bytes.

## Productivity mix

- Runtime behavior: 50%
- Contract/test code: 45%
- Metadata/docs: 5%

## Files in play

- `packages/workflow-boundary-map/**`
- `packages/cli/**`
- `schemas/**`
- focused documentation and release policy
- `package.json`
- `next-prompt-protocols/**`
- `notes/S32/**`
- `runs/S32/**`
- `evidence/S32/**`

## Non-goals

- No hosted intake, telemetry, lead capture, CRM, customer upload, or proprietary format.
- No certification, risk score, or automatic remediation advice.
- No raw prompts, gate output, non-goal prose, relative path text, capability evidence prose, credentials, or absolute paths in the assessment packet.
- No provider, experiment, publication, release, deployment, or external mutation.

## Evidence

Record round-trip, redaction, semantic regression, and no-network qualification
under `runs/S32/` and `evidence/S32/`.

## Acceptance

- Map validation and semantic comparison remain free local APIs.
- Scope expansion and controlled-to-uncontrolled transitions are regressions.
- Exported packets contain commitments and structural findings, not raw workflow content.
- Independent verification requires caller-supplied expected map bytes.
- Identical inputs produce identical packet bytes.
- `scopa assess` works offline and emits one closed packet.
- S32, S31, S30, CLI, release-policy, docs, and protocol checks pass.

## Stop condition

Stop on raw-content retention, ambiguous regression polarity, hosted or paid
truth dependency, false certification language, nondeterminism, or new external authority.
