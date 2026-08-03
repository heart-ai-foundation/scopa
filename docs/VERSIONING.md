# SCOPA versioning

`0.2.0` is SCOPA's first public stable release of the bounded runtime and its
documented evidence contracts. It is published under Apache-2.0.

SCOPA follows semantic-versioning syntax for working release identifiers:

- `MAJOR` may change when the public contract becomes incompatible;
- `MINOR` may add compatible runtime or evidence capability;
- `PATCH` may correct compatible behavior;
- prerelease suffixes identify non-stable candidates and do not receive the
  npm `latest` tag.

The frozen effect taxonomy and versioned evidence schemas are compatibility
boundaries independent of the npm package number. A package version increase
does not silently rename or reinterpret historical records.

`0.2.0` does not create a long-term-support window, hosted-service promise,
formal certification, or stable `1.0.0` commitment. Each future release still
requires an evidence-backed decision and separately authorized execution.
