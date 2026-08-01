# S25 fresh provider-off candidate qualification

S25 qualified new candidate bytes from clean source commit
`395a7e340084bbefbb5fb1ae575193eb33cacef4`. The canonical qualification
receipt is `exact-candidate-qualification.json`, with receipt SHA-256
`bf3a0a54cf6be03ce5e3a6f6d69b8ebe32ca3ad5e07a6fcab04110e6fea1f6d9`.

The candidate package SHA-256 is
`aa744c45c8d28bc609205748f4594a9dc6fa829fd996e63c3917a0693165e8d6`.
npm 10.9.7 and npm 11.19.0 produced byte-identical packages and identical
installed-surface proofs. Both disposable candidate installs used empty caches,
offline mode, an unreachable loopback registry, ignore-scripts, and the
network-deny shim; candidate install external requests were zero. Privacy and
bundled privacy findings were zero, all 38 policy checks passed, and the
production closure retained all 12 packages and 893 files.

All six deterministic matrix cases passed, including the accumulated release
gate, the S24 process-tree custody suite, dependency closure, policy audit,
published-contract parity, and protocol projection. Hosted run
[`30688428178`](https://github.com/heart-ai-foundation/scopa/actions/runs/30688428178)
independently passed the same four-part qualification along with npm parity,
the official clean candidate build, signed-packet recovery, and positive and
negative CASE validation.

The pinned npm runners were provisioned as disposable qualification tooling;
they did not modify repository dependencies. Candidate artifacts and tooling
remain outside the repository. Provider calls, experiment calls, publication
actions, and release actions were zero. Candidate assurance is non-transferable,
and no production-live call is authorized by S25.
