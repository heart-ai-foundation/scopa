# S11 — Proof Contract and Redaction Convergence

**Class:** `arc`
**Module:** `proof-integrity`
**Crosses:** [`release-readiness`, `conformance`]
**Advances contracts:** [`PI1`, `PI2`, `PI3`]
**Compound:** false

## Why this exists

The accepted S10 artifact and proof remain valid, but fresh adversarial review
showed that the reusable runtime validators admit states rejected by SCOPA's
published JSON Schemas. The same review showed that generic whole-document
redaction can alter an unrelated semantic field when its value collides with a
private root, while the receipt still claims no semantic change. These are
generic proof-integrity defects and block broader release.

## Next objective

Create one mechanically checked proof-validation language across the runtime
and published schemas. Enforce closed fields, non-empty and unique arrays,
positive package cardinalities, safe paths, and aggregate invariants. Replace
generic recursive substitution with field-specific publication that rejects
or explicitly reports collisions and computes semantic preservation from the
actual before/after proof.

## Descriptor rung check

Executable unlock: a hostile differential corpus can call both official
validation paths and prove identical accept/reject outcomes, while a collision
corpus proves that public proof generation cannot silently alter semantics.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: validator convergence, schema-parity corpus,
  field-specific public-proof transformation, and semantic comparison.
- New uncertainty reduced: whether an official runtime API can accept a state
  forbidden by the published contract or publish an altered semantic value as
  unchanged.
- Validation: focused S11 tests, differential parity probe, accumulated S10
  tests, full release gate, dependency audit, and protocol check.
- Consecutive metadata/decision slice check: `pass`; S11 changes executable
  validation and publication behavior.
- Status-report alternative: insufficient because the findings reproduce in
  exported runtime functions.

## Productivity mix

- Runtime behavior: 35%
- Contract/test code: 50%
- Metadata/docs: 15%

## Slice queue

This queue is materialized from the ratified Adversarial Release Hardening
Macro Delta and creates no independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S11 | Proof contract and redaction convergence | Align validators and make publication collision-safe | Runtime/schema corpus agrees and receipts cannot falsely claim semantic preservation | Differential mutation corpus, collision corpus, S10 regression, full gate | `active` |
| S12 | Installed surface, launcher, privacy, and CI hardening | Reconcile shipped commands and bound consumer errors/package residue | Every retained command runs from tarball-only bytes and hostile launcher errors stay structured | Installed-command matrix, package/privacy scan, hosted CI | `queued` |
| S13 | Fresh-agent adversarial release requalification | Rebuild and independently requalify the corrected candidate | Three fresh reviewers reproduce the corrected boundaries with no critical/high/medium finding | Exact artifact, source-free corpora, outside reviews, hosted gate | `queued` |

## Files in play

- `packages/release-readiness/**`
- `schemas/**`
- `fixtures/S11/**`
- `package.json`
- `package-lock.json`
- `next-prompt-protocols/**`
- `notes/S11/**`
- `runs/S11/**`
- `evidence/S11/**`

## Validation speed option

- Fast slice-local command: `npm run test:s11`
- Differential command: `npm run probe:s11:parity`
- Upstream fixture policy: derive mutations from a minimal known-valid proof;
  do not rebuild live Claude, Codex, timestamp, or CASE fixtures for focused
  validation.
- Broad-suite policy: `npm run test:s10` and `npm test` remain the accumulated
  compatibility guards.

## Non-goals

- No npm publication, GitHub Release, repository visibility change,
  deployment, customer use, public announcement, certification, or trademark
  claim.
- No rewrite of S10's historical proof, candidate bytes, acceptance, or
  closeout.
- No weakening of a published closed-schema, cardinality, uniqueness,
  numeric, path, aggregate, or false-green constraint.
- No generic whole-document replacement of path-like values.
- No new product feature, provider integration, effect category, mutation
  route, or adapter-assurance claim.
- No credential value or rotation evidence in the repository.
- No implementation of S12 or S13 before protocol rotation.

## Evidence

This slice commits the evidence set under the standard S11 trio:

- `notes/S11/` — contract-convergence design, semantic-field definition,
  collision policy, and retained non-goals.
- `runs/S11/` — focused test, parity probe, S10 regression, full gate,
  dependency audit, and protocol-check results.
- `evidence/S11/` — corpus manifest, runtime/schema parity receipt, redaction
  collision receipt, exact accepted-proof regression, and reviewer verdict.

## Acceptance

- `npm run test:s11`
- `npm run probe:s11:parity`
- `npm run test:s10`
- `npm test`
- `npm audit`
- `npm run protocol:check`
- The exact accepted S10 proof remains valid without editing its retained
  evidence.
- Every positive and negative corpus entry returns the same result through
  runtime and published-contract validation.
- Empty or duplicate adapter tool names, empty or duplicate verified/non-claim
  arrays, zero or negative package cardinalities, unknown or missing fields,
  invalid paths, and fabricated aggregate states fail closed.
- Redaction modifies only the designated environment roots in the public proof.
- Root collisions with assurance labels, claims, package metadata, filenames,
  tool names, placeholders, substrings, or overlapping roots cannot produce a
  valid receipt that falsely reports semantic preservation.
- `semanticFieldsChanged` is computed from a defined semantic projection and
  is never hard-coded.
- Raw source bytes and the public proof remain digest-bound and deterministic.
- PI1, PI2, and PI3 are independently reviewable and satisfied.
