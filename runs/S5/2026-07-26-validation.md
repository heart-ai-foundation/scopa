# S5 validation run

Date: 2026-07-26 America/Los_Angeles
Source base: `150c6fc`

## Focused implementation

- `npm run test:s5`: PASS, 6/6 interoperability tests inside the isolated
  focused-test wrapper.
- Determinism: repeated exports of the same signed packet were byte-identical.
- Frozen ABI: all ten effect categories mapped exactly once; unknown mappings
  failed.
- Round trip: exact native packet bytes recovered, SHA-256 matched, and S4
  verification passed with required FreeTSA trust policy.
- Adversarial mutations: envelope additions, context replacement, category
  distortion, label distortion, missing and duplicate nodes, packet mutation,
  graph reordering, and noncanonical JSON were rejected.
- Fresh-process CLIs: export and verification passed without the original
  workflow or signing private key.

## Independent CASE consumer

Environment:

- consumer: CASE Utilities Python `case-utils 0.17.0`;
- ontology build: `case-1.4.0`;
- installation root: separate temporary Python environment;
- policy: default strict severity handling.

Positive artifact:

- command: `npm run validate:case:s5`;
- validator exit: `0`;
- result: `Conforms: True`.

Negative control:

- fixture: `fixtures/S5/invalid-relationship.jsonld`;
- command: `npm run validate:case:s5:negative`;
- validator exit: `1`, consumed as the expected negative-gate result;
- result: `Conforms: False`;
- violations: required `uco-core:source` and `uco-core:target` absent.

Both paths are wired into `.github/workflows/case-validation.yml`.

The first GitHub-hosted run (`30264961525`) stopped before test execution
because `setup-python` could not discover the intentionally nonstandard
validator requirements filename. The workflow now declares
`packages/interop/requirements-case-validator.txt` as its explicit pip cache
dependency path; this changes CI dependency discovery only, not the validated
artifact or runtime.

## Candidate artifact

- CASE JSON-LD bytes: `33,872`
- artifact SHA-256:
  `cb54ceaf93247517455547404fb68ca95aa9883c123a163e425d27af38d3fbc7`
- embedded native packet SHA-256:
  `f30c9fa735b0a9f76de71eeefa135f6fbf5967b62d36666aa16771cf0653bfcd`
- graph: 13 nodes, 4 Actions, 5 Relationships
- chain: 4 records, root
  `7047b7552a8026ee2c12530a51e0f500042b82e8637c01dc3bf17bce3a18c565`
- signature: Ed25519 key
  `2b7bec8e517096d088424c0d6983ab96306836abb92115b355565f5febf90cde`
- timestamp authority policy: `freetsa.org-2026`, required

## Accumulated gate

- `npm test`: PASS, 76/76 tests.
- injected replay and containment controls continued to fail as expected.
- `npm run protocol:check`: PASS while I1/I2 correctly remained unsatisfied
  pending final S5 review and closeout.

## Outside-model acceptance

An unfamiliar `gpt-5.6-terra` reviewer independently ran every prescribed
gate and synthesized a packet exercising all ten categories. Its first review
returned `HOLD`: an enumerable `__proto__` graph property disappeared during
direct-API normalization. After null-prototype normalization and regression
coverage, a fresh retest found a second `HOLD`: a hostile `@graph` Array
prototype could override `filter` and falsify returned counts.

The final remediation accepts only ordinary mutable JSON containers or
SCOPA's recursively frozen document, rejects hostile descriptors and
prototypes, and operates on a fresh normalized JSON clone. A third fresh
review reproduced both prior attacks plus adjacent symbols, accessors, hidden
properties, sparse arrays, extra properties, and altered descriptors. All
failed closed without invoking hostile methods. Clean mutable, frozen, and
byte-oriented paths passed. Final verdict: `ACCEPT`.

Review records:

- `2026-07-26-outside-model-review.md` — initial `HOLD`.
- `2026-07-26-outside-model-retest.md` — second `HOLD`.
- `2026-07-26-outside-model-final-retest.md` — final `ACCEPT`.
