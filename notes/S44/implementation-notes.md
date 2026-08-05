# S44 implementation notes

## Render seam

`runCli` in `packages/cli/src/app.js` already special-cased `demo` and `view` to
write human content instead of the envelope. S44 extends that existing pattern
rather than introducing a formatting layer: a `HUMAN_RENDERERS` map, a
`requestedFormat` reader, and a `humanRender` guard. `doctor --format markdown`
joins the same chain because unwrapping it is the same operation `demo` performs.

`doctor`'s human render reuses `renderBoundarySnapshot` from
`packages/boundary-doctor`, which S37 already proved. `scopa` and `scopa doctor`
therefore produce the same snapshot, which is coherent: the bare invocation is a
doctor call.

## Terminal detection

`options.isTty ?? process.stdout.isTTY === true`. The injectable option exists so
tests can exercise the terminal default under a piped harness, where
`process.stdout.isTTY` is false.

`doctor --lock` returns a terminal map rather than a diagnostic, so it is
excluded from the human path and keeps its envelope.

## Two shapes of gate result

Boundary-map gates (`scopa.workflow-boundary-map.v1`) carry
`status: 'passed' | 'failed' | 'timed-out'`. Canonical gate results
(`scopa.gate-result.v1`) carry `passed` and `timedOut` booleans plus `exitCode`.
Both reach the renderers — `begin` reads the map, `check` reads gate results.
`gateOutcome` normalizes to the status vocabulary; do not assume either shape.

## Blocked completion is a result, not a failure

`check` on a blocked slice returns `ok: false`, exit 4, with the canonical stop
state under `error.details` and code `SCOPA_COMPLETION_BLOCKED`. Any renderer
gated on `envelope.ok` will silently skip the most important case. `humanPayload`
handles this explicitly and narrowly — only that command, only that code.

## Compatibility choice

`docs/VERSIONING.md` permits incompatible minor changes while major is 0, so
changing the default outright was available. Terminal detection was chosen
instead because it costs nothing: automation keeps byte-identical output with no
flag change, and the compatibility budget stays unspent for a case that needs it.

The one genuine behavior change is `doctor --format markdown`, which no longer
returns a JSON envelope. A pipeline extracting the report with
`jq -r '.result.content'` must read the command output directly, or switch to
`--format json`. This is documented in `CHANGELOG.md` and
`docs/BOUNDARY_DOCTOR.md`.
