# S47 implementation notes

## Decisions

- Preserve S44 terminal detection. Human readers at a terminal keep concise
  output; machine consumers select `--format json` explicitly.
- Treat marker-free detection as the generic Agent Skills baseline. This
  creates only `.agents/skills/scopa/SKILL.md` and the receipt. Detection with
  multiple known clients remains ambiguous and writes nothing.
- Enumerate `claude-code`, `codex`, and `generic` in every ambiguous selection
  error rather than requiring a documentation lookup.
- Put the raw single-URL agent instruction before protocol lineage in the
  README and remove the inaccurate development-build hedge from the shipped
  zero-argument snapshot.
- Correct every consumer defect identified by the 2026-08-05 S44 terminal
  audit, including the generated project-local skill.

## Validation surprise

The first accumulated S39 run failed because two historical tests asserted the
old command string without `--format json`. Direct execution showed the
installer behavior itself passed. The assertions were updated to require the
new deterministic machine-consumer contract, and the official S39 gate then
passed.

## Boundaries retained

- Ambiguous markers do not select a client.
- Generic installation does not attest that any unknown assistant discovers or
  obeys the skill.
- No user-global files, provider, network, release, publication, telemetry, or
  external system were used or changed.
- Human output, completion, assurance, capability, and authority semantics did
  not change.
