# S37 — Instant Boundary Insight

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** [`boundary-doctor`, `distribution`]
**Advances contracts:** [`AX1`]
**Compound:** false
**Status:** completed; AX1 satisfied; provider-off implementation only

## Why this exists

SCOPA's zero-argument CLI currently prints usage, while the read-only Doctor's
Markdown mode returns a canonical JSON envelope whose visible projection is
mostly counts, hashes, and `review-required`. That preserves machine semantics
but delays the first developer insight. S37 must make doing nothing more than
running SCOPA in a repository immediately useful.

## Next objective

Make zero-argument `scopa` run a read-only, human-first boundary snapshot for
the current repository. It must present at most three prioritized observations,
clearly distinguish observed facts from unknown authority, and give one next
action. Preserve explicit `--help` and the existing canonical Doctor JSON
contract for automation.

## Descriptor rung check

Executable unlock: a clean repository fixture must obtain a useful plain-text
boundary result with zero configuration, zero repository mutation, and no
network or provider access.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: zero-argument CLI routing, deterministic finding
  prioritization, human renderer, and hostile first-run fixtures.
- New uncertainty reduced: whether SCOPA can provide understandable value
  before the developer reads protocol documentation or creates control files.
- Validation: focused CLI, rendering, no-mutation, privacy, and compatibility
  tests.
- Consecutive metadata/decision slice check: pass.
- Status-report alternative: insufficient; the missing behavior is executable.

## Productivity mix

- Runtime behavior: 50%
- Contract/test code: 40%
- Metadata/docs: 10%

## Files in play

- `packages/cli/**`
- `packages/boundary-doctor/**`
- `fixtures/S37/**`
- `package.json`
- `README.md`
- `docs/QUICKSTART.md`
- `docs/BOUNDARY_DOCTOR.md`
- `notes/S37/**`
- `runs/S37/**`
- `evidence/S37/**`
- `next-prompt-protocols/**`

## Non-goals

- No initialization, lock creation, policy inference, gate execution, package
  installation, assistant configuration, or repository write from the
  zero-argument path.
- No agent-authority claim derived from the Doctor process's filesystem or
  process access.
- No risk, safety, security, compliance, readiness, or certification score.
- No network probe, provider call, browser action, telemetry, account, lead
  capture, publication, release, or external-system action.
- No removal or semantic weakening of canonical JSON, explicit unknowns,
  source schemas, exit codes, privacy bounds, or hostile fixtures.

## Evidence

Commit the slice trio under `notes/S37/`, `runs/S37/`, and `evidence/S37/`.
Evidence must include exact default output for clean, configured, publication-
marked, truncated, and hostile-path fixtures; before/after filesystem
inventories; and JSON-to-human semantic parity.

## Acceptance

- `npm run test:s37`
- `npm run test:s34`
- `npm run test:s36`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Zero-argument source execution completes inside a five-second test budget on
  the bounded fixture and performs no write, network, provider, or discovered
  command execution.
- Default output is at most 20 nonblank lines, contains no schema or digest
  vocabulary, shows no more than three prioritized findings, distinguishes
  observation from unknown authority, and ends with one concrete next action.
- `scopa --help` still emits usage, and existing `scopa doctor` JSON and
  Markdown contracts remain byte- and exit-compatible unless a versioned
  compatibility change is explicitly justified.
- Every human statement is traceable to the canonical diagnostic; missing
  markers never become claims that a capability is unavailable.

## Stop condition

Stop on repository mutation, network or provider intent, private material,
authority overclaim, favorable absence language, more than one required user
decision before first value, compatibility drift, or a default result that
still requires SCOPA terminology to understand.
