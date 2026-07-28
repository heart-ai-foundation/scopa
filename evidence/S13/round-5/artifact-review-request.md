# S13 final artifact/distribution review request

Return `ACCEPT` or `REJECT` for these exact bytes:

- source commit:
  `18a50da693282760e1b912258fdaae1c5df049d4`
- private candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `5ca3a02054c14c88078485d36abe88a0ce8b084ae9b81d77af739d178e77c6b3`
- candidate manifest:
  `/home/dylan/scopa/evidence/S13/candidate-manifest.json`
- manifest SHA-256:
  `c28be4ad1312282d70e25eb579379f46c83bb4a96a18701e5a80ee1c628977ca`

Work source-free and offline from a fresh temporary directory for installed
behavior. Do not modify the repository, retained evidence, or candidate.
Do not use credentials.

Primary attack surface:

1. Recompute artifact hashes, inventory, modes, sizes, npm integrity, and
   deterministic official repacking from the exact clean source.
2. Install only the tarball with scripts disabled. Exercise both bins and all
   retained exports without source-tree or development dependencies.
3. Audit consumer metadata, lifecycle scripts, package privacy, special
   entries, aliases, private paths, credential patterns, and failure-envelope
   disclosure.
4. Inspect every packed Markdown document. Reproduce the round-four missing
   canon/CASE-documentation finding and determine whether all prescribed local
   resources are shipped or rewritten source-free.
5. Attack the new pack-time documentation-reference audit for false negatives
   or false positives using safe temporary copies/fixtures.
6. Confirm no publication, provenance, certification, or production claim is
   implied.

Report the exact source and candidate binding, commands actually executed,
static-only checks, false positives, limits, and severity-ranked findings.
`ACCEPT` requires no critical, high, or medium finding.
