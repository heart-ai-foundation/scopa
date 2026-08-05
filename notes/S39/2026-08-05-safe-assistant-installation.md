# S39 Safe Assistant Installation Decisions

- Installation is a project-local Agent Skill, not a hidden user-global MCP
  mutation. Claude Code receives `.claude/skills/scopa/SKILL.md`; Codex and
  generic Agent Skills receive `.agents/skills/scopa/SKILL.md`.
- The skill is the smallest portable discovery surface. It delegates task
  setup to S38 `scopa begin` and does not embed an absolute package-cache path,
  assume a persistent `npx` cache, merge client configuration, or cause a
  future automatic network fetch.
- Auto-detection uses fixed marker names without reading their contents.
  Unknown or multi-client results are explicit and fail before mutation;
  `--client` is the caller's supported-surface declaration for clean projects.
- Dry-run and apply share the same canonical plan. The plan contains only the
  client, receipt path, target path, and exact target digest.
- Install uses no-replace publication, records only directories it created,
  rolls back its own new bytes on publication failure, and treats a matching
  receipt plus matching bytes as idempotent.
- Uninstall prevalidates every target and removes only receipt-bound unchanged
  files. Receipt directory entries are restricted to ancestors of the one
  target and receipt, preventing a forged receipt from deleting unrelated
  empty directories.
- `SCOPA_AGENT.md` is now 115 lines and uses the single runtime-owned begin
  request. The manual definition/matrix/authority workflow remains documented
  only as an advanced interface, not as the one-prompt path; its legacy init
  command appears only as an explicit compatibility warning.

No home-directory configuration, provider, experiment, network probe, package
installation, telemetry, account, publication, release, deployment, hosted
service, or external system was used or changed.
