# Next Prompt Protocol Migration Block Loop

Use this pattern when the project needs a larger unattended block that moves
actual migration state, not only guardrails or tracker metadata.

## Loop Name

Canonical name: `next prompt protocol migration block loop`

Short form: `migration block loop`

## When to Use

- The user asks to go bigger for a time-boxed cutover target.
- The current module has a known source runtime path and a known target runtime
  path.
- The block can include at least one Rust/WASM execution, Rust/WASM consumer,
  measured parity, replay activation, or ownership-readiness movement slice.
- The project still requires evidence, commit, and push after each completed
  slice.

## Hard Requirement

Every migration block must contain at least one migration movement slice:

- Rust/WASM code executes or consumes a real fixture/packet.
- JS/WebGL and Rust/WASM outputs are compared through a measured parity result.
- A replay fixture enters a test or CI path.
- A runtime handoff candidate consumes measured parity instead of only metadata.
- A guarded owner-switch readiness decision consumes real execution evidence.

If the block cannot name this slice before editing files, use the module block
loop instead or stop and report.

## Block Shape

Each block declares:

- **Migration goal:** the runtime behavior that moves closer to Rust/WASM
  ownership.
- **Source owner:** the current owner, usually JS/WebGL.
- **Target owner:** the candidate owner, usually Rust/WASM.
- **Migration movement slice:** the slice that proves execution, parity, replay,
  or handoff-readiness movement.
- **Safety policy:** production handoff, runtime publication, and runtime
  ownership remain disabled unless explicitly approved.
- **Evidence policy:** evidence is written after every slice.

Preferred block order:

1. Rust/WASM candidate or consumer slice.
2. JS/WebGL versus Rust/WASM parity/replay measurement slice.
3. Guard or owner-switch readiness slice that consumes the measurement.
4. Browser or CI assertion slice.
5. Tracker refresh after migration movement is proven.

## Per-Slice Contract

Every slice inside the block must finish with:

1. Scoped implementation or test change.
2. Focused validation.
3. Evidence JSON or configured evidence artifact.
4. Commit.
5. Push.
6. Working tree check before continuing.

The block is a migration planning unit; the slice remains the rollback unit.

## Stop Conditions

- No remaining queued slice moves execution, measured parity, replay activation,
  or handoff readiness.
- A slice would enable production handoff, runtime publication, runtime packet
  promotion, or runtime ownership transfer without explicit approval.
- The Rust/WASM candidate cannot consume the intended fixture/packet without a
  broad refactor.
- Measured parity fails and the fix is not narrow.
- The next slice is ceremony-only.
- The user asks to pause, report, or change direction.

## Slice Queue Table

| Slot | Slice | Class | Migration movement | Purpose | Validation gate | Evidence file | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `<slice>` | `<implementation/test/runtime guard/tracker>` | `<execution/parity/replay/handoff-readiness/none>` | `<what changes>` | `<command>` | `<path>` | `queued` |
| 2 | `<slice>` | `<implementation/test/runtime guard/tracker>` | `<execution/parity/replay/handoff-readiness/none>` | `<what changes>` | `<command>` | `<path>` | `queued` |
| 3 | `<slice>` | `<implementation/test/runtime guard/tracker>` | `<execution/parity/replay/handoff-readiness/none>` | `<what changes>` | `<command>` | `<path>` | `queued` |

## Canonical Closeout Line

`Completed migration block loop <migration-goal>; migration movement <execution|parity|replay|handoff-readiness>; pushed slices <sha-list>; evidence <evidence-list>; tracker <updated|not-updated>; runtime ownership <moved|not-moved>.`
