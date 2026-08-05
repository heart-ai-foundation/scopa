# S41 — Provider-Off Pull-Request Distribution

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** [`distribution`, `workflow-boundary-map`]
**Advances contracts:** [`AX5`]
**Compound:** false
**Status:** completed; AX5 satisfied; provider-off implementation only

## Why this exists

The local Boundary Card is useful and shareable, but teams repeatedly make
agent-work decisions in pull requests. SCOPA needs a least-privilege route into
that review surface without executing PR-controlled gates, leaking workflow
content, or turning comment permission into a default.

## Next objective

Add a provider-off local GitHub Action and read-only pull-request workflow that
validate an optional Boundary Card and write a sanitized job summary. The
default workflow must use read-only permissions and never execute PR-declared
commands. An optional PR comment surface must require explicit enablement, a
token supplied by the caller, and full-commit-pinned trusted action code.

## Descriptor rung check

Executable unlock: a synthetic pull-request runner must turn valid, missing,
and hostile card inputs into truthful sanitized summaries while fork and
permission fixtures prove zero implicit write authority.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: action metadata, bounded report runner, read-only workflow,
  optional comment route, and adversarial GitHub context fixtures.
- New uncertainty reduced: whether SCOPA can be useful and visible in code
  review without unsafe PR execution or default write permission.
- Validation: fork events, missing/valid/hostile cards, workflow injection,
  summary safety, comment opt-in, token absence, and permission lint.
- Consecutive metadata/decision slice check: pass.
- Status-report alternative: insufficient; no PR distribution surface exists.

## Productivity mix

- Runtime behavior: 35%
- Contract/test code: 50%
- Workflow/docs: 15%

## Files in play

- `.github/actions/scopa-boundary-check/**`
- `.github/workflows/scopa-boundary-check.yml`
- `packages/adoption-experience/**`
- `packages/release-readiness/**`
- `docs/**`
- `README.md`
- `fixtures/S41/**`
- `package.json`
- `notes/S41/**`
- `runs/S41/**`
- `evidence/S41/**`
- `next-prompt-protocols/**`

## Non-goals

- No execution of gate commands, package scripts, PR-authored action code with
  write credentials, or executable interpolation of untrusted text.
- No implicit pull-request, issue, check, commit, repository, or external write.
- No secret, token, environment map, card path, prompt, gate output,
  capability evidence, or PR body in the summary or comment.
- No certification, security, compliance, readiness, approval, or safe-to-
  merge wording.
- No marketplace publication, GitHub API call during qualification, release,
  deployment, provider/model call, experiment, customer, or hosted mutation.

## Evidence

Commit the slice trio under `notes/S41/`, `runs/S41/`, and `evidence/S41/`.
Evidence must bind action/workflow bytes, valid/missing/hostile summary bytes,
fork and permission analysis, zero gate execution, optional-comment guards,
no-network qualification, and workflow-command injection hostility.

## Acceptance

- `npm run test:s41`
- `npm run test:s40`
- `npm run test:s33`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Default pull-request workflow declares only `contents: read`, persists no
  checkout credential, performs no package install, and executes no card gate.
- Valid cards produce sanitized count/digest summaries; missing cards remain
  explicitly unknown; malformed, oversized, aliased, or hostile cards fail
  before summary publication.
- PR comments require literal opt-in, a caller token, a pull-request event, and
  documentation requiring full-commit-pinned trusted action code.
- Fork fixtures expose no secret or write route, and all untrusted values remain
  data rather than workflow commands or executable script.

## Stop condition

Stop on implicit write permission, token exposure, PR-head action execution
with write credentials, untrusted command execution, summary injection,
missing-evidence green state, certification wording, live API/network intent,
marketplace/release action, or unrelated product expansion.
