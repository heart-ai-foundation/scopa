# S13 round 6 runtime/containment review

Verdict: `REJECT`

## Exact target

- candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/round-6-evidence-chain-reject/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `ddabd2cf3e68e6065531ec59d21cd64548603940f94f5d0f1813fcf587548234`
- package: `@heart-ai-foundation/scopa@0.2.0-dev.1`
- requested source:
  `73a969293a6450134e6cce1e7cbcac47e9eea67f`

The archive does not embed its source commit, so candidate-only provenance to
the requested commit was not independently derivable. The exact round 6
retained path and digest matched.

## Findings

### High — executed hardlink read-containment escape

An outside file was hardlinked at `workspace/hardlink-outside.txt`. Installed
`scopa-mcp` returned its exact contents through `scopa_read_file`. Symlink and
parent escapes were denied, and writing through the hardlink was denied, but
reading was allowed because the contained-read check did not reject
multi-link regular files. This exposed same-filesystem outside-state data to
the model-neutral read tool.

### Medium — static non-atomic mutation topology

Mutation authorization and revalidation resolved a pathname before
`writeFile()` opened it. No directory-descriptor binding made the validated
topology atomic with the write. A concurrent local topology actor could race
the revalidation/open boundary. This was statically confirmed but not
race-exploited.

## Executed conformant checks

- Installed offline and source-free with scripts disabled.
- Valid packet and exact CASE recovery exited 0; evidence, JSON, UTF-8, graph,
  trust, timestamp, and INFER mutations returned exit 5; unreadable input
  remained 1 and usage remained 2.
- Malformed JSON, invalid UTF-8, duplicate IDs, 257-byte IDs, oversized frames,
  and recovery conformed; a 256-byte ID was accepted.
- The first 2048 unique request IDs were ordered and later IDs returned
  `-32000`.
- Event exhaustion retained exactly 1024 structurally complete events and did
  not execute the rejected mutation.
- Byte exhaustion retained 3074545 canonical event bytes and rejected the next
  call before execution.
- The approximately 600 KiB path was rejected before call admission, not
  echoed, and left no unmatched call.
- A slow reader received 1800 ordered responses totaling 4619007 bytes without
  loss, reordering, or producer failure.
- Parent, absolute-inside, dot, normalized-parent-inside, symlink,
  hardlink-write, directory, and false-green controls were exercised. Outside
  write-state remained unchanged.
- Default launcher errors were closed and bounded; debug stacks required
  explicit opt-in.

## False positives and limits

An empty-cache installation failure was dependency availability, not candidate
behavior. Absolute and normalized paths that remained inside the repository
were correctly allowed. Debug stack output was explicit opt-in.

No network, credentials, real provider, external CASE validator, or source
checkout import was used. The internal launcher class was tested through its
exported envelope mapper. Backpressure and topology executions are bounded
tests rather than proofs over every scheduler interleaving.
