HOLD

- D4 blocker: the acceptance packet’s signed journal has only `TOOL.QUERY` and `TOOL.COMMAND` records; neither INFER pin is linked to a journal record or invocation ID. Thus it does not establish which INFER record the pinned provider/model/prompt/response represents. The pin fields and offline-byte replay work, but the claimed model-invocation binding is incomplete.
- D3 blocker: `authorityId` is an unsigned packet label checked only by string equality. The verifier does not bind `freetsa.org-2026` to the TSA signer certificate identity or a verifier-side certificate/policy predicate. The required authority-policy behavior is therefore self-asserted rather than cryptographically enforced.
- Required retained gate is red: `npm test` exits 1. Independently reproduced failures are `packages/enforcement/test/enforcement-loop.test.js` (host CLI emits no JSON) and `packages/kernel-core/test/persistent-idempotency.test.js` (worker output empty). The active S4 protocol requires the full release gate green.

Non-blocking notes:

- Independently ran the requested fresh-process verifier with the supplied FreeTSA root, `--require-timestamp`, and `freetsa.org-2026`: PASS. It verified Ed25519/domain binding, chain, both INFER pins, RFC 3161 query/imprint/token/certificate/trust, and authority-time validation.
- D1 and D2 appear correctly bounded: Ed25519 plus fixed versioned domain are signed; the evidence correctly reports software/key-possession-only; stronger classes require retained evidence and an external verifier.
- Strict-schema and tamper checks fail closed for unknown fields, signature domain, pin changes, missing/wrong timestamp authority, and truncated timestamp token.
- D3 appropriately reports `revocationStatus: "not-checked"`; it must not be represented as long-term revocation-valid evidence.