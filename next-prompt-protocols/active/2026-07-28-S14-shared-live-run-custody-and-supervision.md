# S14 — Shared Live-Run Custody and Supervision

**Class:** `arc`
**Module:** `live-run-custody`
**Crosses:** [`claude-adapter`, `codex-adapter`, `adapter-host`, `release-readiness`, `conformance`]
**Advances contracts:** [`LC1`, `LC2`, `LC3`, `LC4`]
**Compound:** false

## Why this exists

The installed Claude and Codex integrations independently prove allowed work,
scope denial, false-green refusal, and cold restart. Their launchers still
duplicate child-process supervision and surface timeout, output exhaustion,
abnormal exit, version or inventory drift, and stream-normalization failure
through unrelated exception paths. Those paths are not yet one bounded,
privacy-safe, exact-artifact-bound live-run outcome.

Real provider edge campaigns should not expand until the shared launcher
boundary can terminate the full child process group, retain exact terminal
polarity, prove cleanup, and publish safe evidence without credentials,
provider content, or private roots.

## Next objective

Implement a shared live-run custody layer used by both installed integrations.
It must supervise a process group through bounded success and failure states,
return one closed terminal envelope, bind the installed candidate and runtime
policy, store private evidence atomically with restrictive permissions, and
derive deterministic public evidence through the existing collision-safe
publication boundary.

Use deterministic process doubles to exercise the edge matrix. S14 makes no
real provider call.

## Descriptor rung check

Executable unlock: a shared process/evidence supervisor whose injected fault
matrix makes later real Claude and Codex edge campaigns bounded and
independently reviewable.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: shared child-process supervision, terminal outcome
  schema, installed identity binding, safe private evidence output, and fault
  clients used by Claude and Codex launchers.
- New uncertainty reduced: whether a live client failure can leave ambiguous
  process, evidence, privacy, or completion state.
- Validation: deterministic success/exit/signal/timeout/output/spawn/drift/
  malformed-stream cases, process-tree cleanup, evidence-path hostility,
  privacy scan, existing S8/S9 regression, full gate, and hosted CI.
- Consecutive metadata/decision slice check: `pass`; S14 is runtime and test
  implementation after the S13 closeout.
- Status-report alternative: insufficient because the duplicated launcher
  edge behavior and cleanup contract must change and be fault-injected.

## Productivity mix

- Runtime behavior: 45%
- Contract/test code: 45%
- Metadata/docs: 10%

## Slice queue

This queue is materialized from the ratified Production Live-Run Hardening
Macro Delta and creates no independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S14 | Shared live-run custody and supervision | Bound process, terminal, identity, and private/public evidence behavior | Every deterministic terminal class is closed, exact-bound, cleanup-proven, and privacy-safe | Fault clients, process-group cleanup, identity/evidence hostility, S8/S9 regression | `active` |
| S15 | Claude production live-run edge campaign | Exercise real Claude and deterministic provider failures | Real/fault outcomes agree on polarity, cleanup, partial assurance, and non-retention | Core scenarios plus drift, refusal, rate, timeout, truncation, capture/budget, repeat runs | `queued` |
| S16 | Codex production live-run edge campaign | Exercise real Codex and deterministic provider failures | Real/fault outcomes agree on polarity, cleanup, partial assurance, and non-retention | Core scenarios plus drift, refusal, timeout, truncation, usage/capture, repeat runs | `queued` |
| S17 | Sustained recovery, concurrency, and cleanup hardening | Stress operational sequences rather than isolated sessions | No duplicate action, stale state, pairing loss, unbounded growth, or residue | Crash/resume matrix, concurrent calls, ceilings, slow reader, repeated soak, parity | `queued` |
| S18 | Exact production-live requalification | Requalify one exact candidate through soak and fresh review | Exact matrix and three reviews pass without critical/high/medium finding | Clean candidate, full live matrix, soak, audit/privacy, reviews, hosted CI | `queued` |

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/live-run/**`
- `packages/integrations/claude/**`
- `packages/integrations/codex/**`
- `packages/adapter-host/**`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `fixtures/S14/**`
- `next-prompt-protocols/**`
- `notes/S14/**`
- `runs/S14/**`
- `evidence/S14/**`
- private raw fault/evidence material under
  `llm-memories/projects/scopa/evidence/S14/**`

## Validation speed option

- Fast slice-local command: `npm run test:s14`
- Integration regressions: `npm run test:s8` and `npm run test:s9`
- Installed-artifact guard: `npm run probe:s12:installed`
- Upstream fixture policy: reuse the existing S8/S9 live result shapes and
  S13 installed-artifact identity as regression inputs; do not invoke a real
  provider in S14.
- Broad-suite policy: `npm test` remains the accumulated compatibility guard.

## Decision gate

The shared terminal envelope must distinguish at least:

- `succeeded`;
- `exited`;
- `signaled`;
- `timed-out`;
- `output-limit`;
- `spawn-failed`;
- `version-drift`;
- `inventory-drift`; and
- `normalization-failed`.

Each state must be closed-schema, bounded, correction-bearing where
appropriate, and incapable of asserting `canStop: true` unless the normalized
machine state actually permits completion.

The supervisor must launch an isolated process group, send bounded graceful
termination, escalate when descendants remain, drain only bounded output,
wait for terminal process state, and emit cleanup evidence. Deterministic
tests must include a descendant that ignores graceful termination.

Private evidence output must reject aliases and unsafe destinations, use
atomic mode-restricted commit, retain no raw environment map, and never embed
credential values. Public derivation must use designated-field redaction,
reject placeholder/collision ambiguity, bind the private digest, and remain
byte-deterministic.

## Non-goals

- No real Claude, Codex, OpenAI, Anthropic, or other provider call in S14.
- No SCOPA-RV1 experiment protocol, fixture, allocation, ground-truth,
  analyst, scoring, statistical, preregistration, confirmatory, or publication
  work.
- No new public CLI command, bin, provider integration, tool, effect category,
  trust class, or assurance level.
- No operating-system sandbox or full-provider-assurance claim.
- No weakening of the current six-tool adapter surface, scope dispatcher,
  false-green refusal, signed verification, or known-failure behavior.
- No credential value, authorization header, environment dump, provider raw
  session, private root, or customer content in repository evidence.
- No npm publication, GitHub Release, repository visibility change,
  deployment, customer use, public announcement, certification, or trademark
  claim.

## Evidence

This slice commits the standard S14 trio:

- `notes/S14/` — custody design, terminal taxonomy, identity/privacy boundary,
  rejected alternatives, and non-goals.
- `runs/S14/` — exact fault commands, S8/S9 regressions, installed probe,
  full gate, protocol check, and hosted run.
- `evidence/S14/` — terminal fault matrix, process-tree cleanup receipt,
  installed identity binding, private/public evidence proof, and bounded
  reviewer-facing summary.

Raw hostile output, if required for debugging, remains mode-restricted in the
private SCOPA evidence home and is referenced only by safe digest.

## Acceptance

- Shared supervision is actually used by both Claude and Codex run paths.
- Every declared terminal class has a deterministic positive or negative
  control and a closed bounded envelope.
- Timeout and output-limit tests terminate a descendant that ignores graceful
  shutdown and independently prove no process survives.
- Nonzero exit, signal, spawn failure, version drift, inventory drift,
  malformed stream, and truncated stream cannot issue a success or completion
  state.
- Receipts bind source commit, installed package digest/integrity, client
  version, requested model, profile, capability matrix, scenario, limits, and
  environment-policy digest.
- No receipt retains a credential value, authorization header, raw
  environment map, uncontrolled provider content, or private root.
- Private evidence writes are atomic, alias-safe, mode-restricted, and refuse
  overwrite or collision.
- Public evidence is deterministic, binds private bytes, changes only
  designated fields, and passes the package privacy scanner.
- `npm run test:s14`
- `npm run test:s8`
- `npm run test:s9`
- `npm run probe:s12:installed`
- `npm test`
- `npm run protocol:check`
- Hosted CI passes.
