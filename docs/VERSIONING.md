# SCOPA versioning

`0.2.0-dev.1` is a private pre-release developer-preview candidate.

SCOPA follows semantic-versioning syntax for working release identifiers:

- `MAJOR` may change when the public contract becomes incompatible;
- `MINOR` may add compatible runtime or evidence capability;
- `PATCH` may correct compatible behavior;
- `-dev.N` identifies a private, non-production candidate whose interfaces may
  still change before a public release.

The frozen effect taxonomy and versioned evidence schemas are compatibility
boundaries independent of the npm package number. A package version increase
does not silently rename or reinterpret historical records.

No registry tag, publication date, long-term-support window, public support
promise, or stable `1.0.0` commitment exists yet. Each requires separate principal approval
and a new evidence-backed release decision.
