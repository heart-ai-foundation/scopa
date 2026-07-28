# S13 round 3 fresh runtime/containment review request

Target source:
`e17bbc2acfb70cadad2511b1f1338ddc346fde74`

Candidate SHA-256:
`740cfc630cefde123b871dd2d7d1c1975a02c2f4edf8d3d0c8da82484ecaa5e0`

Install only the exact private tarball under
`llm-memories/projects/scopa/evidence/S13/final/` in a fresh temporary
workspace. Treat repository/evidence inputs as read-only; use no network or
real credential.

Exercise scope/write/read containment, traversal/absolute/symlink/hard-link
and post-authorization topology boundaries, false-green and known-failure
behavior, launcher disclosure, malformed/oversize/duplicate MCP recovery,
signature/trust/pin tampering, and direct installed stdio.

Explicitly reproduce the rejected round-2 matrix: commitment-root, Ed25519
signature, INFER-pin, timestamp-authority, and timestamp-signer mutations must
fail closed with exit `5` and `SCOPA_EVIDENCE_VERIFICATION_FAILED`. Unreadable
input/trust-root files must remain exit `1`; invalid syntax must remain exit
`2`. Check that the stable failure envelope discloses no underlying evidence,
path, stack, or OpenSSL diagnostic.

Return exact source/SHA binding, executed versus static categories, `ACCEPT`
or `REJECT`, severity-ranked findings, false positives, and residual limits.
`ACCEPT` requires no critical, high, or medium finding.
