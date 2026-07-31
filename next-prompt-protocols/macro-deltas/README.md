# Macro Deltas

- `2026-07-31-scopa-dependency-closure-identity-hardening.md` — proposed,
  digest-gated S19-S23 queue for publishable dependency-closure enforcement,
  a new exact candidate, fresh live requalification, soak, and reviews.
- `2026-07-28-scopa-production-live-run-hardening.md` — authorized S14-S18
  production custody, Claude/Codex edge hardening, resilience, and exact
  candidate requalification; S18 stopped on a fresh medium finding.
- `2026-07-27-scopa-adversarial-release-hardening.md` — authorized S11-S13
  queue for proof-contract convergence, installed-surface hardening, and
  fresh-agent candidate requalification.
- `2026-07-27-scopa-developer-preview.md` — authorized S6-S10 implementation
  queue for local distribution, a shared adapter bridge, separately evidenced
  Claude Code and Codex integrations, and private release-candidate testing.
- `2026-07-26-scopa-kernel-build.md` — completed S0-S5 kernel foundation,
  enforcement, legibility, signing, and CASE/UCO interoperability queue.

A macro delta is a **multi-slice oversight artifact** that operates above the
per-slice next-prompt protocols. It catches drift the slice protocols can't
see by themselves — accumulated scope, trajectory wobble, forbidden-surface
near-misses, and cumulative non-goal preservation.

## Why this exists

Each next-prompt protocol enforces its own non-goals at slice scope. That
works while the slice arc is small. As an arc grows past ~3 slices, three
failure modes appear that no single slice can detect:

- **Cumulative scope creep.** Each slice is "small and additive", but stacked
  across 5 slices the project quietly grows a whole new subsystem the
  original brief never mentioned. Every slice held its own non-goals; the
  arc as a whole drifted.
- **Trajectory drift.** The original mission becomes load-bearing on a few
  decisions early on. Five slices later, those decisions are invisible —
  a future slice picks up momentum in a direction the principal never
  approved.
- **Forbidden-surface near-misses.** Brief-level forbidden surfaces are
  per-PR-checked but the *approach vector* matters too. A pattern of "we
  almost touched X" across 3 slices is a signal that warrants attention
  before the 4th slice actually crosses the line.

A macro delta is a periodic snapshot that asks: are we still doing what
we said we'd do, and is the trajectory healthy?

## When to fire one

Suggested cadences:

- **Every 5 slices.** Default. Cheap to skip; cheap to write.
- **On phase transitions.** Before rotating from `phase-N` to `phase-N+1`.
- **On scope-shift events.** A retraction, a non-trivial pivot, or a
  principal redirect — write a macro delta to consolidate the new
  direction explicitly.
- **On principal request.** "Where are we?" / "Are we drifting?" / "Give
  me a state-of-the-union" — these all map to a macro delta.

Macro deltas are NOT triggered automatically by `sync-protocols.mjs` and
they do not block handoff. They are reflective artifacts; the slice
protocols remain the load-bearing handoff surface.

## How to instantiate

1. Copy `template.md` into the project memory area at
   `<project>/macro-deltas/<YYYY-MM-DD>-<short-name>.md`. Common
   `<short-name>` values: `arc-checkpoint`, `phase-transition`,
   `pivot-consolidation`, `state-of-the-union`.
2. Fill in every section. Honesty over brevity — a section with "n/a"
   is better than a section that papers over a real signal.
3. Append a one-line entry to `macro-deltas/README.md` in the project
   pointing at the new file (cumulative index — newest first).
4. The macro delta is read-only after it lands. Don't edit a past
   delta to reflect new state; write a new one.

## Required sections

`template.md` is the canonical structure. Every macro delta must include:

- **Where we are** — single-paragraph status.
- **Slice arc** — table of slices in the window.
- **Trajectory check** — original goal vs. current direction; drift
  assessment.
- **Cumulative scope audit** — what was added across the window;
  justified or flagged.
- **Non-goal preservation** — every non-goal from every slice in the
  window; PRESERVED / NEAR-MISS / VIOLATED.
- **Forbidden-surface audit** — Brief-level forbidden surfaces; any
  approached.
- **Cost trajectory** — if the project has a cost model, where are we.
- **Verification health** — test count, contracts baseline drift,
  regression incidents.
- **Open questions / tensions** — what does the principal need to
  weigh in on.
- **Continue / pause / pivot recommendation** — explicit.

## Relationship to slice protocols

| Surface | Scope | Cadence | Load-bearing? |
|---|---|---|---|
| Next-prompt protocol | One slice | Per-slice | Yes — handoff target |
| Slice trio (notes/runs/evidence) | One slice | Per-slice | Audit trail |
| Macro delta | Multi-slice arc | ~every 5 slices | No — reflective |
| `manifest.json` / `.slice-lock.json` | Current state | Per-rotation | Yes — sync target |

A macro delta references slice protocols (by commit + name); the slice
protocols never reference a macro delta. The dependency runs one way.

## What NOT to put in a macro delta

- **Per-slice implementation details.** Those live in the slice's note +
  run + evidence trio. A macro delta references them by file path; it
  doesn't restate them.
- **Future plans.** A macro delta is a snapshot of where we ARE, not a
  roadmap. The "Recommendation" section may suggest the next slice
  type, but it's not a substitute for drafting the actual next-prompt
  protocol.
- **Praise / blame.** Drift assessment is descriptive, not evaluative.
  "We added a frontend that the original brief didn't mention; the
  principal directed this in `<memory file>`" is descriptive. "We
  drifted" without context is judgmental and useless.
