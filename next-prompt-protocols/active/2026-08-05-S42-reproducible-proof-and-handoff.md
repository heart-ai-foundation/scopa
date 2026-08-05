# S42 — Reproducible Proof and Consultation Handoff

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** [`enforcement`, `distribution`]
**Advances contracts:** [`AX6`]
**Compound:** false
**Status:** active; provider-off implementation only

## Why this exists

SCOPA now has a simpler journey and shareable surfaces, but new developers are
still asked to trust the product's claims before seeing it catch a concrete
failure. S42 makes the value independently visible first and places optional
organizational consultation only after the free proof is complete.

## Next objective

Add one provider-off `scopa demo` command that creates an isolated temporary
fixture and mechanically proves scope escape denial, asserted-completion
rejection, and uncontrolled-route assurance-overclaim rejection, then reaches
a truthful terminal state and cleans up. Bind README and demo documentation to
exact output, and add a transparent optional organizational-review handoff
without lead capture or gated free functionality.

## Descriptor rung check

Executable unlock: one command must make three distinct control failures and
their final correction observable through real SCOPA runtime paths with no
target-repository setup or mutation.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: isolated demo runner, real injected faults, stable CLI
  output, exact-output docs test, cleanup proof, and optional handoff.
- New uncertainty reduced: whether a first-time developer can see SCOPA's value
  without understanding its architecture or trusting marketing prose.
- Validation: fault polarity, no staged success, exact bytes, target no-write,
  cleanup, installed compatibility, no telemetry/network, and free-result
  completeness.
- Consecutive metadata/decision slice check: pass.
- Status-report alternative: insufficient; the proof command does not exist.

## Productivity mix

- Runtime behavior: 45%
- Contract/test code: 40%
- Documentation and handoff: 15%

## Files in play

- `packages/adoption-experience/**`
- `packages/cli/**`
- `packages/enforcement/**`
- `packages/agent-surface/**`
- `packages/release-readiness/**`
- `fixtures/S42/**`
- `README.md`
- `docs/**`
- `package.json`
- `notes/S42/**`
- `runs/S42/**`
- `evidence/S42/**`
- `next-prompt-protocols/**`

## Non-goals

- No staged or hard-coded pass result disconnected from real runtime faults.
- No benchmark, adoption, popularity, performance, security, safety,
  certification, compliance, readiness, or guaranteed-prevention claim.
- No target repository mutation, retained temporary state, raw private path,
  prompt, secret, environment map, provider output, or gate output.
- No telemetry, analytics, lead capture, account, email gate, hosted result,
  paid verifier, or withholding of any free result.
- No provider/model call, experiment, network probe, customer action,
  publication, release, deployment, or external-system mutation.

## Evidence

Commit the slice trio under `notes/S42/`, `runs/S42/`, and `evidence/S42/`.
Evidence must bind injected fault definitions, runtime results, exact terminal
bytes, docs parity, before/after target inventory, temporary cleanup, no-
network proof, and the complete-free-result/optional-handoff boundary.

## Acceptance

- `npm run test:s42`
- `npm run test:s41`
- `npm run test:s38`
- `npm run test:s2`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- `scopa demo` uses real dispatcher, gate, and capability-matrix validators;
  all three injected false claims are rejected and the allowed correction
  reaches `canStop: true` with `partial` assurance.
- Output is deterministic, privacy-safe, exact-tested against README/docs, and
  contains no unsupported metric or favorable generic claim.
- The caller repository remains byte-identical, the temporary repository is
  removed, and no network/provider/telemetry surface is touched.
- The free proof and artifacts are complete before a plainly optional,
  non-capturing organizational-review handoff.

## Stop condition

Stop on simulated rather than runtime-backed proof, false-green fault,
retained temp state, target mutation, unverifiable metric, fear marketing,
gated free capability, lead capture, private disclosure, provider/network
intent, publication/release action, or unrelated product expansion.
