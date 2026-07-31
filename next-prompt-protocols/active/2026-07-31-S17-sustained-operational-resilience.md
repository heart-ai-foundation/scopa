# S17 — Sustained Recovery, Concurrency, and Cleanup Hardening

**Class:** `arc`
**Module:** `operational-resilience`
**Crosses:** [`live-run-custody`, `adapter-host`, `enforcement`, `journal`, `claude-live-hardening`, `codex-live-hardening`, `conformance`]
**Advances contracts:** [`OR1`, `OR2`, `OR3`, `OR4`]
**Compound:** false

## Why this exists

S14-S16 proved bounded single-run custody and direct provider polarity for
Claude and Codex. The remaining operational uncertainty lies between runs:
crash recovery may duplicate an admitted mutation, concurrent calls may lose
event pairing, resource pressure may grow state without bound, and stale
control state may cross run boundaries.

The retained RC1 resource-bound evidence implementation note is a non-scored
engineering input to this work. The separately running experiment remains
outside this protocol.

## Next objective

Build a deterministic operational-resilience harness that first proves
canonical full-journal/compact-response equivalence and bounded transcript
responses, then exercises crash/resume idempotency, concurrency and
backpressure, repeated cleanup, and cross-client parity. Provider spot checks
remain closed unless deterministic polarity is complete and a later exact
policy is separately approved.

## Descriptor rung check

Executable unlock: a fault-injected crash/concurrency/ceiling harness that can
reject duplicate mutation, lost event pairing, unbounded response growth,
stale-state reuse, and incomplete cleanup before S18 candidate qualification.

## Anti-ceremony gate

- Classification: `implementation` and `test/validation`.
- Executable change: bounded journal/response behavior plus deterministic
  interruption, concurrency, cleanup, and parity fault tests.
- New uncertainty reduced: whether SCOPA remains finite, idempotent, paired,
  and residue-free across sustained multi-run sequences.
- Validation: slice-local operational-resilience tests, S14-S16 regressions,
  protocol check, and the accumulated release gate.
- Consecutive metadata/decision slice check: `pass`; activation immediately
  targets executable deterministic behavior.
- Status-report alternative: insufficient because the contracts require
  injected runtime failures and independently checked cleanup evidence.

## Productivity mix

- Runtime behavior: 45%
- Contract/test code: 45%
- Metadata/docs: 10%

## Slice queue

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S17.1 | Resource-bound evidence channels | Separate canonical full journals from compact MCP responses without changing meaning | Digest/order tampering fails; compact responses stay bounded and reconstruct to the same canonical evidence | Journal equivalence, ceiling, no-overwrite, incomplete-journal, and privacy tests | `completed` |
| S17.2 | Crash/resume idempotency | Stop or resume after every admitted-mutation boundary without duplicate action | Each crash point yields one mutation or explicit reconciliation | Crash-point and duplicate-resume matrix | `completed` |
| S17.3 | Concurrency and sustained cleanup | Preserve pairing and finite memory under concurrent calls, slow readers, and repeated runs | No pairing loss, unbounded growth, stale state, descriptor leak, or survivor | Concurrency, backpressure, soak, filesystem/process ledger | `completed` |
| S17.4 | Cross-client parity | Report shared outcomes and provider-specific differences without assurance transfer | Claude/Codex divergences are explicit and machine-readable | Expanded parity comparator and regression suite | `active` |

## Files in play

- `packages/journal/**`
- `packages/enforcement/**`
- `packages/adapter-host/**`
- `packages/live-run/**`
- `packages/integrations/claude/**`
- `packages/integrations/codex/**`
- `packages/conformance/**`
- `schemas/**`
- `fixtures/S17/**`
- `notes/S17/**`
- `runs/S17/**`
- `evidence/S17/**`
- `evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md`
- `next-prompt-protocols/**`

## Validation speed option

- Fast slice-local command: add and use `npm run test:s17` with only S17
  fixtures during implementation.
- Upstream regression: `npm run test:s14`, `npm run test:s15`, and
  `npm run test:s16` at integration boundaries.
- Broad-suite policy: `npm test` remains the closeout compatibility guard.

## Non-goals

- No experiment protocol, fixture, allocation, ground truth, analyst, scoring,
  statistical, preregistration, confirmatory, or publication work.
- No replay, scoring, or provider execution of the retained RC1 pilot.
- No provider traffic merely because S17 is active; any spot check requires a
  fresh exact closed policy and separate explicit approval.
- No new public tool inventory, assurance level, customer data, deployment,
  package publication, GitHub Release, visibility change, or announcement.
- No weakening of canonical journals, no lossy evidence substitution, and no
  transfer of assurance between Claude and Codex.

## Evidence

This slice commits reviewer-facing evidence under `evidence/S17/`, exact local
commands under `runs/S17/`, and design/reproduction decisions under
`notes/S17/`. Raw provider content, if a later spot check is approved, remains
bounded and outside the repository.

## Acceptance

- Canonical full-journal and compact-response views have a verified one-to-one
  semantic binding; digest, order, truncation, and incomplete-state tampering
  fail closed.
- Session, transcript, assurance, and output ceilings remain finite under
  concurrency and slow-reader pressure.
- Every admitted-mutation crash point resumes idempotently or stops for
  reconciliation without duplicate action.
- Normal, failed, bounded, and interrupted runs leave no stale control state,
  temporary file, descriptor, or process survivor.
- Cross-client parity reports shared outcomes and provider-specific
  differences without assurance transfer.
- `npm run test:s17`
- `npm run test:s14`
- `npm run test:s15`
- `npm run test:s16`
- `npm run protocol:check`
- `npm test`
- Hosted deterministic CI passes.
