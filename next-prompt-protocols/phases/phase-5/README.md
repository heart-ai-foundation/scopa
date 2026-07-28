# Phase 5 Adversarial Hardening

Current commit reference: `f83b3c1`
Current active protocol: `active/2026-07-28-S12-installed-surface-launcher-privacy-ci-hardening.md`

## Scope

Adversarial release hardening only: converge proof validation and publication, reconcile the installed consumer/error/CI surface, then independently requalify one exact private candidate.

## Active objective

> Create an explicit consumer package contract. Build the tarball through a
> deterministic staging path whose package metadata exposes only runnable
> consumer bins and exports, then exercise every retained entry from installed
> bytes. Make launcher failures closed, structured, stack-free, and path-free by
> default with an explicit diagnostic opt-in. Replace contributor-specific
> privacy sentinels with generic structural checks and update hosted actions to
> authoritative Node.js 24-compatible versions.

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `.github/**`
- `packages/release-readiness/**`
- `packages/adapter-host/**`
- `packages/cli/test/cli.test.js`
- `fixtures/S12/**`
- `next-prompt-protocols/**`
- `notes/S12/**`
- `runs/S12/**`
- `evidence/S12/**`

## Non-goals

- No npm publication, GitHub Release, public repository, visibility change, deployment, customer use, public announcement, certification, or trademark claim
- No removal of consumer bins, exports, public schemas, verifier capability, known-failing fixtures, or independently useful free functionality merely to make the inventory green
- No rewrite of S10 or S11 retained evidence
- No change to enforcement semantics, effect categories, adapter assurance, trust policy, signature verification, or proof-contract acceptance
- No contributor-specific username, home directory, or private evidence path in package bytes
- No default launcher stack, source location, file URL, absolute build/install path, or uncontrolled input echo
- No credential value or credential-rotation evidence in the repository
- No S13 candidate assembly or outside requalification before protocol rotation
- No queue entries outside the authorized Adversarial Release Hardening Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- `npm run test:s12`
- `npm run probe:s12:installed`
- `npm run test:s11`
- `npm test`
- `npm audit`
- `npm run protocol:check`
- The official pack path is deterministic, source-clean, and produces a
  consumer `package.json` with no contributor-only scripts.
- Every retained bin and export resolves and executes or imports from a fresh
  tarball-only installation.
- Every retained consumer script, if any, executes from installed bytes; no
  command references omitted tests, fixtures, build output, or source paths.
- Invalid session, capability-matrix, launcher-option, and protocol inputs
  fail with a closed versioned JSON envelope.
- Default launcher errors contain no stack, source line, `file:` URL, absolute
  build/install path, or uncontrolled input echo.
- Diagnostic stack output is explicit opt-in and documented.
- Package bytes contain no contributor-specific home/path sentinel,
  recognizable credential value, private evidence root, or repository-only
  control/evidence surface.
- Supported action versions remove the Node.js action-runtime deprecation
  annotation in hosted CI.
- DH1, DH2, and DH3 are independently reviewable and satisfied.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
