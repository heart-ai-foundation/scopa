# S13 initial fresh proof/evidence review request

Target source:
`e9b3c7003924df4db2be0298c3966bf1b95d2180`

Candidate SHA-256:
`2bc09658a8a0cda1221a14daa42a9daffe3f947d0f200876171b978306055466`

Use the exact tarball, private raw proof, collision-safe public proof, and
candidate manifest supplied through the private/repository evidence boundary.
Treat all source/evidence as read-only and work in a fresh temporary directory.
Never print credential values.

Independently verify artifact/manifest/raw/public consistency,
runtime/published schema parity and hostile constraints, raw-byte digest
binding, field-only collision-safe publication, semantic-change truth, claim
and non-claim boundaries, public privacy, and absence of false evidence
assertions. Distinguish executed checks from static review.

Return exact commit/SHA binding, execution categories, `ACCEPT` or `REJECT`,
severity-ranked findings, false positives, and residual limits. `ACCEPT`
requires no critical, high, or medium finding.
