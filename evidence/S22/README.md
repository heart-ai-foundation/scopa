# S22 sustained bundled-closure soak evidence

`bundled-closure-soak.json` is the canonical receipt for the exact S20/S21
candidate. Its receipt SHA-256 is
`333eb7c93b67e3edc7b19834f7593ba2ae9a3d17e93bfad6e021d77ef1b9248d`.

The provider-off soak completed all 12 fresh disposable cycles, alternating
npm 10.9.7 and npm 11.19.0. Each cycle installed from a new empty cache with
offline mode, an unreachable registry, ignore-scripts, and the network-deny
shim. Every cycle reproduced the exact candidate identity, installed tree,
dependency graph, license inventory, runtime control state, and allow/deny
polarity with zero install network requests.

All cycle roots and caches were removed. Descriptor growth was zero and the
maximum observed controller RSS growth was 102,400 bytes against the frozen
67,108,864-byte limit. One separate current production advisory audit found
zero vulnerabilities. Privacy findings, provider calls, experiment calls, and
publication actions were all zero.

S22 satisfies PLQ1 and preserves the evidence needed for DCI3. DCI3 remains
advanced until S23 supplies the required fresh exact-identity reviews.

`closeout.json` binds the soak to evidence commit
`46afe0e63355b09c03b5f7e261eca30af952e818` and hosted release-gate run
[`30682221831`](https://github.com/heart-ai-foundation/scopa/actions/runs/30682221831).
