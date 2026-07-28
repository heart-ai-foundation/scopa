# Phase 4 Developer Preview

Current commit reference: `ce768e9`
Current active protocol: `active/2026-07-27-S10-developer-preview-release-candidate.md`

## Scope

Developer-preview work: installable local distribution, a model-neutral agent bridge, separately evidenced Claude Code and Codex integrations, and private release-candidate validation.

## Active objective

> After the principal records the release license, contribution model, working
> release name, and publication posture, assemble a private v0.2
> developer-preview candidate. Run its documented quickstart from the packed
> artifact in a fresh repository, exercise one supported adapter, reproduce the
> core enforcement proof, independently verify the evidence packet, and obtain
> an outside consumer/reviewer verdict.

## Files in play

- `packages/release-readiness/**`
- `packages/cli/test/cli.test.js`
- `fixtures/S10/**`
- `docs/**`
- `schemas/**`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `GOVERNANCE.md`
- `LICENSE`
- `package.json`
- `package-lock.json`
- `README.md`
- `.github/**`
- `next-prompt-protocols/**`
- `notes/S10/**`
- `runs/S10/**`
- `evidence/S10/**`

## Non-goals

- No npm publication, public repository, public release, visibility change, production installation, or customer deployment
- No license text, contribution policy, release name, trademark claim, or publication date inferred without a principal decision
- No claim that partial Claude or Codex assurance is full enforcement
- No hiding of provider-specific uncontrolled capability routes
- No source-checkout import, private evidence dependency, or institutional knowledge in the consumer quickstart
- No removal of known-failing fixtures, public verifier capability, or independently useful free functionality
- No change to S0-S9 runtime semantics or the frozen effect taxonomy
- No queue entries outside the authorized Developer Preview Macro Delta

## Descriptor Rung Stop Rule

Descriptor-only slices are allowed only when they unlock an executable test, probe, handoff, replay activation path, runtime consumer boundary, or production-off invariant needed before runtime code changes. Do not continue descriptor ladders as standalone progress. If runtime behavior remains `0%` for more than one consecutive sextuplet, the next protocol must target a test-controlled runtime-adjacent action.

## Verification

- Principal decisions for license, contribution model, working release name,
  and publication posture are explicitly recorded before candidate assembly.
- `npm run test:s10`
- `npm run probe:s10:consumer`
- `npm run audit:s10:policy`
- `npm test`
- `npm audit`
- `npm run protocol:check`
- The candidate is packed from the committed source state and binds its
  version, entry inventory, byte sizes, SHA-1, and npm integrity digest.
- A fresh source-free consumer installs the exact tarball without
  monorepo-relative resolution or private registry knowledge.
- The documented quickstart initializes SCOPA, reports status, runs a
  governed supported-adapter workflow, observes a correction-bearing scope
  denial, and obtains the real terminal gate state.
- The same consumer independently verifies a retained evidence packet and a
  known-failing fixture remains rejected.
- Threat model, security reporting route, schemas, fixtures, versioning,
  governance, contribution model, and licensing state are explicit and
  machine-auditable where applicable.
- Documentation clearly separates verified kernel behavior, adapter-specific
  partial assurance, non-claims, and actions that remain unauthorized.
- The consumer harness fails on source-checkout imports, private-home paths,
  absent policy files, integrity drift, false-green claims, or hidden
  uncontrolled adapter routes.
- An unfamiliar outside reviewer reproduces the quickstart from the exact
  artifact and issues an explicit accept/hold verdict.
- The accumulated release gate passes in hosted CI.

## Handoff

Before handing off a completed slice, write the companion note, run record, and reviewer-facing evidence under `..`, then run the sync script with the current HEAD commit and confirm `--check` passes.

## Slice lock

- `.slice-lock.json`

## Stop condition

If the active slice is already complete, stop and report that. Do not widen scope.
