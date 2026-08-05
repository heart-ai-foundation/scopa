# S49 — Adopter Fact Badge and Discovery Surface

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** []
**Advances contracts:** [`OA6`]
**Compound:** true — paired-diff (the runtime badge and its repository-owned discovery/contact instructions form one adopter-facing surface)
**Status:** completed; OA6 satisfied; provider-off implementation only

## Why this exists

SCOPA adopters cannot currently display their use of the tool without inventing
a badge or collapsing nuanced boundary evidence into a favorable mark. The
Boundary Card documentation prohibits badges outright even though the actual
safety principle is narrower: no grade, score, pass, approval, or safe-to-merge
semantics. The optional organizational review is also difficult to reach from
the free artifact and support surface.

## Next objective

Render a deterministic, accessible, local SVG badge from the validated Boundary
Card. State only that SCOPA boundary evidence exists, carry the computed
assurance level and basis, carry aggregate observation facts when present, and
bind the source-map digest without paths or private content. Document safe
adopter use and make the optional organizational-review contact reachable from
repository-owned README, support, and review documents. Do not change GitHub
settings or create a remote tracking surface.

## Descriptor rung check

Executable unlock: `scopa view --format badge --output scopa-boundary.svg`
creates exact, no-replace adopter bytes whose text and metadata are mechanically
rejected if they imply a grade, score, pass, approval, certification, or
safe-to-merge result.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: SVG renderer, CLI export route, deterministic/privacy/
  semantic tests, and direct repository-owned documentation links.
- New uncertainty reduced: whether adopters can advertise a fact without
  overstating assurance or adding a third-party analytics request.
- Validation: `npm run test:s49`, S40/S46/S48 regressions, docs, protocol, diff.
- Consecutive metadata/decision slice check: pass; S48 changed runtime PR output.
- Status-report alternative: insufficient because the missing artifact must be
  generated, validated, and safe to publish by adopters.

## Productivity mix

- Runtime behavior: 35%
- Contract/test code: 45%
- Metadata/docs: 20%

## Sub-slices

| # | Change | Files | Non-goals | Why bundled |
| --- | --- | --- | --- | --- |
| 1a | Deterministic fact badge and CLI export | `packages/adoption-experience/**`, `packages/cli/**` | No score, remote asset, or semantic source-map replacement | The badge is the artifact adopters display |
| 1b | Badge canon amendment and reachable review/contact route | `README.md`, `SUPPORT.md`, `docs/**` | No lead capture, GitHub setting, or gated free feature | Documentation must constrain and explain the same artifact |

## Files in play

- `packages/adoption-experience/**`
- `packages/cli/**`
- `README.md`
- `SUPPORT.md`
- `docs/BOUNDARY_CARD.md`
- `docs/ORGANIZATIONAL_REVIEW.md`
- `package.json`
- `fixtures/S49/**`
- `notes/S49/**`
- `runs/S49/**`
- `evidence/S49/**`
- `next-prompt-protocols/**`

## Non-goals

- No grade, score, pass, approval, certification, risk rank, safe-to-merge, or
  generic safety/security/compliance/readiness claim.
- No change to canonical card, completion, `canStop`, assurance, observation,
  or source-map semantics; SVG is a projection only.
- No path, prompt, gate output, non-goal text, capability evidence, credential,
  private root, or raw Git output in the badge.
- No remote image, font, script, URL, analytics, telemetry, account, hosted
  truth source, form, or lead capture in the runtime artifact.
- No GitHub homepage, topic, description, Discussions, social-preview,
  repository visibility, or other external-system mutation.
- No provider call, publication, release, deployment, or announcement.

## Evidence

Commit `notes/S49/`, `runs/S49/`, and `evidence/S49/` with exact SVG bytes,
determinism, accessibility, privacy, forbidden-semantics, export conflict, docs,
and contact-link proof.

## Acceptance

- `npm run test:s49`
- `npm run test:s40`
- `npm run test:s46`
- `npm run test:s48`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Badge output is deterministic, standalone SVG with no script, remote asset,
  URL, telemetry, or executable content.
- Visual and accessible text state the assurance level and exact basis; missing
  observation is explicit and zero is phrased as observed, not universally safe.
- The complete source-map SHA-256 is embedded as a nonvisual binding and no
  private fixture value enters the SVG.
- Badge bytes contain no grade, score, pass, approval, certification, risk rank,
  or safe-to-merge semantics.
- CLI stdout and no-replace export paths derive from the same validated card.
- README, Boundary Card, Support, and Organizational Review documents preserve
  a complete free result, explain safe adopter use, and expose one direct
  optional contact route without telemetry or lead capture in SCOPA.

## Stop condition

Stop on favorable mark semantics, unqualified assurance, source-map drift,
private-data projection, remote asset or analytics, gated free functionality,
hidden lead capture, external-system mutation, or any provider, publication,
release, deployment, or announcement intent.
