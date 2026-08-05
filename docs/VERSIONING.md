# SCOPA versioning

`0.2.0` is SCOPA's first public release of the bounded runtime and its
documented evidence contracts. It is published under Apache-2.0.

`0.3.0` adds the point-and-go agent entry, Workflow Boundary Map, offline
assessment, and Boundary Doctor. It preserves the `0.2.0` command behavior and
versioned evidence contracts while adding new interfaces.

`0.4.0` adds insight-before-setup, the runtime-owned `begin` transaction,
portable project-local Agent Skills installation, Boundary Cards,
least-privilege pull-request reporting, and the reproducible enforcement demo.
It preserves the prior runtime and evidence contracts while reducing the
developer-owned setup surface.

SCOPA follows Semantic Versioning syntax and treats compatibility deliberately:

- while the major version is `0`, incompatible changes may occur in a minor
  release and must be documented prominently;
- after `1.0.0`, `MAJOR` changes the public contract incompatibly;
- `MINOR` may add compatible runtime or evidence capability;
- `PATCH` may correct compatible behavior;
- prerelease suffixes identify non-stable candidates and do not receive the
  npm `latest` tag.

The frozen effect taxonomy and versioned evidence schemas are compatibility
boundaries independent of the npm package number. A package version increase
does not silently rename or reinterpret historical records.

`0.2.0` does not create a long-term-support window, hosted-service promise,
formal certification, or `1.0.0` compatibility commitment. Patch releases may
ship bounded security, bug, dependency, test, and documentation maintenance
without inventing a new product roadmap. Public release execution remains a
separate, reviewable action.
