# S13 round 7 proof/evidence review request

Return `ACCEPT` or `REJECT` for these exact bytes:

- source commit:
  `5a6b29832910db26497095289badb3e859bca48c`
- private candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/round-7-candidate/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `6a8d6db6c07db772a4cba32912995472e017ee4f4bee3290f44fe9baf04c4692`
- raw proof:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/round-7-candidate/consumer-proof.raw.json`
- public proof:
  `/home/dylan/scopa/evidence/S13/consumer-proof.public.json`
- manifest SHA-256:
  `8b503078366e0d1fb5c5f407fe60cf05df45feef4e623333d3ad8252710fb131`
- raw proof SHA-256:
  `467d5a7673e39725a6abd2c78c39ea177c76630364ad4d7c645a8609265e7a61`
- public proof SHA-256:
  `0f16a0eeb42793d36db73a2bec1a7744addd81a5f048cc789aa8a97955201199`
- exact-consistency receipt SHA-256:
  `17e359a33849f4ef46de7d4f009369a626bb53880878b1d4eaa6d48f177ba2eb`
- parity receipt SHA-256:
  `e819c08fa8508510d0ffcdaa90a30b4b18af3580a6b32d81cfc9a177ce3599ad`
- dependency receipt SHA-256:
  `626111ea1566c58d6618ec1c5d0ac5710cb7f41ccc27feab674291433416fdf1`

Use a fresh temporary consumer directory. Do not modify the repository,
retained evidence, or candidate. Do not use network access or credentials.

Primary attack surface:

1. Independently hash and validate candidate, manifest, raw proof, public
   proof, and installed receipt; confirm every binding resolves to the same
   exact artifact and source.
2. Regenerate the official candidate and public proof byte-for-byte.
3. Re-run the 41-case runtime/published parity corpus and independently attack
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
   for self-consistent but false evidence. Attempt to transplant parity,
   collision, dependency, installed-surface, public-proof, and hosted-source
   receipts from another source/candidate or input set.
7. Confirm every retained receipt is individually named and hashed by the
   exact-consistency receipt, parity binds its corpus and validator inputs,
   dependency evidence binds `package-lock.json`, and no unbounded
   caller-controlled path can enter public evidence.
8. Distinguish internal validator agreement from external attestation,
   provenance, certification, or authorization to publish.

Report executed versus static checks, exact bindings, false positives, limits,
and severity-ranked findings. `ACCEPT` requires no critical, high, or medium
finding.
