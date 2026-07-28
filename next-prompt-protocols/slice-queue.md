# SCOPA Slice Queue

**Authority:** `macro-deltas/2026-07-27-scopa-adversarial-release-hardening.md`
**Rule:** This file materializes the canonical Macro Delta. It does not create
or authorize independent queue entries.

| Slot | Slice | Module | Objective | Value gate | Validation gate | Dependencies | Stop/defer condition | Evidence path | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S11 | Proof contract and redaction convergence | `proof-integrity` | Align runtime and published proof contracts and make publication collision-safe | One hostile corpus agrees across official validators and receipts cannot falsely claim semantic preservation | Differential mutations, collision corpus, S10 regression, and full gate | S10 and ratified hardening Macro Delta | Stop on validator disagreement, special-casing, schema weakening, semantic collision, or accepted-proof drift | `evidence/S11/` | `completed` |
| S12 | Installed surface, launcher, privacy, and CI hardening | `distribution-hardening` | Reconcile shipped commands, bound launcher errors, remove contributor path residue, and clear CI warnings | Every retained installed command works and default errors/package bytes remain consumer-safe | Installed-command matrix, hostile launcher corpus, package/privacy scan, and hosted CI | S11 | Stop if functionality is removed only to green the matrix or default errors leak stack/path topology | `evidence/S12/` | `active` |
| S13 | Fresh-agent adversarial release requalification | `release-requalification` | Rebuild and independently requalify the corrected candidate | Three fresh reviewers reproduce corrected boundaries with no critical/high/medium finding | Exact artifact, source-free corpora, outside reviews, dependency audit, credential confirmation, and hosted gate | S12 and credential-rotation confirmation | Stop on proof drift, unsafe redaction, broken command, containment/signature bypass, false green, unrotated credential, or contrary verdict | `evidence/S13/` | `queued` |

S0-S10 remain completed under predecessor Macro Deltas. Only S11 is active.
S12-S13 do not become implementation authority until prior closeout and
protocol rotation. Public release remains separately unauthorized.
