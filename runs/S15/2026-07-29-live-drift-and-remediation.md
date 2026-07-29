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
drift request remains invocation one. The resumed runner therefore executes
only the five remaining scenarios and includes USD 0.0557443 in aggregate
budget accounting. It does not increase authority or spend.

The denied scenario now writes the continuity fixture after observing the
escape denial. Cold restart and both repeat reads use that repository, so the
five remaining requests still cover contained mutation, scope denial,
false-green refusal, fresh-process recovery, and repeat-session residue.
