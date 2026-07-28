# S10 private developer-preview candidate report

Date: 2026-07-27
Candidate source: `bffa5af6743e5f1331592b2cb5198e8e50df2ac8`
Source state: clean

## Artifact

- package: `@heart-ai-foundation/scopa@0.2.0-dev.1`
- filename: `heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- entries: 146
- packed bytes: 134553
- unpacked bytes: 514308
- SHA-256:
  `e647100c5b051fd5e0e522d0de40e632b2accf767fe07c32da1d4a0de96ee9db`
- npm shasum: `1cb34337c9449b9e62367c658d320c276f080fdb`
- npm integrity:
  `sha512-fhElXsdNtIpM5FqiI34JNSUWe1Z/VDogjsPeGx0WVKuMEuagLvw15ecKSKMUVHNTlWKjBJarBdfbPAMAKVwUNA==`

The retained private tarball independently reproduced the candidate SHA-256,
shasum, integrity, byte sizes, and entry count recorded by the consumer probe.

## Policy audit

All 37 closed release-policy checks passed. The canonical audit SHA-256 is:

`4b8e967dfb82e2df315291fcc77b0bb559cc6050534e5b9d7deef67f1ec74c02`

## Source-free consumer proof

- installed the exact local tarball without resolving to the source checkout
- found no absolute source-root references in installed files
- exposed exactly the six expected model-neutral MCP tools
- completed one allowed in-scope write
- rejected one escaping write with `SCOPA_SCOPE_DENIED`
- reached a real `satisfied`, `canStop: true` terminal state
- verified the retained native signed packet with caller-supplied trust policy
- preserved the known-failing fixture as exit 4,
  `SCOPA_COMPLETION_BLOCKED`, `canStop: false`

The private raw proof SHA-256 is:

`b9298fd189e3eda54d10faa6f82fd491a8e4b9d2102784198120095c22a65fa4`

The path-redacted proof is `consumer-proof.public.json`, whose SHA-256 is:

`8fe1ed4fa18b0e1ecf5014939ac77742eeb81aa1f1de8238258fef9c9c0f9c67`

Its publication receipt records two path substitutions and
`semanticFieldsChanged: false`.

## Finding resolved during proof

The first elevated probe found that artifact assembly used locale collation
while the candidate schema required deterministic code-point ordering. Commit
`bffa5af` replaced locale sorting with code-point sorting. The clean candidate
proof above was generated only after that correction.

## Boundary

This is a private local-tarball candidate. It is not an npm publication,
GitHub Release, public-repository authorization, production authorization,
formal certification, trademark claim, operating-system sandbox claim, or
full assurance transfer to Claude or Codex.
