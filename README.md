# SCOPA

[![npm version](https://img.shields.io/npm/v/@heart-ai-foundation/scopa)](https://www.npmjs.com/package/@heart-ai-foundation/scopa)
[![release gate](https://github.com/heart-ai-foundation/scopa/actions/workflows/case-validation.yml/badge.svg)](https://github.com/heart-ai-foundation/scopa/actions/workflows/case-validation.yml)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

SCOPA tells you what a coding agent was allowed to change, whether real project
checks passed, and whether tracked or untracked Git working-tree changes were
observed outside the declared boundary. It runs locally, works with compatible
coding agents, and does not
require an account.

## Give your agent one line

Paste this into your coding agent and replace the task:

```text
Read https://raw.githubusercontent.com/heart-ai-foundation/scopa/main/SCOPA_AGENT.md
and implement <your task> in this repository.
```

That is the complete zero-setup path. The agent inspects the repository,
chooses the smallest honest boundary, bootstraps a compatible SCOPA runtime,
performs the work, runs real project checks, and reports what the result proves.
You do not need to preinstall SCOPA, learn its vocabulary, or write policy JSON.

SCOPA turns four practical questions into local, machine-checkable controls:

| Question | SCOPA control |
| --- | --- |
| What may change? | Locked repository path rules |
| What proves completion? | Real commands with explicit pass or fail results |
| What may survive a restart? | Hash-bound, validated state |
| What can others verify? | Versioned receipts and evidence packets |

## See useful output now

Inspect the current repository without installing a dependency or creating
files:

```sh
npx --yes --package @heart-ai-foundation/scopa@0.5.0 scopa
```

Then run the deterministic demonstration:

```sh
npx --yes --package @heart-ai-foundation/scopa@0.5.0 scopa demo
```

Exact tested output:

```text
SCOPA DEMO — THREE REAL FAILURE CHECKS

PASS  Scope escape denied by the path dispatcher
PASS  Completion claim blocked until the real gate passed
PASS  Full-assurance overclaim rejected for native bypasses

FINAL  Declared gates satisfied: yes
       Reported assurance: partial
       Uncontrolled routes: 4
       Temporary workspace removed: yes

Proof SHA-256 dd08ce8f5cb819365037020d586c06258f358487efaf68ce73299f4e25245a21
Local deterministic demonstration; not a security certification or guaranteed prevention claim.
```

The command uses the real dispatcher, gate runner, and assurance validator in
an isolated temporary repository, then verifies cleanup. It does not touch the
current repository or call a network or model. See [the demo proof](docs/DEMO.md).

For a local checkout, the equivalent one-prompt path is:

> Read `SCOPA_AGENT.md` and add request-ID logging to this service. Preserve
> its public API and do not change dependencies.

The agent submits that explicit boundary through
one [`scopa begin`](docs/BEGIN.md) call. SCOPA owns the closed authority
defaults, conservative client-capability declaration, lock creation, first
gate run, and terminal Boundary Map.

Ordinary work stays ordinary: the agent entry does not create a roadmap,
approval digest, or protocol queue for a contained task. See the
[two-minute quickstart](docs/QUICKSTART.md).

To make SCOPA discoverable in a repository on later prompts, preview and add
one reversible project-local skill:

```sh
scopa assistant install --dry-run
scopa assistant install
```

The portable generic Agent Skills path is the baseline for compatible agents;
Claude Code and Codex are named conveniences with known project-local paths.
SCOPA detects their markers, uses the generic project-local path when none are
present, or accepts an explicit `--client`; ambiguous known markers fail closed.
It never edits user-global configuration or overwrites an existing assistant file. See
[assistant installation](docs/ASSISTANT_INSTALLATION.md).

## See the boundary first

Run SCOPA with no arguments from the repository you want to inspect:

```sh
scopa
```

It returns at most three plain-language findings and one next action without
creating files, executing discovered commands, calling a model, or probing the
network. From this source checkout, use `node packages/cli/src/cli.js`.

At a terminal, `begin`, `check`, `status`, `doctor`, and assistant installation
actions print concise human text. Redirects and pipes receive the canonical
JSON envelope; agents and automation should select `--format json` explicitly
when consuming fields.

Boundary Doctor remains the complete machine-readable diagnosis before
`.scopa/` exists:

```sh
npx --yes --package @heart-ai-foundation/scopa@0.5.0 \
  scopa doctor --format markdown --repo /path/to/project
```

It makes no model call or network probe. It reports observed repository
markers, honest absence, unknown evidence, and completion candidates without
claiming to know an agent's permissions. After review, `doctor --lock` can
convert explicit scope, capability, and authority declarations into locked
SCOPA state. See [Boundary Doctor](docs/BOUNDARY_DOCTOR.md).

After a task boundary exists, make it legible without exposing repository
details:

```sh
scopa view
scopa view --format html --output scopa-boundary.html
scopa view --format badge --output scopa-boundary.svg
```

The terminal and standalone script-free HTML Boundary Cards preserve the
canonical completion and control counts, bind the source map digest, and omit
paths, prompts, gate output, and capability evidence. See
[Boundary Card](docs/BOUNDARY_CARD.md).

The local SVG is an adopter-facing fact badge, not a grade. It carries the
computed assurance basis, aggregate tracked and untracked change-observation
facts, and source-map binding without remote assets, tracking, or private
repository detail.

`--output` is an explicit local evidence-export request, not a governed task
write. SCOPA says so in the result. A subsequent card observes an untracked
export outside the task path boundary; export paths themselves remain private.

For pull requests, the included [GitHub Action](docs/GITHUB_ACTION.md)
validates an optional card into a sanitized job summary. Its default workflow
has only `contents: read`, executes no project or gate command, persists no
checkout credential, and treats missing evidence as unknown. PR comments are a
separate full-commit-pinned, token-bearing opt-in.

## From one repository to an organization

The free local result is complete. If the same boundary problem spans many
repositories, teams, agent clients, or authority owners, read the
[optional organizational workflow-boundary review](docs/ORGANIZATIONAL_REVIEW.md).
Heart AI Foundation offers that work, and organizations may use any qualified
advisor. To discuss a private engagement, use the
[Heart AI Foundation contact route](https://empathyethicist.ai/contact/); SCOPA
itself sends no telemetry or lead data.

## How it works

SCOPA is the executable reference implementation of Next-Prompt Protocol v2.4.
The protocol defines the practice; the runtime applies its control boundaries.

1. A slice definition locks allowed paths, non-goals, and verification gates.
2. The dispatcher rejects writes that escape that boundary.
3. Gates run as bounded subprocesses without a shell.
4. `canStop` becomes true only when every declared gate passes.
5. A Workflow Boundary Map separates controlled, uncontrolled, unknown,
   disabled, and authority-required capabilities.

The same dispatcher serves the CLI and the local MCP host. Restart state is
hash-validated before reuse, and evidence uses versioned schemas with explicit
assurance limits.

SCOPA is a local developer tool. It is not an operating-system sandbox, a
hosted service, provider identity attestation, or permission to publish,
deploy, use credentials, or change an external system.

## Choose an interface

| Interface | Use it for | Reference |
| --- | --- | --- |
| `SCOPA_AGENT.md` | Point an agent at one self-contained operating protocol | [Agent entry](SCOPA_AGENT.md) |
| `scopa` | Diagnose, initialize, run checks, inspect state, and verify evidence | [CLI](packages/cli/README.md) |
| `scopa-mcp` | Bootstrap one task or expose six governed tools over local MCP stdio | [MCP host](packages/adapter-host/README.md) |
| `@heart-ai-foundation/scopa/claude` | Launch the reviewed Claude Code profile | [Claude](packages/integrations/claude/README.md) |
| `@heart-ai-foundation/scopa/codex` | Launch the reviewed Codex profile | [Codex](packages/integrations/codex/README.md) |

## Status

- **Current public release:** `0.5.0`
- **Package:** `@heart-ai-foundation/scopa`
- **Included:** enforcement runtime, Boundary Doctor, Workflow Boundary Map,
  offline assessment, model-neutral MCP, Claude Code, and Codex integrations
- **License:** Apache-2.0
- **Runtime:** Node.js 22 or newer
- **Platforms:** the CLI is portable; process-tree gate custody currently
  requires POSIX process groups
- **Assurance:** the model-neutral fixture can earn full assurance relative to
  its enumerated surface; Claude Code and Codex remain explicitly partial

## Manual setup

Install the current public release without lifecycle scripts:

```sh
npm install --ignore-scripts @heart-ai-foundation/scopa@0.5.0
```

Then initialize and check a repository that contains a closed slice definition:

```sh
npx scopa init --definition scopa.slice-definition.json
npx scopa status
npx scopa check
```

`status` observes the current state. `check` runs the declared gates and exits
nonzero while completion is blocked. Identical initialization is idempotent;
conflicting control state is never overwritten.

Follow the [manual walkthrough](docs/MANUAL_SETUP.md) for an allowed write, a
denied escape, MCP tool inventory, and independent evidence verification. The
[slice-definition reference](docs/SLICE_DEFINITION.md) documents the policy
format.

## Assurance and evidence

Assurance is computed from the capability surface, not selected as marketing
language. Any active shell, native editor, plugin, or other route that bypasses
SCOPA forces `partial`, even when all observed changes stay in scope. Success
with one provider does not transfer assurance to another.

SCOPA can produce deterministic journals, signed evidence packets, optional
RFC 3161 timestamp anchors, and CASE/UCO 1.4 exports. A signature proves key
possession; it does not prove human identity or hardware-key provenance. Read
[Claims and non-claims](docs/CLAIMS.md), [Architecture](docs/ARCHITECTURE.md),
and the [Threat model](docs/THREAT_MODEL.md) before sensitive use.

## Documentation

- **Get started:** [Quickstart](docs/QUICKSTART.md),
  [demo proof](docs/DEMO.md),
  [runtime-owned begin](docs/BEGIN.md),
  [assistant installation](docs/ASSISTANT_INSTALLATION.md),
  [Boundary Doctor](docs/BOUNDARY_DOCTOR.md),
  [manual walkthrough](docs/MANUAL_SETUP.md)
- **Operate:** [CLI](packages/cli/README.md),
  [slice definition](docs/SLICE_DEFINITION.md),
  [Workflow Boundary Map](docs/WORKFLOW_BOUNDARY_MAP.md),
  [Boundary Card](docs/BOUNDARY_CARD.md),
  [GitHub Action](docs/GITHUB_ACTION.md),
  [troubleshooting](docs/TROUBLESHOOTING.md)
- **Integrate:** [Integration guide](docs/INTEGRATIONS.md),
  [MCP host](packages/adapter-host/README.md),
  [Claude](packages/integrations/claude/README.md),
  [Codex](packages/integrations/codex/README.md)
- **Trust:** [Architecture](docs/ARCHITECTURE.md),
  [threat model](docs/THREAT_MODEL.md),
  [claims](docs/CLAIMS.md), [security policy](SECURITY.md)
- **Project:** [Contributing](CONTRIBUTING.md), [governance](GOVERNANCE.md),
  [versioning](docs/VERSIONING.md), [changelog](CHANGELOG.md),
  [optional organizational review](docs/ORGANIZATIONAL_REVIEW.md)

## Exact release bytes

SCOPA has no install lifecycle scripts. For a release-sensitive installation,
compare the npm integrity and tarball values with the checksum published in the
corresponding GitHub Release:

```sh
npm view @heart-ai-foundation/scopa@0.5.0 dist.integrity
npm view @heart-ai-foundation/scopa@0.5.0 dist.tarball
sha256sum heart-ai-foundation-scopa-0.5.0.tgz
```

From a source checkout, use `npm run pack:candidate`; raw `npm pack` is not the
reviewed candidate workflow.

## Security and stewardship

Do not open a public issue for a suspected vulnerability or put secrets in
diagnostics. Follow [SECURITY.md](SECURITY.md) for private reporting.

[Heart AI Foundation](https://github.com/heart-ai-foundation) publishes SCOPA
as a free reference implementation. Contributions use Apache-2.0 and the
Developer Certificate of Origin 1.1; no CLA is required. Consultation may add
profiles, governance installation, and evidence review, but independent
verification remains available without a paid service.
