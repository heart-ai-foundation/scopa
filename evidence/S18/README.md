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
`64a60c06d886460c52838e431df284cdffc8661eb8df2ed3cf50b662fbbfa98f`.
Version 2 binds the candidate-exported Claude 2.1.220 and Codex 0.146.0
requirements.
The committed form authorizes zero calls and cannot be used for provider
intent. A separate, at-most-one-day approval must bind that digest, all four
calls, the Claude USD ceiling, the Codex token ceiling, and both private
evidence destinations before an authorized matrix can exist.

## Historical v1 stopped approval

`closed-production-live-matrix.v1.json` preserves the initially approved
matrix digest `3df4d5eb353c124c2d425c8e98ea6eb52e0d4e07fc6529c470770804a0a317d9`.
`production-live-approval.v1.json` binds the historical four-call allowance and expires after
2026-08-01. Its approval digest is
`f9f1aedb3853878b95b1aceacc9fe57c4070475e4a70c5415b8a36a3dccf0325`;
the derived authorized matrix digest is
`65c04e950f630fa229776df3307af078cc1cd4eaa5844f8b89707e5ceff89317`.
Materializing this approval does not itself consume a provider call.

The resulting execution stopped before provider intent. The matrix named
Claude 2.1.170 and Codex 0.145.0, while the exact candidate bytes require
2.1.220 and 0.146.0. `execution-stop.public.json` binds the private version
probe journal and records zero provider calls consumed. Codex was not opened.
This approval is closed and must not be replayed.
It cannot authorize or transplant onto the corrected v2 matrix.

## Approved v2 execution window

The principal approved corrected v2 digest
`64a60c06d886460c52838e431df284cdffc8661eb8df2ed3cf50b662fbbfa98f`.
`production-live-approval.json` has digest
`c9f67699cb1706bc70e3a6220da7b64fd207356c040cb2980f8adb7f96b242da`
and reconstructs authorized matrix digest
`94be00df2eeee1838946f53fcf20137741c942daa18d8f59631be18caef364ee`.
It expires after 2026-08-01. Execution must use a fresh external resolution of
`SCOPA_PRIVATE_EVIDENCE_ROOT` so the stopped v1 evidence remains immutable.

The v2 campaign consumed all four calls and stopped during evidence validation.
Claude clean/cold-restart and Codex clean passed. Codex cold-restart reached a
satisfied terminal but repeated the read-only `scopa_check`, violating the
frozen exact tool sequence. `live-v2/campaign-stop.public.json` binds the three
accepted public derivatives and the rejected fourth run's private evidence.
Cleanup and resource ceilings passed. The v2 approval is closed against replay.
`consumed-approvals.json` makes both stopped approval digests runtime-rejected
even if a different external custody root is supplied.

## Closed v3 OBSERVE hardening continuation

`closed-observe-hardening-v3.json` retains only the byte-bound accepted Claude
clean and cold-restart derivatives from v2 and plans exactly two fresh Codex
calls: clean, then cold-restart. Its digest is
`3b40b83dfa80c0f4e25e9c2a6dd7fff995caf1c32c842fd54436f1eb48a5e5c4`.
The committed posture authorizes zero provider calls.

The v3 semantic sequence contract permits at most one additional successful
`scopa_check` after the canonical check and before the transcript, and only
when its stop-state projection is identical. Repeated mutation, read,
assurance, or transcript calls; reordered calls; check errors; more than one
extra call; and any semantic result drift remain rejection conditions. This
does not reclassify or replay the rejected v2 run. A fresh, exact, separately
approved v3 digest is required before either Codex call may begin.

The principal approved that exact v3 digest on 2026-07-31 for only Codex clean
then cold-restart. `observe-hardening-approval-v3.json` has digest
`9f66842e03e3405a00388f0127ced5f72ebcb63ab35d32e38937fbfb9751df9f`
and reconstructs authorized matrix digest
`620c7111a120c6301577a434cb1371a979ab6bb4f8781edf1c7ad0857b0a2d00`.
It expires after 2026-08-01. Provider consumption remains zero pending a clean
hosted preflight of the approval-bound v3 controller.

## Accepted v3 execution and provider-free publication recovery

The v3 allowance consumed exactly two Codex calls. Clean and cold-restart both
used the canonical tool sequence with zero extra OBSERVE calls, returned
`canStop: true`, stayed on Codex 0.146.0 and `gpt-5.4`, and completed process,
runtime-home, repository, and controller-root cleanup. Aggregate usage was
103405 of 252000 tokens.

After both runs and campaign validation passed, publication stopped because
the controller passed already-serialized bytes to a canonical-JSON-only
writer. No provider outcome or evidence validation was affected. The approval
was immediately added to `consumed-approvals.json`, forbidding replay. A
provider-free recovery independently re-normalized the private raw streams,
reapplied the frozen semantic policy, verified every private and staged public
hash, confirmed cleanup, and copied only privacy-clean derivatives. Its receipt
is `live-v3/campaign-recovery.public.json`, SHA-256
`16f6ce9577828aae3a56879aedc63e8675df40595ea298b3ce09e49e1c4f4d77`.
S18.2 is complete; the exact-candidate qualification advances to S18.3.

## S18.3 sustained exact-candidate soak and audits

`exact-candidate-soak.json` binds a 12-cycle provider-closed soak to the frozen
candidate and plan digest
`c6399812f6a4c554d7371cfaddfe810a618832d1e99f9e61e44ea803910596bc`.
Every cycle used a fresh ignore-scripts install and disposable synthetic
repository, accepted one in-scope ACT write, rejected one repository escape,
reloaded through fresh CLI processes, reached `canStop: true`, and deleted its
root. Installed tree, dependency graph, lock, and control state remained stable.

The current npm production audit reported zero vulnerabilities. The installed
package privacy/credential scan reported zero findings. Descriptor growth was
zero and peak controller RSS growth was 8343552 bytes against a 67108864-byte
limit. All 12 cycle roots and the audit root were removed; provider traffic was
zero. Receipt SHA-256:
`867b34db1556e8bbd89ac04b7cd5490027409bcedfc15e9ac1f327b35fab17c8`.
S18.3 is complete and PLQ1 is satisfied. S18.4 fresh exact-byte review is next.
