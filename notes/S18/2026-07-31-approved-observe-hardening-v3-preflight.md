# S18.2 approved OBSERVE hardening v3 preflight

The principal approved closed v3 matrix digest
`3b40b83dfa80c0f4e25e9c2a6dd7fff995caf1c32c842fd54436f1eb48a5e5c4`
for exactly two Codex production calls: clean then cold-restart. Approval
digest `9f66842e03e3405a00388f0127ced5f72ebcb63ab35d32e38937fbfb9751df9f`
reconstructs authorized matrix digest
`620c7111a120c6301577a434cb1371a979ab6bb4f8781edf1c7ad0857b0a2d00`
and expires after 2026-08-01.

The new controller is Codex-only. Before provider intent it validates the
approval and expiry, rejects consumed approvals, verifies all retained v2
evidence hashes, checks Codex 0.146.0, installs the exact frozen candidate,
binds its exported integration version, requires a new external S18V3 custody
root, and passes the exact bounded OBSERVE policy into both run validations.
The controller cannot accept or publish a campaign unless both fresh runtime
calls pass polarity, token bounds, evidence validation, and cleanup.

Provider calls consumed: zero of two. Execution waits for local and hosted
preflight of this exact controller commit.
