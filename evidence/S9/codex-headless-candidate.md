# S9 Codex headless candidate

Candidate status: accepted by the non-Codex outside review; final repository
and hosted gates remain recorded in the slice validation receipt.

## Executable result

The installed package exports a pinned Codex headless launcher, an explicit
one-server MCP profile, a fail-closed JSONL normalizer, and a machine-readable
Claude/Codex parity verifier.

The committed public proof demonstrates:

- an allowed write through the SCOPA dispatcher;
- correction-bearing `SCOPA_SCOPE_DENIED` on an escaping write;
- refusal to turn an exit-7 gate into completion;
- cold recovery in a fresh Codex and bridge process;
- exactly one preflight MCP server and only accepted SCOPA MCP tool events;
- partial assurance with Codex-specific uncontrolled routes retained.

## Review surfaces

- `packages/integrations/codex/`
- `fixtures/S9/`
- `evidence/S9/codex-live-proof.public.json`
- `evidence/S9/agent-parity-report.json`
- `notes/S9/codex-headless-decisions.md`
- `runs/S9/2026-07-27-validation.md`
- `evidence/S9/outside-review.md`

The private evidence home retains the exact raw proof. Its SHA-256 is
`744dc75e525c60d96847ebd6519b5420b59fcacbf489af1f4fe1ab72f27c5288`.
