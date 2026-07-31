# S18.4 artifact review stop

The fresh artifact/distribution review returned `REJECT` against exact
candidate SHA-256
`e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498`.
It found one medium-severity identity gap: direct dependencies are pinned, but
the consumer tarball neither carries nor enforces the source lockfile and its
transitive dependencies retain semver ranges. A later installation can resolve
different enforcement or validation runtime bytes without changing the SCOPA
candidate hash.

The S18 program stop condition fired immediately. The evidence reviewer was
interrupted, the runtime reviewer was not launched, and no cross-review
consistency or closeout receipt was created. Provider calls, network requests,
publication actions, and reviewer repository mutations were zero.

The rejected candidate, review plan, report, and stop receipt are retained
under `evidence/S18/reviews/`. PLQ2 and PLQ3 remain open. Remediation must bind
the full resolved dependency closure into installation verification and live
installed-artifact identity, then build a new clean candidate and repeat the
complete exact-candidate requalification with three new reviewers. That work
requires fresh principal-approved macro-delta authority.
