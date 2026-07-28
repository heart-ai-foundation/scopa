# S9 non-Codex outside review

Reviewer: Claude Sonnet

Review environment: disposable exact copy of the S9 candidate

Mutation authority: none

Final full-review verdict: `VERDICT: ACCEPT S9`

## Reproduced gates

The reviewer independently ran and accepted:

- `npm run test:s9`
- accumulated `npm test`
- `npm run verify:s9:parity`
- the Next-Prompt Protocol check
- `npm audit`

## Findings and disposition

1. **LOW — reasoning-item schema closure.** The first candidate accepted the
   observed reasoning item without explicitly closing its content shape.
   Remediation: reasoning items now require exactly `id`, `text`, and `type`;
   a command-like extra-field negative control is committed.
2. **LOW — narrow write-approval proof in the deterministic suite.** The live
   receipt proved the per-tool approval override, but the first deterministic
   suite did not inspect it. Remediation: the suite reads the committed proof
   and asserts the exact `scopa_write_file.approval_mode = "approve"` override,
   successful governed write, and one exact SCOPA MCP inventory.
3. **INFORMATIONAL — protocol progress.** The reviewer observed `38/44`,
   expected while S9 remained active.
4. **INFORMATIONAL — corrected denied scenario.** `canStop: true` follows the
   denied write because the model observed the denial, corrected the path, and
   then satisfied the real gate.

## Follow-up transparency

The remediated deterministic S9 and parity gates pass locally. Two narrower
Claude follow-ups did not return a verdict: one exhausted a $0.75 review
budget, and one ended on a transient API connection refusal. Neither reported
a new defect or superseded the completed `ACCEPT S9` review.

The exact raw model run is retained only in the private evidence home when
available; this public record intentionally contains no credentials, local
home paths, or disposable-root paths.
