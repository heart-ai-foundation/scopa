# Phase 5 Adversarial Hardening

Current commit reference: `ccc2672`
Current active protocol: `active/2026-07-28-S13-fresh-agent-adversarial-release-requalification.md`

## Scope

Adversarial release hardening only: converge proof validation and publication, reconcile the installed consumer/error/CI surface, then independently requalify one exact private candidate.

## Active objective

> Build and retain one exact private candidate from a clean commit, run the full
> source-free hostile corpus against those bytes, and assign three fresh isolated
> reviewers to attack artifact/distribution, evidence/proof, and runtime/
> containment boundaries. Require each reviewer to issue a structured `ACCEPT`
> with no critical, high, or medium finding before closeout.

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `.github/**`
- `packages/release-readiness/**`
- `packages/adapter-host/**`
- `packages/cli/src/command.js`
- `packages/cli/README.md`
- `packages/cli/test/cli.test.js`
- `fixtures/S10/consumer-client.mjs`
- `schemas/**`
- `fixtures/S13/**`
- `next-prompt-protocols/**`
- `notes/S13/**`
- `runs/S13/**`
- `evidence/S13/**`

## Non-goals

- No npm publication, GitHub Release, repository visibility change, deployment, customer use, public announcement, certification, or trademark claim
- No new product feature, provider integration, command, export, schema, assurance level, effect category, trust policy, or verification primitive
- No weakening or removal of consumer bins, exports, verifier capability, known-failing fixtures, hostile corpus cases, or independently useful free functionality
- No rewrite of historical S10-S12 evidence
- No credential value, credential screenshot, or rotation secret in any retained file
- No false claim that reviewer agreement is provider attestation, production certification, or permission to publish
- No hardening-queue closeout while credential rotation is unconfirmed
- No queue entries outside the authorized Adversarial Release Hardening Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- Exact clean source commit and candidate SHA-256 are recorded consistently
  across manifest, private proof, public proof, hostile corpus, and all three
  reviews.
- Repeated official packing is byte-deterministic.
- Fresh tarball-only install passes both bins, all exports, zero-script
  inventory, governed adapter, known failure, signature verification, and
  package/privacy/error-surface checks.
- Runtime and published proof contracts agree over the full S11 corpus.
- Collision, placeholder, overlap, cardinality, numeric, closed-field,
  signature/trust, scope-escape, malformed protocol, and false-green attacks
  fail closed.
- Private proof publication changes only designated roots and reports
  `semanticFieldsChanged: false`.
- Three fresh isolated reports bind exact bytes, return `ACCEPT`, and contain
  no critical, high, or medium finding.
- `npm audit --audit-level=low`
- `npm test`
- `npm run protocol:check`
- Hosted CI passes without a Node action-runtime deprecation warning.
- Provider-side credential rotation/old-value invalidation is confirmed
  without retaining any credential value.
- RQ1, RQ2, and RQ3 are independently reviewable and satisfied.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
