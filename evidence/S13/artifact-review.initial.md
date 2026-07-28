# S13 initial fresh artifact/distribution review

Date: 2026-07-28
Reviewer: fresh isolated Codex subagent `s13_artifact_attack`
Source:
`e9b3c7003924df4db2be0298c3966bf1b95d2180`
Candidate SHA-256:
`2bc09658a8a0cda1221a14daa42a9daffe3f947d0f200876171b978306055466`
Environment: fresh temporary consumer; Node 22.22.2; npm 10.9.7
Network/credentials: no public-release action; no credential values accessed
Repository changes: none
Verdict: `ACCEPT`

## Result

No critical, high, or medium finding was reported. One low provenance
limitation was retained.

## Exact binding and archive checks

- Repository and manifest source commit matched the requested commit.
- Candidate SHA-256, npm SHA-1, SHA-512 integrity, sizes, modes, and all 152
  manifest entries matched the tarball.
- The 142,233-byte packed / 549,248-byte unpacked archive contained 152 unique
  regular files below `package/`.
- No traversal, absolute path, backslash, link, device, socket, duplicate,
  special entry, unexpected owner, or timestamp drift was found.
- Two independent packs from extracted consumer content were byte-identical to
  each other and the candidate.
- Fresh installed content was byte-identical to extracted package content.

## Installed-surface checks

The reviewer dynamically imported every declared export and resolved all
bindings within the disposable installed package:

- `./claude`: 18 bindings;
- `./codex`: 18 bindings; and
- `./release-readiness`: 27 bindings.

Root and undeclared internal imports failed with
`ERR_PACKAGE_PATH_NOT_EXPORTED`. The package retained the expected private
preview identity, Apache-2.0 license, Node 22 floor, four production
dependencies, two bins, and three exports. It contained no lifecycle scripts,
development/peer/optional/bundled dependencies, workspaces, contributor test
directories, repository controls, lockfiles, `.npmrc`, evidence, notes, or
run-control material.

Installed `scopa` passed initialization, clean status/check, the known
exit-7 failure control, and native packet verification. Installed `scopa-mcp`
advertised exactly six tools, allowed the in-scope write, denied the escaping
write without creating a file, reached satisfied terminal state, and reported
full deterministic-fixture assurance.

No-argument, invalid-option, missing-input, malformed-JSON, invalid-session,
and invalid-matrix launcher cases each returned exit 2, one closed JSON error
line, empty stdout, the expected error code, and no path, file URL, or stack.
Stack disclosure occurred only with `SCOPA_DEBUG_ERRORS=1`.

Structural private-path and recognizable credential/private-key scans found
zero findings across all 152 files.

## Finding

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| S13-A-L1 | low | Source provenance is manifest-asserted rather than backed by a detached signature or external build attestation. | Retained limitation. Exact bytes are independently pinned and deterministic; provenance attestation is outside S13 and no release/certification claim is made. |

## Claim boundary

`ACCEPT` applied to the initial exact candidate's artifact/distribution
surface. The later proof/evidence `REJECT` requires a new candidate and fresh
final reviews, so this report alone cannot satisfy RQ2.
