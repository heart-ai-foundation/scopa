# S52 implementation notes

## Reproduced first-time failures

A fresh agent packed and installed the Phase 14 candidate offline, used only
public-facing guidance, and found one release-blocking journey defect: the
documented finish loop ran `check` and `map` without inspecting `view`. That
allowed a completion report to omit tracked boundary contacts already visible
to SCOPA. The same pass reproduced invisible untracked files, machine-first
assistant setup and malformed-request recovery, a cold next action that was not
self-contained, ambiguous evidence-export write semantics, and incorrect badge
grammar for one contact.

## Implemented behavior

- The root and generated assistant protocols require `check --format json`,
  then `view --format json`, then `map`. A clean report is prohibited when the
  card reports an outside-path or declared-non-goal contact.
- Current Git observation separately counts tracked and nonignored untracked
  files, excludes runtime-owned `.scopa/` state, classifies both against the
  declared paths and non-goals, and keeps legacy cards valid.
- Human `check` performs a read-only observation and qualifies a satisfied
  headline when observable contacts remain. Canonical JSON and gate-only
  `canStop` semantics are unchanged.
- Assistant preview/install/uninstall and malformed `begin` recovery are human
  at a terminal and canonical JSON when piped or explicitly requested.
- Cold output supplies one exact local continuation.
- Explicit evidence exports identify themselves as local writes outside the
  locked task mutation boundary. A later card observes an untracked export
  without disclosing its path.
- Badge contact nouns are deterministic and grammatically correct.

## Regression design

`test:s52` exercises the cold continuation, human/machine rendering boundary,
malformed recovery, tracked-plus-untracked observation, privacy, export
semantics, and subsequent observation. The installed S50 hostile test now
asserts the final agent order and the same behavior from packed bytes.

## Qualification result

- Focused S39 and S44-S50 gates: pass.
- S52 gate: five tests passed.
- Documentation gate: 38 documents passed.
- Full provider-off root gate: exit 0; core release gate discovered 376 tests,
  with 375 passed, one intentional skip, and zero failures.
- Protocol sync/check and `git diff --check`: pass.
- Packed candidate: 2,034,775 bytes, 1,146 entries, SHA-256
  `28f0229dd87347cc4409e8c2d0402fb4541ebc663bcc0a17cd8f2363beaa0c26`.

No provider/model call, network dependency, experiment, customer repository,
release, publication, tag, merge, announcement, repository setting, or
external-system action occurred.
