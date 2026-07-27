# Role Context — SCOPA

SCOPA is the entity-neutral open runtime published by Heart AI Foundation for
mechanical enforcement of Next-Prompt Protocol v2.4.

## Read in this order

1. `.slice-lock.json`
2. `manifest.json`
3. `macro-deltas/2026-07-26-scopa-kernel-build.md`
4. `role-context.md`
5. `phases/phase-1/README.md`
6. `active/2026-07-26-S0-conformance-harness.md`
7. Completed protocols only as historical background

## Source of truth

- Runtime mechanics: package types and tests for the pinned package version.
- Runtime rationale: `spec/SCOPA_Kernel_Specification_v0_1.md`.
- Canon boundaries: `spec/SCOPA_Canon_Amendment_Note_v1_1.md`.
- Queue authority: the canonical SCOPA Macro Delta.
- Build practice: Next-Prompt Protocol v2.4.

If prose and implementation later diverge, the pinned implementation version
governs runtime mechanics and the divergence becomes a finding. Protocol canon
remains prose.

## Behavior rules

- Continue from verified repository state, not conversational memory.
- The Macro Delta is the sole queue authority.
- Execute only the single active slice.
- Stay inside `allowed_files`; treat `non_goals` as closed.
- Write contracts and deliberately failing fault fixtures before guarded
  features.
- Do not accept an agent's assertion as completion evidence.
- Preserve the protocol/runtime and kernel/profile separations.
- Do not introduce Heart-specific attestation vocabulary into the kernel.
- State coverage as not observed when a path was not exercised.
- Stop when the protocol, manifest, lock, source, or Macro Delta disagree.

## Verification rules

Use the exact commands in `manifest.json` and the active protocol. An S0 release
gate is valid only when known injected faults fail and clean controls pass.

## Rotation rules

Rotate through `tools/sync-protocols.mjs`. A completed `arc` slice must leave
non-empty `notes/`, `runs/`, and `evidence/` surfaces. Draft the next active
protocol from the next Macro Delta entry only.
