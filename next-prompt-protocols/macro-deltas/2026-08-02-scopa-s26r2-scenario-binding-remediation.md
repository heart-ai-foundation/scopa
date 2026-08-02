# SCOPA S26R2 Scenario-Binding Remediation Macro Delta

**Status:** principal-approved on 2026-08-02; provider and release gates closed
**Trigger:** S26R1 retained a structurally successful Claude result that the runner rejected because runtime scenario `clean` differed from transcript-bound session scenario `S26R1-claude-clean`
**Stopped matrix:** `23246eaa7c8f82c33c8313dddb4553940fa8936d40d28fd0d9c49d8c576fe9c6`
**Stopped approval:** consumed; replay forbidden

## Objective

Remediate only the runtime scenario/session binding defect exposed by S26R1:

1. preserve S26R1 runner, matrix, approval, private custody, stop, and consumed-approval evidence unchanged;
2. create a distinct S26R2 runner that derives the SCOPA session identifier and runtime scenario identifier once and requires exact equality;
3. keep the matrix scenario `clean` as a classification rather than incorrectly using it as the transcript identity;
4. adversarially prove exact binding succeeds and scenario, session, version, provider, or call drift fails closed without provider traffic; and
5. freeze a new provider-closed matrix whose later use requires a separate exact-digest principal approval.

## Executable value

S26R1 used two different identifiers for one runtime contract:

`session = S26R1-claude-clean; runtime scenario = clean`

S26R2 derives one runtime identity and passes it to both surfaces:

`session = runtime scenario = S26R2-<provider>-clean`

The matrix retains `scenario = clean` only as the bounded call classification.
No validator may silently translate, truncate, or equate these distinct fields.

## Authorized files

- `fixtures/S26R2/**`
- `evidence/S26R2/**`
- `runs/S26R2/**`
- `packages/live-run/test/s26r2-scenario-binding-remediation.test.js`
- `next-prompt-protocols/**`
- the SCOPA project evidence-home companion note

Historical `fixtures/S26R1/**`, `evidence/S26R1/**`, and its private custody are
read-only inputs.

## Validation

- exact Claude and Codex session/runtime-scenario equality passes;
- mismatched runtime ID, scenario classification, version, provider, and call ID reject;
- retain-before-validate, no-replace, mode-0600, and cleanup contracts remain intact;
- the closed S26R2 matrix binds the S26R1 stop, consumed approval, superseded runner, replacement runner, prompts, exact S25 candidate, budgets, custody, and stop conditions;
- prospective authority remains exact, ordered, single-use, non-transferable, and grants no release;
- focused, historical, protocol, accumulated local, privacy, and hosted gates pass provider-off.

## Non-goals

- No S26 or S26R1 replay and no provider call.
- No reinterpretation of the retained S26R1 result as qualifying evidence.
- No candidate, package, runtime integration, dependency, public API, version,
  assurance, experiment, publication, release, tag, deployment, or announcement
  change.
- No Codex attempt under the consumed S26R1 authority.
- No authority from a prospective S26R2 approval digest.

## Stop conditions

Stop on historical-byte drift, independently constructed session/scenario IDs,
accepted mismatch, retention regression, provider intent, candidate drift,
private evidence disclosure, false green, or unrelated change.

## Approval boundary

Principal agreement authorizes this deterministic remediation and closed-matrix
freeze only. Any S26R2 production call requires a later separate approval of
the exact closed matrix digest. Release execution remains closed.
