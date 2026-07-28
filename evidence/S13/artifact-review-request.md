# S13 round 7 artifact/distribution review request

Return `ACCEPT` or `REJECT` for these exact bytes:

- source commit:
  `5a6b29832910db26497095289badb3e859bca48c`
- private candidate:
  `/home/dylan/llm-memories/projects/scopa/evidence/S13/round-7-candidate/heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- candidate SHA-256:
  `6a8d6db6c07db772a4cba32912995472e017ee4f4bee3290f44fe9baf04c4692`
- candidate manifest:
  `/home/dylan/scopa/evidence/S13/candidate-manifest.json`
- manifest SHA-256:
  `8b503078366e0d1fb5c5f407fe60cf05df45feef4e623333d3ad8252710fb131`

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
   copies or fixtures. Include exact `Z*.md`-style root globs and a document
   containing an unrelated `source checkout` phrase far from an installed-user
   npm prescription.
7. Confirm manifest paths over 4096 UTF-8 bytes and modes outside `0644` /
   `0755` fail both the runtime and published contracts.
8. Confirm no publication, provenance, certification, or production claim is
   implied.

Report the exact source and candidate binding, commands actually executed,
static-only checks, false positives, limits, and severity-ranked findings.
`ACCEPT` requires no critical, high, or medium finding.
