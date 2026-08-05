# S38 Runtime-Owned Task Bootstrap Decisions

- The public boundary is one exact `scopa.begin-request.v1` object: outcome,
  allowed paths, real direct argv gates, non-goals, slice identifier, and one
  named client profile. The runtime never derives these fields from prose.
- `generic`, `claude-code`, and `codex` are explicit bootstrap labels, not
  attestations. Bootstrap does not verify a client's launch flags, so all four
  native routes remain `uncontrolled` and every bootstrap map is honestly
  `partial`.
- Browser, credentials, deployment, external systems, provider use, and
  publication all default to `authority-required`. No external route is
  silently marked controlled or disabled.
- The complete request, enforcement definition, capability matrix, authority
  document, and lock binding validate before `.scopa/` is created. Existing
  conflicting state is preflighted before any control file is published.
- A valid clean transaction creates exactly config, slice lock, and validated
  begin state. The begin state is self-reconstructing: loading it regenerates
  every runtime-owned declaration and rejects any semantic drift.
- Gate commands are direct argv only. Known shell interpreters, shell operator
  tokens, command substitution, whitespace-shaped executables, escaping cwd,
  and invalid timeouts fail before mutation.
- A blocked gate is a valid runtime observation, not completion. CLI returns
  exit 4 with the actual map; MCP returns the identical result with
  `isError: true`.
- Bootstrap MCP is deliberately separate from the initialized six-tool host.
  It advertises only `scopa_begin`, avoiding operational capability claims
  before a repository has a validated lock.

No provider, experiment, network, package-installation, assistant-configuration,
publication, release, deployment, telemetry, account, or external-system
action occurred.
