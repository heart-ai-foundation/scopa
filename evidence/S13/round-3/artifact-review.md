# S13 round 3 artifact/distribution review

Verdict: `ACCEPT`

- Source commit: `e17bbc2acfb70cadad2511b1f1338ddc346fde74`
- Candidate SHA-256: `740cfc630cefde123b871dd2d7d1c1975a02c2f4edf8d3d0c8da82484ecaa5e0`
- Candidate bytes: 143,637
- Inventory: 153 regular files

## Executed evidence

The reviewer reproduced the official candidate byte-identically from a clean
clone, installed it offline with scripts disabled, imported all three exports,
and executed both bins. The known exit-7 fixture remained exit `4`,
`SCOPA_COMPLETION_BLOCKED`, and `canStop:false`. Direct installed MCP stdio
listed exactly six tools, permitted the contained write, denied escape, and
reached a satisfied terminal state.

All archive types, paths, owners, modes, sizes, per-file hashes, package
integrities, consumer metadata, scripts/development-dependency absence,
private-control absence, launcher disclosure cases, and recognizable
credential patterns passed. Critical/high/medium findings: none.

## Low findings and limits

- No detached signature, transparency receipt, or external provenance
  attestation.
- The packed root README pointed to unshipped protocol-control paths; the
  shipped quickstart was correct, so this was documentation drift only.

The nested Node wrapper reproduced the managed runner's child-pipe suppression;
direct execution of the installed binary passed. No network, live credential,
registry publication, or deployment was tested.
