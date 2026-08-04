# SCOPA v0.3.0

SCOPA `0.3.0` makes bounded coding-agent work practical from the first prompt.
It combines the existing enforcement and evidence runtime with a simple
point-and-go entry, a pre-setup diagnosis, and a deterministic map of the
workflow's actual control boundary. The package remains free software under
Apache-2.0.

## Highlights

- **One-file start:** point a coding agent at `SCOPA_AGENT.md` and state the
  task. The agent derives the smallest boundary, bootstraps SCOPA, runs real
  checks, and reports limitations without requiring setup ceremony.
- **Boundary Doctor:** inspect visible workflow markers before `.scopa/`
  exists, create a privacy-minimized digest-bound report, and convert reviewed
  declarations into a lock with one `doctor --lock` transaction.
- **Workflow Boundary Map:** distinguish controlled, uncontrolled, unknown,
  disabled, and authority-required routes without turning missing evidence into
  a safety claim.
- **Offline assessment:** compare a saved map with a baseline using a sanitized,
  portable assessment packet.

The release also includes the patched `fast-uri` dependency, source-free MCP
consumer fixes, clearer developer documentation, exact package qualification,
and retained Claude Code and Codex integrations.

## Install

```sh
npm install --ignore-scripts @heart-ai-foundation/scopa@0.3.0
```

SCOPA requires Node.js 22 or newer and exposes no install lifecycle scripts.

For the simplest workflow, give your coding agent `SCOPA_AGENT.md` and the task.
For direct use:

```sh
npx scopa doctor --format markdown
npx scopa --help
```

## Upgrade from 0.2.0

The `0.2.0` commands and evidence schemas remain supported. `0.3.0` adds
`doctor`, `map`, and `assess`; it does not reinterpret historical evidence.
Re-run `scopa --help` after upgrading and review capability and authority
declarations before using `doctor --lock`.

## Boundaries

SCOPA is not an operating-system sandbox, hosted service, formal certification,
provider identity attestation, or guarantee of complete workflow capture. Any
active route that bypasses SCOPA keeps assurance partial. Publication,
deployment, credential use, paid model calls, and external-system changes still
require separate authority.

See `docs/QUICKSTART.md`, `docs/BOUNDARY_DOCTOR.md`, `docs/CLAIMS.md`,
`docs/THREAT_MODEL.md`, `SECURITY.md`, and `GOVERNANCE.md` for the supported
surface and reporting route.
