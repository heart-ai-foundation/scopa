# S11 outside review

Date: 2026-07-28
Reviewer: Claude Code 2.1.170 / `claude-sonnet-4-6`
Target: `edc8e2c`
Baseline: `7d28de8`
Verdict: `ACCEPT`

## Result

The reviewer found PI1, PI2, and PI3 satisfied with no critical, high, or
medium finding.

It confirmed:

- the runtime validators and direct published-contract entry point resolve to
  the same AJV-compiled schema language;
- the custom candidate keyword enforces unique/sorted paths and entry-count
  equality;
- closed fields, cardinality, uniqueness, positive/safe integers, false-green
  constants, and publication posture fail closed;
- redaction is field-specific;
- exact and substring semantic collisions fail before publication;
- equal and overlapping designated roots are safe;
- reserved placeholder injection fails closed;
- `semanticFieldsChanged` is computed from an explicit projection;
- the AJV dependency has no externally supplied schema/codegen input surface;
- no S10 API regression was evident.

## Findings and disposition

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| S11-L1 | low | duplicate `nonClaims` missing from corpus | fixed in `7b686e3` |
| S11-L2 | low | empty consultation boundary missing from corpus | fixed in `7b686e3` |
| S11-L3 | low | custom invariant not exercised through consumer `$ref` | fixed in `7b686e3` |
| S11-L4 | low | notes/runs evidence trio not yet present | closed by S11 evidence commit |
| S11-I1 | info | publication receipt used literal occurrence count | fixed in `7b686e3` |

## Review execution

- duration: 718879 ms;
- model cost: USD 1.13663605;
- model turns: 37;
- network/web requests: 0;
- repository edit/write tools: unavailable;
- model-side Bash test request: permission-denied under read-only mode.

The verdict is therefore an independent static/adversarial review, not an
independent command-run receipt. Local focused, accumulated, dependency,
package, exact-proof, and protocol commands are recorded separately in
`runs/S11/2026-07-28-validation.md`.

The original bounded prompt is `outside-review-request.md`.

## Claim boundary

`ACCEPT` applies to S11 proof integrity only. It does not authorize public
release and does not close S12 distribution-hardening findings.
