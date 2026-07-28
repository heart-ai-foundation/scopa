# S13 round 6 spawned-client finding adjudication

Target:

- source:
  `73a969293a6450134e6cce1e7cbcac47e9eea67f`
- candidate SHA-256:
  `ddabd2cf3e68e6065531ec59d21cd64548603940f94f5d0f1813fcf587548234`

Disposition: managed-sandbox false positive; no product remediation.

The root reviewer independently installed only the exact tarball offline with
scripts disabled, followed the packed quickstart to initialize a disposable
repository, and ran the packaged consumer client against the installed
`scopa-mcp` bin.

The managed sandbox reproduced `scopa-mcp closed 0 before replying`. The same
exact installed files, arguments, initialized repository, and environment
outside that nested-process pipe sandbox exited `0` and returned:

- protocol `2025-11-25`;
- the exact six SCOPA tools;
- `allowedWrite: true`;
- `scopeDenied: true`;
- terminal `satisfied` / `canStop: true`;
- deterministic-fixture assurance `full`;
- transcript schema `scopa.adapter-transcript.v1`;
- 11 transcript events.

This matches the nested-Node stdio suppression already reproduced during S10
through S12. Pre-buffered and independently hosted stdio coverage also passes.
The observed early close is therefore runner behavior, not a startup/liveness
defect in the exact candidate.

This adjudication does not change the artifact review's overall `REJECT`:
the independently reproduced root-glob and command-scoping documentation
findings remain medium and release-blocking.
