# S36 — Shareable Doctor Proof and Installed Qualification

**Class:** `arc`
**Module:** `boundary-doctor`
**Crosses:** [`workflow-boundary-map`, `distribution`, `agent-surface`]
**Advances contracts:** [`BD3`]
**Compound:** false
**Status:** completed; BD3 satisfied; provider, experiment, publication, release, customer, and hosted use remained closed

## Why this exists

S34 makes the control gap visible and S35 converts explicit declarations into
an enforced lock. The adoption wedge is not complete until a developer can
share a legible before/after result whose exact JSON source is cryptographically
bound, whose projection excludes private workflow material, and whose entire
journey works from the installed package in fresh processes.

## Next objective

Add `scopa doctor --format markdown` and lock-mode Markdown as a versioned,
digest-bound projection of the corresponding validated JSON result. Omit
repository paths, identifiers supplied by the workflow, credential and
environment names or values, raw content, prompts, and gate output; then prove
the zero-state-to-lock journey from a packed install with no target dependency
manifest and document it as SCOPA's primary adoption path.

## Descriptor rung check

Executable unlock: one installed binary must diagnose an uninitialized target,
lock it from explicit declarations, emit a shareable proof, and reproduce that
proof's semantic binding from a cold process.

## Anti-ceremony gate

- Classification: test/validation with a public runtime projection.
- Executable change: Markdown renderer, digest validator, installed journey,
  package inventory, and primary-path docs.
- New uncertainty reduced: whether the adoption promise survives packaging and
  whether its shareable form can prove provenance without leaking workflow
  material.
- Validation: JSON/Markdown digest parity, hostile private strings, packed
  source-free install, clean/cold processes, and accumulated provider-off gates.
- Consecutive metadata/decision check: pass.
- Status-report alternative: insufficient; distribution and privacy behavior
  must be executable.

## Productivity mix

- Runtime behavior: 30%
- Contract/test code: 50%
- Documentation and closeout: 20%

## Files in play

- `packages/boundary-doctor/**`
- `packages/cli/**`
- `packages/release-readiness/**`
- `packages/agent-surface/**`
- `schemas/**`
- `fixtures/S36/**`
- `README.md`
- `SCOPA_AGENT.md`
- `docs/**`
- `package.json`
- `package-lock.json` only if package metadata requires it
- `notes/S36/**`
- `runs/S36/**`
- `evidence/S36/**`
- `next-prompt-protocols/**`

## Non-goals

- No public release, tag, push, publication, deployment, announcement, badge,
  certification, telemetry, hosted report, account, or lead capture.
- No model/provider call, experiment action, browser action, customer material,
  external-system use, or network probe.
- No automatic inference of scope, gates, capabilities, or authority.
- No full report of repository paths, gate identifiers, allowed paths,
  non-goals, client names, or other caller-supplied workflow strings in the
  shareable Markdown projection.
- No generic risk, safety, compliance, security, or maturity score.

## Evidence

Record the projection contract, privacy corpus, installed clean/cold journey,
package inventory, accumulated qualification, and unchanged closed postures
under `notes/S36/`, `runs/S36/`, and `evidence/S36/`.

## Acceptance

- JSON remains the default doctor output; `--format markdown` is explicit and
  rejects unsupported values before mutation.
- Every Markdown result names its schema and SHA-256 binding to the canonical
  validated JSON result; recomputation proves parity.
- Markdown exposes diagnosis and, when present, completion/assurance summary
  semantics without paths, workflow identifiers, credential/environment names
  or values, raw file content, prompts, or gate output.
- Blocked lock mode retains a blocked exit and a shareable blocked projection;
  formatting cannot turn failure green.
- A packed install diagnoses and locks a target with no `package.json`, local
  dependency tree, or source checkout; a cold process reproduces the bound
  terminal semantics.
- The packed inventory contains every required runtime/schema/fixture/doc byte
  and no private evidence or protocol material.
- Focused S34-S36, CLI, installed, docs, audit, diff, protocol, and full
  provider-off qualification pass.

## Stop condition

Stop on digest mismatch, private-string disclosure, format-dependent semantics,
false-green blocked output, target dependency setup, missing packed bytes,
network/provider intent, or scope beyond the approved adoption wedge.
