# S13 round 3 fresh artifact/distribution review request

Target source:
`e17bbc2acfb70cadad2511b1f1338ddc346fde74`

Candidate SHA-256:
`740cfc630cefde123b871dd2d7d1c1975a02c2f4edf8d3d0c8da82484ecaa5e0`

This candidate follows two rejected rounds. Use only the exact private tarball
and manifest under `llm-memories/projects/scopa/evidence/S13/final/`. Treat the
repository and evidence as read-only. Work in a fresh temporary directory with
no network, real credential, or repository edit.

Independently verify tar safety, complete inventory and hashes, deterministic
packing from the exact source, installed consumer metadata, absence of
scripts/development dependencies/private controls, both bins, all exports,
known failure, source-free resolution, package privacy, recognizable
credential signatures, and default launcher disclosure posture.

Confirm all candidate paths are canonical POSIX-relative paths with no
normalization aliases and that the packer and validator share the same rule.

Return exact source/SHA binding, executed versus static categories, `ACCEPT`
or `REJECT`, severity-ranked findings, false positives, and residual limits.
`ACCEPT` requires no critical, high, or medium finding.
