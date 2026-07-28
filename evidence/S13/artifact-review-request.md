# S13 initial fresh artifact/distribution review request

Target source:
`e9b3c7003924df4db2be0298c3966bf1b95d2180`

Candidate SHA-256:
`2bc09658a8a0cda1221a14daa42a9daffe3f947d0f200876171b978306055466`

Use only the exact private tarball and manifest supplied through the private
SCOPA evidence home. Treat the repository and all evidence as read-only. Work
in a fresh temporary directory and do not access or print credentials.

Independently verify tar safety, full inventory and hashes, installed consumer
metadata, absence of scripts/development dependencies/private control
surfaces, both bins, all exports, known failure, source-free resolution,
package privacy, credential signatures, and default launcher disclosure
posture.

Return exact commit/SHA binding, execution categories, `ACCEPT` or `REJECT`,
severity-ranked findings, false positives, and residual limits. `ACCEPT`
requires no critical, high, or medium finding.
