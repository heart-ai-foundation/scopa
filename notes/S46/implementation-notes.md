# S46 implementation notes

- Used `git diff --name-only -z HEAD` with direct argv, a five-second timeout,
  a one-MiB output bound, and a 4,096-path bound. Untracked files are not
  traversed or reported.
- Reused the enforcement path-rule matcher so observation and dispatcher scope
  interpret exact and `/**` rules consistently.
- Kept raw observed paths in the local observation object only. The Boundary
  Card receives three counts and a fixed non-enforcement basis.
- Kept legacy `scopa.boundary-card.v1` objects valid by making `observed`
  optional. Existing completion, assurance, scope, surface, and source-map
  fields are unchanged.
- Qualified a satisfied headline only when an outside-path or recognized
  non-goal contact exists. Inside-path edits remain observed without changing
  the headline.
- Non-goal recognition is deliberately conservative: literal path/basename
  mentions plus a closed dependency-manifest/lockfile class. It reports
  contact, never violation or attribution.
- The first accumulated S2 invocation reported a failure in the historical
  descendant-process test. That test passed immediately when run directly and
  the complete official S2 command passed on rerun; the chronology is retained
  in the run record.
