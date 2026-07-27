S5 retest found one remaining direct-API fail-closed bypass.

- Prior JSON-parsed Action attack with own enumerable `__proto__`: rejected under required FreeTSA policy. `constructor`, `prototype`, symbols, non-enumerable/accessor properties, sparse arrays, and extra array properties also rejected.
- Ordinary committed export regenerates byte-identically (`cb54…3fbc7`) and verifies directly and from bytes; native packet hash is `f30c…bfcd`.
- Passed: `test:s5` (6/6), `npm test` (76/76), `protocol:check`, native artifact verifier, and supplied `case_validate` positive (`Conforms: True`) / negative (`Conforms: False`) gates.
- CI now runs native artifact recovery with the pinned FreeTSA policy before CASE validation ([workflow](/home/dylan/scopa/.github/workflows/case-validation.yml:38)).
- I1/I2 mapping, external CASE validation, deterministic export, native round trip, and documented Identity/Tool/signature/CASE claim boundaries are otherwise supported.

Blocker: [normalization](/home/dylan/scopa/packages/interop/src/schema.js:107) permits any `Array.isArray` value regardless of its prototype. A JSON-parsed export with a custom `@graph` array prototype overriding `filter` was accepted with `ok: true`, but returned `actionCount: 0` and `relationshipCount: 0` for an actual 4-action/5-relationship graph, because [the verifier invokes the input array’s `filter`](/home/dylan/scopa/packages/interop/src/round-trip.js:11). Nested custom-prototype arrays and altered array descriptor flags are likewise accepted. This leaves public `verifyCaseExport(document)` not fully fail-closed for mutated direct inputs.

VERDICT: HOLD