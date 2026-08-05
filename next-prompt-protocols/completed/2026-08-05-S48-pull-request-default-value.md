# S48 — Pull-Request Default Value

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** []
**Advances contracts:** [`OA5`]
**Compound:** false
**Status:** completed; OA5 satisfied; provider-off implementation only

## Why this exists

The default read-only pull-request action sees no Boundary Card in most new
adoptions. Its current report lists three UNKNOWN values but does not explain
what the action actually observed or give the reviewer an immediately usable
next step. The highest-traffic surface SCOPA owns therefore consumes attention
without delivering value.

## Next objective

Replace the no-card summary with a fixed, actionable report that states the
only observed fact (no validated card was supplied), names what the action can
report from a card, gives the exact privacy-minimized export command, and keeps
completion, assurance, and scope unavailable. Preserve the read-only workflow,
untrusted-input isolation, and explicit comment opt-in unchanged. When an S46
card carries observation counts, project those counts and the qualified
satisfied headline so the PR surface cannot recreate the old presentation gap.

## Descriptor rung check

Executable unlock: the default action with no card emits a reviewer-useful
summary and a tested correction command while executing no project, gate, or
card-supplied content.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: fixed missing-card renderer plus exact no-card, hostile
  input, workflow-permission, and no-network regression tests.
- New uncertainty reduced: whether the default PR surface provides a safe next
  action without presenting missing evidence favorably.
- Validation: `npm run test:s48`, S41/S46 regressions, docs, protocol, and diff.
- Consecutive metadata/decision slice check: pass; S47 changed installer and
  agent-consumer runtime behavior.
- Status-report alternative: insufficient because this is the action's actual
  runtime-generated job summary.

## Productivity mix

- Runtime behavior: 35%
- Contract/test code: 50%
- Metadata/docs: 15%

## Files in play

- `packages/adoption-experience/**`
- `docs/GITHUB_ACTION.md`
- `package.json`
- `fixtures/S48/**`
- `notes/S48/**`
- `runs/S48/**`
- `evidence/S48/**`
- `next-prompt-protocols/**`

## Non-goals

- No project checkout analysis, discovered command execution, gate execution,
  PR-body parsing, executable PR input, or inference about an agent.
- No favorable completion, assurance, scope, risk, approval, certification,
  or safe-to-merge result when evidence is absent.
- No permission, workflow trigger, token, comment-default, network, card
  schema, completion, assurance, or observation-semantics change.
- No provider call, telemetry, publication, release, hosted action, or
  external-system mutation.

## Evidence

Commit `notes/S48/`, `runs/S48/`, and `evidence/S48/` with the exact missing
summary, no-network runner result, hostile input rejection, and workflow
permission audit.

## Acceptance

- `npm run test:s48`
- `npm run test:s41`
- `npm run test:s46`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- A missing card reports evidence as unavailable and every result dimension as
  UNKNOWN, with no favorable icon or status.
- The summary states the action observed only card absence and executed no gate
  or project command.
- The fixed next step is `scopa view --format json --output scopa-boundary.json`
  and the summary describes only fields actually present in a validated card.
- A validated card with outside-path or non-goal contact renders `SATISFIED —
  WITH UNVERIFIED CHANGES`, carries only aggregate observation counts, and does
  not change `canStop` or completion status.
- Missing, malformed, oversized, aliased, escaping, and injected input cannot
  execute or enter the summary.
- Default workflow permissions, no-network behavior, and comment opt-in remain
  unchanged.

## Stop condition

Stop on missing-evidence-as-green, executable or reflected PR input, implicit
write permission, secret exposure, certification or safe-to-merge language,
network use on the default path, or any provider, publication, release,
telemetry, hosted, or external-system intent.
