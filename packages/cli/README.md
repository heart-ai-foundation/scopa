# SCOPA CLI

The `scopa` command is installed by the root
`@heart-ai-foundation/scopa` package. Running it without arguments prints a
short human-first repository snapshot. Explicit subcommands write one canonical
`scopa.cli-result.v1` JSON object.

## Install and run

Install the public release without lifecycle scripts:

```sh
npm install --ignore-scripts @heart-ai-foundation/scopa@0.3.0
```

The examples below use `scopa` as the command name. After a local installation,
run it as `npx scopa` or from an npm script. From a source checkout, use
`node packages/cli/src/cli.js`.

## First look

```sh
scopa
```

The zero-argument path creates no files and runs no discovered commands. It
prints at most three prioritized findings, separates observation from unknown
agent authority, and ends with one next action. Use `scopa --help` for command
documentation or `scopa doctor` for the complete machine-readable result.

## Diagnose and lock

Inspect a repository without creating `.scopa/` or running discovered commands:

```sh
scopa doctor
scopa doctor --format markdown
```

The first form returns `scopa.boundary-diagnostic.v1`. The second returns a
privacy-minimized Markdown report bound to the canonical diagnostic by
SHA-256. Neither form reads environment variables or probes the network.

After reviewing complete scope, capability, and authority declarations, create
the lock and run its gates in one transaction:

```sh
scopa doctor --lock \
  --definition scopa.slice-definition.json \
  --matrix scopa.capability-matrix.json \
  --authority scopa.authority-declarations.json
```

All three inputs validate before mutation. Add `--format markdown` for a
digest-bound before/after report. A failed gate exits `4`; it never becomes a
successful setup result. See [Boundary Doctor](../../docs/BOUNDARY_DOCTOR.md).

## Initialize

Create a closed [slice definition](../../docs/SLICE_DEFINITION.md), then bind
it to the repository:

```sh
scopa init --definition scopa.slice-definition.json
```

Initialization creates `.scopa/config.json` and `.scopa/slice-lock.json`.
Identical state is left unchanged, and conflicting files are never overwritten.

## Inspect, check, and write

```sh
scopa status
scopa check
scopa run --request-json \
  '{"name":"write_file","arguments":{"path":"src/example.js","content":"ok"}}'
```

- `status` observes the current state without running gates.
- `check` runs every declared gate and exits `4` while completion is blocked.
- `run` submits one tool request to the trusted reference host. It is not an
  agent adapter and does not imply Claude or Codex conformance.

## Map and assess

Create a deterministic Workflow Boundary Map:

```sh
scopa map
scopa map --matrix capability-matrix.json --authority authority.json
scopa map --matrix capability-matrix.json --authority authority.json --format markdown
```

Without a capability matrix or authority declarations, required surfaces stay
`unknown`. Markdown remains inside the canonical JSON envelope and is bound to
its source map.

Create a sanitized offline assessment, optionally compared with a baseline:

```sh
scopa assess --map current-map.json
scopa assess --map current-map.json --baseline baseline-map.json
```

The assessment contains structural metrics and regression polarity. It omits
raw paths, non-goal prose, prompts, gate output, provider output, and capability
evidence prose.

## Verify evidence

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

Evidence, signature, trust-policy, and CASE-recovery failures return
`SCOPA_EVIDENCE_VERIFICATION_FAILED` with exit `5`. Unreadable input or trust
roots return exit `1`; invalid command syntax returns exit `2`.

## Exit codes

| Code | Meaning |
| ---: | --- |
| 0 | Command completed |
| 1 | Runtime or configuration failure |
| 2 | Invalid command or arguments |
| 3 | Scope or tool request denied |
| 4 | Completion gates blocked |
| 5 | Evidence verification failed |
