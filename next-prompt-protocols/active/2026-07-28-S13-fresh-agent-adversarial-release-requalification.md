# S13 — Fresh-Agent Adversarial Release Requalification

**Class:** `arc`
**Module:** `release-requalification`
**Crosses:** [`proof-integrity`, `distribution-hardening`, `conformance`]
**Advances contracts:** [`RQ1`, `RQ2`, `RQ3`]
**Compound:** false

## Why this exists

S11 corrected the proof-contract and redaction defects found after S10. S12
corrected the installed command, launcher disclosure, package privacy, and
hosted action-runtime defects. Hardening is not complete until unfamiliar
reviewers reproduce those corrected boundaries from one exact clean private
candidate rather than from implementation context.

## Next objective

Build and retain one exact private candidate from a clean commit, run the full
source-free hostile corpus against those bytes, and assign three fresh isolated
reviewers to attack artifact/distribution, evidence/proof, and runtime/
containment boundaries. Require each reviewer to issue a structured `ACCEPT`
with no critical, high, or medium finding before closeout.

## Descriptor rung check

Executable unlock: an exact candidate plus three independent adversarial
reproductions can determine whether the corrected generic boundaries survive
source-free consumption and unfamiliar review.

## Anti-ceremony gate

- Classification: `test/validation`.
- Executable change: exact private artifact construction, source-free
  install/execution, hostile proof/package/runtime corpora, and independent
  review commands.
- New uncertainty reduced: whether S11/S12 fixes hold on exact candidate bytes
  without repository assumptions or reviewer context.
- Validation: exact artifact hashes, consumer proof, parity/collision corpus,
  installed matrix, CLI/MCP hostility, signature/trust tampering,
  known-failure control, three fresh reviews, dependency audit, credential
  prerequisite, full local gate, and hosted CI.
- Consecutive metadata/decision slice check: `pass`; S13 executes consumer and
  reviewer tests rather than merely recording status.
- Status-report alternative: insufficient because RQ1/RQ2 require new exact
  artifact behavior and independent executions.

## Productivity mix

- Runtime behavior: 0%
- Contract/test execution and adversarial review: 75%
- Evidence/closeout metadata: 25%

## Slice queue

This queue is materialized from the ratified Adversarial Release Hardening
Macro Delta and creates no independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S11 | Proof contract and redaction convergence | Align validators and make publication collision-safe | Runtime/schema corpus agrees and receipts cannot falsely claim semantic preservation | Differential mutation corpus, collision corpus, S10 regression, full gate | `completed` |
| S12 | Installed surface, launcher, privacy, and CI hardening | Reconcile shipped commands and bound consumer errors/package residue | Every retained command runs from tarball-only bytes and hostile launcher errors stay structured | Installed-command matrix, package/privacy scan, hosted CI | `completed` |
| S13 | Fresh-agent adversarial release requalification | Rebuild and independently requalify the corrected candidate | Three fresh reviewers reproduce corrected boundaries with no critical/high/medium finding | Exact artifact, source-free corpora, outside reviews, hosted gate | `active` |

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `.github/**`
- `packages/release-readiness/**`
- `packages/adapter-host/**`
- `packages/cli/src/command.js`
- `packages/cli/README.md`
- `packages/cli/test/cli.test.js`
- `packages/interop/README.md`
- `fixtures/S10/consumer-client.mjs`
- `schemas/**`
- `fixtures/S13/**`
- `next-prompt-protocols/**`
- `notes/S13/**`
- `runs/S13/**`
- `evidence/S13/**`
- private raw candidate/proof material under
  `llm-memories/projects/scopa/evidence/S13/**`

## Validation speed option

- Fast slice-local command: `npm run test:s12`
- Exact installed-artifact command: `npm run probe:s12:installed`
- Proof differential command: `npm run probe:s11:parity`
- Upstream fixture policy: reuse the S10 source-free consumer fixtures, S11
  proof corpus, S12 installed matrix, and retained signed packet.
- Broad-suite policy: `npm test` remains the accumulated compatibility guard.

## Decision gate

All RQ1 behavioral claims must resolve to one exact clean commit and one
deterministic candidate SHA-256. Private raw proof and tarball bytes remain in
the private SCOPA evidence home; only collision-safe public proof, receipts,
review requests/reports, and non-sensitive summaries may enter the repository.

The three reviewers must be fresh, isolated, and assigned non-overlapping
primary attack surfaces:

1. artifact/distribution and source-free installed commands;
2. proof/schema/redaction and evidence truthfulness;
3. runtime containment, launcher/MCP hostility, signature/trust, known
   failure, and false-green behavior.

Each report must bind the exact source commit and candidate SHA-256, state what
was executed, distinguish static review from command execution, and return
`ACCEPT` or `REJECT` with severity-ranked findings.

If a fresh reviewer returns `REJECT`, the active S13 scope may remediate only
the reported proof-integrity, distribution, or conformance boundary needed to
remove that finding. Existing published schemas are in play for such
fail-closed corrections; adding a new schema or capability remains a non-goal.
The rejected candidate and report must be retained, a new clean candidate must
be built, and all three final reviews must use fresh agents against the new
exact bytes.

Provider-side confirmation that the affected S10 Slack, OpenRouter, and Valyu
credentials were rotated and their old values invalidated is required for RQ3.
Only a boolean/provider-side confirmation may be recorded; credential values,
tokens, screenshots, and rotation secrets must never enter repository or
evidence files.

## Non-goals

- No npm publication, GitHub Release, repository visibility change,
  deployment, customer use, public announcement, certification, or trademark
  claim.
- No new product feature, provider integration, command, export, schema,
  assurance level, effect category, trust policy, or verification primitive.
- No weakening/removal of consumer bins, exports, verifier capability,
  known-failing fixtures, hostile corpus cases, or independently useful free
  functionality.
- No rewrite of historical S10-S12 evidence.
- No credential value, credential screenshot, or rotation secret in any
  retained file.
- No false claim that reviewer agreement is provider attestation, production
  certification, or permission to publish.
- No hardening-queue closeout while credential rotation is unconfirmed.

## Evidence

This slice commits the standard S13 trio:

- `notes/S13/` — exact-candidate/reviewer methodology, claim boundary,
  credential-confirmation posture, and non-goals.
- `runs/S13/` — clean construction, hostile corpora, three reviewer
  executions, dependency/protocol gates, and hosted run.
- `evidence/S13/` — exact non-sensitive manifest/receipt, collision-safe public
  consumer proof, mutation summaries, three bounded review requests/reports,
  dependency receipt, boolean rotation confirmation, and hosted receipt.

Private candidate tarball and raw proof live only in the SCOPA evidence home.

## Acceptance

- Exact clean source commit and candidate SHA-256 are recorded consistently
  across manifest, private proof, public proof, hostile corpus, and all three
  reviews.
- Repeated official packing is byte-deterministic.
- Fresh tarball-only install passes both bins, all exports, zero-script
  inventory, governed adapter, known failure, signature verification, and
  package/privacy/error-surface checks.
- Runtime and published proof contracts agree over the full S11 corpus.
- Collision, placeholder, overlap, cardinality, numeric, closed-field,
  signature/trust, scope-escape, malformed protocol, and false-green attacks
  fail closed.
- Private proof publication changes only designated roots and reports
  `semanticFieldsChanged: false`.
- Three fresh isolated reports bind exact bytes, return `ACCEPT`, and contain
  no critical, high, or medium finding.
- `npm audit --audit-level=low`
- `npm test`
- `npm run protocol:check`
- Hosted CI passes without a Node action-runtime deprecation warning.
- Provider-side credential rotation/old-value invalidation is confirmed
  without retaining any credential value.
- RQ1, RQ2, and RQ3 are independently reviewable and satisfied.
