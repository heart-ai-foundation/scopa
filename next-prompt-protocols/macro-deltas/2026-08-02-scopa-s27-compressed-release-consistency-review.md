# SCOPA S27 Compressed Release-Consistency Review Macro Delta

**Status:** principal-approved on 2026-08-02
**Amends:** only the S27 review shape in `2026-08-01-scopa-r1-exact-byte-qualification.md`
**Provider posture:** closed; zero calls authorized
**Release posture:** closed

## Trigger

S26R3 accepted the exact S25 candidate through ordered Claude-clean and
Codex-clean production calls after the evidence-projection defect was fixed.
The candidate bytes did not change, the public/private bindings closed, the
single-use approval was consumed, replay refused before provider intent, and
local plus hosted gates passed. Three broad role reviews would now repeat
already-bound artifact and runtime work.

## Objective

Replace the original three-role S27 with one provider-off executable
release-consistency review that checks exactly four remaining boundaries:

1. public evidence and external-custody digest bindings agree;
2. the exact approval is consumed once and replay remains closed;
3. the installed production identity agrees across S24, S25, and S26R3; and
4. the prospective R1 claims do not exceed partial client assurance or imply
   experiment, publication, release, deployment, or OS-sandbox authority.

The review returns one `ACCEPT` or `REJECT` receipt. It does not ask another
model for a stylistic opinion and does not create three role-shaped reports.

## Executable value

The S27 checker must recompute hashes and canonical receipts from committed
bytes, reject mixed candidate/evidence generations, inspect cleanup and budget
outcomes, scan every public S26R3 derivative for private topology, and verify
the repository release posture remains closed. Adversarial tests must prove
that identity, approval, evidence, cleanup, privacy, and claim drift each turn
the result into `REJECT`.

## Contract amendment

PLQ2 is narrowed from “three fresh reviewers” to “one exact-byte executable
release-consistency review.” Its substantive acceptance boundary remains: no
critical, high, or medium finding, and every low finding adjudicated. PLQ3 and
the separate S28 principal go/no-go decision remain unchanged.

## Authorized files

- `fixtures/S27/**`
- `evidence/S27/**`
- `packages/release-readiness/test/s27-release-consistency.test.js`
- the S26R3 historical-path compatibility assertion required by protocol rotation
- `next-prompt-protocols/**`
- the SCOPA evidence-home companion note

## Acceptance

- One deterministic receipt covers all four boundaries and binds exact input bytes.
- Candidate, closure, bundled payload, and installed payload identities agree.
- Matrix, approval, authorized matrix, public campaign, consumption, and closeout agree.
- Both calls succeeded within bounds with complete cleanup.
- Public derivatives are privacy-clean and release posture remains closed.
- Adversarial drift classes reject.
- Provider, experiment, publication, and release traffic are all zero.
- Focused, protocol, accumulated, and hosted gates pass.

## Non-goals

- No provider call, replay, cold restart, soak, candidate rebuild campaign, or
  fresh three-role review.
- No candidate, dependency, package, runtime, client, model, public API, or
  version change.
- No experiment, publication, tag, release, deployment, announcement,
  certification, or assurance expansion.
- No S28 activation or GO decision inside S27.

## Stop conditions

Stop on any digest or identity mismatch, unconsumed/reused approval, failed
polarity or cleanup, budget breach, private topology, overclaim, material
finding, false green, provider intent, unrelated change, or hosted failure.

## Approval boundary

Principal agreement authorizes this compressed provider-off S27 implementation
and review. It does not authorize S28, release execution, publication, or any
additional production call.
