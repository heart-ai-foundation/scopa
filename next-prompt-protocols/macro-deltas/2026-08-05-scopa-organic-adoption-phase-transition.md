# Macro Delta — 2026-08-05 — Organic Adoption Phase Transition

**Project:** SCOPA
**Phase:** Phase 14 — Legible Value and Organic Adoption
**Window:** `4643cb3` → open
**Author:** Claude with principal direction
**Trigger:** principal-requested pre-distribution virality review of the public
0.4.0 surface, comparing SCOPA's adoption mechanics against an observed
high-adoption open-source developer tool

## Where we are

SCOPA 0.4.0 is public on GitHub and npm. Phase 13 delivered every adoption
mechanism it promised: the zero-argument snapshot, runtime-owned `begin`, the
reversible assistant installer, the Boundary Card, least-privilege pull-request
reporting, and the reproducible three-fault demonstration. A direct exercise of
the published tarball confirms the mechanics hold. The demo proof reproduces
byte-identically between source and published bytes, gate failures are reported
truthfully rather than as setup errors, and the assistant installer is clean and
reversible.

The remaining gap is not correctness. It is legibility and exposure.

A hostile first-contact review of the published surface found that SCOPA's most
valuable observations are computed but never rendered readably, that the
README's featured zero-install command emits escaped JSON, that the most public
surface SCOPA owns reports three UNKNOWN values by default, and that a native
out-of-scope write which violates a declared non-goal currently leaves an
unqualified `SATISFIED` headline on the shareable card. The last item is a
standing credibility exposure: the runtime is honest in its documentation and
in its assurance basis, but its headline presentation does not carry the
qualification an adversarial reader will test for.

## Slice arc reviewed

| # | Work | Commit | Executable result | Non-goals held? |
| --- | --- | --- | --- | --- |
| 1 | S37-S43 Instant Value and Installed Adoption | `12db637` | first-run snapshot, runtime-owned begin, assistant install, Boundary Card, PR reporting, demo corpus | yes |
| 2 | 0.4.0 release preparation | `cf936d0` | version and distribution documentation | yes |
| 3 | Demo proof rebinding | `db284eb` | version-sensitive proof bound to release bytes | yes |
| 4 | Public 0.4.0 release | `4643cb3` | exact published package and source tag | yes |

## Trajectory check

**Original goal:** provide a free runtime that lets developers map and enforce
the control boundaries of coding-agent work while creating an honest path to
deeper workflow-boundary consultation.

**Current direction:** preserve every enforcement, assurance, and privacy
semantic already qualified, and correct the presentation layer so that the
observations SCOPA already computes become readable at the moment of first
contact. Convert the runtime's honesty about its own blind spots from a
documented caveat into a rendered, shareable property.

**Drift assessment:** ACCEPTABLE. This is a principal-directed presentation and
exposure correction. It adds no enforcement claim, weakens no existing limit,
and changes no assurance computation. The one substantive semantic addition —
observation of changes outside the lock — is explicitly non-enforcing and must
never be presented as prevention.

## Cumulative scope audit

| Addition | Justification | In mission? |
| --- | --- | --- |
| Human-first default rendering for `doctor`, `begin`, `check`, `status` | the documented first-contact commands currently emit machine envelopes to human readers | yes |
| Local diagnostic detail render | privacy minimization intended for shareable projections is currently applied to local reads, deleting the diagnosis's value | yes |
| Out-of-scope change observation | closes the gap between a truthful assurance basis and an unqualified completion headline | yes |
| Front-door alignment | the documented adoption commands must succeed for a first-time reader | yes |
| Pull-request default value | the highest-traffic surface SCOPA owns must not default to uninformative | yes |
| Adopter fact badge and discovery surface | adopters cannot currently advertise SCOPA without a grade claim; a fact-stating badge and repository-owned contact content preserve the no-score and no-external-mutation rules | yes |
| Adversarial virality qualification | makes the standing credibility exposure a permanent regression gate | yes |

## Non-goal preservation

| Non-goal | Status | Notes |
| --- | --- | --- |
| No generic safety, compliance, certification, or favorable risk score | PRESERVED | the S49 badge states facts and counts, never a grade, score, or pass |
| No inferred external authority or silent permission grant | PRESERVED | no authority default changes in this phase |
| No telemetry, account, hosted dashboard, or paid truth source | PRESERVED | all added surfaces remain local and provider-off |
| No provider or experiment call without separate authority | PRESERVED | S51 is queued closed and unauthorized |
| No publication, release, deployment, or announcement from this queue | PRESERVED | implementation and qualification only |
| No secret, credential value, private path, prompt, or raw gate output in shareable artifacts | PRESERVED | S45 detail is local-only; shareable redaction is unchanged and hostilely validated |
| No observation presented as prevention or enforcement | NEW, BINDING | S46 reports observed native changes; it must not claim they were controlled |

## Forbidden-surface audit

| Forbidden surface | Status | Notes |
| --- | --- | --- |
| OS-sandbox or full-agent-control claim | NOT APPROACHED | S46 strengthens the bypass disclosure rather than narrowing it |
| Completion semantics driven by unverifiable signal | NOT APPROACHED | `canStop` remains defined solely by declared gate results |
| Favorable score, grade, or safe-to-merge badge | NOT APPROACHED | S49 is fact-stating and carries the partial-assurance basis |
| Hidden analytics or lead capture | NOT APPROACHED | S49 produces repository-owned badge and contact content only; enabling or changing public GitHub settings remains separately authorized |
| Unverifiable performance or efficacy claim | NOT APPROACHED | S51, the only measurement slice, is queued closed |
| Live PR mutation or public release during implementation | NOT APPROACHED | fixture and dry-run qualification only |

## Cost trajectory

n/a — no cost ceiling is defined. S44-S50 are provider-off and must not incur
model or hosted-service spend. S51 is the only slice that would require an
allowance and it is queued closed pending a separate explicit authority.

## Verification health

The published 0.4.0 bytes were exercised directly during the review: bare
snapshot, `--help`, `demo` with proof-hash comparison against both the README
and the source checkout, and `assistant install --dry-run` in a marker-free
repository. The demo proof matched exactly. The accumulated provider-off
release gate remains the qualification basis; S50 adds the out-of-scope
presentation regression as a permanent gate. No historical evidence is reopened
or transferred to changed bytes.

## Open questions / tensions

Two decisions were resolved by the principal at activation:

1. **S46 signal strength.** Three options were considered: report an observed
   count while leaving the headline unchanged; qualify the headline; or block
   `canStop` on observed out-of-scope writes. The principal selected qualifying
   the headline, implemented additively so that `completion.status` and every
   existing `scopa.boundary-card.v1` consumer remain valid. Blocking `canStop`
   was rejected because it would couple a hard completion guarantee to a signal
   SCOPA cannot verify intent for, producing false blocks on unrelated
   concurrent work and violating the non-enforcement constraint.
2. **S49 canon amendment.** `docs/BOUNDARY_CARD.md` currently states that
   neither completion state receives a favorable score or badge. S49 narrows
   that rule to prohibit grades and scores while permitting a fact-stating
   badge. The no-favorable-score principle is preserved; only the blanket badge
   prohibition is amended.

S51 remains closed. No principal decision blocks S44.

## Continue / pause / pivot recommendation

**Recommendation:** CONTINUE.

Activate S44, human-first command output. Continue to a later slot only when
the preceding slot produces executable value and its focused validation passes.
S46 depends on S44's render seam. S50 qualifies clean packed candidate bytes
and retains public 0.4.0 only as an immutable regression baseline; it does not
require or authorize publication. S50 runs last and gates the arc. The sole
ordered implementation queue is `next-prompt-protocols/slice-queue.md`.

## References

- Queue: `next-prompt-protocols/slice-queue.md`
- Manifest: `next-prompt-protocols/manifest.json`
- Prior phase transition: `next-prompt-protocols/macro-deltas/2026-08-04-scopa-instant-value-phase-transition.md`
- Review evidence: `evidence/S44/` onward
