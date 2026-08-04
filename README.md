# SCOPA

SCOPA is an open-source enforcement runtime for bounded, verifiable autonomous
coding work. It gives an agent a mechanically enforced answer to four
questions:

1. **Scope:** which repository paths may change?
2. **Completion:** which real commands must pass before work is complete?
3. **Continuity:** which verified state may survive a restart or context loss?
4. **Evidence:** what can another person or process verify independently?

SCOPA implements the controls of Next-Prompt Protocol v2.4. The protocol
defines the practice; SCOPA is the executable reference implementation.

## See the boundary before setup

On the current source line, Boundary Doctor gives a repository-specific answer
before `.scopa/` exists:

```sh
node packages/cli/src/cli.js doctor --format markdown --repo /path/to/project
```

It performs a bounded, read-only local diagnosis—no model call, network probe,
account, or target dependency. The result distinguishes observed markers,
honest absence, and unknown evidence without pretending to know the agent's
authority. Its Markdown is privacy-minimized and SHA-256-bound to the canonical
JSON source.

When the scope, completion gates, capability surface, and external authority
posture have been reviewed, one explicit `doctor --lock` command converts them
into hardened SCOPA state and returns the actual terminal Workflow Boundary
Map. See [Boundary Doctor](docs/BOUNDARY_DOCTOR.md).

Boundary Doctor is newer than the published `0.2.0` tarball. Until a later
release is separately qualified, use the source command above or confirm that
an installed build lists `doctor` in `scopa --help`.

## Start with one prompt

Point your coding agent at [`SCOPA_AGENT.md`](SCOPA_AGENT.md) and state the
task:

> Read `SCOPA_AGENT.md` and add request-ID logging to this service. Preserve
> its public API and do not change dependencies.

That is the primary workflow. The agent discovers the repository, derives a
small closed boundary, bootstraps the pinned SCOPA runtime, performs supported
writes through it, runs real project gates, and reports whether it can stop.
The developer does not need to install SCOPA or author policy JSON first.

Use the raw file from another repository:

```text
https://raw.githubusercontent.com/heart-ai-foundation/scopa/main/SCOPA_AGENT.md
```

The agent entry applies an anti-ceremony rule: ordinary work is one contained
slice. It creates a Macro Delta or protocol queue only for genuinely
multi-slice work, a change of authority, or an explicit developer request.
See the [two-minute quickstart](docs/QUICKSTART.md).

SCOPA also projects locked policy, completion state, capability inventories,
and explicit authority boundaries into a deterministic
[Workflow Boundary Map](docs/WORKFLOW_BOUNDARY_MAP.md). Missing evidence remains
`unknown`; it never becomes an implicit safety claim.

## Why SCOPA?

Agent instructions are useful, but instructions alone cannot prove that an
agent stayed in scope or that its tests actually passed. SCOPA places those
decisions behind a local tool boundary:

- path rules are locked before mutation;
- writes are routed through a scope-checking dispatcher;
- completion is derived from bounded subprocess results, not model prose;
- restart state is hash-bound and validated before reuse; and
- receipts use versioned schemas and explicit assurance limits.

SCOPA is a local developer tool. It is not a hosted service, an operating-system
sandbox, or a provider identity attestation.

## Status

- **Current public release:** `0.2.0`
- **License:** Apache-2.0
- **Runtime:** Node.js 22 or newer
- **Platforms:** the CLI is portable; process-tree gate custody currently
  requires POSIX process groups
- **Integrations:** model-neutral MCP, Claude Code, and Codex
- **Assurance:** the model-neutral fixture can earn full assurance relative to
  its enumerated surface; Claude Code and Codex remain explicitly partial

The package is public at `@heart-ai-foundation/scopa`. Release qualification,
adversarial findings, and historical protocol records remain reviewable in
this repository; they are supporting evidence rather than the primary
developer documentation.

## Manual setup

You can also operate SCOPA directly when integrating a host or inspecting each
control yourself.

Install SCOPA in a clean project:

```sh
npm install --ignore-scripts @heart-ai-foundation/scopa@0.2.0
```

Create `scopa.slice-definition.json`:

```json
{
  "schema": "scopa.slice-definition.v1",
  "sliceId": "add-health-endpoint",
  "allowedPaths": ["src/**", "test/**"],
  "amendmentPath": ".scopa/amendment.json",
  "gates": [
    {
      "id": "tests",
      "command": ["npm", "test"],
      "cwd": ".",
      "timeoutMs": 120000
    }
  ],
  "nonGoals": ["No dependency changes", "No deployment"],
  "stopCondition": { "kind": "all-gates-pass" }
}
```

Bind the definition and inspect the real stop state:

```sh
npx scopa init --definition scopa.slice-definition.json
npx scopa status
npx scopa check
```

`status` is observational. `check` runs the declared gates and exits nonzero
while completion is blocked. Initialization is idempotent for identical bytes
and refuses conflicting control state.

For a complete source-free walkthrough—including an allowed write, a denied
escape, MCP tool inventory, and independent evidence verification—follow the
[manual walkthrough](docs/MANUAL_SETUP.md).

## Core interfaces

| Interface | Purpose | Start here |
| --- | --- | --- |
| `scopa` | Initialize policy, inspect status, run trusted-host tool requests, execute gates, and verify evidence | [CLI reference](packages/cli/README.md) |
| `scopa-mcp` | Expose six governed SCOPA tools over local MCP stdio | [MCP host reference](packages/adapter-host/README.md) |
| `@heart-ai-foundation/scopa/claude` | Launch the reviewed Claude Code profile through the SCOPA bridge | [Claude integration](packages/integrations/claude/README.md) |
| `@heart-ai-foundation/scopa/codex` | Launch the reviewed Codex profile through the SCOPA bridge | [Codex integration](packages/integrations/codex/README.md) |
| `@heart-ai-foundation/scopa/release-readiness` | Build and verify exact source-free release candidates | [Release-readiness reference](packages/release-readiness/README.md) |

The MCP host exposes exactly six tools: orientation, contained read, governed
write, completion check, assurance inspection, and transcript inspection. It
has no independent filesystem-write, process, network, browser, or plugin
primitive. Every mutation reaches the same dispatcher used by the CLI.

## Enforcement model

SCOPA separates a pure effect loop from the trusted host that performs effects.
The active slice definition is normalized, hashed, and persisted as a lock.
Before a registered mutation executes, SCOPA:

1. resolves the requested repository path;
2. rejects repository escape, symlink aliases, hard-linked targets, and
   undeclared paths;
3. binds the authorized parent directory;
4. revalidates topology immediately before mutation; and
5. records a correction-bearing denial or a governed result.

Verification gates run as argv arrays without a shell, in repository-contained
working directories, with a small sanitized environment, bounded output,
timeouts, process-group termination, and descendant-survivor checks. A model's
claim that work is finished has no effect on `canStop`.

See [Architecture](docs/ARCHITECTURE.md), [Slice-definition reference](docs/SLICE_DEFINITION.md),
and [Threat model](docs/THREAT_MODEL.md) for the full boundary.

## Evidence and assurance

SCOPA can produce deterministic journals, signed evidence packets, optional
RFC 3161 timestamp anchors, and CASE/UCO 1.4 exports. Verification always
requires the relying party's expected bytes and trust policy. A software
signature proves key possession, not human identity or hardware provenance.

Adapter assurance is computed from an enumerated capability matrix. Any active
uncontrolled route forces `partial`; success with one provider does not
transfer assurance to another. See [Claims and non-claims](docs/CLAIMS.md).

## Exact release bytes

SCOPA has no install lifecycle scripts. For a release-sensitive installation,
compare all three of the following:

```sh
npm view @heart-ai-foundation/scopa@0.2.0 dist.integrity
npm view @heart-ai-foundation/scopa@0.2.0 dist.tarball
sha256sum heart-ai-foundation-scopa-0.2.0.tgz
```

Authenticate the expected SHA-256 through the corresponding GitHub Release.
From a source checkout, the qualified workflow uses `npm run pack:candidate`;
raw `npm pack` is not equivalent to the reviewed bundled candidate.

## Documentation

- [Agent entry](SCOPA_AGENT.md) — the self-contained point-and-go protocol
- [Quickstart](docs/QUICKSTART.md) — give an agent one file and one task
- [Boundary Doctor](docs/BOUNDARY_DOCTOR.md) — diagnose before setup and create
  a digest-bound before/after proof
- [Manual walkthrough](docs/MANUAL_SETUP.md) — exercise each runtime interface
- [Slice-definition reference](docs/SLICE_DEFINITION.md) — author scope and gates
- [Architecture](docs/ARCHITECTURE.md) — components, data flow, and trust boundaries
- [Integration guide](docs/INTEGRATIONS.md) — choose MCP, Claude Code, or Codex
- [Workflow Boundary Map](docs/WORKFLOW_BOUNDARY_MAP.md) — inspect controlled,
  uncontrolled, unknown, disabled, and authority-sensitive routes
- [CLI reference](packages/cli/README.md) — commands, JSON envelopes, and exits
- [Threat model](docs/THREAT_MODEL.md) — controls and residual risk
- [Claims and non-claims](docs/CLAIMS.md) — precise assurance language
- [Troubleshooting](docs/TROUBLESHOOTING.md) — common failures and safe diagnostics
- [Security policy](SECURITY.md) — supported versions and private reporting
- [Contributing](CONTRIBUTING.md) — development workflow and DCO
- [Governance](GOVERNANCE.md) — stewardship and open-core boundary
- [Versioning](docs/VERSIONING.md) and [changelog](CHANGELOG.md)

## Security

Please do not open a public issue for a suspected vulnerability or include
secrets in diagnostics. Follow [SECURITY.md](SECURITY.md) for the private
reporting path. SCOPA's security claims are bounded; the project does not claim
formal certification, complete vulnerability-database coverage, or protection
from a separately privileged local process.

## Contributing

Contributions are welcome under Apache-2.0 and the Developer Certificate of
Origin 1.1; no CLA is required. Start with [CONTRIBUTING.md](CONTRIBUTING.md),
follow the [Code of Conduct](CODE_OF_CONDUCT.md), and use the repository's issue
and pull-request templates. Security fixes follow the private process above.

## Stewardship

[Heart AI Foundation](https://github.com/heart-ai-foundation) publishes SCOPA
as a free reference implementation. Consultation may extend the runtime with
profiles, governance installation, and evidence review, but independent
verification must remain available without a paid service.
