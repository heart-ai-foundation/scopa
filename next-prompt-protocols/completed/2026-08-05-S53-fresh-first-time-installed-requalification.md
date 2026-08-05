# S53 — Fresh First-Time Installed Requalification

**Class:** `arc`
**Module:** `release-readiness`
**Crosses:** [`adoption-experience`, `enforcement`]
**Advances contracts:** [`FH2`]
**Compound:** false
**Status:** completed; FH2 satisfied; Phase 15 complete; release closed

## Why this exists

S52 changed the exact first-time behavior that a fresh installed-package agent
found materially incomplete. The loop could close only when a different
unfamiliar consumer used the exact packed product without implementation
context and found no material defect.

## Executed result

One new agent verified the supplied SHA-256, installed the tarball offline with
lifecycle scripts disabled, and used only installed product-facing material.
It exercised the entire cold hostile journey, verified installed-only module
resolution, inspected privacy, uninstalled assistant artifacts, and removed
its temporary workspace.

## Verdict

- Critical findings: 0
- High findings: 0
- Medium findings: 0
- Low findings: 0
- Nit findings: 0
- Cleanup: pass
- FH2: satisfied

The exact candidate was 2,034,775 bytes with 1,146 entries and SHA-256
`28f0229dd87347cc4409e8c2d0402fb4541ebc663bcc0a17cd8f2363beaa0c26`.

## Evidence

- `notes/S53/fresh-agent-report.md`
- `runs/S53/2026-08-05-fresh-installed-requalification.md`
- `evidence/S53/2026-08-05-S53-fresh-first-time-installed-requalification.md`

## Closeout

S52 and S53 are complete, FH1 and FH2 are satisfied, and the bounded
first-time production-hardening loop is closed. No additional review,
approval, digest, or status-only slice is authorized or needed.

Release, merge, publication, announcement, provider/model traffic, experiment
use, and external-system action remain closed.
