# S11 proof-integrity design

Date: 2026-07-28
Authority:
`next-prompt-protocols/active/2026-07-27-S11-proof-contract-and-redaction-convergence.md`
Implementation commits: `edc8e2c`, `7b686e3`

## Validator convergence

The three published release contracts are now the executable source of truth.
`validateReleasePosture`, `validateCandidateManifest`, and
`validateConsumerProof` delegate to `validatePublishedContract`, which compiles
the shipped Draft 2020-12 schemas with AJV 8.20.0.

Portable JSON Schema cannot express candidate file-path ordering, uniqueness
by one object property, or equality between `package.entryCount` and
`files.length`. The candidate schema therefore declares
`x-scopa-candidate-invariants: true`. The official validator registers that
closed custom keyword before loading any schema and enforces:

- unique candidate file paths;
- code-point-sorted candidate file paths;
- exact equality between entry count and file-array length.

The runtime and direct published-contract APIs resolve to the same compiled
validator. The shipped 24-case corpus remains an expectation oracle: it fails
if the authoritative language accepts a case declared invalid or rejects a
case declared valid.

Numeric candidate fields are bounded by JavaScript's maximum safe integer.
Array cardinality and uniqueness are enforced by schema bytes rather than
duplicated manual checks.

## Publication and semantic fields

Only two proof fields are designated private publication fields:

- `/environment/sourceRoot`
- `/environment/temporaryRoot`

Publication first validates the raw proof, scans every string for reserved
placeholder injection, and rejects any occurrence of either private value in
a non-designated field. It then assigns placeholders only to the two
designated fields and validates the result again.

The semantic projection is the complete proof with those two designated
fields removed. `semanticFieldsChanged` is computed by deterministic canonical
comparison of the raw and public projections. A true result is a publication
failure, not a warning.

Equal or overlapping roots are safe because publication does not perform
recursive substitution. Exact and substring collisions outside the designated
fields fail closed because otherwise the public proof would retain private
data or become ambiguous.

## Packaging decision

The parity corpus is shipped at
`packages/release-readiness/src/proof-contract-corpus.json`. It is not added to
the frozen S10 public-fixture allowlist. This keeps the installed
`probe:s11:parity` runnable while preserving the existing rule that
`fixtures/S10/` contains exactly the reviewed S10 consumer fixtures.

## Dependency decision

AJV is an explicit, exactly pinned production dependency because SCOPA should
execute its published JSON Schemas rather than maintain a second handwritten
structural language. The final dependency audit reports zero vulnerabilities.
No schema is fetched or accepted from an untrusted runtime source.

## Non-goals preserved

- The accepted S10 artifact, retained proof, and historical closeout were not
  modified.
- No provider integration, effect category, mutation route, adapter assurance,
  public release, visibility change, deployment, or customer action was added.
- No credential value or rotation evidence entered the repository.
- S12 and S13 implementation did not begin under S11 authority.

## Review remediation

Claude Sonnet returned `ACCEPT` with no critical, high, or medium finding.
Three low corpus gaps were closed in `7b686e3`: duplicate non-claims, empty
consultation boundary, and candidate custom-invariant propagation through the
consumer schema reference. Its informational observation about a literal
redaction count was also removed by deriving the count from the actual field
change.
