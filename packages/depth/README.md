# `@heart-ai-foundation/scopa-depth`

Portable verification for sealed SCOPA runs.

## Claims

- `createEvidencePacket` signs a verified journal commitment and its INFER
  pins with Ed25519 under the versioned
  `SCOPA-COMMITMENT-SIGNATURE-v1` domain.
- Every packet INFER pin must be referenced exactly once by a sealed `INFER`
  journal record; unlinked pins and unresolved records fail.
- The built-in `software` key class proves possession of the private key only.
  `platform-keystore` and `hardware-backed` packets require retained
  attestation plus an external verifier chosen by the relying party.
- RFC 3161 timestamps bind the complete signature envelope, include the original nonce
  query, and verify through `openssl ts` against roots supplied by the relying
  party. A certificate embedded in a packet is never silently trusted.
- INFER pins retain response bytes and bind provider, model identifier,
  snapshot status, host-reported authority boundary, prompt hash, parameters,
  and response hash. Requested aliases are explicitly not snapshots. Offline
  replay does not call the provider and is not provider-signed provenance.

## Verification

```sh
node packages/depth/src/verify-packet-cli.js \
  --packet evidence.json \
  --timestamp-roots trusted-tsa-roots.pem \
  --timestamp-authority-id expected-authority \
  --timestamp-signer-sha256 expected-signer-certificate-digest \
  --require-timestamp
```

The verifier requires no signing private key and no original workflow. OpenSSL
3 is required only when the packet contains an RFC 3161 anchor.

## Timestamp transport

`createRfc3161Request` creates a nonce-bearing SHA-256 query over the complete
commitment-signature envelope. `requestRfc3161Timestamp` can send it to an HTTPS RFC
3161 service. `createRfc3161Anchor` packages the response and untrusted signer
chain. Verification extracts the actual CMS signer certificate and matches its
DER SHA-256 fingerprint against relying-party policy. Trust roots remain an
explicit verifier input.

## Non-claims

A valid software-key signature does not identify a person or prove hardware
backing. An RFC 3161 result is only as authoritative as the verifier's chosen
root. S4 validates the certificate chain at the authority time but does not
perform live revocation checking or claim long-term validation. A host-reported
model identifier is retained exactly but is not upgraded to provider
attestation.
