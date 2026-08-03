# SCOPA v0.2.0

SCOPA is a free Apache-2.0 enforcement runtime for bounded, verifiable
autonomous coding workflows. It turns Next-Prompt Protocol controls into an
executable boundary around scope, completion, evidence, and continuity.

## Included

- deterministic effect journal and replay verification;
- fail-closed scope and completion enforcement;
- signed evidence packets with optional RFC 3161 anchoring;
- CASE/UCO JSON-LD export and independent validation;
- source-free `scopa` and `scopa-mcp` developer interfaces;
- model-neutral adapter plus bounded Claude Code and Codex integrations;
- bundled production dependencies for reproducible offline installation; and
- privacy, process-tree custody, exact-byte, and adversarial release gates.

## Install

```sh
npm install --ignore-scripts @heart-ai-foundation/scopa@0.2.0
```

SCOPA requires Node.js 22 or newer and exposes no install lifecycle scripts.

## Boundaries

SCOPA is not an operating-system sandbox, hosted service, formal certification,
provider identity attestation, or guarantee of complete workflow capture. Its
assurance is limited to the documented runtime boundary, exact integrations,
fixtures, policies, and retained evidence.

See `docs/QUICKSTART.md`, `docs/CLAIMS.md`, `docs/THREAT_MODEL.md`, `SECURITY.md`,
and `GOVERNANCE.md` for the supported surface and reporting route.
