# S44 — Human-First Command Output

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** [`boundary-doctor`, `legibility`]
**Advances contracts:** [`OA1`]
**Compound:** false
**Status:** active; provider-off implementation only

## Why this exists

S37 made zero-argument `scopa` human-first, but every other command a
first-time reader copies from the documentation still returns a canonical JSON
envelope. Three of these are on the documented adoption path:

- `scopa doctor --format markdown` is the README's featured zero-install `npx`
  command. It returns the rendered Markdown as a newline-escaped string inside
  a JSON envelope, so the front door for an uncommitted reader emits unreadable
  output.
- `scopa begin` is the flagship one-call task boundary. It emits roughly 150
  lines of hashes and surface arrays at the moment the developer most needs to
  understand what SCOPA just established.
- `scopa check` and `scopa status` are the loop a developer runs repeatedly. Both
  return envelopes whose completion result must be extracted by eye.

The machine contract is correct and must not regress. The defect is that human
readers have no rendered path at all, and that `--format markdown` does not
honor its own name.

## Next objective

Render `doctor`, `begin`, `check`, and `status` as concise human text by default
when standard output is a terminal-facing invocation, and make `--format
markdown` emit Markdown rather than JSON-wrapped Markdown. Preserve every
existing canonical envelope, schema, and exit code behind explicit
`--format json`.

## Descriptor rung check

Executable unlock: a first-time reader running the exact commands published in
`README.md` obtains readable output for each one, while an automation consumer
requesting `--format json` receives the unchanged canonical envelope.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: a shared human renderer for four commands, format
  resolution, `--format markdown` unwrapping, and exact-output fixtures.
- New uncertainty reduced: whether SCOPA can be readable at first contact
  without weakening the machine contract that its evidence claims depend on.
- Validation: focused render, parity, exit-code, and docs exact-output tests.
- Consecutive metadata/decision slice check: pass.
- Status-report alternative: insufficient; the missing behavior is executable.

## Productivity mix

- Runtime behavior: 55%
- Contract/test code: 35%
- Metadata/docs: 10%

## Files in play

- `packages/cli/**`
- `packages/adoption-experience/**`
- `packages/boundary-doctor/src/render.js`
- `fixtures/S44/**`
- `package.json`
- `README.md`
- `docs/QUICKSTART.md`
- `docs/BOUNDARY_DOCTOR.md`
- `docs/BEGIN.md`
- `docs/TROUBLESHOOTING.md`
- `notes/S44/**`
- `runs/S44/**`
- `evidence/S44/**`
- `next-prompt-protocols/**`

## Non-goals

- No change to any canonical schema, digest, exit code, or JSON field name.
- No change to gate execution, assurance computation, authority defaults, lock
  creation, or completion semantics.
- No new observation, finding, or diagnostic content; S44 renders what already
  exists. Naming currently-withheld local detail is S45.
- No relaxation of shareable-projection privacy bounds; `view` and the
  pull-request surface are untouched.
- No risk, safety, security, compliance, readiness, or certification score.
- No network probe, provider call, telemetry, account, lead capture,
  publication, release, or external-system action.

## Evidence

Commit the slice trio under `notes/S44/`, `runs/S44/`, and `evidence/S44/`.
Evidence must include exact default and `--format json` output for each of the
four commands across satisfied, blocked, and error states; a byte-comparison
proving the JSON envelope is unchanged from 0.4.0; and exit-code tables.

## Acceptance

- `npm run test:s44`
- `npm run test:s37`
- `npm run test:s34`
- `npm run test:s36`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- For each of `doctor`, `begin`, `check`, `status`: `--format json` output is
  byte-identical to the 0.4.0 envelope for the same input and state.
- `doctor --format markdown` emits Markdown as its own output with no JSON
  envelope and no escaped newline sequences.
- Exit codes are unchanged, including `check` returning 4 while completion gates
  are blocked and `status` returning 0 while observing blocked state.
- Default human output for each command is at most 20 nonblank lines, states the
  actual completion and assurance result, and never presents an unknown or
  absent surface favorably.
- Every human statement is traceable to a field in the corresponding canonical
  envelope; the renderer introduces no claim of its own.
- Every command example in `README.md` and `docs/**` matches actual output under
  the docs exact-output corpus.

## Stop condition

Stop on canonical envelope drift, schema or field rename, exit-code change,
semantic divergence between the human and JSON renders, assurance or completion
recomputation, favorable absence language, privacy regression in any shareable
projection, or any provider, network, publication, or release intent.
