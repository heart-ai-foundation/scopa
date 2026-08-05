# S52 provider-off validation run

**Date:** 2026-08-05

**Source baseline:** `63da198`

**Posture:** local, provider-off, release closed

## Executed gates

| Gate | Result |
| --- | --- |
| `npm run test:s39` | pass |
| `npm run test:s44` through `npm run test:s50` | pass |
| `npm run test:s52` | pass; 5/5 |
| `npm run test:docs` | pass; 38 documents |
| `npm test` | pass; exit 0 |
| Core release gate inside `npm test` | 375 pass, 1 intentional skip, 0 fail; 376 total |
| `node packages/release-readiness/src/audit-policy.js` | pass |
| Protocol sync and check | pass |
| `git diff --check` | pass |

## Candidate identity

| Property | Value |
| --- | --- |
| Package | `@heart-ai-foundation/scopa@0.4.0` development candidate |
| Packed bytes | `2,034,775` |
| Packed entries | `1,146` |
| SHA-256 | `28f0229dd87347cc4409e8c2d0402fb4541ebc663bcc0a17cd8f2363beaa0c26` |
| SHA-512 integrity | `sha512-3eEfwd6rDRVBX0rQd4NyhVFS34awHYVc36S62k7dENEE34wHzNJw2m44GAsqGBxYEpKiVNppT9+k1BHt+U6Lig==` |

This candidate is local qualification evidence only. The public `0.4.0`
release remains the immutable compatibility baseline; no assurance or release
authority transfers to these changed bytes.
