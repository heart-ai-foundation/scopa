# S13 initial fresh proof/evidence review

Date: 2026-07-28
Reviewer: fresh isolated Codex subagent `s13_evidence_attack`
Source:
`e9b3c7003924df4db2be0298c3966bf1b95d2180`
Candidate SHA-256:
`2bc09658a8a0cda1221a14daa42a9daffe3f947d0f200876171b978306055466`
Raw proof SHA-256:
`246934fa4a27bb061e2c5850c3dd3197a47f3b9564f6cfcc9cbf221e6f92cea0`
Public proof SHA-256:
`f2df215b938a85b21d07f19ad1eb768008864039b19ee7b8a1f99f5d38aa44bc`
Repository changes: none
Verdict: `REJECT`

## Exact checks that passed

- All 152 candidate files, archive metadata, hashes, integrity, sizes, modes,
  and consumer metadata matched the clean commit and manifest.
- Runtime/published validators agreed over the shipped 24-case corpus and 40
  independently generated hostile rejection cases.
- Public proof regeneration was byte-identical and changed only
  `/environment/sourceRoot` and `/environment/temporaryRoot`.
- `semanticFieldsChanged: false` was truthful; the receipt bound the raw proof
  bytes; redaction collisions failed closed.
- No supplied private root or recognizable credential pattern occurred across
  the public files.
- Installed policy audit passed all 37 checks.
- Installed execution reproduced six tools, allowed/denied writes, satisfied
  terminal state, full fixture assurance, native verification, and the
  known-failing exit-4 state.

No assertion in the exact initial public proof was found false.

## Blocking findings

### S13-E-M1 — consumer-proof semantic false greens (`medium`)

Both official validator entry points accepted individual mutations that
replaced:

- `adapter.schema` with an unrelated non-empty string;
- the exact six-tool inventory with `["unrelated_tool"]`;
- `adapter.assurance` with an arbitrary non-empty level;
- `claimBoundary.verified` with an arbitrary assertion; or
- `claimBoundary.nonClaims` with an arbitrary boundary.

Because the v1 proof carries specific six-tool/full-assurance and claim
statements, accepting contradictory non-empty text permits a syntactically
green proof whose evidence and claims disagree.

Required remediation: make the adapter schema, sorted tool inventory,
assurance, verified claims, and non-claims exact v1 constants through the
shared published contract; add every mutation to parity and focused tests.

### S13-E-M2 — normalization-unsafe candidate paths (`medium`)

Both validators accepted `./CONTRIBUTING.md` and also accepted a manifest
containing both `./CONTRIBUTING.md` and `CONTRIBUTING.md` after entry-count
adjustment. Raw string uniqueness therefore did not prevent logical aliases.

Required remediation: accept only canonical POSIX-relative file paths; reject
empty, `.`, `..`, repeated-separator, backslash, absolute, and trailing-empty
segments; enforce normalized uniqueness in the shared candidate invariant and
add independent mutation cases.

## Claim boundary

This `REJECT` blocks RQ2 and invalidates the initial candidate as the S13 final
candidate despite the exact proof itself being truthful. Remediation must
produce new exact bytes and three fresh final reviews.
