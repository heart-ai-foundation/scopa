# S10 private developer-preview candidate report

Date: 2026-07-27
Candidate source: `be913542e1e723bc8ca499436ef727ac0b922926`
Source state: clean

## Artifact

- package: `@heart-ai-foundation/scopa@0.2.0-dev.1`
- filename: `heart-ai-foundation-scopa-0.2.0-dev.1.tgz`
- entries: 146
- packed bytes: 134871
- unpacked bytes: 515219
- SHA-256:
  `10e0173940c1730d3a812268e43a9ea7a32103ad169398ad693cb13d57ebc7db`
- npm shasum: `28d4d99e6810383a356714a5f3b3a43a145d5d5d`
- npm integrity:
  `sha512-l1zw9cJAtihj1mw5sXek/cA7ZzzV87NU05XkI/FKEpk0yOtNO1xspDBGxUk7r+Q+Etm19n8b6vFWFOwK4WXSag==`

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

`63b657d1f4c769b1c5dfbd79e9ea61b114c7e1d290e7a5ab2bc523f64d16d3ec`

The path-redacted proof is `consumer-proof.public.json`, whose SHA-256 is:

`87a229b100aa74a0becf9c8f2818be7feefdc0bade14d9ad18e83fe7df68f3fc`

Its publication receipt records two path substitutions and
`semanticFieldsChanged: false`.

## Findings resolved

The first elevated probe found that artifact assembly used locale collation
while the candidate schema required deterministic code-point ordering. Commit
`bffa5af` replaced locale sorting with code-point sorting. The clean candidate
proof above was generated only after that correction.

An initial tarball-only Claude Sonnet review returned `ACCEPT` with two low
documentation findings: offline timestamp revocation status was not explicit
enough, and requested model-alias provenance could be surfaced more directly.
Commit `be91354` added both boundaries to the packaged quickstart, threat
model, and claims. A fresh Claude Sonnet session then reran the independent
review against the new candidate bytes and returned `ACCEPT` with all ten
checks passing and zero findings. The exact structured reviews are retained as
`outside-review.initial.json` and `outside-review.final.json`.

## Boundary

This is a private local-tarball candidate. It is not an npm publication,
GitHub Release, public-repository authorization, production authorization,
formal certification, trademark claim, operating-system sandbox claim, or
full assurance transfer to Claude or Codex.
