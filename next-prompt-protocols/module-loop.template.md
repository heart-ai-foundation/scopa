# Next Prompt Protocol Module Loop

Use this pattern when a production module has a visible series of narrow
protocol slices and the project requires one commit per completed slice.

## Loop Name

Canonical name: `next prompt protocol module loop`

Short form: `module loop`

Larger unattended variant: `next prompt protocol module block loop`
(`module block loop`). Use `module-block-loop.template.md` when the user wants
3-6 meaningful slices executed as one coherent production-speed block while
still committing, pushing, and evidencing each slice independently.

## When to Use

- The active protocol belongs to a named module.
- The slice queue or active context identifies the next logical slice.
- Each slice can produce executable code, test coverage, runtime guardrails, or
  decision clarity.
- The project requires commit and push after each completed slice.
- Rotation is automated by the project protocol tooling.

Use the block-loop variant instead when the next work has a coherent block goal
and several obvious executable follow-on slices. The standard module loop is
slice-sized; the block loop is block-sized while preserving slice recovery
points.

## Loop Steps

1. Read `manifest.json`, role context, phase context, and the active protocol.
2. Confirm the active slice is not ceremony and has a concrete validation gate.
3. Implement only the active slice.
4. Record notes, evidence, and run metadata while the slice is in progress.
5. Run the focused validation named by the protocol.
6. Run protocol validation before commit when the project requires it.
7. Commit the slice with a message that names the module outcome.
8. Rotate to the next active protocol using the committed SHA.
9. Run protocol validation after rotation.
10. Push the branch.
11. Re-read the rotated active protocol and continue the loop only if the next
    slice still unlocks executable progress.

## Stop Conditions

- The next slice is ceremony-only.
- The next slice is the second consecutive decision or handoff artifact without
  an executable guard, validator, probe, test, or runtime path.
- Validation cost is no longer proportional to the change.
- The slice queue is stale or mostly descriptor-only.
- The rotated active protocol conflicts with repo state.
- The user asks to pause, report, or change direction.

## Canonical Closeout Line

When using this loop, close each slice with:

`Completed <slice>; committed <sha>; rotated active protocol to <next-slice>; pushed <branch>; continuing module loop because <evidence-backed reason>.`
