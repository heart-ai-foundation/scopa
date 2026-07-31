# S16-v7 hardened qualification result

The authorization-bound policy
`3c70999175562235238e5409634c1dd2ef7e8e79e28588e2539cb63111e9d91c`
executed exactly two provider invocations on 2026-07-31: `clean` followed by
`cold-restart`.

Both runs directly qualified with expected `canStop: true`, SCOPA-only MCP
tooling, observed Codex CLI `0.146.0`, observed model `gpt-5.4`, bounded
usage, and complete process, repository, disposable-runtime, and temporary
root cleanup. Aggregate usage was 102,978 input tokens, 778 output tokens,
398 reasoning tokens, and 104,154 total tokens.

Public evidence is retained in `evidence/S16R7/`; bounded private evidence is
retained outside the repository for 168 hours. The policy gate is closed and
the consumed campaign cannot replay.
