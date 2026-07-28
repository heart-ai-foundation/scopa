# S13 validation — 2026-07-28

## Authority and boundary

- active authority: S13 Fresh-Agent Adversarial Release Requalification;
- branch: `main`;
- remote: private `heart-ai-foundation/scopa`;
- no npm publication, GitHub Release, visibility change, deployment, customer
  action, or public announcement;
- no credential value retained or accessed by reviewers.

## Initial exact-candidate round

The initial candidate bound source
`e9b3c7003924df4db2be0298c3966bf1b95d2180` to SHA-256
`2bc09658a8a0cda1221a14daa42a9daffe3f947d0f200876171b978306055466`
and 152 entries. Its source-free and local gates passed.

Three fresh isolated reviewers executed non-overlapping artifact, evidence,
and runtime assignments. Artifact and runtime returned `ACCEPT`; evidence
returned `REJECT` with two medium findings:

1. consumer-proof v1 accepted unrelated adapter schema/tool/assurance and
   arbitrary verified/non-claim text;
2. candidate manifests accepted normalization aliases such as `path` and
   `./path`.

The initial tarball, manifest, raw proof, requests, and reports were retained.
It is not the final S13 candidate and cannot satisfy RQ2.

## Remediation

Implementation commits:

- `8615988` — exact v1 adapter/claim constants, canonical candidate-path
  enforcement, 33-case parity corpus, focused regressions, protocol-scope
  correction, and initial reports;
- `11a79b3` — file-backed outer proof-command capture;
- `1ad57a8` — installed consumer fixture import path;
- `9c64b6c` — transport-independent installed bridge/MCP proof execution.

The official consumer-proof command originally exposed the same runner
nested-child stdio suppression already observed during S12 and the initial
reviews. The final design imports the installed packaged fixture and runs the
installed bridge/MCP handler in the proof process. Real installed
`scopa-mcp` newline stdio remains covered by the release gate,
installed-surface probe, and fresh runtime review.

## Round 2 exact candidate

Clean source:
`9c64b6c25e217da18767c6aedda811b755bbbe63`

Official private round 2 candidate:

- filename: `heart-ai-foundation-scopa-0.2.0-dev.1.tgz`;
- SHA-256:
  `0f47bd929a0ae7db2237c86efb2785640345a5eaec7d2782b49d681eb5c4d346`;
- npm SHA-1: `1e84cc38ab2af0432c8e51ebc9fd20c911b712bb`;
- npm integrity:
  `sha512-J8wp7+C966XI/F07ikr+h1wr4jME2KRbXFJcyWY36LlKGhj6xQpq/nmbb9K+/uawzlBCC3JzqwEk/81U7k0vFQ==`;
- packed/unpacked bytes: 143332 / 555860;
- entries: 153;
- repeated official pack: byte-identical.

The tarball and raw proof are owner-readable only under the retained private
round 2 evidence directory.

## Round 2 source-free proof

Command:

```sh
npm run probe:s10:consumer -- \
  --output llm-memories/projects/scopa/evidence/S13/final/consumer-proof.raw.json
```

Result: pass.

- installation exit 0, source-free, zero monorepo-relative reference;
- exact six-tool installed adapter;
- allowed write true and scope denial true;
- terminal satisfied / `canStop: true`;
- deterministic-fixture assurance `full`;
- native packet verification exit 0 / `ok: true`;
- known failure exit 4 / `SCOPA_COMPLETION_BLOCKED` /
  `canStop: false`.

Raw proof SHA-256:
`ed855373015fd53cfe9c56ea664d9ed515e27b57c0678fb132c86a21af35f149`.

Public-proof command:

```sh
npm run publish:s10:proof -- \
  --input llm-memories/projects/scopa/evidence/S13/final/consumer-proof.raw.json \
  --output evidence/S13/consumer-proof.public.json
```

Result: pass. Public proof SHA-256:
`bce38bbad4e6814df63e7db569d089ba9b1794e55e81d59ea9f36af1ec33dabd`.
Only the two designated environment roots changed,
`semanticFieldsChanged: false`, the receipt bound the exact raw digest, and
independent regeneration was byte-identical.

## Contract, collision, installed, and dependency gates

- runtime/published parity: 33 cases, 3 expected accepts, 30 expected rejects,
  full agreement and expected outcomes;
- both initial medium mutation families: rejected identically;
- exact/substr collision and reserved placeholder: rejected;
- equal/overlapping designated roots: safe with semantic preservation;
- installed-surface probe: deterministic exact candidate, both bins, all
  three exports, zero consumer scripts, five closed launcher cases, and zero
  privacy finding across 153 files;
- `npm audit --json`: exit 0, zero info/low/moderate/high/critical
  vulnerability across 19 dependency relationships.

## Accumulated local gate

Commands:

```sh
npm test
npm audit --audit-level=low
npm run protocol:check
git diff --check
```

Result before final evidence assembly: pass.

- accumulated discovered tests: 110/110;
- Claude focused gate: 6/6;
- Codex/parity focused gate: 8/8;
- S10 focused gate: 7/7;
- S11 focused gate: 9/9;
- S12 focused gate: 2/2;
- clean/fault replay and containment probes retained expected polarity.

## Round 2 fresh-review round

Three new isolated reviewers were assigned the replacement candidate:

- artifact/distribution: `ACCEPT`, no critical/high/medium finding;
- proof/evidence and explicit initial-finding reproduction: `ACCEPT`, no
  critical/high/medium finding;
- installed runtime/containment: `REJECT`, one medium finding.

The runtime reviewer found that journal-root, signature, INFER-pin,
timestamp-signer, and timestamp-authority tampering all failed closed but
returned exit `1` rather than documented verification exit `5`. The round 2
candidate cannot satisfy RQ2.

## Round 2 runtime-contract remediation

The CLI now wraps only parsed evidence/trust verification and CASE recovery in
typed `SCOPA_EVIDENCE_VERIFICATION_FAILED` results. File reads remain outside
that boundary, preserving exit `1` for unreadable input or trust roots, while
syntax remains exit `2`. Source and installed-package regressions reproduce
the five reported tamper classes and both exit controls.

Post-remediation local result:

- focused CLI gate: 8/8;
- accumulated discovered tests: 111/111;
- S8-S12 focused gates: 6/6, 8/8, 7/7, 9/9, 2/2;
- protocol gate: pass.

A new clean candidate and three entirely new reviews are required before RQ2
can close.

## Pending RQ3

- final hosted evidence-commit gate: pending;
- provider-side confirmation that affected Slack, OpenRouter, and Valyu
  credentials were rotated and old values invalidated: pending principal
  confirmation.

Only a boolean confirmation may be retained. Until both items pass, RQ3 and
the hardening queue remain open even if RQ1/RQ2 are green.
