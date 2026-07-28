# S13 round 5 artifact/distribution review

Verdict: **REJECT**

## Exact binding

- Source commit: `18a50da693282760e1b912258fdaae1c5df049d4`
- Candidate SHA-256:
  `5ca3a02054c14c88078485d36abe88a0ce8b084ae9b81d77af739d178e77c6b3`
- Manifest SHA-256:
  `c28be4ad1312282d70e25eb579379f46c83bb4a96a18701e5a80ee1c628977ca`
- npm SHA-1: `c42df3b93d71dea6c71e0a848d4338e5995cb468`
- npm integrity:
  `sha512-H9MjK4RlMwiym6vzaa61fl57KNGetwe3QLMynmK8sK7u+MgPbLRE1LoS5YwMDa7NU2S6iarcYWZV0UILHRvb8g==`
- Inventory: 153 regular files, 144960 packed bytes, 562581 unpacked
  bytes.

The manifest matched extracted paths, sizes, and modes. Two independent
official repacks were byte-identical.

## Findings

**Medium — pack-time documentation audit false negatives.** In clean temporary
commits, official packing accepted absent root `CHANGELOG.md` and absent glob
`spec/definitely-absent*.md`. A direct absent
`spec/definitely-absent.md` was correctly rejected. The guard therefore did
not establish its stated inventory property.

**Medium — packed documentation prescribed source-only npm scripts.**
`README.md` and `packages/release-readiness/README.md` prescribed S10-S12 and
release-gate npm scripts that the consumer package intentionally strips.
Installed `npm run audit:s10:policy` failed with `Missing script`.

**Low — external-scheme false positive.** A temporary
`ssh://example.test/repository/docs/external.md` reference was treated as a
local missing `docs/external.md`; only HTTP(S) references were excluded.

## Executed checks that passed

- Independent SHA-1/SHA-256/SHA-512, gzip/tar, inventory, manifest, privacy,
  and credential scans.
- Offline tarball-only install with scripts and development dependencies
  disabled.
- Both bins, all three exports, direct six-tool MCP, governed write/scope
  denial, known failure, and retained packet verification.
- Five closed launcher-error cases.
- Canonical-path mutation corpus and corrected round-four canon/CASE
  instructions.

## Limits and false positives

No network, registry provenance, credentials, provider CLI, or publication
action was used. Dependencies came from local npm cache. A nested packaged
consumer-runner early close was treated as runner behavior after direct MCP
passed. Broad credential regex hits were environment-variable names only.
