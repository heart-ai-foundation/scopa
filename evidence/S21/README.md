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
