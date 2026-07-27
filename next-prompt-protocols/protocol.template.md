# <slice-title>

**Class:** `arc`
**Module:** `<module-id>`
**Crosses:** []
**Advances contracts:** []
**Compound:** false

Class options:

| Class | When | Required sections | Skipped |
| --- | --- | --- | --- |
| `arc` | Multi-slice planned work. | Descriptor rung check, productivity mix, slice queue when multiple slices are visible, evidence, non-goals, acceptance. | Nothing. |
| `spike` | Exploratory work to determine whether an approach is viable. | Descriptor rung check, non-goals, acceptance, evidence with `runs/` minimum. | Productivity mix, slice queue, validation-speed option. |
| `hotfix` | Single concrete bug or unblock with a known fix. | Acceptance, evidence with `runs/` minimum. | Descriptor rung check, productivity mix, slice queue, non-goals. |

Worktree-per-terminal, isolated checkout, and commit-after-each-slice rules still apply when the project requires them. Class adjusts the thinking ceremony, not the isolation ceremony.

Use `**Compound:** true — <paired-diff | shared-gate | refactor-then-use> (<reason>)` only when a bundled slice is justified by one of the approved combine patterns. Hard cap: three sub-slices.

Module tags are structural metadata. `Module` is the owning module. `Crosses` lists other modules intentionally touched by the slice. `Advances contracts` lists declared module exit contracts this slice advances or satisfies.

## Why this exists

<state the blocker, runtime seam, or handoff need this slice resolves>

## Next objective

<describe one concrete slice in plain prose>

## Descriptor rung check

Name the executable step this protocol unlocks before accepting descriptor-only work:

- test, probe, packet handoff, replay activation path, Rust/WASM consumer boundary, or production-off invariant: `<specific unlock>`

If the protocol cannot name one of those, do not continue a descriptor ladder. Choose a runtime seam or test-controlled runtime-adjacent action instead.

## Anti-ceremony gate

Classify this slice before starting: `<implementation | test/validation | runtime guard | decision | ceremony>`.

Answer before rotating this protocol active:

- Executable change: `<code path, test coverage, validation command, fixture contract, runtime guard, or review action>`
- New uncertainty reduced: `<specific uncertainty>`
- Validation: `<command or concrete review action>`
- Consecutive metadata/decision slice check: `<pass | stop>`
- Status-report alternative: `<why this needs an artifact instead of a concise report>`

If the classification is `ceremony`, do not activate this protocol. A second consecutive `decision`, `closeout`, or `handoff` slice requires stopping and reporting unless the user explicitly requested docs/admin.

## Productivity mix

- Runtime behavior: `<percent>%`
- Contract/test code: `<percent>%`
- Metadata/docs: `<percent>%`

If runtime behavior is `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action rather than another metadata-only descriptor rung.

## Slice queue

Use this for `arc` work when the work naturally contains multiple slices. A queue is a decision aid, not an autopilot. After each completed slice, re-read this queue and choose whether to continue, reorder, split, or stop.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | `<slice name>` | `<what it changes>` | `<why this is still worth doing>` | `<focused command or review>` | `queued` |
| 2 | `<slice name>` | `<what it changes>` | `<why this is still worth doing>` | `<focused command or review>` | `queued` |

Queue rules:

- Commit and push after each completed queue slot when the project requires slice commits.
- Before starting the next slot, confirm the prior slot changed runtime behavior, test coverage, production guardrails, or decision clarity. If it only added ceremony, stop and report.
- Reorder or collapse queued slots when evidence shows a smaller path exists.
- Stop and ask before continuing if the queue becomes mostly descriptor-only, if validation cost is no longer proportional to the change, or if the next slot does not unlock a concrete executable step.
- Draft the next protocol from the remaining queue only after the closeout states what changed, what did not move, and what evidence justifies continuing.

## Sub-slices

Use this section only when `**Compound:** true`.

| # | Change | Files | Non-goals | Why bundled |
| --- | --- | --- | --- | --- |
| 1a | `<change>` | `<file>` | `<what remains out of scope>` | `<paired-diff/shared-gate/refactor-then-use reason>` |

Compound rules:

- One acceptance gate, one evidence set, and one closeout cover the compound slice.
- Each sub-slice keeps its own non-goals row.
- Compound is permitted only for `paired-diff`, `shared-gate`, or `refactor-then-use`.
- `combined for speed` is not a valid reason.
- Hard cap: three sub-slices.
- The descriptor rung check still applies per sub-slice for `arc` class work.

## Files in play

- `<file-1>`
- `<file-2>`
- `<file-3>`

## Validation speed option

Use this section when the normal focused command still loads a large accumulated suite or recursively builds expensive historical fixtures.

- Fast slice-local command: `<optional fast command, e.g. npm run test:<area>:active>`
- Active-slice test file: `<optional small test file>`
- Upstream fixture policy: use descriptor-shaped or minimal source objects for already-proven upstream artifacts; do not rebuild the full historical fixture chain for slice-local checks.
- Broad-suite policy: keep accumulated suites for explicit guard, integration, closeout, or periodic compatibility validation only.

## Non-goals

- `<non-goal-1>`
- `<non-goal-2>`

## Evidence

This slice commits the evidence set under `<arc>/<slice-id>/`:

- `notes/` — decision log, surprises, ruled-out options. Written as the slice runs, not after.
- `runs/` — raw command output and test logs. One file per validation pass. Filename: `YYYY-MM-DDTHH-MM-Z-<command-tag>.log`.
- `evidence/` — reviewer-facing proof that behavior changed: packet hex dumps, screenshot, before/after counter, replay diff, or equivalent artifact.

For `spike` and `hotfix`, `runs/` is the minimum evidence requirement. If a slice closes without all evidence expected for its class, the closeout must state what is missing and why.

## Acceptance

- `<fast slice-local verification command, if configured>`
- `<focused verification command, if fast slice-local coverage is unavailable>`
- `<broader verification command>`
