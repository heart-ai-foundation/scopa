# S44 — Human-First Command Output — Evidence

**Slice:** S44
**Module:** `adoption-experience`
**Advances:** `OA1`
**Phase:** 14 — Legible Value and Organic Adoption
**Source baseline:** `4643cb3` (public 0.4.0)
**Provider calls:** none
**Network calls:** none beyond the one `npm pack` used to obtain the published
0.4.0 comparison tarball

## What changed

`begin`, `check`, `status`, and `doctor` render concise human text when standard
output is a terminal, and the unchanged canonical envelope when redirected,
piped, or run in CI. `--format human` and `--format json` select either
explicitly. `doctor --format markdown` now emits Markdown rather than Markdown
escaped inside a JSON envelope.

Terminal detection was chosen over changing the default outright. It delivers
the readable result to a person without spending the pre-1.0 compatibility
budget documented in `docs/VERSIONING.md`: a script, pipe, or CI job receives
byte-identical output to 0.4.0 with no flag change.

## Defects found and corrected during implementation

1. **Blocked `check` was unrenderable.** A blocked completion returns
   `ok: false` with the canonical stop state inside `error.details`, so the
   first renderer implementation fell back to the envelope for exactly the case
   a developer most needs to read. A blocked gate is a reportable result, not a
   command failure; `humanPayload` now renders the stop state carried in
   `SCOPA_COMPLETION_BLOCKED`.
2. **Gate counts read zero for failing gates.** Boundary-map gates carry a
   `status` string while canonical gate results carry `passed`/`timedOut`
   booleans. Both shapes reach these renderers. `gateOutcome` normalizes them,
   so a failing gate now reports `0 passed / 1 failed / 0 timed out` instead of
   `0 / 0 / 0`.

## Envelope compatibility

`--format json` and the piped default were compared against output captured
from the published 0.4.0 tarball for the same fixture and state, retained under
`fixtures/S44/baseline-0.4.0/`.

| Command | Piped default vs 0.4.0 | `--format json` vs 0.4.0 |
| --- | --- | --- |
| `status` | identical | identical |
| `check` | identical | identical |
| `doctor` | identical | identical |

Two fields are nondeterministic and normalized before comparison: the canonical
`durationMs` gate field, and the `duration_ms` values inside captured gate
stdout emitted by the fixture's own test reporter. No schema, field name, field
order, or exit code changed.

## Exit codes

| Command and state | Exit | Preserved |
| --- | --- | --- |
| `begin`, gates satisfied | 0 | yes |
| `begin`, truthful failing baseline | 4 | yes |
| `check`, satisfied | 0 | yes |
| `check`, blocked | 4 | yes |
| `status`, blocked | 0 | yes |
| `doctor` | 0 | yes |
| `doctor --format yaml` | usage error | new rejection, previously `--format must be json or markdown` |

## Acceptance results

- `npm run test:s44` — 11/11 pass
- `npm test` — full accumulated release gate, 563 assertions, 0 failures,
  exit 0
- `npm run test:docs` — documentation check passed, 38 files
- `node next-prompt-protocols/tools/sync-protocols.mjs --check` — no drift
- Human output for `status`, `check`, and `doctor` is at most 20 nonblank lines
- Human output contains none of `schema`, `sha256`, `SHA-256`, `canStop`,
  `lockHash`
- Human output contains none of `secure`, `safe`, `sandboxed`,
  `fully controlled`, `certified`
- `doctor --format markdown` output contains no `"schema"` key and no escaped
  newline sequences, and is not parseable as JSON
- `begin` human and JSON renders agree on completion, assurance, and surface
  counts; the human render omits the slice-lock digest

## Retained output

`runs/S44/` holds the exact human and JSON output for `begin`, `check`,
`status`, and `doctor` from a clean fixture repository, and the unwrapped
`doctor --format markdown` report.

## Non-goals held

No canonical schema, digest, exit code, or JSON field name changed. No gate
execution, assurance computation, authority default, lock creation, or
completion semantic changed. No new observation or diagnostic content was added;
naming currently-withheld local detail is S45. `view` and the pull-request
surface are untouched, so shareable-projection privacy bounds are unchanged. No
score, network probe, provider call, telemetry, publication, or release action
occurred.
