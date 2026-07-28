# S13 round 7 runtime/containment review request

Return `ACCEPT` or `REJECT` for these exact bytes:

- source commit:
  `5a6b29832910db26497095289badb3e859bca48c`
- private candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/round-7-candidate/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `6a8d6db6c07db772a4cba32912995472e017ee4f4bee3290f44fe9baf04c4692`
- installed receipt:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/round-7-candidate/installed-surface-regression.json`
- installed receipt SHA-256:
  `f050a8445acd23499139bc3c7a77fd2ce7beceb60c18e32e0e1b5fe7437f0a5f`

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
   completion remains impossible. For reads, prove same-filesystem hardlinks
   to outside files fail closed. For writes, attempt parent swaps both before
   and after final revalidation; check descriptor-facility unavailability,
   immediate-parent absence, existing mode preservation, target aliasing, and
   temporary-file cleanup. Distinguish executed attacks from static race
   analysis.
8. Exercise all five launcher failure classes for closed one-line envelopes,
   diagnostic opt-in, path/input/stack privacy, and no amplification.

Report executed versus static checks, exact bindings, false positives, limits,
and severity-ranked findings. `ACCEPT` requires no critical, high, or medium
finding.
