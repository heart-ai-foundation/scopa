# S18 — Exact Production-Live Requalification

**Class:** `arc`
**Module:** `production-live-requalification`
**Crosses:** [`operational-resilience`, `claude-live-hardening`, `codex-live-hardening`, `release-readiness`, `conformance`]
**Advances contracts:** [`PLQ1`, `PLQ2`, `PLQ3`]
**Compound:** false

## Why this exists

S14-S17 established bounded shared custody, independent Claude and Codex live
hardening, resource-bound evidence, idempotent recovery, sustained cleanup,
and client-bound parity. Qualification must now bind those results to one
exact installed candidate rather than transfer assurance from changing source
or historical provider runs.

## Next objective

Freeze one clean committed candidate and deterministically prove its package,
runtime, policy, matrix, evidence, privacy, dependency, protocol, and soak
boundaries. Provider-backed execution remains closed until exact Claude and
Codex policies, budgets, private destinations, call counts, and stop conditions
are separately materialized and explicitly approved.

## Descriptor rung check

Executable unlock: eligibility for a separate private release decision based
on one exact candidate, a complete bounded qualification matrix, and three
fresh exact-byte reviews.

## Anti-ceremony gate

- Classification: `test/validation`.
- Executable change: installed candidate probes, bounded matrix/soak, audits,
  and exact-byte independent review harnesses.
- New uncertainty reduced: whether one immutable candidate retains all S14-S17
  properties under production-like qualification.
- Validation: clean pack/install, deterministic full matrix, bounded live runs
  only after approval, soak, privacy/dependency audit, reviews, and hosted CI.
- Status-report alternative: insufficient because PLQ1-PLQ3 require executable
  installed artifacts and independent exact-byte verdicts.

## Productivity mix

- Installed candidate validation: 40%
- Production-like matrix and soak: 35%
- Independent review and audit: 20%
- Metadata/docs: 5%

## Slice queue

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S18.1 | Exact candidate freeze | Bind one clean commit, package, installed exports, policies, and deterministic matrix | No source/package/policy drift and all deterministic hostile controls retain polarity | Clean pack/install, manifest, installed probe, S17 and accumulated gates | `completed` |
| S18.2 | Closed production-live matrix | Materialize exact Claude/Codex calls, budgets, private evidence custody, and stop conditions | No provider intent without separate explicit approval; every approved outcome remains bounded | Policy-digest and authorization tests, then only the approved live subset | `active` |
| S18.3 | Sustained candidate soak and audits | Exercise the exact installed candidate repeatedly and audit dependency, credential, privacy, residue, and stability boundaries | No growth, survivor, stale state, privacy event, dependency drift, or false green | Bounded soak, filesystem/process ledgers, audit and privacy receipts | `queued` |
| S18.4 | Fresh exact-byte reviews and closeout | Obtain artifact, evidence, and runtime verdicts on the same candidate bytes | Three ACCEPT verdicts; no critical/high/medium finding; lows adjudicated | Independent reviews, consistency receipt, protocol check, hosted CI | `queued` |

## Current S18.2 posture

The closed exact-candidate matrix is materialized at
`evidence/S18/closed-production-live-matrix.json`, digest
`3df4d5eb353c124c2d425c8e98ea6eb52e0d4e07fc6529c470770804a0a317d9`.
It plans exactly four calls—Claude clean/cold-restart, then Codex
clean/cold-restart—but authorizes zero. Provider intent requires a separate
explicit approval binding this digest, both private evidence destinations,
the exact call counts, the Claude USD ceilings, the Codex token ceilings, and
an execution window no longer than one day. S18.2 remains active pending that
approval and any resulting bounded live execution.

## Files in play

- `package.json`
- `package-lock.json`
- `packages/live-run/**`
- `packages/integrations/claude/**`
- `packages/integrations/codex/**`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `schemas/**`
- `docs/**`
- `fixtures/S18/**`
- `notes/S18/**`
- `runs/S18/**`
- `evidence/S18/**`
- `next-prompt-protocols/**`

## Non-goals

- No provider traffic from activation or deterministic qualification alone.
- No experiment protocol, fixture, allocation, scoring, analysis, or
  publication work.
- No npm publication, GitHub Release, visibility change, deployment, customer
  use, public announcement, certification, or trademark claim.
- No assurance transfer between candidates, clients, providers, or historical
  runs; Claude and Codex remain independently `partial`.
- No customer repository, credential-bearing fixture, private topology, or
  uncontrolled mutation.

## Evidence

Reviewer-facing evidence is committed under `evidence/S18/`. Any later raw
provider evidence remains bounded, mode-restricted, and outside the repository;
only privacy-reviewed deterministic derivatives may enter the repository.

## Acceptance

- One exact installed candidate passes the frozen production-like matrix and
  sustained bounded soak.
- Three fresh exact-byte reviews return ACCEPT with no unresolved
  critical/high/medium finding and every low finding adjudicated.
- Dependency, privacy, credential, protocol, local, and hosted gates pass.
- Closeout establishes eligibility only for a separate release decision.
