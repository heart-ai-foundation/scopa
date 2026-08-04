# S30 — Boundary Map CLI

**Class:** `arc`
**Module:** `workflow-boundary-map`
**Crosses:** [`enforcement`, `agent-surface`, `legibility`]
**Advances contracts:** [`WBM2`]
**Compound:** false
**Status:** completed; WBM2 satisfied; provider, experiment, publication,
release, and customer use remained closed

## Why this exists

S29 established truthful map semantics. Developers now need one stable,
provider-off command that derives those semantics from active SCOPA state and
returns matching machine and human projections.

## Next objective

Add `scopa map` with canonical JSON and concise Markdown renderings, optional
validated capability and authority inputs, and stale-state failure polarity.

## Descriptor rung check

Executable unlock: S30 creates the installed CLI consumed by the S31
point-and-go fixture and S32 portable assessment tooling.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: CLI parsing, active-state projection, rendering, and tests.
- New uncertainty reduced: whether a developer can inspect the real map with one command.
- Validation: CLI integration, stale-state, parity, and filesystem-diff tests.
- Consecutive metadata/decision check: pass.
- Status-report alternative: insufficient; S31 requires the actual installed command.

## Productivity mix

- Runtime behavior: 55%
- Contract/test code: 40%
- Metadata/docs: 5%

## Files in play

- `packages/workflow-boundary-map/**`
- `packages/cli/**`
- `schemas/**`
- `package.json`
- focused documentation and release-readiness policy
- `next-prompt-protocols/**`
- `notes/S30/**`
- `runs/S30/**`
- `evidence/S30/**`

## Non-goals

- No MCP tool-count or mutation-surface change.
- No automatic capability discovery claim.
- No hosted service, telemetry, customer upload, or proprietary renderer.
- No provider call, experiment, publication, release, deployment, or external mutation.

## Evidence

Record focused CLI and parity qualification under `runs/S30/` and
`evidence/S30/`.

## Acceptance

- `scopa map` defaults to the closed JSON map.
- Optional capability and authority files are validated and digest-bound.
- Markdown carries the same scope, completion, surfaces, statuses, and map hash.
- Missing inputs remain unknown.
- Conflicting or stale lock state fails closed.
- Map execution does not mutate repository product files under an observational gate.
- Focused CLI, S29, release-policy, docs, and protocol checks pass.

## Stop condition

Stop on semantic format drift, unknown-to-safe coercion, unbounded output,
private input echo, MCP expansion, or authority beyond provider-off local
implementation.
