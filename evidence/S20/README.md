# S20 bundled exact-candidate evidence

S20 qualified one exact candidate from clean commit
`d56440195dcb24cb6dd43c24e484641b1646a5a9`. The canonical qualification is
`exact-candidate-qualification.json`; `closeout.json` binds its hosted result
and the portability findings resolved during qualification.

The candidate SHA-256 is
`49b62ac4b4d869dbca8459aa08f515427e0a04349f014c85cc422d7e0625f147`.
Its production graph, bundled tree, installed tree, and license inventory are
separate exact fields. npm 10.9.7 and npm 11.19.0 produced identical candidate
bytes and installed proofs from empty caches with an unreachable registry and
zero external requests.

Hosted run
[`30678929665`](https://github.com/heart-ai-foundation/scopa/actions/runs/30678929665)
passed the accumulated gate, npm parity, four-part qualification, official
candidate build, and positive/negative CASE validation.

S20 advances DCI3 and PLQ1 but does not satisfy either: the same candidate must
still receive separately approved fresh live evidence, sustained soak, and
fresh reviews. No provider call or publication action occurred.
