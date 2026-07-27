# S9 — Codex Headless Integration and Parity

**Class:** `arc`
**Module:** `codex-adapter`
**Crosses:** [`adapter-host`, `claude-adapter`, `enforcement`, `conformance`]
**Advances contracts:** [`CX1`, `CX2`, `CX3`]
**Compound:** false

## Why this exists

S8 proved that Claude Code can operate through the shared SCOPA bridge with an
explicit tool surface and honestly partial assurance. One provider cannot prove
that the bridge contract is model-neutral. Codex has a different native tool,
sandbox, configuration, plugin, skill, MCP, subprocess, and session surface;
those differences must be measured rather than normalized away.

## Next objective

Run a pinned Codex CLI non-interactively through the installed S7 bridge in a
fresh fixture repository. Reproduce S8's allowed-write, blocked-scope,
false-green-refusal, and cold-restart outcomes, then publish a machine-readable
Claude/Codex parity report and retain every provider-specific assurance gap.

## Descriptor rung check

Executable unlock: a pinned `codex exec` launcher produces normalized SCOPA
evidence for the four cross-agent behaviors and a mechanically checked parity
result against the committed S8 proof.

## Anti-ceremony gate

- Classification: `implementation`.
- Executable change: Codex launcher/profile, isolated configuration, event
  normalizer, live fixture driver, capability matrix, and parity verifier.
- New uncertainty reduced: whether the common bridge contract survives a
  second agent host without hiding Codex-native authority or outcome drift.
- Validation: pinned CLI receipt, explicit sandbox and MCP configuration,
  clean/fault/cold live runs, S8 parity comparison, accumulated release gate,
  and non-Codex outside review.
- Consecutive metadata/decision slice check: `pass`; S8 delivered a live
  Claude boundary, and S9 delivers a separate executable provider boundary.
- Status-report alternative: insufficient because only real Codex JSON events
  reveal its resolved native and MCP behavior.

## Productivity mix

- Runtime behavior: 45%
- Contract/test code: 40%
- Metadata/docs: 15%

## Slice queue

This queue is materialized from the authorized Developer Preview Macro Delta
and creates no independent work.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S6 | Installable developer surface | Package SCOPA behind one safe CLI | Clean repository installs the tarball and runs core commands | Pack/install harness, CLI contracts, overwrite refusal, accumulated gate | `completed` |
| S7 | Model-neutral adapter bridge | Give supported agents one trusted mutation boundary | Fake agent reaches allowed, denied, and stop states only through the bridge | Hostile tool calls, bypass attempts, transcript and matrix checks | `completed` |
| S8 | Claude Code headless integration | Exercise the bridge with Claude through strict tool configuration | Claude is blocked out of scope and refused false-green while an allowed task completes | Headless clean/fault runs, cold resume, outside review | `completed` |
| S9 | Codex headless integration and parity | Exercise the same contract with Codex and compare outcomes | Codex satisfies the Claude behavior contract or reports a parity gap | Headless clean/fault runs, parity report, outside review | `active` |
| S10 | Developer-preview release candidate | Prove adoption outside the build repository | Unfamiliar consumer installs, runs, and independently verifies the candidate | Consumer quickstart, policy audit, hosted gate, independent review | `queued` |

## Files in play

- `packages/integrations/codex/**`
- `fixtures/S9/**`
- `package.json`
- `package-lock.json`
- `README.md`
- `next-prompt-protocols/**`
- `notes/S9/**`
- `runs/S9/**`
- `evidence/S9/**`

## Validation speed option

- Fast deterministic command: `npm run test:s9`
- Live command: `npm run probe:s9:live`
- Parity command: `npm run verify:s9:parity`
- Upstream policy: consume the installed S7 bridge and the committed S8 public
  proof; do not copy provider-specific enforcement logic.
- Live-model policy: run only in a fresh temporary fixture repository, cap
  turns and captured output, and retain raw JSON events plus exact CLI/config
  receipts.
- Broad-suite policy: `npm test` retains all S0-S8 tests and fault probes.

## Non-goals

- No dangerous sandbox or approval bypass, unbounded workspace, or claim that
  a Codex-native mutation route is SCOPA-mediated.
- No reliance on Codex prompt obedience for scope or completion enforcement.
- No mutation of the SCOPA source checkout by a live model.
- No provider-attested identity or immutable-model-snapshot claim; record
  requested configuration and observed events honestly.
- No full-assurance claim while native shell, patch, process, network, managed
  policy, plugin, hook, skill, session, or other uncontrolled route remains.
- No change to Claude adapter behavior, S0-S8 semantics, or the frozen effect
  taxonomy.
- No npm publication, public repository, public release, or production
  installation.
- No final trademark, package-name, license, or contribution-model claim.
- No queue entries outside the authorized Developer Preview Macro Delta.

## Evidence

This arc slice requires all three evidence surfaces:

- `notes/S9/` — Codex flags, sandbox, config, MCP, identity, resume, parity,
  and assurance decisions.
- `runs/S9/` — deterministic tests, exact CLI receipt, clean/fault/cold live
  commands, parity verification, accumulated gate, protocol check, and
  non-Codex outside review.
- `evidence/S9/` — generated launch inputs, raw Codex JSON events, normalized
  behavior result, SCOPA transcript, capability matrix, parity report, cold
  restart proof, and reviewer verdict.

## Acceptance

- `npm run test:s9`
- `npm run probe:s9:live`
- `npm run verify:s9:parity`
- `npm test`
- `npm run protocol:check`
- The launcher records an exact Codex CLI version and rejects unreviewed
  version drift.
- Headless launch uses `codex exec` with JSON events, an explicit repository,
  bounded runtime/output, isolated MCP configuration, a reviewed sandbox, no
  dangerous bypass, and a recorded settings/hooks/plugins/skills inventory.
- The observed model-callable surface and every Codex-native shell, patch,
  write, network, hook, plugin, skill, setting, MCP, subprocess, session, and
  admin route are classified in the capability matrix.
- A clean live session writes one allowed file through `scopa_write_file`,
  calls the real stop gate, and returns a valid SCOPA transcript.
- A fault session attempts an out-of-scope write, receives
  `SCOPA_SCOPE_DENIED`, and does not create the target.
- A failing gate remains `canStop: false`; model prose cannot convert it into
  completed evidence.
- A fresh second Codex/bridge process in the same fixture reorients from
  persisted SCOPA state without relying on prior process memory.
- Raw event normalization fails on unknown security events, missing tool
  results, altered call ordering, or a claimed result inconsistent with the
  SCOPA terminal state.
- A machine-readable parity report compares the four Codex outcomes with the
  committed S8 Claude public proof and exposes, rather than hides, any gap.
- Known uncontrolled Codex routes force `partial` assurance.
- A non-Codex outside reviewer reproduces deterministic gates, inspects live
  and parity evidence, and issues an explicit accept/hold verdict.
- S0-S8 release gates remain green.
