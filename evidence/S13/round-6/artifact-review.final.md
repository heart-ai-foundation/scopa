# S13 round 6 artifact/distribution review

Verdict: `REJECT`

## Exact target

- source:
  `73a969293a6450134e6cce1e7cbcac47e9eea67f`
- candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `ddabd2cf3e68e6065531ec59d21cd64548603940f94f5d0f1813fcf587548234`
- manifest SHA-256:
  `51e670f3941edc82d63373055991754bafa08f33de99c79e56125cdb0d7fe3fb`
- runtime: Node `v22.22.2`, npm `10.9.7`

All bindings matched.

## Findings

### Medium — installed `scopa-mcp` failed the documented spawned-client path

After a tarball-only, offline install with scripts disabled, the packaged
quickstart client failed reproducibly twice with:

```text
Error: scopa-mcp closed 0 before replying:
```

The bin exited successfully before answering `initialize`. A pre-buffered
shell pipeline elicited a reply, indicating a possible startup/liveness race.
Static review found executable dispatch invokes `main().catch(...)` without a
top-level await. This finding requires independent reproduction because the
managed environment has previously suppressed nested Node stdio.

### Medium — pack-time documentation audit misses root globs

The official checker detected missing `ROADMAP.md` and
`packages/*/NOPE.md`, but accepted the unresolved conventional-root glob
`Z*.md`. Reference tokenization permits globs only under selected directory
prefixes, allowing official packing to certify an unresolved prescribed root
pattern.

### Medium — npm qualification is document-scoped

A document containing the unrelated phrase `source checkout` and a separate
instruction `Installed users should run npm run absent-script` passed the
audit. Any `source checkout` occurrence currently qualifies every `npm test`,
`npm audit`, or `npm run` occurrence in that document instead of requiring
per-prescription qualification.

### Low — CLI failure envelope reflects a caller-supplied absolute path

`scopa status --repo /tmp/SENSITIVE_REVIEWER_PATH_7fdb/absent` returned the
complete caller-supplied path in `error.message`. `scopa-mcp` returned a
path-free launcher envelope for equivalent missing inputs. Caller ownership
of the value limits severity.

## Passing checks

- Two clean official packs reproduced the exact candidate byte-for-byte.
- All 153 entries were canonical regular files with matching sizes and modes.
- Consumer metadata retained the two bins, three exports, runtime dependencies,
  and private posture while omitting scripts and development dependencies.
- Tarball-only offline installation added 13 packages with scripts disabled.
- `scopa` help/init/status and all three export subpaths worked.
- All 17 actual packed Markdown documents passed static review and the current
  package audit.
- Actual contributor npm commands were source-checkout-qualified.
- Generic URI schemes were excluded without hiding a neighboring local path.
- Package privacy and credential scans returned no finding.
- No lifecycle hooks, aliases, private keys, recognizable credentials,
  retained source paths, or publication/certification implication were found.

## Executed and static checks

The reviewer used a clean detached clone, exact hashes, tar inventories,
official deterministic packing, source-free offline installation, both bins,
all exports, the packaged client, privacy scans, hostile documentation
fixtures, and failure-envelope probes. Static review covered every packed
Markdown document, package manifest, artifact builder, launcher, transport,
privacy scanner, release posture, and package allow/deny list.

## False positives and limits

Naive `npm pack` was excluded because it retains contributor metadata while
the official isolated pack does not. External URIs, documented placeholders,
the public FreeTSA certificate, and DCO contributor language were not treated
as private residue or product certification.

No network, registry audit, credentials, provider integration, publication,
or revocation check was used. Testing covered Linux, Node 22, and npm 10.
Offline installation used the local npm cache. An empty-directory npm-prefix
result and a cached `npm view --offline` E404 were discarded. The repository,
candidate, and retained evidence were not modified.
