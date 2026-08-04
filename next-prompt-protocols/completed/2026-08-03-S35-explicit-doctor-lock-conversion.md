# S35 — Explicit Doctor Lock Conversion

**Class:** `arc`
**Module:** `boundary-doctor`
**Crosses:** [`workflow-boundary-map`, `enforcement`, `distribution`]
**Advances contracts:** [`BD2`]
**Compound:** false
**Status:** completed; BD2 satisfied; provider, experiment, publication, release, customer, and hosted use remained closed

## Why this exists

S34 proves a boundary problem without changing the repository. Diagnosis only
becomes a developer tool when an explicitly reviewed minimum boundary can be
converted into real SCOPA control state without a second manual workflow or a
silent authority inference.

## Next objective

Add `scopa doctor --lock --definition <file> --matrix <file> --authority
<file>`. Read and validate every supplied input and capture the zero-state
diagnostic before creating `.scopa/`; then initialize through the existing
hardened project path, execute the declared gates, and return the actual
workflow map.

## Descriptor rung check

Executable unlock: one explicit command must move a clean repository from
diagnosis to a real initialized map while malformed input proves zero mutation.

## Anti-ceremony gate

- Classification: runtime guard.
- Executable change: prevalidated lock transaction, CLI flags, and hostile
  no-mutation/conflict corpus.
- New uncertainty reduced: whether the adoption wedge can close a discovered
  gap without guessing scope or weakening initialization.
- Validation: malformed inputs, conflicts, real passing/failing gates,
  idempotency, and after-map validation.
- Consecutive metadata/decision check: pass.
- Status-report alternative: insufficient; this slice changes actual control
  state through an explicit caller action.

## Productivity mix

- Runtime behavior: 50%
- Contract/test code: 45%
- Metadata/docs: 5%

## Files in play

- `packages/boundary-doctor/**`
- `packages/cli/**`
- `packages/enforcement/**` only if a shared prevalidation seam is unavoidable
- `packages/workflow-boundary-map/**` only for existing validators
- `fixtures/S35/**`
- `package.json`
- `notes/S35/**`
- `runs/S35/**`
- `evidence/S35/**`
- `next-prompt-protocols/**`

## Non-goals

- No automatic scope, gate, capability, or authority inference.
- No natural-language task parsing or model call.
- No overwrite, repair, merge, or amendment of conflicting `.scopa` state.
- No lock without all three explicit inputs.
- No publication, deployment, browser, credential, provider, network, hosted,
  customer, experiment, or external-system action.

## Evidence

Record transaction design, focused command output, and reviewer-facing
prevalidation/idempotency/map claims under `notes/S35/`, `runs/S35/`, and
`evidence/S35/`.

## Acceptance

- `--lock` requires definition, matrix, and authority inputs together.
- Every input is readable, schema-valid, repository-contained, and mutually
  coherent before `.scopa/` is created.
- Malformed or escaping input leaves the repository byte-identical.
- Initialization uses the existing safe control-directory and exclusive-file
  path and refuses conflicting state.
- A passing gate returns a validated after-map with `canStop: true`; a failing
  gate returns a truthful initialized result with `canStop: false`, not a false
  green.
- Exact repeat invocation is idempotent; changed input refuses overwrite.
- Focused S34-S35, CLI, diff, docs, and protocol checks pass.

## Stop condition

Stop on mutation before complete validation, inferred authority, overwrite,
false-green completion, invented map evidence, provider/network/hosted intent,
or scope beyond explicit lock conversion.
