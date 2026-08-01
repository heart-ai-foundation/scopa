# S20 bundled exact-candidate freeze

S20 extends the historical S18 qualifier without altering S18 receipts. The
new qualifier binds the candidate tarball, production graph, bundled payload,
installed payload, license inventory, npm-version parity, installed CLI/bin
surface, policy audit, deterministic matrix, and exact input files.

The executable run found and closed three portability failures rather than
turning them into ceremony:

1. npm-11-enabled TAP crossed Node's default `spawnSync` buffer. The release
   gate now has an explicit 32 MiB ceiling and reports runner errors.
2. protocol projection assumed a developer-workstation absolute path and a local reflog. The
   manifest root is now relative, and one activation commit is validated from
   the raw commit object's exact parent header, including shallow clones.
3. the hosted checkout parent basename was `scopa`, which the privacy probe
   treated as a forbidden secret token. Absolute source and parent paths remain
   forbidden; the ambiguous bare basename was removed and regression-tested.

After these fixes, local and hosted qualification converged on source commit
`d56440195dcb24cb6dd43c24e484641b1646a5a9`, package SHA-256
`49b62ac4b4d869dbca8459aa08f515427e0a04349f014c85cc422d7e0625f147`,
and qualification receipt
`ad9d2dc7e22cfd6e5de07ebce0b430f3970e2eb1072f0e1a78711a82559cec2f`.

S21 remains provider-closed. S20 cannot transfer historical live approval or
assurance to this candidate.
