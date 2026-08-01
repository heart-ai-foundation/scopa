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

## Production result

The approved campaign completed at `2026-08-01T02:52:37.425Z`. All four calls
ran in the approved order and succeeded with matching stop polarity and full
cleanup. Claude used `$0.096816500000000016` of the `$0.40` campaign ceiling;
Codex used 103,814 total tokens of the 252,000-token campaign ceiling.

`live/campaign.public.json` is the path-free public derivative with SHA-256
`5aa21c4815b1e55a862eb8f862467e884414810eecd1792477ba4a1d9e64ffd6`.
It binds authorized matrix
`9b83b7d5d4265526f481cf0d71a77312a5aa37d7d7998c5474f3da398f7ec9d8`
to the exact S20 package, closure, bundled payload, and installed payload.

Raw evidence remains outside the repository under the approved destination
alias. Its aggregate private receipt SHA-256 is
`8923cf28f6ba3b9c5ceebf56a64aed28ae09d52c0d41ae93de7447e8c5bbfe9a`;
all private files are mode 0600 and all private directories are mode 0700.
`consumed-approvals.json` permanently closes this approval. A direct replay
attempt stopped before provider intent because the S21 custody root existed.
