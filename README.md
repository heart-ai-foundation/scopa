# SCOPA

SCOPA is an open enforcement runtime for bounded, verifiable autonomous coding
work. It mechanically enforces Next-Prompt Protocol v2.4 across three
boundaries:

- **Scope:** what may the agent change?
- **Completion:** what must be proven before work may stop?
- **Continuity:** what verified state may survive rotation or compaction?

Next-Prompt Protocol remains the canonical protocol. SCOPA is its executable
reference implementation.

## Status

SCOPA is pre-release Foundation work. The S0 conformance-harness slice is active
under the canonical Macro Delta. The package is private and no publication is
permitted before S3 closes v0.1.

Start with:

1. `next-prompt-protocols/.slice-lock.json`
2. `next-prompt-protocols/manifest.json`
3. `next-prompt-protocols/macro-deltas/2026-07-26-scopa-kernel-build.md`
4. `next-prompt-protocols/role-context.md`
5. `next-prompt-protocols/active/2026-07-26-S0-conformance-harness.md`

## Publisher

Heart AI Foundation publishes the specification and reference implementation.
The public kernel remains entity-neutral; Heart-specific semantics compose
above it through profiles.

## Canon

- `spec/SCOPA_Kernel_Specification_v0_1.md`
- `spec/SCOPA_Canon_Amendment_Note_v1_1.md`

## Build governance

The repository uses Next-Prompt Protocol v2.4. The SCOPA Macro Delta is the sole
queue authority for S0-S5. Discovered work must fit the active slice, be
deferred, or be ratified through an explicit Macro Delta amendment.
