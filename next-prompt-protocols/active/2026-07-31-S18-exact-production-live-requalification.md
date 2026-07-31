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

Harden the repeated OBSERVE edge while preserving the rejected v2 result, then
hold the exact two-call Codex clean-to-cold-restart continuation closed until
its policy, token ceilings, private destination, call count, retained-evidence
bindings, and stop conditions are separately and explicitly approved.

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

The initial closed exact-candidate matrix is retained at
`evidence/S18/closed-production-live-matrix.v1.json`, digest
`3df4d5eb353c124c2d425c8e98ea6eb52e0d4e07fc6529c470770804a0a317d9`.
It plans exactly four calls—Claude clean/cold-restart, then Codex
clean/cold-restart—but authorizes zero. Provider intent requires a separate
explicit approval binding this digest, both private evidence destinations,
the exact call counts, the Claude USD ceilings, the Codex token ceilings, and
an execution window no longer than one day.

The principal approved that exact digest on 2026-07-31. The canonical
approval digest is
`f9f1aedb3853878b95b1aceacc9fe57c4070475e4a70c5415b8a36a3dccf0325`
and the derived authorized matrix digest is
`65c04e950f630fa229776df3307af078cc1cd4eaa5844f8b89707e5ceff89317`.
It expires after 2026-08-01. Preflight detected default-client version drift
without provider intent, then staged the exact approved Claude 2.1.170 and
Codex 0.145.0 clients outside the repository. Call consumption remains zero;
the next action is the bounded Claude-first execution from a clean controller
commit.

That execution stopped before provider intent because the exact candidate
exports required client versions Claude 2.1.220 and Codex 0.146.0, contradicting
the approved matrix's 2.1.170 and 0.145.0. Only the local Claude version probe
ran; it closed with version drift and complete process cleanup. Codex was not
opened and provider-call consumption is zero. The approval is closed against
replay. S18.2 remains active pending a corrected closed matrix and fresh
explicit approval.

The corrected closed v2 matrix is now materialized at
`evidence/S18/closed-production-live-matrix.json`, digest
`64a60c06d886460c52838e431df284cdffc8661eb8df2ed3cf50b662fbbfa98f`.
It binds the frozen candidate's exported Claude 2.1.220 and Codex 0.146.0
requirements, plans the same four ordered calls, and authorizes zero. The v1
matrix remains archived as `closed-production-live-matrix.v1.json`; its stopped
approval cannot transplant onto v2. S18.2 remains active pending separate
explicit approval of the exact v2 digest.

The principal approved that exact v2 digest on 2026-07-31. Approval digest
`c9f67699cb1706bc70e3a6220da7b64fd207356c040cb2980f8adb7f96b242da`
reconstructs authorized matrix digest
`94be00df2eeee1838946f53fcf20137741c942daa18d8f59631be18caef364ee`
and expires after 2026-08-01. Execution remains at zero consumed calls pending
a clean hosted preflight commit and will use a fresh external custody-root
resolution so the stopped v1 evidence remains immutable.

The v2 execution consumed all four authorized calls. Claude clean and
cold-restart passed; Codex clean passed. Codex cold-restart returned a
satisfied terminal but repeated `scopa_check`, exceeding the frozen tool
sequence, so evidence validation stopped the campaign. Cost, usage, custody,
privacy, and cleanup bounds passed. No replay is authorized. S18.2 remains
active pending a fresh hardening posture for repeated idempotent OBSERVE calls.
Both stopped approval digests are now listed in the committed consumed-approval
registry, and the live controller rejects them before client launch regardless
of the supplied external custody-root resolution.

The closed v3 continuation is materialized at
`evidence/S18/closed-observe-hardening-v3.json`, digest
`3b40b83dfa80c0f4e25e9c2a6dd7fff995caf1c32c842fd54436f1eb48a5e5c4`.
It retains the two accepted, byte-bound Claude derivatives and plans only two
fresh Codex calls: clean then cold-restart. It authorizes zero calls. Its
frozen semantic sequence policy permits at most one extra successful,
semantically equivalent `scopa_check` between the canonical check and the
transcript. Every mutation, read, assurance, or transcript repeat; reorder;
error; second extra call; or result drift remains a hard stop. This is not a
post-hoc acceptance or replay of v2. Provider intent remains closed pending
fresh exact approval of the v3 digest and private S18V3 custody destination.

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
