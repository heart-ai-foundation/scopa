# S16-v3 client-store entry-audit remediation

## Reproduced defect

The non-replayable S16-v3 campaign consumed one denied-scenario provider call
and then stopped during post-run client-store custody. The scenario itself
completed with expected polarity and cleanup, but Codex CLI `0.146.0` created
more than the runner's fixed 64-entry inventory ceiling.

The stopped campaign, its closed policy, and its private evidence remain
immutable. This remediation does not authorize another provider call.

## Narrow correction

Client-store inventory traversal now:

- uses streaming directory iteration instead of an unbounded directory read;
- retains deterministic path ordering;
- permits at most 4,096 total entries;
- permits deterministic tests to lower, but never raise, that ceiling;
- continues to reject symlinks and special files;
- continues to content-hash files through 2 MiB;
- continues to reject oversized, content-ambiguous baseline files before
  provider traffic; and
- continues to reject every unexpected post-run addition, removal, or change.

The focused regression proves that a 256-entry current-client-shaped inventory
is auditable, a lowered 64-entry ceiling fails closed, and callers cannot
raise the production ceiling.

## Separate queued input

The RC1 resource-bound evidence note is retained unchanged at
`evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md` and
queued as deterministic S17 input. Its dual-channel evidence work is not part
of this S16 correction. The pilot is not replayed or scored, and no provider
qualification is authorized.
