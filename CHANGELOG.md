# Changelog

All notable user-facing changes are documented here. SCOPA uses Semantic
Versioning syntax; see [Versioning](docs/VERSIONING.md) for its pre-1.0
compatibility policy.

## Unreleased

## 0.5.0 — 2026-08-05

### Added

- Observe tracked, staged, and nonignored untracked Git working-tree changes,
  report tracked and untracked counts separately, and classify both against
  declared path and non-goal boundaries without exposing changed paths.
- Add a deterministic, accessible, script-free SVG Boundary Evidence badge
  that reports computed assurance and aggregate observation facts without a
  score, grade, certification, or safe-to-merge claim.
- Make marker-free repositories default to the portable project-local generic
  Agent Skill while retaining explicit Claude Code and Codex targets and
  failing closed on ambiguous recognized markers.
- Make the default pull-request summary explain missing evidence as unknown and
  provide the exact local command that produces a privacy-minimized card.

### Changed

- `begin`, `check`, `status`, and `doctor` now print concise human text when
  standard output is a terminal, and the unchanged canonical JSON envelope when
  redirected, piped, or run in CI. `--format human` and `--format json` select
  either explicitly. Scripts and automation are unaffected: no schema, field
  name, or exit code changed, and `--format json` output is byte-identical to
  `0.4.0` for the same input and state.
- `scopa doctor --format markdown` now emits the Markdown report directly
  instead of returning it as an escaped string inside the JSON envelope. Use
  `--format json` for the envelope, whose `result.content` carries the same
  report bound by `result.sourceSha256`. A pipeline that extracted the report
  with `jq -r '.result.content'` should now read the command output directly.
- `doctor --format` rejects an unsupported value with `--format must be human,
  json, or markdown`.
- Assistant detect, preview, install, and uninstall now render concise human
  output at a terminal and retain canonical JSON for explicit machine use or
  redirected output.
- The installed agent protocol now finishes with explicit JSON `check`, JSON
  `view`, and `map`, and requires aggregate Boundary Card findings in its final
  report.
- The zero-argument snapshot now ends with the executable, no-write
  `scopa assistant install --dry-run` continuation.

### Fixed

- Qualify human completion as `SATISFIED — WITH UNVERIFIED CHANGES` when a
  passing gate coexists with observable outside-path or declared-non-goal
  contacts. Canonical `completion.status` and gate-only `canStop` are unchanged.
- Return concise recovery guidance for malformed `begin` input at a terminal
  while preserving the canonical machine error and exit code.
- Identify explicit Boundary Card exports as caller-directed local writes
  outside the governed task mutation boundary, and observe later nonignored
  untracked exports without disclosing their paths.
- Correct singular and plural badge wording for non-goal contacts.

### Qualification

- Add permanent source and installed-package hostile tests for final
  `check`/`view` order, tracked and untracked contacts, privacy, output-mode
  parity, export semantics, and badge grammar.
- Qualify the exact local candidate through a second fresh-agent offline
  installed journey with zero product findings at every severity.

## 0.4.0 — 2026-08-04

- Add an offline installed-adoption qualifier covering under-30-second
  read-only first insight, zero-manual-file task bootstrap, reversible Claude
  Code, Codex, and generic Agent Skills integration, exact demo output,
  Boundary Card privacy and accessibility, and valid/missing PR reporting
  behind a runtime network tripwire.
- Make the demo proof digest reproducible across installation directories by
  removing its absolute source-path binding while retaining real gate
  execution and the historical S42 evidence unchanged.

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
- Add the one-command isolated demo proving real scope-denial,
  blocked-completion, and assurance-overclaim rejection paths with exact-tested
  output and verified cleanup.

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
