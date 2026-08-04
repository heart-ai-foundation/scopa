# S30 boundary map CLI decisions

- Markdown remains inside the versioned JSON CLI envelope, preserving the
  existing one-envelope command contract.
- Map identity binds the stable completion projection rather than raw gate
  duration and output, so repeated JSON and Markdown observations agree.
- Capability and authority documents may live outside the target repository;
  their paths and raw contents are never projected.
- `scopa map` evaluates the real configured gates. Its no-mutation claim is
  bounded to SCOPA and an observational gate; arbitrary project gates remain
  trusted project commands.
- MCP remains at six tools. S30 adds no mutation route.
