# S13 round 2 artifact/distribution review

Date: 2026-07-28
Reviewer: fresh isolated Codex subagent `s13_final_artifact`
Source:
`9c64b6c25e217da18767c6aedda811b755bbbe63`
Candidate SHA-256:
`0f47bd929a0ae7db2237c86efb2785640345a5eaec7d2782b49d681eb5c4d346`
Repository changes: none
Network/credentials: none
Verdict: `ACCEPT`

## Exact binding

- 153 regular files;
- 143,332 packed / 555,860 unpacked bytes;
- manifest SHA-1 and SHA-512 integrity matched;
- every path, size, mode, and content matched exact source or generated
  consumer metadata; and
- two official clean repacks were byte-identical to the candidate.

## Executed checks

The reviewer passed gzip/tar integrity, entry type, owner, timestamp,
canonical-path, duplicate, and normalization-alias checks. A fresh offline
source-free installation passed both bins, all three exports, the known
exit-7 control, direct real newline MCP transport, four hostile launcher
cases, and structural privacy/private-key/credential scans.

Observed runtime results included:

- exact six-tool inventory;
- contained write success;
- escaping write denial without outside mutation;
- satisfied terminal state;
- full deterministic-fixture assurance;
- known failure exit 4 / `SCOPA_COMPLETION_BLOCKED` /
  `canStop: false`; and
- one closed launcher JSON line, exit 2, empty stdout, and no path, file URL,
  or stack disclosure.

The canonical-path mutation corpus rejected empty, absolute, dot, dot-dot,
repeated-separator, trailing-separator, backslash, and non-NFC paths. Static
inspection confirmed the packer and manifest validator share
`candidatePathIsCanonical`.

## Findings

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| S13-AF-L1 | low | Source provenance remains manifest/Git asserted without detached signing or external build attestation. | Retained bounded limitation; exact deterministic bytes are pinned, and external attestation/certification is outside S13. |

No critical, high, or medium finding was reported.

## False positives and limits

The packaged nested Node fixture encountered the documented runner-specific
stdio suppression; direct installed `scopa-mcp` newline transport passed. An
initial shell-encoded backslash mutation produced a backspace; the reviewer
corrected it with a character-code case and observed rejection.

Testing was Linux/Node 22 only. No network, registry publication, live
provider, credential, external provenance service, or OS-sandbox claim was in
scope.

## Claim boundary

`ACCEPT` applies only to the exact final candidate's artifact/distribution
surface. It is not production certification or permission to publish.
