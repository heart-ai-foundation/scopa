# Next Prompt Protocol Module Block Loop

Use this pattern when a production module needs unattended progress across a
larger portion of work while still preserving commit-sized evidence and rollback
points.

## Loop Name

Canonical name: `next prompt protocol module block loop`

Short form: `module block loop`

Migration-moving variant: `next prompt protocol migration block loop`
(`migration block loop`). Use `migration-block-loop.template.md` when the block
must include Rust/WASM execution, measured parity, replay activation, or
handoff-readiness movement rather than only guard or contract machinery.

## When to Use

- The user explicitly asks for a larger loop, production-speed work, or work
  that can continue while they are away.
- The module has a coherent block goal that can be split into 3-6 executable
  slices.
- Each slice can produce code, tests, runtime guardrails, browser assertions,
  validation commands, or a necessary tracker update.
- The project requires evidence, commit, and push after each completed slice.
- The final slice in the block may update the cutover tracker or macro tracker
  after executable slices have landed.

## When Not to Use

- The next work is exploratory and lacks a known executable direction.
- The queue is mostly closeout, approval, archive, summary, or descriptor-only
  work.
- Any slice would require production enablement, runtime ownership transfer, or
  broad refactor without an explicit approval gate.
- The validation cost for each slice is no longer proportional to the change.
- The active repo or memory state is dirty in a way that makes scoped commits
  ambiguous.

## Block Shape

Each block must declare:

- **Block goal:** one concrete module outcome.
- **Module:** the structural owner.
- **Slice count:** normally 3-6 slices.
- **Stop boundary:** the condition that ends unattended progress.
- **Production policy:** what remains disabled until explicit approval.
- **Evidence policy:** where slice evidence is written.

Preferred block order:

1. Runtime or contract-producing slice.
2. Consumer, router, guard, or adapter slice.
3. Browser, integration, or CI assertion slice.
4. Downstream candidate/result slice when useful.
5. Tracker refresh only after executable slices land.

## Per-Slice Contract

Every slice inside the block must finish with:

1. Scoped implementation or test change.
2. Focused validation.
3. Evidence JSON or configured evidence artifact.
4. Commit.
5. Push.
6. Working tree check before continuing.

Do not defer evidence, commit, or push to the end of the block. The block is a
planning unit; the slice remains the recovery unit.

## Block Steps

1. Read `manifest.json`, role context, phase context, active protocol, current
   tracker, and recent evidence for the module.
2. State the block goal and 3-6 slice queue before editing files.
3. Confirm every queued slice has an executable value gate.
4. Execute slice 1 through the per-slice contract.
5. Re-read repo status and newest evidence.
6. Continue only if the next slice still advances the block goal.
7. Repeat until the block stop boundary or tracker refresh slice is complete.
8. End with a concise block summary listing commits, evidence files,
   validations, and what still did not move.

## Slice Queue Table

Use this table in active protocols that invoke the block loop:

| Slot | Slice | Class | Purpose | Value gate | Validation gate | Evidence file | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `<slice>` | `<implementation/test/runtime guard/tracker>` | `<what changes>` | `<why now>` | `<command>` | `<path>` | `queued` |
| 2 | `<slice>` | `<implementation/test/runtime guard/tracker>` | `<what changes>` | `<why now>` | `<command>` | `<path>` | `queued` |
| 3 | `<slice>` | `<implementation/test/runtime guard/tracker>` | `<what changes>` | `<why now>` | `<command>` | `<path>` | `queued` |

## Stop Conditions

- A slice fails validation and the fix is not narrow.
- The next slice is ceremony-only.
- Two consecutive slices would be tracker, closeout, decision, or descriptor
  work.
- A slice would enable production handoff, runtime publication, runtime packet
  promotion, or runtime ownership transfer without a named approval gate.
- A generated artifact or unrelated user change makes scoped commits unsafe.
- The tracker slice is complete.
- The user asks to pause, report, or change direction.

## Canonical Closeout Line

When using this loop, close the block with:

`Completed module block loop <block-goal>; pushed slices <sha-list>; evidence <evidence-list>; tracker <updated|not-updated>; continuing only if the next block has an executable value gate.`

## Canonical Slice Closeout Line

For each slice inside the block:

`Completed block slice <slice>; committed <sha>; pushed <branch>; evidence <path>; continuing block because <next executable value gate>.`
