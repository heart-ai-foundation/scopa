# S4 signing and anchoring evidence

Status: accepted

Contracts exercised:

- D1: an Ed25519 signature with explicit algorithm and domain binds the sealed
  chain commitment and ordered INFER pins.
- D2: software signatures report possession only; stronger key classes fail
  without hash-valid evidence and an external attestation verifier.
- D3: local and external RFC 3161 receipts verify message imprint, nonce, token
  signature, actual CMS signer fingerprint, authority policy, and
  caller-supplied trust chain.
- D4: INFER pins bind provider, model identifier and snapshot status, prompt
  hash, parameters, response hash, and retained response bytes. Offline replay
  makes no provider call, and every pin is linked by ID to a sealed `INFER`
  journal record.

Primary evidence:

- `2026-07-26-freetsa-packet.json` — signed S3 model-session journal, two
  offline INFER pins, retained RFC 3161 query/response, and FreeTSA signer
  certificate.
- `2026-07-26-freetsa-verification.json` — generation-host verification.
- `../../runs/S4/2026-07-26-fresh-process-verification.json` — separate-process
  verification without the private key or original workflow.
- `../../fixtures/S4/freetsa-root.pem` — explicit relying-party trust root,
  whose raw-file digest matches FreeTSA's published value.
- `2026-07-26-local-tsa-packet.json` and
  `2026-07-26-local-tsa-verification.json` — reproducible protocol/chain test
  under a clearly labeled ephemeral test authority.

The external receipt asserts that FreeTSA saw the SHA-256 imprint of the SCOPA
signature envelope at `Jul 27 05:28:43 2026 GMT`. The verifier output is
`Verification: OK`.

Claim boundaries:

- The signing key is software and proves possession only.
- Timestamp authority depends on the relying party choosing the supplied
  FreeTSA root; packet-contained certificates are not self-trusted.
- Certificate validity is checked at the authority time; revocation status is
  explicitly `not-checked`, so this is not long-term-validation evidence.
- The relying-party policy pins the actual FreeTSA CMS signer certificate DER
  SHA-256:
  `32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc`.
- The OpenAI/Codex model ID was only a requested alias and is explicitly not an
  immutable snapshot or provider-signed claim.
- The content-addressed deterministic fixture demonstrates an immutable
  snapshot pin but is not an external model-provider attestation.

Initial outside review returned `HOLD` because pins were not journal-linked,
the authority label was not certificate-bound, and its constrained subprocess
environment lost nested child output. The first two findings were fixed in the
candidate. A fresh `gpt-5.6-terra` retest independently exercised the remediated
controls and returned `ACCEPT` with no blockers; the release gate passed 70/70
in that review environment.

Review records:

- `../../runs/S4/2026-07-26-outside-model-review.md` — initial `HOLD`.
- `../../runs/S4/2026-07-26-outside-model-retest.md` — final `ACCEPT`.
