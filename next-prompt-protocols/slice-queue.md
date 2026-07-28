# SCOPA Slice Queue

**Authority:** `macro-deltas/2026-07-27-scopa-developer-preview.md`
**Rule:** This file materializes the canonical Macro Delta. It does not create
or authorize independent queue entries.

| Slot | Slice | Module | Objective | Value gate | Validation gate | Dependencies | Stop/defer condition | Evidence path | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S6 | Installable developer surface | `distribution` | Package SCOPA behind one safe CLI and prove operation outside its source checkout | A clean repository installs the local tarball and runs core commands | Pack/install harness, CLI contracts, idempotency, overwrite refusal, and accumulated gate | S5 | Stop on monorepo-relative resolution, destructive initialization, or prose-only success | `evidence/S6/` | `completed` |
| S7 | Model-neutral adapter bridge | `adapter-host` | Give supported agents one trusted SCOPA mutation boundary | A fake agent reaches allowed, denied, and stop states only through the bridge | Hostile tool calls, direct bypass attempts, transcript completeness, and capability matrix | S6 | Stop if policy is delegated to the model or transport creates an unjournaled mutation path | `evidence/S7/` | `completed` |
| S8 | Claude Code headless integration | `claude-adapter` | Exercise the shared bridge with Claude through a strict recorded tool surface | Claude is blocked out of scope and refused false-green while an allowed task completes | Headless clean/fault runs, cold resume, capability matrix, and non-Claude review | S7 | Stop or label partial assurance if tools, plugins, hooks, settings, or subprocesses bypass SCOPA | `evidence/S8/` | `completed` |
| S9 | Codex headless integration and parity | `codex-adapter` | Exercise the same contract with Codex and compare outcomes with Claude | Codex satisfies the Claude behavior contract or reports a parity gap | Headless clean/fault runs, cold resume, parity report, and non-Codex review | S8 | Stop or label partial assurance if shell, patch, hooks, plugins, MCP, or subprocesses bypass SCOPA | `evidence/S9/` | `completed` |
| S10 | Developer-preview release candidate | `release-readiness` | Prove private-candidate adoption outside the build repository | An unfamiliar consumer installs, runs, and independently verifies the candidate | Consumer quickstart, policy audit, hosted gate, and independent review | S9 and release decisions | Defer while naming, license, contribution, or publication decisions remain open | `evidence/S10/` | `active` |

S0-S5 remain completed under the predecessor Macro Delta. S6-S9 are complete.
S10 is the only active slice and remains at its explicit principal-decision
gate before candidate assembly.
