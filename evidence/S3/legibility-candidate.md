# S3 legibility evidence

Status: accepted

The candidate establishes four active contracts:

- L1: boundary-event reconstructability is computed from verified,
  profile-bound records and the host's reconciled attempted-event summary.
- L2: observation happens after real tool execution and capture failures do not
  deny or alter successful tools.
- L3: observed-but-undeclared and declared-but-not-observed boundaries are
  explicit findings.
- L4: every profile operation reports `observed` or `not-observed`; the output
  explicitly says the latter never means absent.

Evidence artifacts:

- `2026-07-26-live-boundary-map.json` — actual filesystem read/write session,
  manual comparison, and complete coverage output.
- `2026-07-26-model-agent-boundary-map.json` — a real
  `gpt-5.6-terra`-generated plan executed by the trusted host and compared
  against its independent full execution trace. The artifact embeds record
  hex, commitment, and summary for independent recomputation.
- `../../runs/S3/2026-07-26-model-agent-plan.json` — the schema-constrained
  model output.
- `../../runs/S3/2026-07-26-model-session.jsonl` — retained local Codex client
  event stream with thread ID and exact model output.
- `../../runs/S3/2026-07-26-model-session-receipt.json` — hashes binding the
  prompt, output schema, plan, transcript, client version, and thread ID. This
  is explicitly not a provider-signed receipt.
- `../../runs/S3/2026-07-26-outside-model-review.md` — initial independent
  `HOLD` that triggered evidence hardening.
- `../../runs/S3/2026-07-26-outside-model-retest.md` — independent `ACCEPT`
  after the retained receipt, replayable records, and exact trace comparison
  resolved every blocking finding.

Adversarial coverage includes invalid post-tool classification, failed journal
append, duplicate event IDs, rejected tools, concealed summary counts,
unexercised operations, undeclared observations, declared-but-unseen
boundaries, and profile-bound journal analysis.

Claim boundary: maps describe captured host events only. They do not establish
that unobserved activity was absent, and the host summary is not
cryptographically authenticated before S4.
