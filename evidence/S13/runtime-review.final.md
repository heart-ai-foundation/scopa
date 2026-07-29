# S13 Round 7 installed runtime/containment review

Verdict: `ACCEPT`

Reviewer: fresh headless Claude session (Fable 5 with Opus 4.8 fallback).

Exact binding:

- source:
  `5a6b29832910db26497095289badb3e859bca48c`;
- candidate SHA-256:
  `6a8d6db6c07db772a4cba32912995472e017ee4f4bee3290f44fe9baf04c4692`;
- installed receipt SHA-256:
  `f050a8445acd23499139bc3c7a77fd2ce7beceb60c18e32e0e1b5fe7437f0a5f`.

## Findings

- critical: 0;
- high: 0;
- medium: 0;
- low: 0.

## Executed review

The outside model installed exact hash-verified candidate bytes offline with
scripts disabled and exercised all eight requested surfaces:

1. successful native verification followed by journal-root, signature,
   signing-input, signer-certificate, INFER-pin, timestamp authority/signer,
   malformed JSON, invalid UTF-8, CASE graph, schema, unreadable-input, and
   usage controls with the expected exit families;
2. real newline-stdio MCP malformed JSON/UTF-8, duplicate and oversized IDs,
   the 2048-ID ceiling, oversized frames, and recovery;
3. the 1024-event and 4 MiB transcript ceilings, proving post-exhaustion tools
   do not execute and every retained event sequence remains complete;
4. the approximately 600 KiB path-poisoning case, rejected before filesystem
   resolution and paired transcript admission without echo;
5. 501/501 ordered slow-reader responses with bounded stdout backlog;
6. bounded `protocol_error` evidence without hostile frame content;
7. read/write absolute, parent, symlink, directory, missing, hardlink,
   lock/rotation, outside-slice, mode-preservation, and false-green controls;
8. all five launcher failure classes, envelope-first single-line privacy,
   diagnostic opt-in, and amplification controls.

The same-filesystem outside hardlink read failed closed. Existing write mode
`0640` was preserved. No outside or post-exhaustion file was created, the
slice lock was unchanged, and no `.scopa-write-*` temporary remained.

## Static-only boundaries, observations, and limitations

Concurrent parent swaps and descriptor-filesystem unavailability were
inspected statically. Identity-checked descriptor-directory operations and
explicit unavailable-facility denial fail closed within the documented threat
model. A live separately privileged topology race is explicitly out of scope;
testing was on Linux with `/proc`.

Changing only the timestamp anchor's descriptive authority label did not
invalidate the packet, while all bound signer/signature fields and the
explicit authority pin failed closed. This is expected. The bridge's default
lock path makes its DECISION-specific branch unreachable for the
`.scopa/slice-lock.json` launcher layout, but the path remains mechanically
immutable because it is outside the allowed slice; this is a cleanup
observation without security impact.

The disposable offline cache lacked some crypto dependencies. The reviewer
used a version-exact resolved dependency tree and overlaid its independently
hash-verified candidate extraction. It used no network, credential, provider
integration, real project repository, publication action, or retained
evidence mutation. This review is independent model evidence, not provider
attestation.
