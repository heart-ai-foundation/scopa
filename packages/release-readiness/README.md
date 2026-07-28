# SCOPA release readiness

This package implements the S10 private developer-preview release boundary.
It validates the principal-approved release posture, audits required security
and governance surfaces, packs the exact candidate, verifies its integrity,
and drives a source-free consumer reproduction.

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
```

## Claim boundary

The candidate manifest binds artifact bytes and the consumer proof binds
observed installation and execution outcomes. Neither is a registry
publication, provider identity attestation, trademark grant, production
security certification, or full-assurance claim for Claude or Codex.
