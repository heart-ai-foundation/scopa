# S49 adopter fact badge and discovery evidence

## Artifact

`scopa view --format badge --output scopa-boundary.svg` generates a standalone
SVG from the same validated card used by terminal, JSON, HTML, and PR surfaces.
The reviewed exact fixture is `fixtures/S49/expected-partial-badge.svg`.

The fixture visibly states:

- `SCOPA BOUNDARY EVIDENCE`;
- `PARTIAL · ACTIVE UNCONTROLLED ROUTE`; and
- `TRACKED CHANGE OBSERVATION UNAVAILABLE`.

Its accessible title repeats those facts, its description identifies a local
fact-only projection, and its metadata carries the full source-map SHA-256.

## Rejection and privacy properties

Executable tests reject badge bytes containing grade, score, pass, approval,
certification, safe-to-merge, or risk-rank semantics. Hostile private path,
non-goal, and gate identifiers do not enter the SVG. The output contains no
script, foreign object, handler, link, remotely loaded asset, or CSS URL.

Observation polarity is explicit:

- no observation → `TRACKED CHANGE OBSERVATION UNAVAILABLE`;
- bounded zero → `0 OUTSIDE · 0 NON-GOAL CONTACTS OBSERVED`; and
- contact present → the exact aggregate counts.

## Discovery and consultation boundary

README now explains the fact badge and exposes an optional multi-repository
workflow-boundary review after the free PR surface. README, Support, and the
review document link to the existing Heart AI Foundation contact route and say
SCOPA sends no usage or lead data. The project remains fully useful without
contact or consultation. No GitHub setting or external system changed.

## Verification

- `npm run test:s49` — pass
- `npm run test:s40` — pass
- `npm run test:s46` — pass
- `npm run test:s48` — pass
- `npm run test:docs` — pass
- protocol synchronization and diff checks — pass
