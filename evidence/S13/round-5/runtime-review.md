# S13 round 5 runtime/containment review

Verdict: **REJECT**

## Exact binding

- Source commit: `18a50da693282760e1b912258fdaae1c5df049d4`
- Candidate SHA-256:
  `5ca3a02054c14c88078485d36abe88a0ce8b084ae9b81d77af739d178e77c6b3`
- Installed receipt SHA-256:
  `909cc062629ee343445f29352f9af9fec36f78831b9db774541566321f181028`
- Runtime: Node 22.22.2, source-free offline installation, scripts disabled.

## Finding

**Medium — per-session memory is unbounded.** `mcp-stdio.js` retained every
unique request ID in `seenRequestIds`, while `transcript.js` retained every
protocol/tool event without a count or byte ceiling. Transcript reads cloned,
validated, cloned again, canonicalized, and serialized the accumulated
history. The 1 MiB frame limit therefore bounded only individual frame
accumulation; an initialized hostile client could grow resident memory
indefinitely and amplify work through transcript requests.

## Executed checks

- Native packet and exact CASE recovery succeeded.
- Journal root, signature, INFER pin, timestamp authority/signer, malformed
  JSON, invalid UTF-8, and CASE graph mutations returned exit 5.
- Missing input returned exit 1; usage returned exit 2.
- Real newline MCP exercised malformed JSON, invalid UTF-8, duplicate IDs, and
  a greater-than-1-MiB frame. Errors remained 192-230 serialized bytes, leaked
  no hostile markers, and recovery ping/tool listing succeeded.
- Oversize probe input was 1049672 bytes; observed peak RSS was 67500 KiB.

A sandbox-blocked nested Node `spawnSync` result was discarded after direct
CLI reruns produced canonical envelopes.

## Limits

Read/write scope and the five launcher failure classes were reviewed
statically but not completed dynamically. No sustained exhaustion run was
performed; the medium finding was established by code inspection. Static
scope review found authorization, hardlink rejection, and topology
revalidation.
