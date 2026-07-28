# S13 round 4 runtime/containment review

Verdict: **ACCEPT**

## Exact binding

- Source commit: `1d4239cc5a30226bbf41e263fb217b84fb7ecf04`
- Candidate SHA-256:
  `239ab6a4cfe6d6daf37f2e2fe0322782e1aca4cfdd8a0264641950aa03cba53e`

## Executed checks

The reviewer used a source-free offline install under Node 22.22.2 with a
credential-free environment.

- Baseline verification and CASE validation returned exit 0.
- Journal-root, Ed25519, TSA pin, authority, INFER pin, malformed JSON,
  invalid UTF-8, and CASE graph tampering returned exit 5 with
  `SCOPA_EVIDENCE_VERIFICATION_FAILED`.
- Unreadable inputs returned exit 1; syntax errors returned exit 2.
- Direct installed MCP exercised scope, symlink, hardlink, directory, and
  oversize containment; allowed writes were exact and outside state did not
  change.
- Parse, invalid-UTF8, oversize, and duplicate-id errors were captured as
  bounded `protocol_error` events. Recovery pings succeeded.
- Five launcher failure classes remained closed and free of hostile data,
  private paths, and stacks.

Critical: 0. High: 0. Medium: 0. Low: 1.

The low finding is that frame accumulation is capped at 1 MiB, but
`Buffer.from` transiently copies an accepted frame, so raw frame storage can
approach 2 MiB. It remains bounded and non-amplifying; the literal retention
claim should describe accumulation state.

Limits: Linux and Node 22.22.2 only; no heap profiling or nanosecond race
stress. Symlink/hardlink topology was dynamic, with revalidation also reviewed
statically. A nested Node runner failure was eliminated by direct Python
subprocess execution.
