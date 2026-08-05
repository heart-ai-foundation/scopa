# S37 Instant Boundary Insight Decisions

- Zero arguments now mean “inspect this repository,” while `--help` remains the
  explicit documentation route.
- The default surface has exactly three findings: two bounded repository
  observations and one explicit agent-authority unknown.
- Authority-sensitive markers outrank completion candidates because they expose
  the most consequential visible workflow surface; no private paths are shown.
- Human rendering is a pure projection of the validated canonical diagnostic.
  `scopa doctor` and its JSON/Markdown contracts were not changed.
- CLI orchestration moved into an importable `runCli` function so the behavior
  can be tested without relying on shell capture or weakening the installed
  entry point.
- The next action remains the existing `SCOPA_AGENT.md` path until S38 adds the
  runtime-owned task bootstrap.

Non-goals held: no initialization, inferred policy, gate execution, repository
write, network probe, provider call, telemetry, score, or assurance promotion.

