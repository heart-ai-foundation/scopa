# S6 Validation Run

Date: 2026-07-27
Base commit: `7392d440456a`
Node: `v22.22.2`
npm: `10.9.7`

## Focused gate

Command: `npm run test:s6`

Result: 7 passed, 0 failed.

The suite covered idempotent initialization, overwrite refusal, symlinked
control-directory refusal, non-mutating status in an uninitialized
repository, real failing-gate observation and rejection, allowed and denied
tool calls, retained FreeTSA packet verification under caller trust policy,
and installation from a local tarball in a fresh consumer repository.

## Accumulated release gate

Command: `npm test`

Result: 83 passed, 0 failed. Both injected negative conformance probes failed
as expected, while both clean probes passed.

## Package boundary

Command: `npm pack --dry-run --json`

Result: one `@heart-ai-foundation/scopa@0.0.0` tarball candidate with 90
entries and no `.github/`, `evidence/`, `fixtures/`,
`next-prompt-protocols/`, `notes/`, `runs/`, `spec/`, `.log`, `.pem`, or
`.tmp` path.

The clean-install test built the real tarball, installed it with scripts,
audit, funding lookup, and package-lock generation disabled, resolved the
consumer-local binary, and exercised `init`, `status`, `check`, `run`, and
`verify`.

## Sandbox note

The focused test wrapper was run with permission to spawn its temporary Node
and npm child processes. The earlier managed-sandbox failure was an
environmental process-launch denial, not a SCOPA test result.
