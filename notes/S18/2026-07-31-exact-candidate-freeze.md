# S18.1 exact candidate freeze

The candidate qualification boundary now has a closed matrix definition,
an importable verifier, a separate CLI, and hostile regressions for dirty
source, false green, privacy findings, policy failure, digest drift, source
transplantation, assurance elevation, duplicate inputs, and provider-capable
commands.

Matrix subprocesses remove npm lifecycle state and credential-bearing
environment names before execution. This makes provider closure an execution
property rather than a narrative claim. The managed nested-process sandbox
could not run the deeply nested CLI form of the accumulated release gate; its
failure returned no TAP result. The same committed qualification API ran the
identical frozen matrix successfully with one fewer orchestration layer. The
CLI/library split and bounded redacted diagnostics remain as hardening from
that finding.

Final exact bindings:

- source: `43fbb969f32c711d1a68b05ad73fb33717c90d8c`;
- candidate SHA-256:
  `e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498`;
- qualification receipt SHA-256:
  `b1dff3b65d9dcd89b41d9b3e3c8080cce055f0082a96d5ae7013688921330f99`;
- installed-surface proof SHA-256:
  `b3305b332922edd62f6d43cd28fb31a73ec12e0480e8649a92a67da5d727b21f`;
- frozen matrix SHA-256:
  `06fffcfb463f4a50b9a961259eedb548c195e4d5820e221a122d50ed06fa36c8`;
- release-policy audit SHA-256:
  `f630c4e548afbdf55864a4725ad656ee4dc233c8ef8cf0ed36668d26ff65bc05`.

No provider call, registry publication, GitHub Release, deployment, customer
fixture, or experiment work occurred.
