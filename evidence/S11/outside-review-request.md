# S11 outside review request

Review exact SCOPA commit `edc8e2c` against its authority/baseline commit
`7d28de8`. Work read-only. Do not edit files, create commits, push, publish,
change repository settings, access private evidence outside this checkout, or
use credentials other than the model call itself.

Read these governing and implementation surfaces:

- `next-prompt-protocols/active/2026-07-27-S11-proof-contract-and-redaction-convergence.md`
- `next-prompt-protocols/macro-deltas/2026-07-27-scopa-adversarial-release-hardening.md`
- `packages/release-readiness/src/published-contracts.js`
- `packages/release-readiness/src/schema.js`
- `packages/release-readiness/src/publish-proof.js`
- `packages/release-readiness/src/proof-parity-probe.js`
- `packages/release-readiness/test/proof-integrity.test.js`
- `packages/release-readiness/src/proof-contract-corpus.json`
- the three public schemas under `schemas/`
- `package.json` and `package-lock.json`

Independently assess:

1. whether RR-01 is actually closed, including empty/duplicate arrays,
   positive/safe integers, closed fields, candidate path uniqueness/order, and
   cross-field entry-count equality;
2. whether runtime and published-contract validation now have one
   authoritative executable language without a meaningful bypass;
3. whether RR-02 is actually closed for exact collision, substring collision,
   overlapping/equal roots, reserved placeholder injection, and deterministic
   publication;
4. whether `semanticFieldsChanged` is genuinely computed from an explicit
   projection and cannot falsely report preservation;
5. whether accepted S10 proof behavior or other release-readiness behavior
   regressed;
6. supply-chain, dependency, packaging, error, data-leak, prototype-pollution,
   malformed-corpus, or API-compatibility risks introduced by S11;
7. whether the tests can false-green or compare two aliases of the same
   faulty behavior without independently exercising the schema bytes.

You may run read-only Git inspection and the focused test/parity commands.
Treat pre-existing S12 findings about the wider shipped script inventory,
launcher stacks, path sentinels, and CI warnings as deferred unless S11 makes
them materially worse.

Return a strict verdict:

- `ACCEPT` only if PI1, PI2, and PI3 are satisfied with no critical, high, or
  medium finding.
- `HOLD` otherwise.

Report every finding with severity, stable ID, file and line where applicable,
specific evidence, and concrete remediation. Distinguish a blocking defect
from a low hardening suggestion.
