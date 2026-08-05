# SCOPA v0.4.0

SCOPA `0.4.0` makes agent-workflow boundaries useful before setup and easier to
carry into the tools developers already use. It preserves the existing
enforcement and evidence contracts while reducing the ordinary starting path
to one task, one explicit runtime transaction, and one truthful result. The
package remains free software under Apache-2.0.

## Highlights

- **Insight before setup:** run `scopa` with no arguments for a concise,
  read-only repository boundary snapshot with no file creation, discovered
  command execution, model call, or network probe.
- **Runtime-owned beginning:** `scopa begin` accepts one explicit task boundary,
  defaults external authority closed, creates the SCOPA control state, runs the
  real gates, and returns the terminal Workflow Boundary Map.
- **Assistant-neutral installation:** install one reversible project-local
  Agent Skill. The portable generic Agent Skills path is the baseline; Claude
  Code and Codex are named conveniences rather than requirements.
- **Boundary Card:** inspect the canonical map as terminal output, JSON, or an
  accessible standalone script-free HTML card without exposing paths, prompts,
  or gate output.
- **Pull-request evidence:** an opt-in least-privilege GitHub Action turns a
  valid Boundary Card into a sanitized job summary and reports missing evidence
  as unavailable instead of green.
- **Real enforcement demo:** `scopa demo` executes three injected failures for
  scope escape, false completion, and assurance overclaim, then verifies exact
  output and cleanup.

## Install

```sh
npm install --ignore-scripts @heart-ai-foundation/scopa@0.4.0
```

SCOPA requires Node.js 22 or newer and exposes no install lifecycle scripts.

Start with immediate local insight:

```sh
npx scopa
npx scopa demo
```

Or give a coding agent [`SCOPA_AGENT.md`](SCOPA_AGENT.md) and the ordinary
repository task. The agent derives the smallest explicit boundary; the runtime
owns validation, default-closed authority, state creation, and completion
polarity.

To make the workflow discoverable on later prompts:

```sh
npx scopa assistant install --dry-run
npx scopa assistant install --client generic
```

Use `--client claude-code` or `--client codex` for their known project-local
paths. Installation never overwrites an existing assistant file or changes
user-global configuration by default.

## Upgrade from 0.3.0

The `0.3.0` commands and versioned evidence schemas remain supported. `0.4.0`
adds `begin`, `view`, `demo`, and `assistant` workflows and changes the
zero-argument CLI from help output to the read-only first-insight snapshot. Use
`scopa --help` for explicit command documentation. Existing initialized
repositories retain their locked state and evidence semantics.

## Qualification

The exact installed candidate is exercised outside the source checkout with
offline installation, a runtime network-denial guard, real blocked-to-passing
gate polarity, generic/Claude/Codex clean and cold installation, Boundary Card
privacy and accessibility, valid/missing PR evidence, exact demo output, and
cleanup verification.

## Boundaries

SCOPA is not an operating-system sandbox, hosted service, formal certification,
provider identity attestation, or guarantee of complete workflow capture. An
active native route that bypasses SCOPA keeps assurance partial. Generic Agent
Skills qualification proves the local skill lifecycle, not every assistant's
discovery or obedience. Publication, deployment, credential use, paid model
calls, and external-system changes still require separate authority.

See `docs/QUICKSTART.md`, `docs/ASSISTANT_INSTALLATION.md`,
`docs/BOUNDARY_CARD.md`, `docs/GITHUB_ACTION.md`, `docs/CLAIMS.md`,
`docs/THREAT_MODEL.md`, `SECURITY.md`, and `GOVERNANCE.md` for the supported
surface and reporting route.
