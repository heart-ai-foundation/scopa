# S26-S28 — R1 Exact-Byte Qualification and Decision Queue

**Class:** `arc`
**Module:** `production-live-requalification`
**Crosses:** [`release-readiness`, `gate-process-custody`, `claude-live-hardening`, `codex-live-hardening`]
**Advances contracts:** [`PLQ2`, `PLQ3`]
**Compound:** false
**Status:** proposal only; not active; no provider or release authority

## Why this exists

S24 closed the descendant-survivor defect and S25 qualified new exact bytes,
but these bytes have no provider-bound client evidence or fresh independent
review. Those are the only material gaps before a principal R1 decision.

## Next objective

If the proposed Macro Delta is approved, activate S26 to create one closed,
exact candidate-bound two-call matrix and execute it only after a separate
exact-digest approval. Continue to S27 and S28 only when each prior value gate
passes.

## Descriptor rung check

Executable unlock: two real installed-client calls bind the S25 package to the
Claude and Codex transports. No descriptor-only precursor slice is permitted.

## Anti-ceremony gate

- Classification: `runtime validation`.
- Executable change: exact installed S25 bytes execute once through each client
  transport with allow/deny polarity, terminal validation, and cleanup.
- New uncertainty reduced: whether both supported clients operate correctly
  against the changed candidate rather than historical bytes.
- Validation: exact policy preflight plus two private-custody public derivatives.
- Consecutive metadata/decision slice check: pass; S25 executed candidate
  construction and installed qualification.
- Status-report alternative: insufficient because no provider-bound observation
  exists for the new package identity.

## Productivity mix

- Runtime/provider-bound validation: 45%
- Independent installed-runtime/artifact/evidence review: 40%
- Eligibility validation and decision record: 10%
- Protocol/evidence metadata: 5%

## Slice queue

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | S26 exact-byte client qualification | Bind the S25 tarball to both distinct client transports | exactly two calls retire untested client compatibility without replaying unchanged continuity campaigns | digest preflight; Claude clean then Codex clean; strict SCOPA surface; allow/deny; cleanup | `queued, provider-closed` |
| 2 | S27 parallel exact-byte reviews | Independently challenge artifact, evidence, and installed runtime claims | prior runtime review found a real defect, so one fresh three-role pass is justified | three parallel reports, all ACCEPT, no material finding; installed descendant probes | `queued behind S26` |
| 3 | S28 R1 go/no-go | Close PLQ2/PLQ3 and obtain one durable release decision | converts complete evidence into one actionable boundary | consistency validator, final hosted gate, principal GO or NO-GO | `queued behind S27` |

Queue rules specific to this arc:

- Fold matrix drafting, digesting, approval binding, preflight, call consumption,
  and closeout into S26; never split them into ceremonial slices.
- Do not repeat cold restart, long soak, or earlier fault campaigns unless a
  concrete drift or finding reopens their seam.
- Run S27 roles in parallel as one slice; do not create three review protocols.
- A material S27 finding stops. Do not patch and rereview under the same packet.
- S28 is the only decision slice. Do not add a consistency-review or
  release-readiness-review after it.
- A GO does not execute a release. A separate exact release authorization is
  required; NO-GO ends the queue.

## Files in play

- `fixtures/S26/**`
- `packages/live-run/**`
- `packages/integrations/claude/**`
- `packages/integrations/codex/**`
- `packages/release-readiness/**`
- `evidence/S26/**`
- `evidence/S27/**`
- `evidence/S28/**`
- `next-prompt-protocols/**`

## Validation speed option

- S26 local policy checks must run before any provider intent; deterministic
  client doubles cover drift and stop paths without paid calls.
- S27 runtime review reruns only the installed S24 descendant probes and public
  surface checks; it does not reconstruct historical campaigns.
- Broad `npm test`, npm 10/11 parity, protocol projection, and hosted CI run at
  S27/S28 boundaries, not after every descriptor edit.

## Non-goals

- No authority from this queued file.
- No more than two S26 provider calls and no experiment use.
- No cold-restart replay or new soak without evidence-driven reopening.
- No dependency, feature, public API, assurance, customer, publication,
  release, version, tag, deployment, or announcement action.
- No transfer of historical candidate or cross-client assurance.

## Evidence

If approved and activated:

- S26 retains private raw evidence outside the repository and commits only
  path-safe public authorization, campaign, and closeout derivatives.
- S27 commits three fresh normalized reports and one deterministic consistency
  result.
- S28 commits the final eligibility projection and exact principal decision.

No standalone evidence index, approval summary, review summary, or archive
slice may be inserted.

## Acceptance

- S26: two exact calls only, both qualifying, zero cleanup/privacy/policy drift.
- S27: three fresh ACCEPT verdicts, no critical/high/medium finding, every low
  adjudicated, installed descendant cleanup independently reproduced.
- S28: PLQ2 and PLQ3 satisfied by machine-checked evidence, hosted gate green,
  and one explicit principal GO or NO-GO decision.
- Provider and release gates remain closed except for separately approved exact
  actions.
