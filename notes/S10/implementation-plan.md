# S10 implementation plan

Authority: approved Developer Preview Macro Delta and principal approval of the
recommended S10 posture on 2026-07-27.

This plan materializes the active S10 protocol. It does not add queue entries
or authorize publication.

## Task 1 — Ratify the release posture

- [x] Record Apache-2.0, DCO/no-CLA, working naming, and private-only
  publication decisions in `notes/S10/release-decisions.md`.
- [x] Set `package.json` and `package-lock.json` to
  `@heart-ai-foundation/scopa@0.2.0-dev.1` with Apache-2.0 metadata.
- [x] Add the exact Apache License 2.0 text at `LICENSE`.

## Task 2 — Implement executable release-readiness controls

- [x] Add the release-readiness package under
  `packages/release-readiness/`.
- [x] Implement closed release-posture, policy-audit, candidate-manifest, and
  consumer-proof validators.
- [x] Implement exact artifact packing/integrity inspection and a fail-closed
  policy audit.
- [x] Add deterministic S10 tests and root scripts in `package.json`.

## Task 3 — Build the consumer and policy surfaces

- [x] Add `SECURITY.md`, `CONTRIBUTING.md`, and `GOVERNANCE.md`.
- [x] Add quickstart, threat model, claim boundary, versioning, and
  machine-readable release posture under `docs/`.
- [x] Add published JSON Schemas under `schemas/`.
- [x] Add clean, failing, adapter-client, and independent-verification
  fixtures under `fixtures/S10/`.
- [x] Extend the package allowlist and root documentation for the private
  candidate.

## Task 4 — Prove the exact committed candidate

- [x] Commit all package-included candidate surfaces.
- [x] Run the exact source-free packed-artifact consumer probe from a clean
  commit.
- [x] Retain the raw transcript in the private evidence home and publish a
  path-redacted receipt in `evidence/S10/`.
- [x] Record candidate integrity, policy audit, known-failing refusal, and
  independent packet verification.

## Task 5 — Independent outside-model review

- [ ] Give an unfamiliar outside model only the candidate artifact,
  quickstart, and public evidence needed to reproduce claims.
- [ ] Require deterministic gates, consumer reproduction, security/non-claim
  review, and an explicit accept/hold verdict.
- [ ] Remediate findings and rerun affected gates.

## Task 6 — Close the developer-preview queue

- [ ] Run accumulated tests, dependency audit, policy audit, protocol check,
  diff hygiene, and hosted CI.
- [ ] Mark RC1-RC3 satisfied only if the evidence supports each contract.
- [ ] Move S10 to completed with no active protocol and preserve the final
  queue state.
- [ ] Update the durable evidence home with the release-candidate closeout.
