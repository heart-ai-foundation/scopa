# S13 round 2 evidence review

Verdict: `ACCEPT`

- Source commit: `9c64b6c25e217da18767c6aedda811b755bbbe63`
- Candidate SHA-256: `0f47bd929a0ae7db2237c86efb2785640345a5eaec7d2782b49d681eb5c4d346`
- Raw proof SHA-256: `ed855373015fd53cfe9c56ea664d9ed515e27b57c0678fb132c86a21af35f149`
- Public proof SHA-256: `bce38bbad4e6814df63e7db569d089ba9b1794e55e81d59ea9f36af1ec33dabd`
- Manifest SHA-256: `915941193c3de1311d70df13b216dfc592f0491b6f370e528cf2961f2e9b0859`

## Findings

Critical: none. High: none. Medium: none. Low: none.

## Executed evidence

The reviewer installed the exact tarball offline, matched all 153 entries and
555,860 unpacked bytes to the manifest, and reproduced the candidate twice
from the exact clean source. The installed 33-case corpus agreed 33/33 with 3
accepts and 30 rejects. It rejected all former semantic-proof blockers,
non-canonical paths, Unicode aliases, traversal, and normalized duplicates.

Public-proof regeneration was byte-identical, changed only the two designated
root fields, and truthfully retained `semanticFieldsChanged: false`.
Placeholder and private-root collisions failed closed. The reviewer also
reproduced the six-tool adapter proof, contained write, denied escape,
satisfied stop state, native verification, and exit-4 blocked control. Scans
of all 17 public S13 evidence files found no credentials or private topology.

## False positives and limits

Repacking an installed filesystem changed metadata-derived compressed bytes;
two official clean-source packs reproduced the reviewed candidate exactly. A
runner-specific generic grandchild-pipe EOF was reproduced independently and
the MCP exchange passed over file-backed stdio, so it was not a SCOPA finding.
No network, live provider, credential, hosted-gate, rotation, publication, or
production assertion was tested.
