# SCOPA S26R3 Canonical Evidence-Projection Remediation Macro Delta

**Status:** principal-approved on 2026-08-02; provider and release gates closed
**Trigger:** S26R2 received a normalized Claude result but private retention rejected its fractional `costUsd` through the integer-only canonical JSON encoder
**Stopped matrix:** `1a4a642411c47349a34720b0aa35ea4ee668cdefac75622871de1bfd6937a947`
**Stopped approval:** consumed; replay forbidden

## Objective

Remediate only the canonical evidence-projection defect exposed by S26R2:

1. preserve S26R2 runner, matrix, approval, intent custody, stop, and consumed-approval evidence unchanged;
2. create a distinct S26R3 runner that reuses the exact installed-candidate Claude evidence projection before canonical private and public serialization;
3. preflight zero, representative fractional, and policy-maximum USD values before provider intent;
4. reject malformed, negative, exponent-form, or nonfinite accounting and preserve no-replace retention ordering; and
5. freeze a new provider-closed matrix requiring later separate exact-digest approval.

## Executable value

The Claude normalizer correctly preserves finite provider accounting as a
number. Durable SCOPA evidence requires a canonical decimal string. S26R3 uses
the already-qualified candidate function `normalizedEvidenceProjection` to
perform that boundary conversion:

`normalized cost number -> exact plain-decimal evidence string -> canonical JSON`

The original normalized run remains the source for qualification. Only the
durable evidence projection changes representation.

## Authorized files

- `fixtures/S26R3/**`
- `evidence/S26R3/**`
- `runs/S26R3/**`
- `packages/live-run/test/s26r3-canonical-evidence-projection-remediation.test.js`
- `next-prompt-protocols/**`
- the SCOPA project evidence-home companion note

Historical `fixtures/S26R2/**`, `evidence/S26R2/**`, and its private intent are
read-only inputs.

## Validation

- `0`, representative fractional, and policy-maximum cost values project to exact plain-decimal strings;
- malformed, negative, exponent-form, and nonfinite values reject;
- installed-candidate projection is present and passes before provider intent;
- projected fractional evidence is mode-0600, retained before validation, and collision-safe;
- private campaign and public derivative use the same Claude projection;
- scenario/session binding and all S26R2 hardening remain intact;
- the closed matrix binds S26R2 stop, consumption, superseded runner, replacement runner, prompts, exact candidate, budgets, custody, and stop conditions;
- focused, historical, protocol, privacy, accumulated, and hosted gates pass provider-off.

## Non-goals

- No S26, S26R1, or S26R2 replay and no provider call.
- No reconstruction or qualification claim for the unretained S26R2 result.
- No canonical JSON relaxation and no floating-point number admitted into sealed evidence.
- No candidate, package, dependency, public API, version, assurance, experiment,
  publication, release, tag, deployment, or announcement change.
- No authority from the prospective S26R3 approval digest.

## Stop conditions

Stop on historical-byte drift, direct fractional serialization, divergent
private/public projections, malformed-cost acceptance, provider intent,
retention regression, overwrite, privacy leak, false green, or unrelated change.

## Approval boundary

Principal agreement authorizes deterministic remediation and closed-matrix
freeze only. Any S26R3 production call requires later separate approval of the
exact closed matrix digest. Release execution remains closed.
