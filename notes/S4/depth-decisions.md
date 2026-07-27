# S4 signing and anchoring decisions

Date: 2026-07-26 America/Los_Angeles

- The signing input is deterministic dCBOR under
  `SCOPA-COMMITMENT-SIGNATURE-v1`. It binds the verified chain commitment,
  ordered INFER pins, signing key ID, and complete key-class object.
- S4 implements Ed25519 and records the algorithm on every signature.
  Algorithm identity is part of the envelope; post-quantum signatures remain
  deferred.
- The built-in `software` class means key possession only. It does not identify
  a person or device. `platform-keystore` and `hardware-backed` require
  hash-bound external attestation and a relying-party verifier callback.
- RFC 3161 anchors hash the complete deterministic dCBOR signature envelope,
  not a mutable JSON rendering. The original nonce-bearing query is retained
  so OpenSSL verifies the nonce, message imprint, token signature,
  time-stamping certificate, and trust chain.
- Trust roots are always supplied by the verifier. A root or signer certificate
  embedded in a packet cannot make itself trusted.
- Timestamp presence is a relying-party policy. `requireTimestamp` fails if an
  otherwise valid signed packet has had its optional anchor removed.
- The authority label and signer-certificate SHA-256 fingerprint are
  relying-party policy independent of the root. Verification extracts the
  actual CMS signer certificate, matches it to the anchor and expected
  fingerprint, and reports its subject and issuer. Certificate validity is
  evaluated at the authority time. Live revocation and long-term-validation
  evidence are not implemented and are reported as `not-checked`.
- The external acceptance receipt came from `https://freetsa.org/tsr`. The
  downloaded CA and TSA files matched FreeTSA's published raw-file SHA-256
  digests:
  - CA: `2151b61137ffa86bf664691ba67e7da0b19f98c758e3d228d5d8ebf27e044438`
  - TSA: `8bfb0305bb64e2571ca507552ef3245cb1c2fee8728e0ff8689225081ea13467`
- The actual FreeTSA CMS signer certificate DER fingerprint is
  `32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc`.
- INFER pins bind provider, model identifier, snapshot status, authority
  boundary, prompt hash, exact parameters, retained response bytes, and
  response hash.
- Every packet pin must be referenced exactly once by a sealed `INFER` journal
  record carrying its `pinId`. Missing, duplicate, or unresolved linkages fail.
- A requested model alias is explicitly `requested-alias-not-snapshot`. It
  cannot be presented as an immutable snapshot. The acceptance packet also
  contains a content-addressed deterministic fixture marked
  `content-addressed-immutable-snapshot`.
- Both snapshot statuses remain host-reported and not provider-signed.
  Provider attestation is not claimed by S4.
- Packet verification rejects duplicate INFER pin IDs and tampering with any
  record, commitment, pin field, signature metadata, key class, query,
  timestamp response, or trust root.
- Private signing and TSA fixture keys are generated in temporary directories,
  are never serialized into evidence, and are deleted during cleanup.
