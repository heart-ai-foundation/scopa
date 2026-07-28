# S13 final fresh runtime/containment review request

- Source: `1d4239cc5a30226bbf41e263fb217b84fb7ecf04`
- Candidate SHA-256:
  `239ab6a4cfe6d6daf37f2e2fe0322782e1aca4cfdd8a0264641950aa03cba53e`

Install only the exact private tarball under
`llm-memories/projects/scopa/evidence/S13/final/`. Work source-free, read-only
on inputs, offline and credential-free in a new temporary directory.

Exercise scope/read/write/topology containment, false-green/known failure,
launcher privacy, MCP malformed/invalid UTF-8/oversize/duplicate recovery,
signature/trust/pin tampering, and direct installed stdio.

Explicitly confirm:

- five evidence/trust mutations return exit `5` and
  `SCOPA_EVIDENCE_VERIFICATION_FAILED`, unreadable files return `1`, and usage
  returns `2`;
- parse and oversize errors after initialization appear as bounded
  `protocol_error` transcript events without hostile content;
- the streaming decoder retains no more than 1 MiB for a frame and recovers at
  the next newline.

Return exact binding, executed/static categories, `ACCEPT` or `REJECT`,
severity findings, false positives, and limits. `ACCEPT` requires no critical,
high, or medium finding.
