# SCOPA release readiness

In a source checkout, the provider-off Phase 13 adoption qualifier packs and
installs the current bytes offline, then exercises first insight, runtime-owned
begin, Claude and Codex project-local installation, the enforcement demo,
Boundary Card, and PR reporting from that installation:

```sh
npm run qualify:s43:installed
```

Use `-- --output <receipt.json>` for a no-replace machine-readable receipt.
The qualifier does not authorize publication or transfer release assurance.
It scans first-party installed bytes and shareable outputs for private values;
the accumulated release gates retain bundled-dependency privacy and integrity
coverage.

This package implements SCOPA's exact-byte release boundary. It validates the
principal-approved release posture, audits required security and governance
surfaces, packs the exact candidate, verifies its integrity, and drives a
source-free consumer reproduction.

S11 makes the shipped JSON Schemas executable through the same validator used
by the runtime exports. Candidate-manifest cross-field rules that portable
JSON Schema cannot express—unique and sorted file paths plus entry-count
equality—are declared by `x-scopa-candidate-invariants` and enforced by the
official validator. `probe:s11:parity` runs both public entry paths over the
same positive and hostile corpus.

Public-proof publication is field-specific. Only
`/environment/sourceRoot` and `/environment/temporaryRoot` are transformed.
If either private value occurs elsewhere, or a reserved placeholder is already
present, publication fails closed. Semantic preservation is computed from the
proof with those two designated fields projected out.

S12 builds the candidate through an isolated consumer stage. The staged
`package.json` retains the release identity, dependencies, bins, exports,
engine, license, repository, and file allowlist while omitting contributor
scripts and development dependencies. The installed-surface probe packs twice
to prove deterministic bytes, installs only the tarball, imports every export,
executes every bin, and scans every installed file for structural private-path
or recognizable credential residue.

The package is public-release capable, but these commands never publish it.
They create only local tarballs and evidence receipts; registry and GitHub
publication remain separately authorized release-execution actions.

S18 adds a provider-closed exact-candidate probe. It runs the frozen local
matrix, packs and installs the clean candidate repeatedly, binds policy and
protocol inputs by digest, and emits a path-free qualification receipt. The
tarball destination must be private and explicit. A passing receipt preserves
independent `partial` Claude and Codex assurance and authorizes neither
provider traffic nor publication.

## Source-checkout commands

These contributor commands require a SCOPA source checkout and are
intentionally absent from the source-free consumer package, which strips
scripts and development dependencies. Installed consumers use the exported
`./release-readiness` APIs and the `scopa` / `scopa-mcp` binaries instead.

```sh
npm run test:s10
npm run audit:s10:policy
npm run probe:s10:consumer -- --output /trusted/private-proof.json
npm run publish:s10:proof -- \
  --input /trusted/private-proof.json \
  --output evidence/S10/consumer-proof.public.json
npm run test:s11
npm run probe:s11:parity
npm run test:s12
npm run probe:s12:installed
npm run probe:s18:candidate -- \
  --artifact-dir /trusted/private-candidate \
  --output /trusted/exact-candidate-receipt.json
```

## Claim boundary

The candidate manifest binds artifact bytes and the consumer proof binds
observed installation and execution outcomes. Neither is a registry
publication, provider identity attestation, trademark grant, production
security certification, or full-assurance claim for Claude or Codex.
