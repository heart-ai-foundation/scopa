# Changelog

All notable user-facing changes are documented here. SCOPA uses Semantic
Versioning syntax; see [Versioning](docs/VERSIONING.md) for its pre-1.0
compatibility policy.

## Unreleased

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

- Rebuild the repository landing page around a five-minute developer path and
  progressive disclosure.
- Add architecture, integration, slice-definition, troubleshooting, support,
  and community-contribution guidance.
- Publish the `scopa.slice-definition.v1` JSON Schema and test it against the
  runtime contract.
- Reconcile preview-era security, claims, governance, and threat-model text
  with the public `0.2.x` posture.

## 0.2.0 — 2026-08-03

- First public Apache-2.0 release.
- Add bounded scope and completion enforcement, continuity, signed evidence,
  CASE/UCO export, model-neutral MCP, and reviewed Claude Code/Codex profiles.
- Publish exact bundled-package qualification and adversarial release evidence.
