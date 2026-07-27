# S3 validation run

Date: 2026-07-26 America/Los_Angeles
Source base: `076bd2d`

- `node packages/legibility/test/legibility.test.js`: PASS, 10/10 tests.
- `npm run test:s3`: PASS.
- `npm run probe:s3`: PASS.
  - actual read and write effects executed;
  - produced map exactly matched manual inspection;
  - undeclared observed boundaries became findings;
  - execute, query, and emit remained `not-observed`;
  - capture gaps: 0.
- `npm test`: PASS, 64/64 tests; S0-S2 gates and all four clean/fault
  conformance probes retained.
- `npm run protocol:check`: PASS.
- `git diff --check`: PASS.

Real model session:

- Model: `gpt-5.6-terra`, via an ephemeral read-only Codex session.
- Output contract: `fixtures/S3/coding-agent-plan.schema.json`.
- Plan: `runs/S3/2026-07-26-model-agent-plan.json`.
- Local Codex JSONL:
  `runs/S3/2026-07-26-model-session.jsonl`.
- Hash-bound local client receipt:
  `runs/S3/2026-07-26-model-session-receipt.json`.
- Trusted execution report:
  `evidence/S3/2026-07-26-model-agent-boundary-map.json`.
- The model proposed one read and one write. The driver executed both real
  filesystem effects. The full ordered journal trace matched the full ordered
  host trace across sequence, event ID, operation, target, tool name, and
  result status. The embedded record hex, commitment, and summary independently
  recompute the map and score. Unexercised operations remain `not-observed`.

The first model request exposed a strict-output-schema incompatibility because
the `const` and `enum` properties lacked explicit JSON Schema `type` fields.
The schema was corrected before the successful recorded run.

The first independent review returned `HOLD` because model provenance was only
asserted, sealed records were absent from the evidence, and the host comparison
was a deduplicated operation/target projection. S3 was reopened. The retained
local receipt, replayable record evidence, and full ordered trace comparison
resolve those findings without claiming provider-signed provenance.

Final independent retest:

- Model: `gpt-5.6-terra`, in a fresh ephemeral read-only Codex session.
- Verdict: `ACCEPT`; no concrete blockers remained.
- The reviewer independently recomputed the commitment, root hash, boundary
  map ID, 10,000-basis-point score, and exact ordered host/journal traces.
- The reviewer directly exercised the non-gating capture-gap path and both
  declaration-gap directions.
- Transcript: `runs/S3/2026-07-26-outside-model-retest.md`.
