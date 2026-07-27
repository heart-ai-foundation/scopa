## S5 acceptance review

Required gates passed: `test:s5` (6/6), `npm test` (76/76), `protocol:check`, FreeTSA-bound native round-trip, and CASE positive/negative validation with the supplied independent binary.

The committed export byte-regenerates exactly from the S4 packet; its embedded bytes equal the S4 artifact and verify with the required FreeTSA authority, signer pin, and timestamp. A synthesized ten-record packet also projected all ten frozen categories exactly once to generic UCO Actions and round-tripped byte-identically. The committed graph clearly bounds Identity, Tool, Relationship, signature, and CASE-validation claims.

Blocker:

- Public `verifyCaseExport(document, …)` is not fully fail-closed. A genuine JSON-parsed graph with an injected own enumerable nested `__proto__` property was accepted with the required timestamp policy. The normalizer writes into `{}` via `output[key]`, causing that property to disappear before the exact-projection comparison ([schema.js](/home/dylan/scopa/packages/interop/src/schema.js:118), [round-trip.js](/home/dylan/scopa/packages/interop/src/round-trip.js:56)). `verifyCaseExportBytes()` rejects serialized form as noncanonical, but the exported direct verifier remains bypassable ([index.js](/home/dylan/scopa/packages/interop/src/index.js:16)). This violates the required unknown-graph-mutation fail-closed property.

Follow-up after fixing: add direct-API regression tests for JSON-parsed magic keys and add committed-artifact native verification with the FreeTSA policy to CI; current CI only runs the suite and CASE gates ([workflow](/home/dylan/scopa/.github/workflows/case-validation.yml:35)).

VERDICT: HOLD