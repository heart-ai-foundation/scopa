# Changelog

All notable user-facing changes are documented here. SCOPA uses Semantic
Versioning syntax; see [Versioning](docs/VERSIONING.md) for its pre-1.0
compatibility policy.

## Unreleased

### Added

- Make zero-argument `scopa` return an immediate, read-only repository
  boundary snapshot with at most three findings and one next action.
- Add the runtime-owned `scopa begin` and bootstrap-only `scopa_begin` MCP
  transaction for explicit task boundaries, closed authority defaults,
  conservative client profiles, real gate results, and a terminal Workflow
  Boundary Map without caller-authored policy files.
- Add reversible project-local Claude Code, Codex, and generic Agent Skills
  installation with exact dry-run plans, collision refusal, idempotence, and
  receipt-bound uninstall.
- Add the privacy-minimized Boundary Card with deterministic terminal, JSON,
  and accessible standalone script-free HTML rendering and no-replace export.
- Add a least-privilege provider-off GitHub Action that validates optional
  Boundary Cards into sanitized job summaries, reports missing evidence as
  unknown, and keeps PR commenting explicitly disabled by default.

### Changed

- Compress `SCOPA_AGENT.md` around the runtime-owned `begin` journey and remove
  the three-document policy-authoring path from the one-prompt workflow.

## 0.3.0 — 2026-08-03

### Added

- Add the self-contained `SCOPA_AGENT.md` point-and-go workflow: give a coding
  agent one file and one task without preinstalling SCOPA or authoring policy
  JSON.
- Add deterministic Workflow Boundary Maps with explicit controlled,
  uncontrolled, unknown, disabled, and authority-required surfaces.
- Add sanitized offline boundary assessments and baseline comparison.
- Add the read-only Boundary Doctor diagnosis, privacy-minimized Markdown
  reports, and atomic `doctor --lock` conversion.

### Security

- Update the transitive `fast-uri` dependency from `3.1.4` to patched `3.1.5`
  for GHSA-7p8r-x3mc-p8w7 / CVE-2026-18446.

### Fixed

- Launch the packaged MCP consumer fixture through the current Node runtime so
  npm `.bin` symlink layouts cannot cause the child process to exit before
  serving stdio.
- Exercise the real `scopa-mcp` subprocess in source-free consumer
  qualification instead of substituting the in-process bridge.

### Documentation

- Rebuild the repository landing page around the one-prompt developer path and
  progressive disclosure.
- Add architecture, integration, slice-definition, troubleshooting, support,
  and community-contribution guidance.
- Publish the `scopa.slice-definition.v1` JSON Schema and test it against the
  runtime contract.
- Reconcile preview-era security, claims, governance, and threat-model text
  with the public `0.2.x` posture.
- Clearly distinguish historical `0.2.0` evidence from the current package
  identity and make release schemas reusable across stable versions.

## 0.2.0 — 2026-08-03

- First public Apache-2.0 release.
- Add bounded scope and completion enforcement, continuity, signed evidence,
  CASE/UCO export, model-neutral MCP, and reviewed Claude Code/Codex profiles.
- Publish exact bundled-package qualification and adversarial release evidence.
