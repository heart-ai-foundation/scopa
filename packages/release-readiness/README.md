# SCOPA release readiness

This package implements the S10 private developer-preview release boundary.
It validates the principal-approved release posture, audits required security
and governance surfaces, packs the exact candidate, verifies its integrity,
and drives a source-free consumer reproduction.

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

The package does not publish anything. `package.json` remains private, and the
S10 commands create only local tarballs and evidence receipts.

## Commands

```sh
npm run test:s10
npm run audit:s10:policy
npm run probe:s10:consumer -- --output /trusted/private-proof.json
npm run publish:s10:proof -- \
  --input /trusted/private-proof.json \
  --output evidence/S10/consumer-proof.public.json
npm run test:s11
npm run probe:s11:parity
```

## Claim boundary

The candidate manifest binds artifact bytes and the consumer proof binds
observed installation and execution outcomes. Neither is a registry
publication, provider identity attestation, trademark grant, production
security certification, or full-assurance claim for Claude or Codex.
