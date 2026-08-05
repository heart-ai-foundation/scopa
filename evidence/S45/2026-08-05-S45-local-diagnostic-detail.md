# S45 local diagnostic detail evidence

## Result

`scopa doctor` now has a deterministic local-only human projection that names
every detected and unknown indicator, its category and count, and bounded
repository-relative paths for detected evidence. The marker-rich exact fixture
is `fixtures/S45/expected-local-diagnostic.txt` and contains 20 nonblank lines.

The zero-argument `scopa` snapshot is unchanged. Canonical JSON is unchanged
behind `--format json`. Shareable doctor Markdown, Boundary Card, and
pull-request projections do not consume the local renderer and retain their
existing privacy bounds.

## Polarity proved

- A marker-rich repository exposes marker names and relative paths locally.
- The same names and paths are absent from the short snapshot and minimized
  Markdown proof.
- Truncated inventory reports an incomplete scan and retains unknown status.
- `not-detected` is described only as a marker not observed, never as a safe or
  disabled route.
- Absolute fixture roots, file contents, environment values, and instructions
  never appear in output.

## Validation

Focused S45, Boundary Doctor S34/S36, human-output S44, PR S41,
documentation, protocol, and diff-hygiene gates passed provider-off. Exact
commands and results are retained in
`runs/S45/2026-08-05T17-50Z-validation.log`.

## Non-claims

This renderer does not inspect agent authority, probe a network, read arbitrary
file contents, establish safety/compliance, change completion or assurance, or
make local paths shareable.
