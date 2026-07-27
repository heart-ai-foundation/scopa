# `scopa`

The developer CLI installs from the root `@heart-ai-foundation/scopa` package.
The package remains private during the developer-preview arc; S6 validates
local tarball installation only.

Every command except `--help` writes one canonical
`scopa.cli-result.v1` JSON object.

## Initialize

Create a closed slice definition in the target repository, then bind it:

```sh
scopa init --definition scopa.slice-definition.json
```

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

## Exit codes

| Code | Meaning |
|---:|---|
| 0 | Command completed |
| 1 | Unexpected runtime or configuration failure |
| 2 | Invalid command or arguments |
| 3 | Scope/tool request denied |
| 4 | Completion gates blocked |
| 5 | Evidence verification failed |
