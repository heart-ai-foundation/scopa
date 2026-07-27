# S1 validation run

Runtime date: 2026-07-26 America/Los_Angeles

Runtime identities:

- Node.js 22.22.2, V8 12.4
- Deno 2.9.4, V8 15.0

Results:

- `npm test`: PASS, 41/41 tests; S0 clean controls exited 0 and
  injected-fault controls exited 1.
- `npm run test:s1`: PASS.
- persistent idempotency suite after process-race addition: PASS, 5/5.
- `npm run test:cross-runtime`: PASS.
- `npm run test:lockdown`: PASS; all 11 probed ambient authorities denied.
- `npm run probe:integrity`: PASS; mutation and suffix truncation rejected.
- `npm run probe:act-suppression`: PASS; one shell execution, later run
  suppressed.
- `npm run protocol:check`: PASS.
- `npm audit --omit=dev`: PASS, 0 vulnerabilities.

Cross-runtime vector:

- chain root:
  `f986dad18ee8f29c6219a73d47a67c116ca4c8ba09f7667624a58cadb3218066`
- byte-identical record set SHA-256:
  `be76f95ff6369910f187b359bf1457f61c876d4b9e7adcc10738d6607a2944bd`

Integrity probe root:

- `ec1b1f3a9d8ee688e4e2e4c9ab61c668bc55e11b712fab73a4ba3a98b3a4d67c`
