# S40 — Local Visual Boundary Map

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** [`workflow-boundary-map`, `distribution`]
**Advances contracts:** [`AX4`]
**Compound:** false
**Status:** completed; AX4 satisfied; provider-off implementation only

## Why this exists

S37-S39 make first insight and governed bootstrap simple, but the terminal map
is still a machine-oriented object. Developers need one legible artifact they
can understand and share without leaking repository topology or turning
unknown evidence into favorable decoration.

## Next objective

Project the canonical Workflow Boundary Map into one privacy-minimized
Boundary Card, render it as compact terminal text and accessible standalone
local HTML, and optionally export exact bytes with no-replace semantics. All
formats must preserve completion and control polarity while omitting paths,
non-goal prose, prompts, raw gate output, capability evidence, and secrets.

## Descriptor rung check

Executable unlock: one initialized repository command must produce a local,
human-legible visual whose counts, completion, assurance, and source digest
reproduce exactly from the canonical map.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: sanitized card contract, terminal renderer, script-free
  HTML renderer, CLI view/export, and hostile privacy/accessibility corpus.
- New uncertainty reduced: whether SCOPA's abstract boundary can become
  immediately understandable and shareable without semantic or privacy drift.
- Validation: JSON/terminal/HTML parity, deterministic bytes, no-replace
  export, accessibility landmarks, no remote/script assets, and hostile input.
- Consecutive metadata/decision slice check: pass.
- Status-report alternative: insufficient; no local visual artifact exists.

## Productivity mix

- Runtime behavior: 45%
- Contract/test code: 45%
- Documentation and examples: 10%

## Files in play

- `packages/adoption-experience/**`
- `packages/cli/**`
- `packages/workflow-boundary-map/**`
- `schemas/**`
- `docs/**`
- `README.md`
- `fixtures/S40/**`
- `package.json`
- `notes/S40/**`
- `runs/S40/**`
- `evidence/S40/**`
- `next-prompt-protocols/**`

## Non-goals

- No remote asset, JavaScript, telemetry, analytics, hosted viewer, account,
  network probe, browser launch, or automatic publication.
- No raw path, non-goal, prompt, gate output, capability evidence, credential,
  environment value, private root, or secret in the card or rendered bytes.
- No favorable color, score, badge, certification, safety, security,
  compliance, or readiness claim for unknown or uncontrolled surfaces.
- No alternate source of boundary truth and no format-specific semantics.
- No overwrite of an existing export and no write from the default terminal
  view.
- No provider, experiment, release, deployment, customer, or external-system
  action.

## Evidence

Commit the slice trio under `notes/S40/`, `runs/S40/`, and `evidence/S40/`.
Evidence must bind the canonical map, sanitized card, terminal bytes, HTML
bytes, semantic parity report, privacy corpus, accessibility checks, export
mode/no-replace behavior, and before/after inventories.

## Acceptance

- `npm run test:s40`
- `npm run test:s39`
- `npm run test:s30`
- `npm run test:s33`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Terminal, HTML, and JSON reproduce one validated card and bind the same
  canonical map digest with no private source fields.
- HTML is standalone, script-free, keyboard/reader-legible, responsive, and
  contains no remote URL or executable content.
- Default view is read-only; explicit export is repository-contained,
  no-replace, deterministic, and byte-identical to the corresponding renderer.
- Unknown and uncontrolled surfaces remain visually and textually adverse or
  neutral; no favorable aggregate score exists.

## Stop condition

Stop on semantic drift, source-map bypass, private topology, prompt or secret
disclosure, remote asset, executable HTML, favorable unknown, accessibility
failure, implicit write, overwrite, browser launch, provider/network intent,
or unrelated workflow expansion.
