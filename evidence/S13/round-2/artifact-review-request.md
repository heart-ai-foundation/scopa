# S13 round 2 fresh artifact/distribution review request

Target source:
`9c64b6c25e217da18767c6aedda811b755bbbe63`

Candidate SHA-256:
`0f47bd929a0ae7db2237c86efb2785640345a5eaec7d2782b49d681eb5c4d346`

This is a new candidate after the initial proof/evidence reviewer rejected the
prior bytes. Use only the exact private tarball and manifest under
`llm-memories/projects/scopa/evidence/S13/final/`. Treat the repository and
evidence as read-only. Work in a fresh temporary directory with no network,
real credential, or repository edit.

Independently verify tar safety, full inventory and hashes, deterministic
packing where reproducible from exact source, installed consumer metadata,
absence of scripts/development dependencies/private controls, both bins, all
exports, known failure, source-free resolution, package privacy, recognizable
credential signatures, and default launcher disclosure posture.

Specifically confirm all candidate paths are canonical POSIX-relative paths
with no normalization aliases and that the packer applies the same rule.

Return exact source/SHA binding, executed versus static categories,
`ACCEPT` or `REJECT`, severity-ranked findings, false positives, and residual
limits. `ACCEPT` requires no critical, high, or medium finding.
