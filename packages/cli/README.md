# `scopa`

The developer CLI installs from the root `@heart-ai-foundation/scopa` package.
Install the current public release with lifecycle scripts disabled:

```sh
npm install --ignore-scripts @heart-ai-foundation/scopa@0.2.0
```

Every command except `--help` writes one canonical
`scopa.cli-result.v1` JSON object.

## Diagnose before initialization

```sh
scopa doctor
scopa doctor --format markdown
```

The first form returns the read-only `scopa.boundary-diagnostic.v1`. The second
returns a `scopa.boundary-doctor-report.v1` whose Markdown `content` and summary
are SHA-256-bound to the canonical diagnostic. Neither form creates `.scopa`,
executes a discovered command, reads environment variables, or probes the
network.

Convert a complete reviewed declaration set into control state and the actual
terminal map:

```sh
scopa doctor --lock \
  --definition scopa.slice-definition.json \
  --matrix scopa.capability-matrix.json \
  --authority scopa.authority-declarations.json
```

All three inputs are required and validate before mutation. Add `--format
markdown` for a digest-bound, path-free before/after projection. Gate failure
returns exit `4` with a blocked result, never a successful setup envelope. See
the [Boundary Doctor guide](../../docs/BOUNDARY_DOCTOR.md) for limits, privacy,
schemas, and assurance boundaries.

## Initialize

Create a closed slice definition in the target repository, then bind it:

```sh
scopa init --definition scopa.slice-definition.json
```

See the [slice-definition reference](../../docs/SLICE_DEFINITION.md) and its
[JSON Schema](../../schemas/scopa.slice-definition.v1.schema.json).

Initialization creates `.scopa/config.json` and
`.scopa/slice-lock.json`. Existing identical files are left unchanged.
Conflicting files are never overwritten.

## Operate

```sh
scopa status
scopa check
scopa run --request-json \
  '{"name":"write_file","arguments":{"path":"src/example.js","content":"ok"}}'
```

`status` reports the current orientation even when completion is blocked.
`check` returns exit `4` when any declared verification gate fails. `run`
submits one raw tool request to the trusted reference host; it is not an agent
adapter and does not imply Claude or Codex conformance.

## Map the workflow boundary

```sh
scopa map
scopa map --matrix capability-matrix.json --authority authority.json
scopa map --matrix capability-matrix.json --authority authority.json --format markdown
```

The default result is `scopa.workflow-boundary-map.v1`. Without a capability
matrix or explicit authority declarations, required surfaces remain `unknown`.
Markdown output stays inside the canonical CLI envelope as a
digest-bound `scopa.workflow-boundary-map-render.v1` result.

Create a sanitized offline assessment packet from a saved map, optionally
compared with a baseline:

```sh
scopa assess --map current-map.json
scopa assess --map current-map.json --baseline baseline-map.json
```

The packet contains structural metrics, committed identifiers, and regression
polarity. It excludes raw path text, non-goal prose, prompts, gate output,
provider output, and capability evidence prose.

## Verify

```sh
scopa verify \
  --packet evidence.json \
  --timestamp-roots tsa-root.pem \
  --require-timestamp \
  --timestamp-authority-id example-authority \
  --timestamp-signer-sha256 <sha256>
```

Use `--case-export` instead of `--packet` to recover and verify a native packet
from a SCOPA CASE export.

Evidence-content, signature, trust-policy, and CASE recovery failures return
the stable `SCOPA_EVIDENCE_VERIFICATION_FAILED` envelope and exit `5`.
Unreadable input or trust-root files remain runtime/configuration failures and
return exit `1`; invalid command syntax returns exit `2`.

## Exit codes

| Code | Meaning |
|---:|---|
| 0 | Command completed |
| 1 | Unexpected runtime or configuration failure |
| 2 | Invalid command or arguments |
| 3 | Scope/tool request denied |
| 4 | Completion gates blocked |
| 5 | Evidence verification failed |
