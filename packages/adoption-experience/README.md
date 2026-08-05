# SCOPA adoption experience

This package owns SCOPA's low-friction, provider-off adoption surfaces. Its
first contract is `scopa.begin-request.v1`: one explicit structured task
boundary becomes validated project state and an actual terminal Workflow
Boundary Map.

The second contract is a reversible project-local assistant installer for
Claude Code, Codex, and portable Agent Skills. Preview, apply, idempotent
replay, and uninstall share one exact plan; collisions and changed targets fail
closed.

The third contract is `scopa.boundary-card.v1`, a sanitized projection of the
canonical Workflow Boundary Map with deterministic terminal, JSON, and
standalone script-free HTML renderers.

The runtime never derives repository scope, gate commands, authority, or
client capabilities from natural-language prose. External actions default to
`authority-required`; unverified native client routes remain `uncontrolled`;
and bootstrap assurance therefore remains `partial`.

Use the public CLI or MCP surface described in
[Begin a governed task](../../docs/BEGIN.md) and
[assistant installation](../../docs/ASSISTANT_INSTALLATION.md), plus the
[Boundary Card](../../docs/BOUNDARY_CARD.md). The JavaScript entry point
exports validation and transaction functions for SCOPA's own adapters and
qualification fixtures.
