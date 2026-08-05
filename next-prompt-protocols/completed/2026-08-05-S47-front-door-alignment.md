# S47 — Front-Door Alignment

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** [`workflow-boundary-map`]
**Advances contracts:** [`OA4`]
**Compound:** true — paired-diff (the installer fallback and documented agent-output contract are two first-contact consumers of the same front-door promise)
**Status:** completed; OA4 satisfied; provider-off implementation only

## Why this exists

The public generic assistant path is documented as the portable baseline, but
automatic installation currently fails in a marker-free repository. The error
does not name the accepted client values. The README also hedges shipped
behavior and places protocol lineage before the zero-install agent journey.

The S44 consumer audit found a related correctness defect: the flagship agent
entry expects JSON fields from `begin` and `check` without selecting JSON. An
agent harness that allocates a terminal instead receives intentionally concise
human text. The one-prompt journey must not depend on that invisible harness
property.

## Next objective

Make `assistant install` select the generic project-local client only when
auto-detection is genuinely unknown, retain fail-closed behavior for ambiguous
known markers, and make every selection error enumerate valid clients. Align
the README and first-run documents around what SCOPA does before protocol
lineage, promote the single-URL agent entry, remove shipped-feature hedging,
and pin the agent entry's machine-consumed commands to `--format json`.

## Descriptor rung check

Executable unlock: in a marker-free repository, the first three documented
adoption commands succeed, and the exact `begin`/`check` command forms consumed
by an agent remain parseable JSON under both PTY and piped harnesses.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: unknown-to-generic selection, complete selection errors,
  consumer-bound JSON commands, marker-free and PTY regression tests, and
  exact front-door documentation checks.
- New uncertainty reduced: whether a new adopter or coding agent can follow the
  first published path without hidden repository markers or terminal behavior.
- Validation: `npm run test:s47`, S39/S43/S44 regressions, docs, protocol, and
  diff hygiene.
- Consecutive metadata/decision slice check: pass; S46 changed runtime
  observation and presentation.
- Status-report alternative: insufficient because two first-contact commands
  currently fail or become harness-dependent at runtime.

## Productivity mix

- Runtime behavior: 35%
- Contract/test code: 40%
- Metadata/docs: 25%

## Sub-slices

| # | Change | Files | Non-goals | Why bundled |
| --- | --- | --- | --- | --- |
| 1a | Marker-free generic fallback and complete selection errors | `packages/adoption-experience/**`, `packages/cli/**` | No ambiguous-client inference or user-global mutation | The docs advertise generic as the baseline for the same installation path |
| 1b | Deterministic agent/output and front-door documentation contract | `SCOPA_AGENT.md`, `README.md`, `docs/**`, CLI tests | No removal of human TTY output or capability-limit language | The agent entry is the primary consumer of the selected runtime path |

## Files in play

- `packages/adoption-experience/**`
- `packages/cli/**`
- `SCOPA_AGENT.md`
- `README.md`
- `docs/ASSISTANT_INSTALLATION.md`
- `docs/BEGIN.md`
- `docs/QUICKSTART.md`
- `docs/TROUBLESHOOTING.md`
- `docs/MANUAL_SETUP.md`
- `package.json`
- `fixtures/S47/**`
- `notes/S47/**`
- `runs/S47/**`
- `evidence/S47/**`
- `next-prompt-protocols/**`

## Non-goals

- No selection between multiple known assistant surfaces and no claim that the
  generic skill is automatically discovered by every coding agent.
- No change to assurance, capability, authority, completion, or `canStop`
  semantics and no transfer of named-client qualification to generic clients.
- No removal of terminal-aware human output; machine consumers select JSON
  explicitly.
- No dependency installation, user-global assistant mutation, destructive
  overwrite, provider/network call, telemetry, release, publication, hosted
  action, or external-system mutation.
- No protocol-lineage deletion; lineage moves after the functional value and
  remains accurately documented.

## Evidence

Commit the slice trio under `notes/S47/`, `runs/S47/`, and `evidence/S47/`.
Retain the marker-free/ambiguous installer polarity, complete error text, exact
agent-command JSON regression, and documentation front-door audit.

## Acceptance

- `npm run test:s47`
- `npm run test:s39`
- `npm run test:s43`
- `npm run test:s44`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Marker-free auto-detection selects only the generic project-local target.
- Ambiguous known markers still fail closed and name `claude-code`, `codex`,
  and `generic` as explicit choices.
- The exact first three copied adoption commands have executable coverage and
  succeed without a pre-existing assistant marker.
- `SCOPA_AGENT.md` selects JSON for every command whose fields it consumes,
  and its exact command shapes parse as JSON under PTY and piped harnesses.
- README and first-run docs lead with function and the single-URL agent entry,
  describe shipped first-run behavior without hedging, and accurately explain
  terminal versus redirected output.

## Stop condition

Stop on ambiguous-client inference, unsupported-client assurance transfer,
user-global mutation, overwrite, human/JSON semantic drift, a documented
machine consumer without explicit JSON, capability-limit removal, claim
inflation, or any provider, network, publication, release, hosted, telemetry,
or external-system intent.
