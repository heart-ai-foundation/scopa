ACCEPT

No concrete blockers remain.

Non-blocking notes:

- All requested gates pass: `npm run test:s4`, `npm test` (70 tests), `npm run protocol:check`, and the supplied fresh-process FreeTSA verification command.
- D4 is remediated: decoded journal has two sealed `INFER` records; each packet `pinId` is referenced exactly once.
- D3 is remediated under verifier policy: the CMS token signer is extracted and its DER SHA-256 matches the caller-supplied fingerprint `32e841…191fc`, not just the packet label. Authority label and signer fingerprint both fail closed on mismatch.
- D1/D2 remain correctly bounded: Ed25519, fixed signing domain, and software key-possession-only claim.
- Strict schemas and tamper/downgrade tests fail closed for unknown fields, signature-domain/key-class changes, timestamp mutation, alias-as-immutable change, and non-content-addressed fixture.
- The OpenAI entry remains explicitly `requested-alias-not-snapshot`; only the deterministic fixture is content-addressed immutable. Both remain host-reported, not provider-signed.
- Timestamp verification reports `revocationStatus: "not-checked"`; this is appropriately not a long-term revocation-valid claim.