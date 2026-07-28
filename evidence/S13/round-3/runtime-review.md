# S13 round 3 runtime/containment review

Verdict: `REJECT`

- Source commit: `e17bbc2acfb70cadad2511b1f1338ddc346fde74`
- Candidate SHA-256: `740cfc630cefde123b871dd2d7d1c1975a02c2f4edf8d3d0c8da82484ecaa5e0`

## M-01 — Medium: transport errors omitted from transcript

After initialization, malformed JSON and oversized frames returned the proper
MCP `-32700` and `-32600` errors but bypassed
`bridge.recordProtocolError`. A following `scopa_transcript` contained only
the initialize event, contradicting the documented capture of protocol
errors and creating a forensic false negative.

## L-01 — Low: size guard follows full-line buffering

The 1 MiB check ran only after Node `readline` had buffered the complete line.
It prevented execution but did not bound memory consumption from an untrusted
client.

Required remediation: route bounded transport failures through the bridge
after initialization and replace full-line buffering with a byte-capped
streaming decoder.

## Passed evidence

Twenty-eight independent checks passed. The complete round-2 mutation matrix
now returns exit `5` and `SCOPA_EVIDENCE_VERIFICATION_FAILED`; its envelope
contains no evidence, paths, stack, or OpenSSL diagnostics. Unreadable
packet/root remains exit `1` and syntax remains exit `2`. Containment,
topology, known failure, launcher privacy, malformed-protocol recovery, and
direct installed stdio otherwise passed.

The nested Node EPERM/pipe behavior was runner-specific and direct
Python-orchestrated stdio passed.
