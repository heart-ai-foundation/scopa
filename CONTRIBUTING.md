# Contributing to SCOPA

Thank you for helping improve SCOPA. Contributions are accepted under Apache
License 2.0 using Developer Certificate of Origin 1.1 sign-off.
No Contributor License Agreement is required.

## Before opening a change

- Search existing issues and pull requests.
- For a bug, include the smallest safe reproduction and the affected boundary.
- For a feature, explain the developer problem and why existing interfaces do
  not solve it.
- For a security issue, stop and follow [SECURITY.md](SECURITY.md); do not open
  a public issue or pull request.

Substantial protocol semantics, frozen effect categories, evidence claims, or
trust-boundary changes should begin as a bounded design issue. Routine bug,
dependency, test, and documentation maintenance does not require ceremonial
governance expansion.

## Development setup

SCOPA requires Node.js 22 or newer. From a source checkout, install without
running lifecycle scripts:

```sh
npm ci --ignore-scripts
```

The source checkout contains contributor tests and release tooling that are
not part of the consumer runtime surface.

## Make a focused change

1. Identify the affected scope, completion, continuity, evidence, or adapter
   boundary.
2. Keep protocol documentation and runtime behavior distinct.
3. Add a hostile or failure-oriented test that would fail without the fix.
4. Update public documentation when behavior or a claim changes.
5. Avoid unrelated formatting, dependency, generated-evidence, or release
   changes.

Do not add a new dependency when a small, reviewable standard-library solution
is sufficient. New dependencies must have a clear runtime purpose, compatible
license, exact direct version, lockfile integrity, and reviewed transitive
closure.

## Validate

From a source checkout, run the narrowest relevant test during development,
then the full gate before requesting review:

```sh
npm test
npm audit
npm run protocol:check
```

From a source checkout, useful focused commands include:

```sh
npm run test:s2    # scope and completion enforcement
npm run test:s7    # MCP adapter
npm run test:s10   # consumer and release readiness
npm run test:s14   # live-run process custody
```

Provider-backed probes are opt-in qualification operations. Never run them as
part of ordinary contribution validation and never infer authority from a
historical policy file.

## Documentation standard

Developer-facing changes should include:

- a minimal working example;
- prerequisites and supported versions;
- expected success and failure behavior;
- explicit trust and assurance boundaries;
- safe troubleshooting guidance; and
- relative links that work on GitHub and in the npm package.

Prefer progressive disclosure: keep the repository landing page concise and
move detailed contracts into focused reference documents.

## Commit sign-off

Every contribution commit must contain:

```text
Signed-off-by: Your Name <your-email@example.com>
```

Use `git commit -s` to add it. By signing off, you certify the
[Developer Certificate of Origin 1.1](https://developercertificate.org/).
Do not submit third-party work you are not entitled to contribute.

## Pull requests

Complete the pull-request template, keep commits reviewable, and respond to
evidence-focused review. Maintainers may request narrower claims, additional
hostile fixtures, source-free reproduction, or independent verification.

Acceptance does not constitute certification, provider attestation, or an
endorsement of a contributor or deployment. All participants must follow the
[Code of Conduct](CODE_OF_CONDUCT.md).
