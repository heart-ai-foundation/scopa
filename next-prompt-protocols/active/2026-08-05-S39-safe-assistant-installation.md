# S39 — Safe Assistant Installation and Compressed Agent Entry

**Class:** `arc`
**Module:** `adoption-experience`
**Crosses:** [`adapter-host`, `distribution`]
**Advances contracts:** [`AX3`]
**Compound:** false
**Status:** active; provider-off implementation only

## Why this exists

S38 removed three policy documents, but developers still need to know how to
place SCOPA in their assistant's project-local workflow. `SCOPA_AGENT.md` also
describes the superseded manual document construction path. S39 turns the
runtime-owned begin transaction into one reversible installation action while
keeping client claims explicit and local.

## Next objective

Detect supported project-local Claude Code, Codex, and generic Agent Skills
surfaces; preview or install the appropriate SCOPA instruction and bootstrap
MCP entry without user-global mutation; provide exact idempotent uninstall;
and compress `SCOPA_AGENT.md` to the runtime-owned one-prompt journey. Refuse
collisions and unsupported assurance transfer.

## Descriptor rung check

Executable unlock: a clean project fixture must go from no SCOPA integration
to an assistant-discoverable project-local entry with one command, then return
to its exact prior state with one uninstall command.

## Anti-ceremony gate

- Classification: implementation.
- Executable change: detector, dry-run plan, no-replace installer, receipt-
  bound uninstall, CLI surface, assistant fixtures, and compressed agent entry.
- New uncertainty reduced: whether SCOPA can enter an existing coding workflow
  without global configuration, manual JSON, destructive overwrite, or
  client-assurance overclaim.
- Validation: Claude/Codex/generic detection, dry-run parity, install,
  idempotence, collisions, uninstall, and clean source-free journey.
- Consecutive metadata/decision slice check: pass.
- Status-report alternative: insufficient; project-local integration behavior
  does not yet exist.

## Productivity mix

- Runtime behavior: 50%
- Contract/test code: 40%
- Documentation and protocol compression: 10%

## Files in play

- `packages/adoption-experience/**`
- `packages/cli/**`
- `packages/adapter-host/**`
- `packages/integrations/**`
- `packages/release-readiness/**`
- `SCOPA_AGENT.md`
- `README.md`
- `docs/**`
- `fixtures/S39/**`
- `package.json`
- `notes/S39/**`
- `runs/S39/**`
- `evidence/S39/**`
- `next-prompt-protocols/**`

## Non-goals

- No user-global configuration change by default.
- No destructive overwrite, merge guess, implicit backup deletion, or install
  into an ambiguous client surface.
- No package-name or client-presence assumption without local evidence.
- No manual capability, authority, or slice-definition JSON requirement.
- No claim that installation disables native assistant routes or raises S38
  bootstrap assurance above `partial`.
- No provider call, package installation, network probe, telemetry, account,
  hosted service, publication, release, deployment, or external-system action.

## Evidence

Commit the slice trio under `notes/S39/`, `runs/S39/`, and `evidence/S39/`.
Evidence must bind detection inputs, exact dry-run/install plans, created-byte
digests, idempotent replay, collision no-write results, uninstall receipt,
before/after inventories, and the compressed agent-entry contract.

## Acceptance

- `npm run test:s39`
- `npm run test:s38`
- `npm run test:s31`
- `npm run test:s7`
- `npm run test:docs`
- `node next-prompt-protocols/tools/sync-protocols.mjs --check`
- Dry-run and apply produce the same canonical plan; apply creates only named
  project-local files with no-replace semantics and a hash-bound receipt.
- Repeated install is idempotent, a changed or pre-existing target fails before
  mutation, and uninstall removes only receipt-bound unchanged files.
- Claude Code, Codex, and generic fixtures receive explicit supported entries;
  unknown/ambiguous surfaces fail closed without assurance transfer.
- `SCOPA_AGENT.md` uses `scopa begin` as the primary path and contains no
  developer-authored policy-document workflow.

## Stop condition

Stop on home-directory mutation, destructive overwrite, config-merge
guesswork, unsupported-client claim, package-name invention, missing uninstall
provenance, manual JSON setup regression, assurance promotion, provider or
network intent, or unrelated runtime expansion.
