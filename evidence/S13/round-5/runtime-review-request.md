# S13 final runtime/containment review request

Return `ACCEPT` or `REJECT` for these exact bytes:

- source commit:
  `18a50da693282760e1b912258fdaae1c5df049d4`
- private candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `5ca3a02054c14c88078485d36abe88a0ce8b084ae9b81d77af739d178e77c6b3`
- installed receipt:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/installed-surface-regression.json`

Install source-free and offline in a fresh temporary directory with scripts
disabled. Do not modify repository or retained evidence. Do not use network
access, real providers, or credentials.

Primary attack surface:

1. Exercise successful CLI verification and CASE recovery, then mutate journal
   root, signature, INFER pin, timestamp signer/authority, malformed JSON,
   invalid UTF-8, and CASE graph. Verify stable exit 5; preserve exit 1 for
   unreadable input and exit 2 for usage.
2. Drive the installed `scopa-mcp` binary over real newline stdio. Attack
   malformed JSON, invalid UTF-8, duplicate IDs, >1 MiB frames, and recovery
   after errors.
3. Inspect transcripts immediately after transport errors. Require bounded
   `protocol_error` evidence with no hostile frame content.
4. Attack read/write scope with absolute, dot, parent, symlink, hardlink,
   directory, topology-change, and outside-state controls. Verify false-green
   completion remains impossible.
5. Exercise all five launcher failure classes for closed one-line envelopes,
   diagnostic opt-in, path/input/stack privacy, and no amplification.
6. Revisit the round-four buffer-copy low finding. Distinguish the 1 MiB
   accumulation bound from transient parse copies and identify any unbounded
   or amplifying storage.

Report executed versus static checks, exact bindings, false positives, limits,
and severity-ranked findings. `ACCEPT` requires no critical, high, or medium
finding.
