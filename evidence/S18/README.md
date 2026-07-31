# S18 exact production-live requalification

S18.1 freezes clean source commit
`43fbb969f32c711d1a68b05ad73fb33717c90d8c` to exact private candidate
SHA-256 `e0d4bb772cc4ebee53b7d9ea1dd19161411724e417286612b4b00dcbab1d9498`.
The tarball remains outside the repository in the dedicated private SCOPA
evidence home. The committed qualification receipt is path-free and binds
the full candidate manifest, repeated pack/install result, release-policy
audit, frozen deterministic matrix, S17 closeout, integration policies and
profiles, package metadata, lockfile, and active protocol.

The installed candidate has 179 entries, 211939 packed bytes, and 887932
unpacked bytes. Three exports and both binaries qualified, the package scan
reported zero privacy findings, all 37 release-policy checks passed, and all
four provider-closed matrix cases passed. Claude and Codex remain independently
`partial`; neither provider traffic nor publication is authorized.

S18.1 does not satisfy PLQ1 by itself. The closed production-live matrix,
sustained soak/audits, and three fresh exact-byte reviews remain in S18.2-S18.4.

## S18.2 closed posture

`closed-production-live-matrix.json` binds the S18.1 candidate to exactly four
planned provider calls: Claude `clean` then `cold-restart`, followed by Codex
`clean` then `cold-restart`. Its digest is
`3df4d5eb353c124c2d425c8e98ea6eb52e0d4e07fc6529c470770804a0a317d9`.
The committed form authorizes zero calls and cannot be used for provider
intent. A separate, at-most-one-day approval must bind that digest, all four
calls, the Claude USD ceiling, the Codex token ceiling, and both private
evidence destinations before an authorized matrix can exist.

## Approved execution window

The principal approved the exact closed matrix digest on 2026-07-31.
`production-live-approval.json` binds the four-call allowance and expires after
2026-08-01. Its approval digest is
`f9f1aedb3853878b95b1aceacc9fe57c4070475e4a70c5415b8a36a3dccf0325`;
the derived authorized matrix digest is
`65c04e950f630fa229776df3307af078cc1cd4eaa5844f8b89707e5ceff89317`.
Materializing this approval does not itself consume a provider call.
