# S10 validation — 2026-07-27

## Approved posture

- license: Apache-2.0
- contribution model: DCO 1.1 sign-off, no CLA
- candidate: `@heart-ai-foundation/scopa@0.2.0-dev.1`
- binaries: `scopa`, `scopa-mcp`
- channel: private local tarball only
- npm, GitHub Release, public repository, and production: unauthorized

## Exact candidate

- source commit:
  `be913542e1e723bc8ca499436ef727ac0b922926`
- source state: clean
- entries: 146
- packed/unpacked bytes: 134871 / 515219
- SHA-256:
  `10e0173940c1730d3a812268e43a9ea7a32103ad169398ad693cb13d57ebc7db`
- npm shasum: `28d4d99e6810383a356714a5f3b3a43a145d5d5d`
- npm integrity:
  `sha512-l1zw9cJAtihj1mw5sXek/cA7ZzzV87NU05XkI/FKEpk0yOtNO1xspDBGxUk7r+Q+Etm19n8b6vFWFOwK4WXSag==`

The identical tarball is retained in the private S10 evidence home.

## Source-free consumer proof

Command:

```sh
npm run probe:s10:consumer -- \
  --output /trusted/private/consumer-proof.raw.json
```

Results:

- local tarball install: exit 0, source-free, no source-root references
- model-neutral MCP inventory: exact six SCOPA tools
- governed allowed write: pass
- escaping write: `SCOPA_SCOPE_DENIED`
- terminal state: `satisfied`, `canStop: true`
- adapter assurance: `full` relative to the closed stream-only surface
- native signed packet: independently verified with caller trust policy
- exit-7 fixture: exit 4, `SCOPA_COMPLETION_BLOCKED`,
  `canStop: false`

The private raw proof SHA-256 is
`63b657d1f4c769b1c5dfbd79e9ea61b114c7e1d290e7a5ab2bc523f64d16d3ec`.
The public path-redacted proof SHA-256 is
`87a229b100aa74a0becf9c8f2818be7feefdc0bade14d9ad18e83fe7df68f3fc`.
Its receipt reports two substitutions and `semanticFieldsChanged: false`.

## Release-policy audit

`npm run audit:s10:policy` passes all 37 closed checks. The canonical report
SHA-256 is
`4b8e967dfb82e2df315291fcc77b0bb559cc6050534e5b9d7deef67f1ec74c02`.

The checks cover required surfaces, private package posture, exact license
text, binary and package allowlists, governance/security/contribution/claims
content, closed JSON Schemas, clean and known-failing fixtures, and retained
verification-fixture integrity.

## Outside-model review

Claude Sonnet received only the candidate tarball, redacted proof, and bounded
review request in a disposable directory.

Initial result: `ACCEPT`, twelve checks passing, with two low documentation
findings:

1. offline RFC 3161 verification did not state the
   `revocationStatus: "not-checked"` boundary prominently enough;
2. requested model-alias provenance could be more explicit.

Commit `be91354` addressed both in the packaged quickstart, threat model, and
claims. The entire consumer proof was regenerated against the new bytes. A
fresh Claude Sonnet session then returned `ACCEPT`, all ten checks passing,
and zero findings. Both structured reviews are committed under `evidence/S10`.

## Accumulated local release gates

- `npm test`: pass
  - 97 kernel, conformance, distribution, adapter, and release-readiness tests
  - 6 Claude integration tests
  - 8 Codex integration/parity tests
- required clean/fault conformance probes: pass with expected polarity
- `npm audit --json`: pass, 0 vulnerabilities across 14 dependencies
- `npm run audit:s10:policy`: pass, 37/37
- `git diff --check`: pass
- public evidence private-path scan: pass

## Hosted gate

Foundation-hosted run `30332097112` passed on exact pushed evidence commit
`6ecc581ec7e5bb6755a9522c52ad7c852897bbf6`.

All workflow steps passed: clean dependency installation, accumulated SCOPA
release gate, signed native-packet recovery, independent CASE validation, and
malformed-graph rejection.

## Claim boundary

This validates a private developer-preview tarball. It does not authorize npm
publication, a GitHub Release, public repository visibility, production use,
formal certification, trademark exclusivity, operating-system sandbox claims,
or transfer of the stream-only adapter's `full` assurance label to Claude or
Codex.
