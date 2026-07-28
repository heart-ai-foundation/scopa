# S13 final fresh artifact/distribution review request

- Source: `1d4239cc5a30226bbf41e263fb217b84fb7ecf04`
- Candidate SHA-256:
  `239ab6a4cfe6d6daf37f2e2fe0322782e1aca4cfdd8a0264641950aa03cba53e`

Use only the exact private tarball and manifest under
`llm-memories/projects/scopa/evidence/S13/final/`. Treat repository and
evidence as read-only; work offline without credentials in a new temporary
directory.

Independently verify tar safety, complete inventory/hash/integrity binding,
official deterministic packing, source-free installation, consumer metadata,
scripts/development-dependency absence, both bins, all exports, known failure,
package privacy, credential signatures, launcher disclosure, and that packed
documentation points only to shipped files.

Attack canonical paths with absolute/dot/dot-dot/repeated/trailing/backslash,
Unicode aliases, duplicates, U+0000, C0 controls, and DEL. Return exact
binding, executed/static categories, `ACCEPT` or `REJECT`, severity-ranked
findings, false positives, and limits. `ACCEPT` requires no critical, high, or
medium finding.
