# S6 — Installable Developer Surface

**Class:** `arc`
**Module:** `distribution`
**Crosses:** [`conformance`]
**Advances contracts:** [`DS1`, `DS2`, `DS3`]
**Compound:** false

## Why this exists

S0-S5 prove SCOPA inside its own source repository, but the runtime is not yet
a usable free developer tool. A consumer should not need monorepo-relative
imports, internal fixture knowledge, or handwritten command composition to
initialize and inspect SCOPA.

## Next objective

Create a locally packable SCOPA distribution with one `scopa` CLI that can
initialize a clean repository, report orientation and stop state, run declared
checks through the existing enforcement surface, and verify retained evidence.
Prove it by installing the packed artifact into a fresh fixture repository
that contains no SCOPA source.

## Descriptor rung check

Executable unlock: a real `scopa` binary installed from a local npm tarball in
an unfamiliar repository performs initialization, status, check, and
verification with machine-checkable exit states.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: package entrypoint, CLI router, closed configuration
  schema, safe initializer, clean-install harness, and fault fixtures.
- New uncertainty reduced: whether SCOPA can operate outside its monorepo
  without hidden source-relative dependencies or destructive setup behavior.
- Validation: packed-artifact installation into a fresh temporary repository,
  CLI contract tests, idempotency and overwrite-denial fixtures, and the
  accumulated release gate.
- Consecutive metadata/decision slice check: `pass`; S5 delivered executable
  interop, and S6 delivers a runtime consumer boundary.
- Status-report alternative: insufficient because only an installed artifact
  can prove the distribution boundary.

## Productivity mix

- Runtime behavior: 55%
- Contract/test code: 35%
- Metadata/docs: 10%

## Slice queue

This queue is materialized from the authorized Developer Preview Macro Delta
and creates no independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S6 | Installable developer surface | Package SCOPA behind one safe CLI | Clean repository installs the tarball and runs core commands | Pack/install harness, CLI contracts, overwrite refusal, accumulated gate | `active` |
| S7 | Model-neutral adapter bridge | Give supported agents one trusted mutation boundary | Fake agent reaches allowed, denied, and stop states only through the bridge | Hostile tool calls, bypass attempts, transcript and matrix checks | `queued` |
| S8 | Claude Code headless integration | Exercise the bridge with Claude through strict tool configuration | Claude is blocked out of scope and refused false-green while an allowed task completes | Headless clean/fault runs, cold resume, outside review | `queued` |
| S9 | Codex headless integration and parity | Exercise the same contract with Codex and compare outcomes | Codex satisfies the Claude behavior contract or reports a parity gap | Headless clean/fault runs, parity report, outside review | `queued` |
| S10 | Developer-preview release candidate | Prove adoption outside the build repository | Unfamiliar consumer installs, runs, and independently verifies the candidate | Consumer quickstart, policy audit, hosted gate, independent review | `queued` |

## Files in play

- `packages/cli/**`
- `packages/conformance/**` only for distribution fixtures in the accumulated
  release gate
- `fixtures/S6/**`
- `package.json`
- `package-lock.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S6/**`
- `runs/S6/**`
- `evidence/S6/**`

## Validation speed option

- Fast slice-local command: `npm run test:s6`
- Package consumer command: install the output of `npm pack` into a newly
  created temporary repository and invoke its local `scopa` binary.
- Upstream fixture policy: consume the already-proven S2-S5 APIs and committed
  fixtures; do not rebuild historical signing or CASE evidence for every CLI
  parser test.
- Broad-suite policy: `npm test` retains all S0-S5 tests and fault probes;
  clean-install and package-content checks run explicitly for S6.

## Non-goals

- No Claude Code, Codex, MCP, hook, or plugin integration in S6.
- No change to the frozen effect taxonomy, journal encoding, enforcement
  semantics, signed packet, or CASE mapping.
- No registry lookup requirement or dependency on a published SCOPA package.
- No npm publication, public repository, public release, or production
  installation.
- No final trademark, package-name, license, or contribution-model claim.
- No silent overwrite of existing project files.
- No shell-string command execution; preserve argv-based gate execution.
- No claim that an installed CLI alone makes an agent adapter conforming.

## Evidence

This arc slice requires all three evidence surfaces:

- `notes/S6/` — package-boundary decisions, CLI schema choices, and ruled-out
  destructive initialization behavior.
- `runs/S6/` — focused tests, package manifest, clean-install run, fault runs,
  accumulated release gate, and protocol check.
- `evidence/S6/` — reviewer-facing local tarball manifest, fresh-repository
  transcript, stable result samples, idempotency proof, and overwrite denial.

## Acceptance

- `npm run test:s6`
- `npm test`
- `npm run protocol:check`
- `npm pack` produces an installable local artifact with an explicit file
  allowlist and no private keys, temporary receipts, or historical run logs.
- A fresh temporary repository installs only that artifact and its declared
  dependencies; no import resolves into the SCOPA source checkout.
- `scopa init` creates a closed, versioned configuration without overwriting
  existing files and is idempotent on an unchanged repository.
- `scopa status`, `scopa check`, `scopa run`, and `scopa verify` expose stable
  JSON result forms and meaningful zero/nonzero exit codes.
- A deliberately failing verification gate cannot be converted to success by
  output text or an agent assertion.
- Path, gate, and evidence errors fail closed with correction-bearing output.
- S0-S5 release gates remain green.
