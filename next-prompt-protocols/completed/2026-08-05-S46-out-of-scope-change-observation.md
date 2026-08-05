# S46 — Out-of-Scope Change Observation

**Class:** `arc`
**Module:** `enforcement`
**Crosses:** [`workflow-boundary-map`, `adoption-experience`]
**Advances contracts:** [`OA3`]
**Compound:** false
**Status:** completed; OA3 satisfied; provider-off implementation only

## Why this exists

SCOPA enforces writes routed through its dispatcher, but an agent may retain a
native filesystem route outside that dispatcher. Public `0.4.0` reports that
bypass honestly as partial assurance, yet a tracked native write outside the
locked paths can still leave the Boundary Card's most visible completion line
as unqualified `SATISFIED`.

The completion gates may genuinely pass. The missing behavior is a separate
observation—not a new enforcement guarantee and not a reason to redefine
`canStop`.

## Next objective

Observe bounded tracked Git changes at Boundary Card creation, count paths
outside the lock, conservatively count recognized declared-non-goal contact,
and add only those counts to an optional card field. Qualify a satisfied human
headline when unverified changes exist. Keep completion status, `canStop`,
source-map identity, and existing v1 card consumers unchanged.

## Descriptor rung check

Executable unlock: a real Git fixture with a passing declared gate and a
native `package.json` change outside `src/**` produces `SATISFIED — WITH
UNVERIFIED CHANGES`, while the same card remains `completion.status =
satisfied`, `canStop = true`, and contains no path.

## Anti-ceremony gate

- Classification: runtime guard.
- Executable change: bounded Git observation, additive card projection, and
  clean/dirty/non-goal/compatibility polarity tests.
- New uncertainty reduced: whether a native bypass can create a screenshotable
  false impression despite otherwise honest partial-assurance evidence.
- Validation: `npm run test:s46`, S2/S29/S40/S41 regressions, docs, protocol,
  and diff hygiene.
- Consecutive metadata/decision slice check: pass; S45 changed executable CLI
  behavior.
- Status-report alternative: insufficient because the exposure exists in the
  runtime-generated artifact.

## Productivity mix

- Runtime behavior: 45%
- Contract/test code: 45%
- Metadata/docs: 10%

## Files in play

- `packages/enforcement/**`
- `packages/adoption-experience/**`
- `packages/cli/**`
- `docs/BOUNDARY_CARD.md`
- `schemas/scopa.boundary-card.v1.schema.json`
- `package.json`
- `fixtures/S46/**`
- `notes/S46/**`
- `runs/S46/**`
- `evidence/S46/**`
- `next-prompt-protocols/**`

## Non-goals

- No claim that observed changes were caused by an agent, prevented, mediated,
  controlled, or unauthorized.
- No change to declared gate execution, completion status, `canStop`,
  assurance computation, or source-map digest.
- No blocking on observation, dirty-tree state, missing Git, concurrent work,
  generated lockfiles, formatting, or rebases.
- No arbitrary natural-language policy inference. Non-goal contact recognition
  is conservative, closed, and reporting-only.
- No untracked-file traversal, file-content read, path disclosure in the card,
  provider/network call, telemetry, release, publication, or external action.

## Evidence

Commit `notes/S46/`, `runs/S46/`, and `evidence/S46/`. Evidence must retain the
real clean/inside/outside/non-goal Git matrix, an unchanged legacy card fixture,
and terminal/HTML/JSON path-disclosure checks.

## Acceptance

- `npm run test:s46`
- `npm run test:s2`
- `npm run test:s29`
- `npm run test:s40`
- `npm run test:s41`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Clean tracked state yields zero observed/outside/non-goal counts.
- A tracked change within an allowed rule is observed but not counted outside.
- A tracked change outside the rules increments the outside count.
- A changed package manifest with a dependency non-goal increments the separate
  recognized-contact count.
- A satisfied card with observed changes renders `SATISFIED — WITH UNVERIFIED
  CHANGES`; completion status and `canStop` remain unchanged.
- Existing cards without the optional observation field remain valid.
- No observed path, non-goal text, Git output, or repository root enters the
  card or its terminal/HTML/PR projections.

## Stop condition

Stop if observation is presented as prevention, enforcement, control,
attribution, or authorization; if `canStop`, completion, assurance, or source
map identity changes; if legacy card validation breaks; if paths or Git output
reach a shareable artifact; or on any provider, network, publication, release,
hosted, telemetry, or external-system intent.
