# S13 round 2 runtime review

Verdict: `REJECT`

- Source commit: `9c64b6c25e217da18767c6aedda811b755bbbe63`
- Candidate SHA-256: `0f47bd929a0ae7db2237c86efb2785640345a5eaec7d2782b49d681eb5c4d346`
- Fresh source-free workspace: `/tmp/scopa-s13-final-runtime.VORDZe`

## M-01 — Medium: verification exit contract mismatch

The installed documentation declares exit `5` for evidence verification
failure, and `CLI_EXIT.verification` is `5`. The CLI classifier recognized
only depth/interop typed failures. Expected journal, signature, INFER-pin, and
timestamp-policy rejections using generic or journal errors instead returned
exit `1`.

| Mutation | Result | Exit |
| --- | --- | ---: |
| Valid packet and trust policy | accepted | 0 |
| Commitment root tampered | `SCOPA_JOURNAL_INVALID` | **1** |
| Ed25519 signature tampered | verification rejection | **1** |
| INFER prompt digest tampered | pin mismatch | **1** |
| Wrong TSA signer pin | policy mismatch | **1** |
| Wrong TSA authority | policy mismatch | **1** |
| Required timestamp without trusted roots | `SCOPA_DEPTH_INVALID` | 5 |

Every mutation failed closed; there was no verification bypass. The finding is
medium because this public machine-interface mismatch prevents deterministic
automation from distinguishing invalid evidence from an unexpected runtime
failure.

Narrow remediation: convert domain-verifier rejections to one typed CLI
verification failure, preserve exit `1` for unreadable files and genuine
runtime/configuration faults, preserve usage exit `2`, and add installed
regressions for the full mutation matrix.

## Other executed boundaries

Allowed operation, completion, scope/traversal/absolute/symlink/hard-link
denials, size limits, post-authorization topology change, known-failing gate,
MCP malformed/oversize/duplicate/unknown-method recovery, false-full matrices,
invalid provenance, launcher privacy, and direct installed stdio all passed.

No network, live credentials/providers, CRL/OCSP, OS sandbox, cross-platform,
or concurrent privileged-process race claim was tested.
