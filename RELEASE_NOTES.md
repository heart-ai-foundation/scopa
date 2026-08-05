# SCOPA v0.5.0

SCOPA `0.5.0` makes the first-time coding-agent boundary workflow easier to
start and harder to misreport. A passing project gate remains a passing gate,
but the final result now also shows whether tracked or untracked Git changes
were observed outside the declared task boundary.

The package remains free software under Apache-2.0, requires no account or
model provider, and has no install lifecycle scripts.

## Start with one prompt

Give any compatible coding agent this instruction and replace the task:

```text
Read https://raw.githubusercontent.com/heart-ai-foundation/scopa/main/SCOPA_AGENT.md
and implement <your task> in this repository.
```

The agent inspects the repository, submits one explicit task boundary, performs
the work, runs real project checks, reads the final Boundary Card, and reports
what SCOPA did and did not observe. Developers do not need to author policy
JSON or learn protocol terminology first.

## Highlights

- **Truthful final verification:** the agent protocol runs JSON `check`, JSON
  `view`, and `map` before reporting completion. A passing gate with observable
  outside-path or non-goal contacts is reported as `SATISFIED — WITH UNVERIFIED
  CHANGES`.
- **Tracked and untracked observation:** Boundary Cards separately count
  tracked and nonignored untracked working-tree changes and classify both
  against allowed paths and declared non-goals. Shareable output retains only
  aggregate counts.
- **Human-first terminal output:** operational commands, assistant setup, and
  malformed-request recovery are concise at a terminal. Pipes and explicit
  `--format json` retain canonical machine envelopes and exit codes.
- **Portable assistant setup:** marker-free repositories use the generic
  project-local Agent Skill by default. Claude Code and Codex remain explicit
  conveniences; ambiguous recognized markers fail closed.
- **Actionable pull-request evidence:** a missing Boundary Card is reported as
  unknown with one exact corrective command, never as a favorable result.
- **Fact-only badge:** the standalone local SVG reports evidence facts and the
  assurance basis without a grade, score, approval, tracking asset, or remote
  dependency.
- **Explicit export boundary:** caller-requested evidence exports state that
  they are outside the governed task mutation boundary and become visible to a
  later working-tree observation without disclosing their paths.

## Install

```sh
npm install --ignore-scripts @heart-ai-foundation/scopa@0.5.0
```

SCOPA requires Node.js 22 or newer. For immediate read-only insight:

```sh
npx scopa
npx scopa demo
```

To preview reversible project-local agent setup:

```sh
npx scopa assistant install --dry-run
```

## Upgrade from 0.4.0

Existing locked repositories and versioned evidence remain valid. Canonical
gate completion and `canStop` remain determined only by declared gate results.
Current Boundary Cards add an `untrackedChanges` count and a current
working-tree observation basis; legacy cards remain accepted and disclose that
untracked files were not assessed.

Interactive output is human-readable by default. Scripts and agents that
consume fields should continue to use `--format json` explicitly. Piped output
remains canonical JSON.

The local SVG badge and explicit export-boundary fields are additive. No
existing export is overwritten.

## Qualification

The release candidate passed the full accumulated provider-off gate, including
375 core assertions, one intentional skip, all focused Phase 14 and Phase 15
regressions, 38 documentation checks, protocol synchronization, policy audit,
and exact package inventory.

A second fresh agent installed the exact candidate offline with lifecycle
scripts disabled and used only installed product-facing material. Cold insight,
assistant setup and uninstall, malformed recovery, begin/check/view/map,
tracked and untracked hostility, export observation, badge grammar, privacy,
installed-only module resolution, and cleanup passed with zero product findings
at every severity.

## Boundaries

SCOPA is not an operating-system sandbox, hosted service, formal certification,
provider identity attestation, or guarantee of complete workflow capture.
Observation does not prove prevention, attribution, intent, or authorization.
An active native route that bypasses SCOPA keeps assurance partial. Generic
Agent Skills qualification proves the local skill lifecycle, not every
assistant's discovery or obedience.

Publication, deployment, credential use, paid model calls, experiments, and
external-system changes still require separate authority.

See `docs/QUICKSTART.md`, `docs/ASSISTANT_INSTALLATION.md`,
`docs/BOUNDARY_CARD.md`, `docs/GITHUB_ACTION.md`, `docs/CLAIMS.md`,
`docs/THREAT_MODEL.md`, `SECURITY.md`, and `GOVERNANCE.md` for the supported
surface and reporting routes.
