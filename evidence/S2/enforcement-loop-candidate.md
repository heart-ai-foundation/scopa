# S2 enforcement-loop evidence

Status: accepted by requested independent outside-model review

The live probe establishes all three active boundaries:

- Scope: an out-of-slice write is rejected before its mutation handler runs,
  the file remains absent, and the denial carries allowed paths plus the
  amendment route.
- Completion: a real command exits 9 and an asserted completion is refused
  with a machine-checkable failed-gate state.
- Continuity: a passing gate state is saved atomically, hash-verified after a
  cold reload, and returned through the compact orientation surface.

Focused adversarial tests cover:

- a separate reference-host process denying an out-of-scope agent tool call;
- mutation serialization inside that trusted host;
- topology change between authorization and revalidation;
- symlink repository escape;
- hard-link alias mutation;
- fabricated DECISION without a trusted principal adapter;
- slice-lock hash tampering;
- gate working-directory escape;
- gate timeout;
- rotation-state tampering; and
- mutation-tool execution ordering.

The included reference host owns a fixed mutation implementation and makes the
dispatcher its exclusive mutation path. Enforcement is therefore independent
of the agent's cooperation inside that host.

The threat claim is deliberately narrow. Agent-originated mutations within a
host process are serialized and topology is revalidated immediately before
execution. A separately privileged local process racing the filesystem after
revalidation is outside S2's threat model and requires OS isolation or an
inode-pinned adapter. Codex hooks are defense in depth, not this conformance
boundary.

Independent verdict: `gpt-5.6-terra` returned `ACCEPT` after rerunning 13/13
focused tests and 54/54 release tests and adversarially inspecting both prior
blockers.
