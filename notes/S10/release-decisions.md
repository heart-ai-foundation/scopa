# S10 release decisions

Principal approval: 2026-07-27

## License

SCOPA uses the Apache License, Version 2.0 (`Apache-2.0`). The complete license
text is retained in `LICENSE` and included in the packed candidate.

## Contribution model

Contributions use Developer Certificate of Origin sign-off. SCOPA does not
require a Contributor License Agreement for this developer-preview posture.
Every commit intended for contribution must carry a valid `Signed-off-by`
trailer.

## Working naming posture

- project: `SCOPA`
- developer-preview version: `0.2.0-dev.1`
- npm package identifier: `@heart-ai-foundation/scopa`
- installed binaries: `scopa` and `scopa-mcp`
- publisher: Heart AI Foundation

These are working implementation identifiers. Apache-2.0 does not grant
trademark rights, and this decision makes no registration or exclusivity
claim.

## Publication posture

S10 is private tarball evaluation only. The repository remains private,
`package.json` remains `"private": true`, and no npm publication, GitHub
Release, public repository, public announcement, production installation, or
customer deployment is authorized. Each such action requires a separate
principal decision.

## Free-tool boundary

The kernel, verifier, conformance fixtures, and supported adapters remain
independently useful. Consultation may sell expert application, governance
installation, evidence review, regulated integration, and reconstructability
assessment; it may not place verification truth behind a paid dependency.
