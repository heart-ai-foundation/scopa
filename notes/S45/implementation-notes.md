# S45 implementation notes

- Reused the existing validated diagnostic object; no new traversal or
  evidence computation was added.
- Added a dedicated local renderer rather than expanding the zero-argument
  snapshot or the minimized Markdown renderer.
- Kept the local result at 20 nonblank lines even in the marker-rich fixture by
  giving every detected/unknown indicator one deterministic line.
- Rendered repository root as `(repository root)` while retaining bounded
  repository-relative paths for actual markers.
- Kept `not-detected` explicitly qualified as “marker not observed”; truncated
  scans state that missing markers remain unknown.
- Corrected activation hygiene: S45 is now bound by an active protocol and the
  Phase 14 evidence roots are present in the manifest/lock.
- Corrected future queue wording so S50 qualifies installed candidate bytes
  without requiring a release and S49 performs no GitHub-setting mutation.
