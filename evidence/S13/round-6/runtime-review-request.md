# S13 round 6 runtime/containment review request

Return `ACCEPT` or `REJECT` for these exact bytes:

- source commit:
  `73a969293a6450134e6cce1e7cbcac47e9eea67f`
- private candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `ddabd2cf3e68e6065531ec59d21cd64548603940f94f5d0f1813fcf587548234`
- installed receipt:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/installed-surface-regression.json`
- installed receipt SHA-256:
  `8eafb223e3d4b363c6bb1a2a2060052d67a81de612d2f0a429e68fbab2b6b319`

Install source-free and offline in a fresh temporary directory with scripts
disabled. Do not modify the repository or retained evidence. Do not use
network access, real providers, or credentials.

Primary attack surface:

1. Exercise successful CLI verification and CASE recovery, then mutate journal
   root, signature, INFER pin, timestamp signer/authority, malformed JSON,
   invalid UTF-8, and CASE graph. Verify stable exit 5; preserve exit 1 for
   unreadable input and exit 2 for usage.
2. Drive the installed `scopa-mcp` binary over real newline stdio. Attack
   malformed JSON, invalid UTF-8, duplicate IDs, string IDs over 256 UTF-8
   bytes, more than 2048 unique IDs, frames over 1 MiB, and recovery.
3. Exhaust transcript retention across the 1024-event and 4 MiB canonical
   payload ceilings. Require bounded failure without tool execution when a
   call/result pair cannot be reserved, and require every retained transcript
   to remain structurally complete.
4. Reproduce the approximately 600 KiB denied-path poisoning attack. Confirm
   the over-4096-byte path is rejected before filesystem resolution and
   transcript admission, is not echoed, and cannot leave an unmatched call or
   consume the reserved result slot.
5. Apply slow-reader/backpressure pressure to MCP stdout while continuing to
   submit frames. Look for response loss, reordering, unbounded buffering, or
   post-exhaustion mutation.
6. Inspect transcripts immediately after transport errors. Require bounded
   `protocol_error` evidence with no hostile frame content.
7. Attack read/write scope with absolute, dot, parent, symlink, hardlink,
   directory, topology-change, and outside-state controls. Verify false-green
   completion remains impossible.
8. Exercise all five launcher failure classes for closed one-line envelopes,
   diagnostic opt-in, path/input/stack privacy, and no amplification.

Report executed versus static checks, exact bindings, false positives, limits,
and severity-ranked findings. `ACCEPT` requires no critical, high, or medium
finding.
