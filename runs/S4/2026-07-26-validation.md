# S4 validation run

Date: 2026-07-26 America/Los_Angeles
Source base: `6621949`

Focused results before independent review:

- `node --test --test-concurrency=1 packages/depth/test/depth.test.js`: PASS,
  6/6 tests.
- `npm run test:s4`: PASS.
- `npm run probe:s4`: PASS.
- Local RFC 3161 acceptance packet: PASS with explicit ephemeral-test-authority
  limitation.
- External FreeTSA RFC 3161 acceptance packet: PASS.
- Fresh-process verifier over the external packet: PASS without a private key
  or original workflow.

External timestamp:

- Endpoint: `https://freetsa.org/tsr`
- Policy: `tsa_policy1`
- Serial: `0x06848D97`
- Authority time: `Jul 27 05:28:43 2026 GMT`
- Imprint:
  `914b3e7a151552abd9a467c15440f7f719c699d5577a24438e6e98f7c172a821`
- OpenSSL result: `Verification: OK`
- Actual CMS signer DER SHA-256:
  `32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc`
- Certificate validity checked at authority time; revocation status:
  `not-checked`.

Adversarial coverage:

- journal-record and external-commitment mutation;
- algorithm, signing-domain, key-class, key-ID, signature, and signing-input
  mutation;
- stronger key class without evidence or without a relying-party verifier;
- provider, model identifier, snapshot status/authority, prompt, parameters,
  retained response, response hash, duplicate INFER pin, missing journal link,
  and unresolved journal reference;
- missing required timestamp, wrong timestamp root, and truncated timestamp
  response;
- insecure timestamp transport refusal.

Accumulated results:

- `npm test`: PASS, 70/70 tests.
- `npm run protocol:check`: PASS.

The initial outside model review returned `HOLD` on missing journal-to-pin
linkage and self-asserted timestamp authority labeling. It also saw historical
nested subprocess output disappear in its constrained Codex sandbox. The
candidate now appends two sealed `INFER` records, verifies exact bidirectional
pin linkage, extracts the actual RFC 3161 CMS signer certificate, and enforces
its verifier-supplied SHA-256 fingerprint. A fresh `gpt-5.6-terra` retest ran
the focused suite, all 70 release-gate tests, protocol check, fresh-process
FreeTSA verification, and additional downgrade mutations in an independent
review environment. Its final verdict was `ACCEPT` with no blockers.
