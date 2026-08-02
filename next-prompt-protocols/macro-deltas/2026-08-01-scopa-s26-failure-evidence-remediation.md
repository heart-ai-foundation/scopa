# SCOPA S26 Failure-Evidence Remediation Macro Delta

**Status:** principal-approved on 2026-08-01; provider and release gates closed
**Trigger:** S26 Claude returned non-qualifying and the runner asserted before retaining the returned run
**Historical matrix:** `0ae0aa91fbe8a8eaa800fce6496735ae270ea2c91cb12879a235c27d099725a4`
**Historical approval:** consumed; replay forbidden

## Objective

Remediate only the evidence-ordering defect exposed by S26:

1. preserve the stopped S26 runner, matrix, approval, and stop evidence unchanged;
2. create a distinct S26R1 runner that atomically retains every returned run
   before applying qualification assertions;
3. prove rejected, accepted, collision, and retention-failure behavior
   deterministically without provider traffic; and
4. freeze a new closed matrix whose later use requires a separate exact-digest
   principal approval.

The missing S26 run details cannot be reconstructed. This work records that
diagnostic limit rather than assigning a speculative Claude failure cause.

## Executable value

The new operator runner changes the order from:

`provider result -> qualification assertion -> private journal`

to:

`provider result -> no-replace private journal -> qualification assertion`

A non-qualifying result must therefore remain available for private diagnosis.
If retention itself fails, qualification stops and no success derivative can be
created.

## Authorized files

- `fixtures/S26R1/**`
- `evidence/S26R1/**`
- `runs/S26R1/**`
- `packages/live-run/test/s26r1-failure-evidence-remediation.test.js`
- `next-prompt-protocols/**`
- the SCOPA project evidence-home companion note

Historical `fixtures/S26/**` and `evidence/S26/**` are read-only inputs.

## Validation

- rejected returned run is mode-0600 and readable after qualification rejects;
- qualifying returned run is retained before acceptance;
- evidence collision never overwrites the prior file;
- retention failure prevents qualification;
- the closed S26R1 matrix binds the old stop, consumed approval, superseded
  runner, new runner, prompts, candidate, budgets, custody, and stop conditions;
- protocol projection, accumulated local gate, and hosted CI pass provider-off.

## Non-goals

- No S26 replay or historical evidence rewrite.
- No provider diagnostic, Claude retry, Codex attempt, experiment call, scored
  work unit, or customer data.
- No candidate, package, runtime, integration, dependency, public API, version,
  assurance, publication, release, tag, deployment, or announcement change.
- No claim about the unrecoverable S26 Claude terminal cause.
- No authority from the prospective S26R1 approval digest.

## Stop conditions

Stop on historical-byte drift, journal-after-assert behavior, overwrite,
private-mode failure, missing rejected-run evidence, candidate or matrix drift,
provider intent, or any unrelated change.

## Approval boundary

Principal agreement authorizes this deterministic remediation and closed-matrix
freeze only. Any S26R1 production call requires a later separate approval of
the exact closed matrix digest. Release execution remains closed.
