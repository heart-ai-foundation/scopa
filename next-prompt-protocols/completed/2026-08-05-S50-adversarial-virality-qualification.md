# S50 — Adversarial Virality Qualification

**Class:** `arc`
**Module:** `release-readiness`
**Crosses:** [`adoption-experience`, `enforcement`]
**Advances contracts:** [`OA7`]
**Compound:** false
**Status:** completed; OA7 satisfied; provider-off qualification only; release closed

## Why this exists

Phase 14 changed the first-contact, local diagnostic, tracked-change,
pull-request, and adopter-badge surfaces. Source tests prove each slice, but the
credibility risk exists in packed installed bytes: a native dependency change
outside `src/**` must never again yield an unqualified satisfied presentation.
The public `0.4.0` behavior must remain an immutable compatibility baseline,
not be mistaken for evidence about the changed candidate.

## Next objective

Build a fresh local tarball, install it offline into an isolated tool root, and
exercise cold first contact plus marker-free generic installation. In a real
Git fixture, create a passing task boundary, make a tracked native dependency
change outside the lock, and assert qualified terminal, JSON, PR, and badge
projections while canonical completion remains satisfied. Bind the public
`v0.4.0` tag and retained S44 envelope fixtures by exact digests. Add this test
to the accumulated release gate, run the complete provider-off suite, and stop
without release or publication action.

## Descriptor rung check

Executable unlock: `npm run test:s50` fails if packed candidate bytes emit an
unqualified satisfied headline for the reproduced native non-goal violation,
if cold first insight exceeds thirty seconds, or if the immutable public
baseline changes.

## Anti-ceremony gate

- Classification: test/validation.
- Executable change: installed-candidate adversarial harness, exact baseline
  manifest, permanent accumulated-gate wiring, and retained qualification
  receipt.
- New uncertainty reduced: whether the entire Phase 14 behavior survives
  packaging and whether its highest-risk presentation can silently regress.
- Validation: `npm run test:s50`, full `npm test`, protocol, docs, diff, and
  package inventory.
- Consecutive metadata/decision slice check: pass; S49 changed runtime badge
  generation and CLI export.
- Status-report alternative: insufficient because installed bytes and timing
  must be executed, not inferred from source review.

## Productivity mix

- Runtime behavior: 0%
- Contract/test code: 80%
- Metadata/docs: 20%

This is the final arc gate and directly exercises the packed runtime; it is not
a descriptor-only follow-up.

## Files in play

- `packages/release-readiness/**`
- `package.json`
- `fixtures/S44/**`
- `fixtures/S50/**`
- `notes/S50/**`
- `runs/S50/**`
- `evidence/S50/**`
- `next-prompt-protocols/**`

## Non-goals

- No provider/model call, experiment use, production-live run, customer repo,
  hosted service, telemetry, or network dependency.
- No release, npm publication, tag, GitHub Release, merge, announcement,
  repository setting, or external-system mutation.
- No transfer of public `0.4.0` assurance to changed candidate bytes and no
  rewrite of historical evidence.
- No change to runtime behavior, completion, `canStop`, assurance,
  observation, badge, PR, or schema semantics in this slice; material findings
  stop qualification rather than being remediated silently.
- No claim that timing on one local host is a universal benchmark. The thirty-
  second limit is a usability regression ceiling only.

## Evidence

Commit `notes/S50/`, `runs/S50/`, and `evidence/S50/` with candidate SHA-256,
packed inventory, local timing, native-violation projections, public-baseline
digests, accumulated gate result, and explicit release-closed posture.

## Acceptance

- `npm run test:s50`
- `npm test`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- `git diff --check`
- Fresh tarball installs offline without resolving source-checkout modules.
- Cold zero-argument first insight is human, read-only, and below 30 seconds;
  marker-free assistant preview selects generic without writing.
- Real tracked `package.json` change outside `src/**`, with dependency non-goal,
  yields outside/non-goal counts and `SATISFIED — WITH UNVERIFIED CHANGES` in
  terminal and PR projections; JSON remains `status = satisfied`, `canStop =
  true`; badge carries partial basis and observation facts without a grade.
- No changed path, non-goal text, private root, or raw Git output enters a
  shareable projection.
- Local `v0.4.0` resolves to commit
  `4643cb342e4de3a8641476e0b171139e08f16620`, and every retained public baseline
  fixture matches its committed SHA-256.
- `test:s45` through `test:s50` are wired into the accumulated `npm test` gate.

## Stop condition

Stop on material finding, false green, unqualified satisfied projection,
installed/source divergence, claim drift, privacy leak, baseline drift, timing
regression, unexpected network/provider intent, or any release, publication,
merge, announcement, hosted, telemetry, or external-system action.
