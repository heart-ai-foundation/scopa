# S15 first live drift and bounded remediation

Date: 2026-07-29
Source commit:
`85b067dff5d0b419185f3e426bcf06f3d2131b0a`
Policy:
`ba238484a4e96f10157ac9916d4b8938571ee62e13e6ac0fcff4b8c68f8c2e31`

## First provider request

The campaign stopped after its first request. Process execution and cleanup
were successful, but normalization failed closed. The request consumed
USD 0.0557443 and eight turns.

The bounded init event reproduced two profile drifts:

- the approved `sonnet` alias resolved to `claude-sonnet-5`, consistent with
  the policy's explicit non-snapshot limitation; and
- `--json-schema` injected a seventh callable `StructuredOutput` tool, which
  violated the exact six-SCOPA-tool inventory.

No second request was sent before inspection. The process group was gone,
there was no orphan, output was not truncated, no resumable provider content
was observed, the disposable repository was deleted, and run-specific project
metadata was absent.

The first automatically generated public summary recorded cost zero and no
observed model because accounting projection occurred only after successful
normalization. It is retained with `superseded` in its filename. The separate
accounting correction binds that exact public/private evidence and records
the safe provider result fields.

## Narrow remediation

- remove the CLI `--json-schema` flag so the initialization inventory returns
  to exactly the six SCOPA MCP tools;
- retain the strict normalizer and its closed final-object validation as the
  completion authority;
- update only the observed model string to `claude-sonnet-5`; the requested
  alias and non-snapshot claim do not change;
- add deterministic rejection of a reintroduced `StructuredOutput` tool;
- recover provider cost/turn accounting from a bounded result event even when
  normalization fails; and
- install the same staged source-free candidate produced by the S12
  packager, rather than a source-package variant.

The policy permits six provider invocations and USD 1.20 total. The failed
drift request remains invocation one. The resumed runner initially had five
remaining slots and included USD 0.0557443 in aggregate budget accounting. It
did not increase authority or spend.

The resumed design had the denied scenario write the continuity fixture after
observing the escape denial, with cold restart and both repeat reads using
that repository. The next section records why that intended direct chain did
not become qualifying evidence.

## Second request: evidence serialization fault

Source commit:
`5c70f348f213c0060af677817105acc8c17bbe06`

The resumed command sent the denied-path request and Claude returned before
the runner failed at the normalized-evidence hash. The canonical encoder
reported `$.result.costUsd is not canonical JSON data`: provider costs are
fractional numbers, while SCOPA canonical JSON admits only safe integers.

The failure occurred before outcome assertions and before private/public
scenario evidence was persisted. The disposable repository, temporary root,
and run-specific provider metadata were nevertheless removed. With the raw
result gone, this request is not reconstructed as a pass. It is recorded as
`denied-runner-fault`, `runner-failed`, and
`inconclusive-lost-before-publication`; accounting conservatively reserves
USD 0.20 and 12 turns.

The narrow remediation:

- serializes evidence costs as canonical decimal strings;
- requires raw and normalized cost/turn accounting to agree;
- refuses all intent, journal, scenario, and campaign evidence collisions
  before provider traffic;
- writes a mode-`0600` intent before every provider call and a bounded
  recovery journal immediately after every provider return;
- removes those records only after semantic assertions and private/public
  publication succeed; and
- resumes with only the four genuinely unconsumed provider slots.

Because the denied repository was destroyed, the remaining cold/repeat chain
uses a deterministically reconstructed synthetic allowed file and is labeled
accordingly. The final campaign cannot satisfy direct denied-path or
denied-to-restart continuity acceptance without separate future authority for
a new campaign.
