# SCOPA CLI

The `scopa` command is installed by the root
`@heart-ai-foundation/scopa` package. Running it without arguments prints a
short human-first repository snapshot.

`begin`, `check`, `status`, and `doctor` print concise human text at a terminal
and one canonical `scopa.cli-result.v1` JSON object when redirected or piped;
`--format human` and `--format json` select either explicitly. Every other
subcommand writes the canonical JSON object.

## Install and run

Install the public release without lifecycle scripts:

```sh
npm install --ignore-scripts @heart-ai-foundation/scopa@0.4.0
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

## See three real enforcement failures

```sh
scopa demo
```

The deterministic demo uses an isolated temporary repository to exercise the
real scope dispatcher, completion gate, and capability-matrix validator. It
then performs one allowed correction, verifies `canStop: true` with `partial`
assurance, and removes the fixture. Use `--format json` for the bound result.
See [demo proof](../../docs/DEMO.md).

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

## Begin from one task boundary

In this source version, `begin` accepts one closed JSON request instead of
three caller-authored policy files:

```sh
scopa begin --request-json '{"schema":"scopa.begin-request.v1","sliceId":"logging","outcome":"Add request-ID logging","allowedPaths":["src/**","test/**"],"gates":[{"id":"tests","command":["npm","test"],"cwd":".","timeoutMs":120000}],"nonGoals":["No dependency changes"],"clientProfile":"generic"}'
```

SCOPA validates everything before mutation, creates default-closed authority
and conservative capability declarations, initializes the lock, runs the real
gates, and returns the terminal Boundary Map. A blocked map exits `4`.
Conflicting state is never overwritten. See [Begin a governed task](../../docs/BEGIN.md).

## Add a project-local assistant skill

```sh
scopa assistant detect
scopa assistant install --dry-run
scopa assistant install
scopa assistant uninstall --dry-run
scopa assistant uninstall
```

Auto-detection recognizes Claude Code, Codex, and generic Agent Skills markers.
Use `--client claude-code`, `--client codex`, or `--client generic` when a clean
repository has no unique marker. Install creates one no-replace skill and a
hash-bound receipt under `.scopa/`; uninstall removes only unchanged,
receipt-bound bytes. No user-global configuration is read or written. See
[assistant installation](../../docs/ASSISTANT_INSTALLATION.md).

At a terminal, assistant actions render a concise human summary. Redirects and
pipes retain the canonical envelope; automation should add `--format json`.

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

After `scopa begin`, `map` uses the validated runtime-owned declarations.
Otherwise, without a capability matrix or authority declarations, required
surfaces stay `unknown`. Markdown remains inside the canonical JSON envelope
and is bound to its source map.

Render the active map as a privacy-minimized human Boundary Card:

```sh
scopa view
scopa view --format html --output scopa-boundary.html
scopa view --format json --output scopa-boundary.json
scopa view --format badge --output scopa-boundary.svg
```

Unlike machine-oriented subcommands, `view` prints its selected presentation
directly. With `--output`, it writes exact repository-contained bytes with
no-replace semantics and prints the byte count, digest, and the fact that this
explicit evidence export is outside the locked task mutation boundary. A
subsequent card counts an untracked outside-path export without disclosing its
path. The standalone
HTML contains no script, remote asset, telemetry, path, prompt, raw gate
output, or capability evidence. The SVG badge states assurance and aggregate
tracked and untracked observation facts without a grade or pass mark. See
[Boundary Card](../../docs/BOUNDARY_CARD.md).

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
