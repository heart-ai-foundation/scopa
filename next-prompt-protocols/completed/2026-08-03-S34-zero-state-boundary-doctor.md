# S34 — Zero-State Boundary Doctor

**Class:** `arc`
**Module:** `boundary-doctor`
**Crosses:** [`workflow-boundary-map`, `distribution`]
**Advances contracts:** [`BD1`]
**Compound:** false
**Status:** completed; BD1 satisfied; provider, experiment, publication, release, customer, and hosted use remained closed

## Why this exists

The initialized workflow map proves SCOPA's configured boundary, but it cannot
show a new developer why the boundary matters before setup. S34 adds a distinct
zero-state diagnostic whose evidence is limited to bounded repository and host
process observations and whose vocabulary cannot be mistaken for agent
assurance.

## Next objective

Implement a versioned, schema-valid, deterministic `scopa doctor` result for an
uninitialized repository. Detect repository instruction, agent configuration,
completion-candidate, authority-sensitive, and host-process indicators without
reading file content beyond a small closed set of structured manifests.

## Descriptor rung check

Executable unlock: an installed CLI test must obtain useful boundary findings
before `.scopa/` exists and prove byte-stable repeat observation with no writes.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: bounded discovery package, public schema, CLI command, and
  hostile zero-state corpus.
- New uncertainty reduced: whether SCOPA can demonstrate a truthful personal
  control gap before configuration.
- Validation: focused diagnostic and CLI tests plus no-mutation inventory.
- Consecutive metadata/decision check: pass.
- Status-report alternative: insufficient; the missing value is executable
  diagnosis.

## Productivity mix

- Runtime behavior: 55%
- Contract/test code: 40%
- Metadata/docs: 5%

## Files in play

- `packages/boundary-doctor/**`
- `packages/cli/**`
- `schemas/scopa.boundary-diagnostic.v1.schema.json`
- `fixtures/S34/**`
- `package.json`
- `notes/S34/**`
- `runs/S34/**`
- `evidence/S34/**`
- `next-prompt-protocols/**`

## Non-goals

- No initialization, lock generation, file write, gate execution, or discovered
  command execution in S34.
- No environment-variable enumeration, credential-value access, network probe,
  provider call, browser action, telemetry, or file-content indexing.
- No claim about an agent's available tools from the diagnostic process's own
  filesystem or process authority.
- No generic risk, security, compliance, or safety score.

## Evidence

Record design decisions, focused command output, and reviewer-facing
no-mutation/privacy/determinism claims under `notes/S34/`, `runs/S34/`, and
`evidence/S34/`.

## Acceptance

- Uninitialized diagnosis succeeds and initialized state is reported only as a
  detected marker.
- Traversal is repository-contained, symlink-opaque, deterministically sorted,
  depth/entry bounded, and explicit when truncated.
- Structured manifest reads are size bounded; other file contents are not read.
- Findings distinguish `detected`, `not-detected`, and `unknown`; a missing
  marker never claims a capability is disabled.
- Output excludes absolute paths, environment names/values, raw file content,
  prompts, credentials, and network-derived data.
- Repeated diagnosis returns canonical identical bytes and creates no file.
- Focused tests, docs check, diff check, and protocol check pass.

## Stop condition

Stop on mutation, symlink traversal, unbounded resource use, private data,
agent-authority overclaim, ambiguous absence language, provider/network intent,
or scope beyond the approved diagnostic seam.
