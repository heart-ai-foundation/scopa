# S16 deterministic client-store custody remediation

Date: 2026-07-30
Working directory: `/home/dylan/scopa`
Base commit: `9c55fe60a64577d8dad2b81b612971f251edb7bf`

## Commands

```sh
npm run test:s16
```

## Result

All 16 S16 hardening tests passed. The new deterministic residue branch
launches only the committed local fault client; it makes no provider network
request. It writes a synthetic isolated-store entry, verifies that the runner
stops, and verifies the retained private custody receipt is path-hashed,
mode-restricted, and unaccompanied by a public result.

The existing successful deterministic campaign also verifies that its
temporary custody receipt is deleted after normal evidence persistence.
