# S3 legibility decisions

Date: 2026-07-26

- Legibility is a derived layer over verified S1 journal records. S3 does not
  change the sealed record ABI or add effect categories.
- Observe mode invokes the real tool handler before capture. Observation
  failure is recorded as a gap and never changes a successful tool result.
- A host-owned attempted-event counter is required. Journal contents alone
  cannot distinguish no activity from failed capture.
- The counter and summary are validated for internal reconciliation but remain
  host-reported and unauthenticated until S4.
- The initial profile is `coding-agent.v1`, covering read, query, write,
  execute, and emit. Its manifest hash is pinned as the journal script hash.
- Duplicate event IDs, invalid profile events, and append failures remain
  visible capture gaps.
- Coverage has only `observed` and `not-observed` states. The implementation
  contains no `not-present` state.
- Declared-but-unseen boundaries are findings with epistemic status
  `not-observed`; they are not silently treated as missing or removed.
- Reconstructability is limited to boundary-event capture completeness:
  complete classified events divided by host-reported attempts, in integer
  basis points. It makes no claim about uninstrumented activity or work-product
  reconstruction.
- Model-generated probe plans are schema constrained and path confined. The
  model proposes calls while the trusted host executes and separately records
  the actual trace.
- Model evidence embeds sealed record hex, the external commitment, and the
  host summary so a reviewer can recompute the map and score.
- Full trace comparison preserves event order, multiplicity, event ID,
  operation, target, tool name, and result status.
- The local model-session receipt binds the exact prompt, output schema, plan,
  Codex JSONL transcript, client version, and thread ID. It is explicitly a
  local client receipt, not provider-signed provenance.
