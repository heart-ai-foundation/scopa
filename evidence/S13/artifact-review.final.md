# S13 Round 7 artifact/distribution review

Verdict: `ACCEPT`

Exact binding:

- source:
  `5a6b29832910db26497095289badb3e859bca48c`;
- candidate SHA-256:
  `6a8d6db6c07db772a4cba32912995472e017ee4f4bee3290f44fe9baf04c4692`;
- manifest SHA-256:
  `8b503078366e0d1fb5c5f407fe60cf05df45feef4e623333d3ad8252710fb131`.

## Findings

- critical: 0;
- high: 0;
- medium: 0;
- low: 1 — `scopa` runtime/usage failure envelopes can reflect
  caller-supplied absolute paths and invalid-JSON prefixes. The caller owns
  those values; `scopa-mcp` defaults remained path- and stack-free.

## Executed review

The fresh reviewer recomputed SHA-1, SHA-256, SHA-512 integrity, inventory,
modes, sizes, totals, and special-entry controls. All 153 entries were regular,
unique, safe files. Two official clean offline repacks were byte-identical.

A credential-free `env -i` offline install used only the tarball, disabled
scripts, and installed 13 production packages. Both bins, all three export
paths, allowed and denied writes, satisfied and known-failing gates, retained
RFC 3161 verification, the exact six-tool MCP inventory, and closed launcher
failures were exercised.

All 17 packed Markdown documents passed. Safe adversarial copies proved that
missing root files and `Z*.md` globs, neighboring references, and unrelated
source-checkout language cannot false-green installed-user npm prescriptions.
Resolvable root globs and generic URI schemes passed. The bound 41-case
contract corpus, privacy scan, lifecycle/package claims, and invalid
path/mode controls also passed.

## False positive and limitations

The live nested-process client exited early only inside the managed
nested-pipe sandbox. The launcher, transport, and consumer client are unchanged
from the retained Round 6 adjudication. Root reran the exact current installed
command outside that sandbox: it returned protocol `2025-11-25`, six tools,
allowed write, scope denial, satisfied terminal state, full deterministic
assurance, and a complete 11-event transcript. This is an environment false
positive, not a candidate finding.

Coverage was Linux, Node 22/npm 10, and local offline cache. It did not perform
online advisory refresh, provider integration, publication, revocation
lookup, or external provenance certification.
