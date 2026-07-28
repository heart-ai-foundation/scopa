# S13 final proof/evidence review request

Return `ACCEPT` or `REJECT` for these exact bytes:

- source commit:
  `18a50da693282760e1b912258fdaae1c5df049d4`
- private candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `5ca3a02054c14c88078485d36abe88a0ce8b084ae9b81d77af739d178e77c6b3`
- raw proof:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/consumer-proof.raw.json`
- public proof:
  `/home/dylan/scopa/evidence/S13/consumer-proof.public.json`
- manifest SHA-256:
  `c28be4ad1312282d70e25eb579379f46c83bb4a96a18701e5a80ee1c628977ca`
- raw proof SHA-256:
  `3ad9aafcdd20c5e2f47423c5fb10cd8a0de316765bb7996392125811e3b90674`
- public proof SHA-256:
  `85a9a89d8aa9303a3651939adc1866514894f74f1cbbd27f76b265d112a67c5a`

Use a fresh temporary consumer directory. Do not modify the repository,
retained evidence, or candidate. Do not use network access or credentials.

Primary attack surface:

1. Independently hash and validate candidate, manifest, raw proof, and public
   proof; confirm every binding resolves to the same exact artifact/source.
2. Regenerate the official candidate and public proof byte-for-byte.
3. Re-run the 37-case runtime/published parity corpus and independently attack
   closed fields, false-green claims, numeric boundaries, tool inventory, and
   semantic projection.
4. Exhaustively test candidate paths across U+0000-U+001F and U+007F, plus
   absolute, separator, dot, parent, duplicate, alias, and non-NFC cases.
5. Re-run exact/substring/reserved-placeholder/overlapping/equal-root
   publication cases. Confirm only the two designated roots change and no
   private root survives.
6. Distinguish internal validator agreement from external attestation,
   provenance, certification, or authorization to publish.

Report executed versus static checks, exact bindings, false positives, limits,
and severity-ranked findings. `ACCEPT` requires no critical, high, or medium
finding.
