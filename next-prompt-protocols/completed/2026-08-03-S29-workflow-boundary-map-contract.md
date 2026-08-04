# S29 — Workflow Boundary Map Contract

**Class:** `arc`
**Module:** `workflow-boundary-map`
**Crosses:** [`enforcement`, `agent-surface`, `legibility`]
**Advances contracts:** [`WBM1`]
**Compound:** false
**Status:** completed; WBM1 satisfied; provider, experiment, publication,
release, and customer use remained closed

## Why this exists

SCOPA mechanically controls important runtime surfaces but requires a reviewer
to reconstruct the complete boundary from the slice lock, stop state, and
capability matrix. A first-class map makes controlled, uncontrolled, unknown,
and authority-sensitive workflow surfaces explicit without expanding
enforcement claims.

## Next objective

Define `scopa.workflow-boundary-map.v1` and implement a pure deterministic
projection from validated SCOPA inputs with closed schemas and hostile tests.

## Descriptor rung check

Executable unlock: S29 creates a generator and schema consumed directly by the
S30 CLI and S31 installed point-and-go journey. It is not a prose-only contract.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: a pure map generator, validator, public schema, and hostile corpus.
- New uncertainty reduced: whether SCOPA can truthfully represent omitted and
  uncontrolled workflow authority without implying safety.
- Validation: focused Node test suite plus schema validation and canonical-byte reproduction.
- Consecutive metadata/decision check: pass; runtime-consumable code is required.
- Status-report alternative: insufficient because later CLI and assessment
  surfaces require a stable executable contract.

## Productivity mix

- Runtime behavior: 35%
- Contract/test code: 55%
- Metadata/docs: 10%

## Slice queue

| Slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S29 | Workflow map contract | Create deterministic map semantics | Unknown and uncontrolled authority cannot become green | schema and generator hostility | active |
| S30 | Boundary map CLI | Expose JSON and Markdown maps | One provider-off command returns real locked state | CLI parity and stale-state tests | queued |
| S31 | Point-and-go journey | Prove one file plus one task | Developer performs no manual SCOPA setup | source-free installed consumer | queued |
| S32 | Assessment interoperability | Validate, compare, and export maps offline | Free portable artifacts work without hosted truth | round-trip, diff, redaction, no-network tests | queued |
| S33 | Adversarial qualification | Search for false confidence and usability failure | Evidence supports a continuation or release decision | installed hostility and legibility suite | queued; provider-closed |

## Files in play

- `package.json`
- `schemas/scopa.workflow-boundary-map.v1.schema.json`
- `packages/workflow-boundary-map/**`
- focused conformance and documentation references
- `next-prompt-protocols/**`
- `notes/S29/**`
- `runs/S29/**`
- `evidence/S29/**`

## Non-goals

- No CLI, MCP, provider integration, or mutation-surface change in S29.
- No hosted service, dashboard, telemetry, lead capture, or proprietary verifier.
- No claim of control over native, omitted, or unknown capabilities.
- No customer data, consultation delivery, provider call, experiment, release,
  publication, deployment, or external-system action.
- No rewrite of historical evidence.

## Evidence

S29 records focused provider-off run output and a reviewer-facing map fixture
under `runs/S29/` and `evidence/S29/`. Notes are required only for a material
design decision not evident from code and tests.

## Acceptance

- The schema is closed, versioned, and packaged publicly.
- The generator is deterministic and free of filesystem, process, network, and mutation effects.
- Every required workflow surface has `controlled`, `uncontrolled`,
  `authority-required`, or `unknown` status with provenance.
- Missing capability evidence remains `unknown`; it never defaults to controlled.
- The map binds the slice-lock hash and stop state without claiming provider identity.
- Canonical input yields byte-identical canonical output.
- Focused tests, documentation checks, release policy, and protocol validation pass.

## Stop condition

Stop on implied safety, ambiguous unknown handling, semantic overlap that makes
a new contract unnecessary, nondeterminism, private-data retention, unrelated
runtime change, or any action requiring provider, experiment, customer,
publication, or release authority.
