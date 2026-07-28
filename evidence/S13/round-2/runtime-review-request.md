# S13 round 2 fresh runtime/containment review request

Target source:
`9c64b6c25e217da18767c6aedda811b755bbbe63`

Candidate SHA-256:
`0f47bd929a0ae7db2237c86efb2785640345a5eaec7d2782b49d681eb5c4d346`

Install only the exact private tarball from
`llm-memories/projects/scopa/evidence/S13/final/` in a fresh temporary
workspace. Treat the repository/evidence as read-only and use no network or
real credential.

Exercise scope/write/read containment, symlink or topology boundaries,
false-green and known-failure behavior, launcher
option/session/matrix disclosure, malformed/oversize/duplicate MCP handling,
signature/trust/pin/tampering rejection, and default versus explicit
diagnostic output. Confirm the source-free consumer path operates without a
source checkout and that direct installed stdio still behaves correctly.

Return exact source/SHA binding, executed versus static categories,
`ACCEPT` or `REJECT`, severity-ranked findings, false positives, and residual
limits. `ACCEPT` requires no critical, high, or medium finding.
