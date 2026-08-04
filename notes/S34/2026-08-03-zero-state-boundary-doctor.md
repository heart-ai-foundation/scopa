# S34 zero-state boundary doctor decisions

- The doctor is a distinct zero-state diagnostic, not a workflow boundary map.
  A map requires an actual lock, stop state, capability matrix, and authority
  declaration; inventing them would create false assurance.
- Host filesystem and process observations are labeled `host-process`. They do
  not establish what a coding agent can do.
- Marker absence means `not-detected` only after a complete bounded scan. When
  the scan truncates, absent markers become `unknown`.
- Symlinks are counted and never followed. Large/generated directories are
  explicitly excluded and reported by the diagnostic limits.
- Only bounded `package.json` structure is read. Script bodies, other file
  contents, environment names or values, and credential values are not emitted.
- Completion candidates are fixed invocations derived from a closed script-name
  allowlist; discovery never executes them.
