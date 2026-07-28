# S13 round 6 proof/evidence review request

Return `ACCEPT` or `REJECT` for these exact bytes:

- source commit:
  `73a969293a6450134e6cce1e7cbcac47e9eea67f`
- private candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `ddabd2cf3e68e6065531ec59d21cd64548603940f94f5d0f1813fcf587548234`
- raw proof:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/consumer-proof.raw.json`
- public proof:
  `/home/dylan/scopa/evidence/S13/consumer-proof.public.json`
- manifest SHA-256:
  `51e670f3941edc82d63373055991754bafa08f33de99c79e56125cdb0d7fe3fb`
- raw proof SHA-256:
  `93c598ba02e0125acc8882f5ec0f1481f51dc28d1f0b1b85e9bd9d7e02f39b95`
- public proof SHA-256:
  `01866081eab5d8fa6bb7680eee1bd04d5899a52bbd482963688599d75d33105a`

Use a fresh temporary consumer directory. Do not modify the repository,
retained evidence, or candidate. Do not use network access or credentials.

Primary attack surface:

1. Independently hash and validate candidate, manifest, raw proof, public
   proof, and installed receipt; confirm every binding resolves to the same
   exact artifact and source.
2. Regenerate the official candidate and public proof byte-for-byte.
3. Re-run the 37-case runtime/published parity corpus and independently attack
   closed fields, false-green claims, numeric boundaries, tool inventory, and
   semantic projection.
4. Exhaustively test candidate paths across U+0000-U+001F and U+007F, plus
   absolute, separator, dot, parent, duplicate, alias, non-NFC, and oversized
   UTF-8 cases. Confirm rejected hostile values are not echoed into evidence.
5. Re-run exact, substring, reserved-placeholder, overlapping-root, and
   equal-root publication cases. Confirm only the two designated roots change
   and no private root survives.
6. Challenge the exact-artifact consistency receipt, manifest inventory,
   deterministic-repack claim, and cross-receipt source/candidate bindings
   for self-consistent but false evidence.
7. Distinguish internal validator agreement from external attestation,
   provenance, certification, or authorization to publish.

Report executed versus static checks, exact bindings, false positives, limits,
and severity-ranked findings. `ACCEPT` requires no critical, high, or medium
finding.
