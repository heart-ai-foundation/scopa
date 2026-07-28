# S10 — Developer-Preview Release Candidate

**Class:** `arc`
**Module:** `release-readiness`
**Crosses:** [`distribution`, `adapter-host`, `conformance`]
**Advances contracts:** [`RC1`, `RC2`, `RC3`]
**Compound:** false

## Why this exists

S6-S9 prove local packaging, a model-neutral enforcement bridge, and separately
evidenced Claude Code and Codex integrations. Those proofs were built by
contributors who know the repository. A private developer-preview candidate is
not ready until an unfamiliar consumer can install it, understand its claim
boundary, reproduce one governed adapter workflow, and independently verify
retained evidence without build-conversation knowledge.

## Next objective

After the principal records the release license, contribution model, working
release name, and publication posture, assemble a private v0.2
developer-preview candidate. Run its documented quickstart from the packed
artifact in a fresh repository, exercise one supported adapter, reproduce the
core enforcement proof, independently verify the evidence packet, and obtain
an outside consumer/reviewer verdict.

## Descriptor rung check

Executable unlock: an unfamiliar consumer installs the exact packed candidate
in a source-free repository and produces a machine-checkable installation,
governed-workflow, denial, stop-state, and independent-verification receipt.

## Anti-ceremony gate

- Classification: `test/validation`.
- Executable change: consumer harness, candidate manifest and integrity
  verifier, public-fixture dry run, policy audit, and reproducible quickstart.
- New uncertainty reduced: whether SCOPA is adoptable and honestly
  understandable without monorepo paths, institutional context, or inflated
  agent-assurance claims.
- Validation: clean consumer install, supported-adapter run, failing fixture,
  evidence verification, threat/non-claim audit, policy-state audit,
  accumulated hosted gate, and independent outside review.
- Consecutive metadata/decision slice check: `pass`; S9 delivered executable
  Codex parity, and S10 must deliver an executable consumer boundary.
- Status-report alternative: insufficient because release readiness depends on
  a real source-free consumer run.

## Productivity mix

- Consumer/runtime validation: 45%
- Contract/test code: 35%
- Policy and adoption documentation: 20%

## Slice queue

This queue is materialized from the authorized Developer Preview Macro Delta
and creates no independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S6 | Installable developer surface | Package SCOPA behind one safe CLI | Clean repository installs the tarball and runs core commands | Pack/install harness, CLI contracts, overwrite refusal, accumulated gate | `completed` |
| S7 | Model-neutral adapter bridge | Give supported agents one trusted mutation boundary | Fake agent reaches allowed, denied, and stop states only through the bridge | Hostile tool calls, bypass attempts, transcript and matrix checks | `completed` |
| S8 | Claude Code headless integration | Exercise the bridge with Claude through strict tool configuration | Claude is blocked out of scope and refused false-green while an allowed task completes | Headless clean/fault runs, cold resume, outside review | `completed` |
| S9 | Codex headless integration and parity | Exercise the same contract with Codex and compare outcomes | Codex satisfies the Claude behavior contract or reports a parity gap | Headless clean/fault runs, parity report, outside review | `completed` |
| S10 | Developer-preview release candidate | Prove adoption outside the build repository | Unfamiliar consumer installs, runs, and independently verifies the candidate | Consumer quickstart, policy audit, hosted gate, independent review | `active` |

## Files in play

- `packages/release-readiness/**`
- `packages/cli/test/cli.test.js`
- `fixtures/S10/**`
- `docs/**`
- `schemas/**`
- `README.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `GOVERNANCE.md`
- `LICENSE`
- `package.json`
- `package-lock.json`
- `.github/**`
- `next-prompt-protocols/**`
- `notes/S10/**`
- `runs/S10/**`
- `evidence/S10/**`

## Validation speed option

- Fast deterministic command: `npm run test:s10`
- Consumer command: `npm run probe:s10:consumer`
- Policy command: `npm run audit:s10:policy`
- Upstream policy: consume the exact packed S9 artifact and public evidence;
  do not special-case source-checkout resolution.
- Outside-consumer policy: run in a fresh disposable repository with no
  SCOPA-source imports or private evidence-home access.
- Broad-suite policy: `npm test` retains all S0-S9 tests and fault probes.

## Decision gate

The Macro Delta names license, contribution model, release naming, and
publication timing as principal dependencies. S10 may audit and document their
state, but candidate assembly must defer while any remains open. A private
candidate does not itself authorize npm publication, repository visibility
change, public release, trademark assertion, or production deployment.

## Non-goals

- No npm publication, public repository, public release, visibility change,
  production installation, or customer deployment.
- No license text, contribution policy, release name, trademark claim, or
  publication date inferred without a principal decision.
- No claim that partial Claude or Codex assurance is full enforcement.
- No hiding of native provider, session, network, policy, skill, plugin, hook,
  filesystem, or other uncontrolled capability routes.
- No quickstart path that imports SCOPA source, private evidence, credentials,
  or repository-local institutional knowledge.
- No removal of known-failing fixtures, public verifier capability, or
  independently useful free functionality.
- No change to S0-S9 runtime semantics or the frozen effect taxonomy.
- No queue entries outside the authorized Developer Preview Macro Delta.

## Evidence

This arc slice requires all three evidence surfaces:

- `notes/S10/` — release, naming, licensing, contribution, security,
  governance, versioning, threat-model, and claim-boundary decisions.
- `runs/S10/` — deterministic tests, exact pack/install receipt, consumer
  commands, supported-adapter run, failing fixture, policy audit, accumulated
  gate, hosted CI, and outside review.
- `evidence/S10/` — candidate manifest, integrity receipt, consumer transcript,
  independent packet verification, threat/non-claim audit, policy-state audit,
  and reviewer verdict.

## Acceptance

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
