# S13 round 6 artifact/distribution review request

Return `ACCEPT` or `REJECT` for these exact bytes:

- source commit:
  `73a969293a6450134e6cce1e7cbcac47e9eea67f`
- private candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/final/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `ddabd2cf3e68e6065531ec59d21cd64548603940f94f5d0f1813fcf587548234`
- candidate manifest:
  `/home/dylan/scopa/evidence/S13/candidate-manifest.json`
- manifest SHA-256:
  `51e670f3941edc82d63373055991754bafa08f33de99c79e56125cdb0d7fe3fb`

Work source-free and offline from a fresh temporary directory for installed
behavior. Do not modify the repository, retained evidence, or candidate. Do
not use credentials.

Primary attack surface:

1. Recompute artifact hashes, inventory, modes, sizes, npm integrity, and
   deterministic official repacking from the exact clean source.
2. Install only the tarball with scripts disabled. Exercise both bins and all
   retained exports without source-tree or development dependencies.
3. Audit consumer metadata, lifecycle scripts, package privacy, special
   entries, aliases, private paths, credential patterns, and failure-envelope
   disclosure.
4. Inspect every packed Markdown document, including conventional root
   documents. Require prescribed local files and glob patterns to resolve
   within the package, and distinguish generic external URI schemes from
   local references.
5. Find every `npm test`, `npm audit`, and `npm run` prescription in packed
   Markdown. Confirm each contributor-only command is explicitly qualified as
   requiring a source checkout and installed instructions use available bins
   or exports.
6. Attack the pack-time documentation checks for root-file, glob, URI-scheme,
   and unqualified-npm false negatives or false positives using safe temporary
   copies or fixtures.
7. Confirm no publication, provenance, certification, or production claim is
   implied.

Report the exact source and candidate binding, commands actually executed,
static-only checks, false positives, limits, and severity-ranked findings.
`ACCEPT` requires no critical, high, or medium finding.
