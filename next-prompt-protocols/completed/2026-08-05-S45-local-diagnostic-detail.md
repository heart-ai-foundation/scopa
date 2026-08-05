# S45 — Local Diagnostic Detail

**Class:** `arc`
**Module:** `boundary-doctor`
**Crosses:** [`adoption-experience`]
**Advances contracts:** [`OA2`]
**Compound:** false
**Status:** completed; OA2 satisfied; provider-off implementation only

## Why this exists

The canonical boundary diagnostic already records indicator IDs, categories,
counts, and repository-relative paths. Public `0.4.0` exposes those facts only
through JSON. Its default human diagnostic and shareable Markdown collapse the
same evidence into counts and generic phrases, so a local developer cannot
learn which surfaces were observed without parsing a machine envelope.

Privacy minimization is correct for shareable projections. Applying it to a
developer's local terminal removes the diagnosis's useful content.

## Next objective

Add one deterministic local-only human renderer for `scopa doctor`. Name every
detected and unknown indicator, show its category and count, and show bounded
repository-relative observed paths for detected indicators. Preserve the
short zero-argument snapshot and every canonical JSON/shareable projection
unchanged.

## Descriptor rung check

Executable unlock: a marker-rich local fixture produces readable named
diagnostic evidence while the corresponding JSON, Markdown, Boundary Card,
and pull-request projections prove that local paths never cross into a
shareable surface.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: a local diagnostic renderer, CLI routing, focused
  privacy/parity tests, and exact documentation output.
- New uncertainty reduced: whether useful repository-local detail can be shown
  without weakening the existing shareable privacy boundary.
- Validation: `npm run test:s45`, S34/S36/S44 regressions, docs audit, and
  protocol synchronization.
- Consecutive metadata/decision slice check: pass; S44 changed runtime output.
- Status-report alternative: insufficient because the missing behavior is an
  executable CLI surface.

## Productivity mix

- Runtime behavior: 45%
- Contract/test code: 45%
- Metadata/docs: 10%

## Files in play

- `packages/boundary-doctor/**`
- `packages/cli/**`
- `docs/BOUNDARY_DOCTOR.md`
- `package.json`
- `fixtures/S45/**`
- `notes/S45/**`
- `runs/S45/**`
- `evidence/S45/**`
- `next-prompt-protocols/**`

## Non-goals

- No change to the diagnostic schema, indicator computation, canonical JSON,
  digest, exit code, or completion/assurance semantics.
- No additional filesystem traversal, file-content indexing, environment
  inspection, command execution, provider call, or network probe.
- No repository paths, marker names, prompts, commands, or raw evidence in
  shareable Markdown, Boundary Cards, pull-request output, or badge content.
- No expansion of the zero-argument snapshot beyond its existing three-finding
  and one-next-action bound.
- No favorable interpretation of `not-detected`, `unknown`, or truncated scan
  state.
- No release, publication, hosted action, telemetry, account, lead capture, or
  external-system mutation.

## Evidence

Commit the slice trio under `notes/S45/`, `runs/S45/`, and `evidence/S45/`.
Retain exact local output for a marker-rich fixture and a reviewer-facing
local/shareable divergence record proving path absence from every shareable
projection.

## Acceptance

- `npm run test:s45`
- `npm run test:s34`
- `npm run test:s36`
- `npm run test:s44`
- `npm run test:s41`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Default interactive `scopa doctor` names detected and unknown indicators,
  categories, counts, and bounded repository-relative paths.
- `scopa` with no arguments retains the existing short snapshot.
- `doctor --format json` remains canonical and semantically identical.
- `doctor --format markdown`, `view`, and the pull-request surface contain none
  of the local fixture paths or marker names.
- Unknown and truncated evidence remain explicitly unknown; no absence becomes
  a favorable claim.

## Stop condition

Stop on diagnostic schema or JSON drift, new traversal or content reads,
zero-argument snapshot expansion, local path disclosure into any shareable
projection, favorable absence language, nondeterministic ordering, exit-code
drift, or any provider, network, publication, release, hosted, telemetry, or
external-system intent.
