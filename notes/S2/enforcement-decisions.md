# S2 enforcement decisions

Date: 2026-07-26

- Enforcement binds in a trusted host dispatcher after tool selection and
  before tool execution. The dispatcher, not the agent, decides whether a
  mutation handler runs.
- Every registered tool must be classified as `OBSERVE` or `MUTATE`;
  mutation tools must declare every path-bearing argument.
- The reference agent host owns a fixed write implementation in a separate
  process, so an agent can submit tool calls but cannot register or invoke an
  alternate write handler.
- Registered mutation calls are serialized. Each authorization is bound to the
  active lock and target topology is revalidated immediately before handler
  execution.
- Authorized mutation paths are rewritten to their canonical target before
  execution. Symlink escapes, hard-link aliases, repository escapes, and paths
  outside the active rules fail closed.
- The slice definition uses a closed schema and a SHA-256 definition hash.
  Mutation of the lock requires a correctly bound `DECISION` plus confirmation
  from a trusted principal adapter. An agent-supplied DECISION-shaped object is
  insufficient.
- Verification gates execute argv directly without a shell. Their environment
  is reduced to PATH, locale, and CI; output and duration are bounded.
- Gate working directories must resolve inside the repository.
- Completion is a kernel result derived from executed gates, not an agent
  assertion.
- Rotation state validates its complete stop-state structure, lock binding, and
  state hash before orientation. Hashing detects accidental or in-boundary
  mutation; authenticated third-party state remains S4 work.
- This reference is a tool-boundary guard, not an operating-system sandbox.
  The host must expose no alternate unguarded mutation tool.
- A separately privileged local process that races repository topology after
  final revalidation is outside the S2 threat model. Such deployments require
  OS isolation or an inode-pinned mutation adapter.
- Codex `PreToolUse` hooks are documented as incomplete enforcement boundaries,
  so SCOPA treats them only as defense in depth.
