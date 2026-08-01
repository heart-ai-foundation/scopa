# S19-v2 bundled production-closure evidence

S19-v2 replaces the stopped nested-shrinkwrap approach with a candidate that
physically contains every reviewed production dependency byte. The canonical
receipt is `bundled-production-closure.json`.

The implementation at commit
`7ec818e86abed69ec1aa5709dd23fd584d8a6edc` produced an official clean
candidate with SHA-256
`9b55f8a64723fb99f305328e563b84e0be73e2e108c5257274e593d661637e6f`.
Its 12-package, 893-file production payload is bound separately as graph,
bundle, installed-tree, and license-inventory identities. npm 10.9.7 and npm
11.19.0 produced identical candidate and bundle identities, then installed
the exact payload from empty caches in offline mode with an unreachable
registry and a network-deny shim.

Hosted run
[`30677302851`](https://github.com/heart-ai-foundation/scopa/actions/runs/30677302851)
passed the accumulated gate, npm-version parity, official clean candidate
path, native packet recovery, and positive/negative CASE validation.

This satisfies DCI1 and DCI2. DCI3 is only advanced: S20 qualification, S21
live evidence, S22 soak, and S23 reviews must independently bind the same four
identity classes before that cross-slice contract can close. No provider call,
publication action, or candidate-install external request occurred.
