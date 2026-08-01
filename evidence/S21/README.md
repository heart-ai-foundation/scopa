# S21 fresh candidate production-live matrix

`closed-production-live-matrix.json` is the fail-closed approval boundary for
the S20 bundled candidate. Its canonical JSON digest is
`5b227ecaf12ce6eb4eae03591a1bc7e3dc268f45925e7d9ae3e55bf96ee00f6a`.

The matrix proposes exactly four production calls, in order: Claude clean,
Claude cold-restart, Codex clean, and Codex cold-restart. It binds the package,
candidate manifest, production bundle manifest, closure, bundled payload,
installed payload, license inventory, client versions, model requests,
budgets, timeouts, custody destinations, and the 24-hour approval window.

The committed artifact authorizes zero provider calls. S21 may open only after
the principal explicitly approves the exact matrix digest. Approval is
single-use, does not transfer between calls or campaigns, cannot be used by an
experiment, and authorizes neither publication nor customer data.

`production-live-approval.json` records the principal's exact approval of the
matrix with approval digest
`81df2d47f24251ff6d743d0d026fef0a5eb9dd10a484f26a6eb1a3f9117096c9`.
It does not by itself prove that any call ran or passed.
