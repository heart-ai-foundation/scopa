---
title: "Macro Delta: 2026-07-27: SCOPA Developer Preview"
entity: heart
type: compliance
tags:
  - compliance
  - forensic-methdologies
  - agentic-workflow-forensics
  - scopa
  - macro-delta
---

# Macro Delta: 2026-07-27: SCOPA Developer Preview

**Document Classification:** Developer Preview Build Plan (Pattern A)
**Format:** Macro Delta, per Next-Prompt Protocol v2.4
**Project:** SCOPA (Scope, Completion, and Operational Persistence for Agents)
**Publisher:** Heart AI Foundation
**Governs:** Local packaging, developer CLI, shared agent bridge, Claude Code
and Codex integrations, and pre-publication release readiness
**Predecessor:** `2026-07-26-scopa-kernel-build.md`
**Baseline:** `9191256` on private `heart-ai-foundation/scopa`
**Principal authorization:** 2026-07-27
**Scaffold root:** `next-prompt-protocols/`
**Date:** July 27, 2026

---

## Why this exists

S0-S5 proved the kernel, enforcement loop, legibility layer, signed evidence
packet, and CASE/UCO export. The remaining uncertainty is adoption: whether a
developer can install SCOPA in an unfamiliar repository and place a real
coding agent behind its enforcement boundary without hidden mutation paths or
inflated assurance claims.

This Macro Delta converts that uncertainty into an ordered developer-preview
queue. It adds Claude Code as an explicit integration alongside Codex. Claude
is exercised first because its headless surface supports non-interactive
execution, strict MCP configuration, explicit tool controls, and structured
output. Codex follows through its own non-interactive execution surface and a
cross-agent parity gate.

## Governing decisions

- Next-Prompt Protocol v2.4 remains the build operating system.
- SCOPA remains the entity-neutral executable runtime.
- The free kernel, verifier, conformance fixtures, and supported adapters
  remain independently useful without consultation services.
- Integrations are separate assurance targets. Passing on Claude does not
  imply passing on Codex, or vice versa.
- An adapter is not called conforming merely because hooks or prompts request
  cooperation. Its capability and bypass matrix must show that every exposed
  mutation path is mediated by the trusted SCOPA host.
- Local packaging and preview validation do not authorize npm publication,
  repository visibility changes, a public release, or a trademark claim.
- The current scoped package names and `scopa` CLI are working implementation
  identifiers until the principal settles release naming and licensing.

## Blocks

### Block C: Developer Distribution

| Field | Value |
|---|---|
| Block goal | Install SCOPA from a local package artifact into a clean repository and operate it through one coherent CLI |
| Modules | `distribution`, `conformance` |
| Slice count | 1 (S6) |
| Stop boundary | Stop if installation depends on monorepo-relative paths, mutates existing project files without consent, or reports success through prose instead of exit state |
| Production policy | Local tarball only. Package remains private. No registry publication. |
| Evidence policy | `arc` class; notes, runs, and reviewer-facing evidence required |

### Block D: Agent Integrations

| Field | Value |
|---|---|
| Block goal | Put Claude Code and Codex behind the same trusted SCOPA mutation boundary and measure each adapter honestly |
| Modules | `adapter-host`, `claude-adapter`, `codex-adapter`, `enforcement`, `agent-surface` |
| Slice count | 3 (S7, S8, S9) |
| Stop boundary | Stop if an agent retains an unmediated write, shell, patch, MCP, plugin, hook, or subprocess path while the adapter claims full enforcement |
| Production policy | Headless fixture repositories only. No customer repositories and no unattended production enablement. |
| Evidence policy | `arc` class; raw structured transcripts, blocked-write proof, false-green proof, capability/bypass matrix, and outside review |

### Block E: Developer-Preview Candidate

| Field | Value |
|---|---|
| Block goal | Prove that an unfamiliar consumer can install, run, understand, and independently verify SCOPA without repository-local knowledge |
| Modules | `release-readiness`, `distribution`, `adapter-host`, `conformance` |
| Slice count | 1 (S10) |
| Stop boundary | Stop if the candidate lacks a threat model, security route, machine-readable schemas, known-failing fixtures, or honest adapter assurance labels |
| Production policy | Candidate assembly and external evaluation only. Public release remains a separate principal action. |
| Evidence policy | `arc` class; reproducible consumer run plus independent reviewer report |

## Module map and exit contracts

| Module | Exit contracts |
|---|---|
| `distribution` | DS1 local package installs in a clean repository without monorepo-relative resolution; DS2 `scopa init/status/check/run/verify` expose stable machine-readable results and exit codes; DS3 initialization is idempotent and refuses destructive overwrite |
| `adapter-host` | AH1 a model-neutral bridge exposes only SCOPA-mediated mutations; AH2 the bridge captures request, model/CLI identity, structured transcript, effects, and terminal state; AH3 a machine-readable capability/bypass matrix prevents unsupported conformance claims |
| `claude-adapter` | CL1 headless Claude runs with an explicit, reproducible tool and MCP surface; CL2 live fixtures prove blocked scope, refused false-green completion, and cold resume; CL3 the adapter publishes evidence-derived assurance and known bypasses |
| `codex-adapter` | CX1 headless Codex runs with an explicit, reproducible tool, sandbox, hook, and MCP surface; CX2 live fixtures prove blocked scope, refused false-green completion, and cold resume; CX3 Codex and Claude satisfy the same behavior contract or report an explicit parity gap |
| `release-readiness` | RC1 an unfamiliar consumer completes a local-artifact quickstart in a fresh repository; RC2 threat model, security route, schemas, fixtures, versioning, governance, and licensing state are explicit; RC3 an independent reviewer can reproduce claims and distinguish verified behavior from non-claims |

Completion is satisfied exit contracts over declared exit contracts. It
measures progress through this developer-preview arc, not permission to
publish.

## Slice queue

### S6: Installable developer surface

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `distribution` |
| Crosses | `conformance` |
| Advances contracts | DS1, DS2, DS3 |
| Objective | Create a locally packable SCOPA distribution with one CLI for initialization, orientation, enforcement checks, execution, and verification |
| Purpose | The runtime is not yet a developer tool if it only works from its own monorepo |
| Value gate | A clean fixture repository installs the local tarball and completes `scopa init`, `status`, `check`, and `verify` without importing source from the SCOPA checkout |
| Validation gate | Fresh temporary repository, packed-artifact install, idempotent initialization, overwrite refusal, stable JSON/exit-code assertions, and accumulated release gate |
| Likely artifacts | `packages/cli`, package allowlist, config/schema, local install harness, fixture repository, CLI documentation |
| Dependencies | S5 |
| Stop or defer condition | Stop if package layout requires release naming or registry publication to test locally; stop on destructive initialization or prose-only success |
| Evidence path | `evidence/S6/` with pack manifest, clean-install transcript, idempotency result, and overwrite denial |
| Status | `active` |

**Descriptor-rung check.** Unlocks a real `scopa` command installed from a
tarball in a repository that does not contain SCOPA source.

**Anti-ceremony gate.** Classification: `implementation`. Runtime and
contract behavior dominate the slice.

### S7: Model-neutral adapter bridge

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `adapter-host` |
| Crosses | `enforcement`, `agent-surface`, `conformance` |
| Advances contracts | AH1, AH2, AH3 |
| Objective | Expose the trusted SCOPA host through a model-neutral bridge suitable for headless coding agents |
| Purpose | Claude and Codex must share one enforcement contract rather than acquire divergent security logic |
| Value gate | A deterministic fake agent can read, request an allowed mutation, receive a blocked mutation, and reach or fail the stop gate solely through the bridge |
| Validation gate | Protocol-level tests, hostile unknown-tool calls, direct mutation bypass attempts, transcript completeness, capability matrix validation, and accumulated release gate |
| Likely artifacts | Bridge transport, tool schemas, launcher contract, transcript collector, capability/bypass schema, fake-agent fixtures |
| Dependencies | S6 |
| Stop or defer condition | Stop if the bridge delegates policy to the model or if its transport creates an unjournaled mutation path |
| Evidence path | `evidence/S7/` with tool inventory, hostile-call results, structured transcript, and bypass matrix |
| Status | `queued` |

**Descriptor-rung check.** Unlocks an agent-neutral executable transport to the
already trusted enforcement host.

**Anti-ceremony gate.** Classification: `implementation`.

### S8: Claude Code headless integration

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `claude-adapter` |
| Crosses | `adapter-host`, `enforcement`, `conformance` |
| Advances contracts | CL1, CL2, CL3 |
| Objective | Run Claude Code non-interactively against live SCOPA fixtures with a strict, recorded tool surface |
| Purpose | Claude's headless CLI makes it the fastest real-agent proof of the shared bridge and provides a second model family for SCOPA testing |
| Value gate | `claude -p` attempts an out-of-scope edit and a false-green completion; SCOPA blocks both while an allowed task completes |
| Validation gate | Pinned CLI-version receipt, strict MCP/tool configuration, structured stream transcript, clean and fault fixtures, cold resume, accumulated release gate, and non-Claude outside review |
| Likely artifacts | Claude launcher/profile, strict MCP config, headless fixture driver, transcript normalizer, capability/bypass matrix |
| Dependencies | S7 |
| Stop or defer condition | Stop if built-in tools, plugins, hooks, settings, or subprocesses retain an unmediated mutation route; label partial assurance if a route cannot be closed |
| Evidence path | `evidence/S8/` with launch config, raw transcript, blocked-write and false-green records, resume proof, and outside review |
| Status | `queued` |

**Descriptor-rung check.** Unlocks a reproducible live Claude session governed
at the tool boundary rather than by prompt cooperation.

**Anti-ceremony gate.** Classification: `implementation`.

### S9: Codex headless integration and parity

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `codex-adapter` |
| Crosses | `adapter-host`, `claude-adapter`, `enforcement`, `conformance` |
| Advances contracts | CX1, CX2, CX3 |
| Objective | Run Codex non-interactively through the shared bridge and compare behavior with the Claude fixture contract |
| Purpose | A single-agent success can hide vendor-specific assumptions; parity exposes them |
| Value gate | `codex exec` passes the same clean, blocked-write, false-green, and cold-resume behavior contract used by Claude, or emits an explicit machine-readable parity gap |
| Validation gate | Pinned CLI-version receipt, explicit sandbox/hook/MCP configuration, JSON event transcript, clean and fault fixtures, cross-agent outcome comparison, accumulated release gate, and non-Codex outside review |
| Likely artifacts | Codex launcher/profile, headless fixture driver, transcript normalizer, parity report, capability/bypass matrix |
| Dependencies | S8 |
| Stop or defer condition | Stop if native shell, patch, hooks, plugins, MCP, or subprocess behavior bypasses SCOPA while full assurance is claimed; preserve documented partial assurance rather than hiding a parity gap |
| Evidence path | `evidence/S9/` with launch config, raw transcript, behavior results, parity report, and outside review |
| Status | `queued` |

**Descriptor-rung check.** Unlocks a cross-vendor executable integration
contract rather than two unrelated demonstrations.

**Anti-ceremony gate.** Classification: `implementation`.

### S10: Developer-preview release candidate

| Field | Value |
|---|---|
| Class | `arc` |
| Module | `release-readiness` |
| Crosses | `distribution`, `adapter-host`, `conformance` |
| Advances contracts | RC1, RC2, RC3 |
| Objective | Assemble and externally test a private v0.2 developer-preview candidate |
| Purpose | The last pre-publication proof must be consumer installation and honest comprehension, not another in-repository test |
| Value gate | An unfamiliar consumer installs the packed candidate in a fresh repository, runs one supported adapter, reproduces the core enforcement proof, and independently verifies the evidence packet |
| Validation gate | Reproducible quickstart, public-fixture dry run, threat/non-claim audit, security and governance file audit, license and naming decision check, external consumer transcript, and accumulated hosted CI |
| Likely artifacts | Candidate tarball manifest, quickstart, threat model, security policy, contribution/governance documents, schemas, public fixtures, release checklist |
| Dependencies | S9 plus principal decisions on license, contribution model, release naming, and publication timing |
| Stop or defer condition | Defer while legal/naming/license decisions remain open; stop if the quickstart requires privileged institutional knowledge or the candidate overstates adapter assurance |
| Evidence path | `evidence/S10/` with consumer transcript, artifact manifest, policy audit, and independent review |
| Status | `queued` |

**Descriptor-rung check.** Unlocks a distributable candidate that an outside
consumer can execute and verify without access to the build conversation.

**Anti-ceremony gate.** Classification: `test/validation` with executable
consumer installation.

## Program stop conditions

- Any exposed agent mutation path bypasses the SCOPA dispatcher while the
  adapter is labeled conforming.
- An integration depends on prompt obedience for scope, completion, or
  continuity enforcement.
- Claude and Codex differences are normalized away instead of reported.
- A live-model test can alter a non-fixture repository or escape its temporary
  worktree.
- Initialization overwrites an existing project configuration without an
  explicit principal decision.
- Packaging removes known-failing conformance fixtures or makes verification
  depend on a paid service.
- Publication, npm release, repository visibility change, trademark claim, or
  production customer installation is proposed without separate principal
  authorization.
- Two consecutive slices produce no executable runtime, test, guard, or
  consumer-boundary change.

## Rotation

Each completed slice moves to `completed/`, leaves the required evidence trio,
and commits before the next slice activates. The next protocol is drafted from
this queue only after the prior closeout establishes that continuing reduces a
new executable uncertainty.

S6 is the sole active protocol at ratification. S7-S10 are queue entries, not
permission to run ahead of the active slice.

---

*Heart AI Foundation. Governs SCOPA developer-preview implementation.*
