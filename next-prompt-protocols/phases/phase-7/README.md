# Phase 7 Dependency Closed Release Requalification

Current commit reference: `f3ab975`
Current active protocol: `active/2026-07-31-S19-publishable-dependency-closure-enforcement.md`

## Scope

Bind the complete resolved production dependency closure into SCOPA candidate identity, then requalify entirely new package bytes without transferring historical assurance.

## Active objective

> Generate a deterministic consumer-specific `npm-shrinkwrap.json`, include it
> in every candidate tarball, derive one canonical production closure from it,
> and independently compare fresh installed graphs with that closure. Prove
> supported npm versions preserve the exact graph while missing, mutated,
> transplanted, extra, stale, dev-contaminated, or semver-drifted states fail
> closed.

## Files in play

- `package.json`
- `package-lock.json`
- `npm-shrinkwrap.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `packages/cli/**`
- `fixtures/S19/**`
- `next-prompt-protocols/**`
- `notes/S19/**`
- `runs/S19/**`
- `evidence/S19/**`
- `evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md`

## Non-goals

- No npm publication, GitHub Release, repository visibility change, deployment, customer use, public announcement, certification, or trademark claim
- No SCOPA-RV1 experiment protocol, fixture, allocation, ground-truth, analyst, scoring, statistical, preregistration, confirmatory, or publication work
- No replay, reclassification, scoring, provider run, or candidate claim for the retained SCOPA-RC1 pilot implementation note
- No provider traffic in S19, S20, S22, or S23 and no S21 traffic without a separate fresh exact candidate-bound approval
- No transfer of the rejected S18 candidate, provider approval, live assurance, or reviewer verdict to the replacement candidate
- No silent fallback to bundled dependencies if npm shrinkwrap enforcement fails
- No opportunistic dependency upgrade outside the reproduced closure-identity defect
- No customer repository, customer data, production deployment, or uncontrolled mutation
- No new public CLI command, bin, provider integration, tool, effect category, trust class, or assurance level
- No operating-system sandbox or full-provider-assurance claim
- No weakening or removal of the six-tool adapter, scope dispatcher, verifier, known-failing fixtures, hostile corpora, or independently useful free functionality
- No credential value, authorization header, raw environment map, provider raw session, private root, customer content, screenshot, token fragment, or rotation secret in repository evidence
- No rewrite of historical evidence
- No queue entries outside the exact approved Dependency-Closure Identity Hardening Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- The packed consumer contains one canonical production-only
  `npm-shrinkwrap.json` whose root metadata matches the consumer package.
- Closure extraction rejects unknown fields, non-exact versions, missing or
  malformed integrity, local/git/unapproved sources, development nodes,
  duplicate semantic nodes, and graph inconsistency.
- Package manifest, closure digest, and installed-tree digest remain distinct
  and exact.
- Fresh npm 10 and npm 11 installation graphs match the closure exactly.
- A synthetic newer semver-compatible transitive package does not replace the
  approved version.
- Missing, mutated, transplanted, extra, stale, dev-contaminated, and
  self-rehashed false-green states are rejected.
- Package privacy/credential scanning returns zero findings.
- `npm run test:s19`, installed-surface regression, protocol check,
  accumulated release gate, and hosted CI pass.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
