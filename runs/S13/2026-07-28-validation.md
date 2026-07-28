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

## Round 3 exact candidate and reviews

Round 3 bound source
`e17bbc2acfb70cadad2511b1f1338ddc346fde74` to candidate SHA-256
`740cfc630cefde123b871dd2d7d1c1975a02c2f4edf8d3d0c8da82484ecaa5e0`
and 153 entries. Official packing, source-free proof, public-proof
regeneration, installed probe, 33-case parity, privacy, dependency, local, and
hosted gates passed.

Fresh isolated verdicts:

- artifact/distribution: `ACCEPT`;
- proof/evidence: `REJECT`, one medium canonical-path false green;
- runtime/containment: `REJECT`, one medium transcript omission and one low
  post-buffering size guard.

The evidence reviewer reproduced U+0000, newline, tab, and DEL paths accepted
by both candidate validators. The runtime reviewer reproduced parse and
oversize wire errors absent from the immediately following transcript. Round
3 cannot satisfy RQ2.

## Round 3 canonical-path and MCP-framing remediation

- shared runtime normalization and published schema reject C0/DEL controls;
- parity corpus grows to 37 cases: 3 accepts and 34 rejects;
- MCP stdio allocates a bounded frame buffer, discards excess input through
  the next newline, and uses fatal UTF-8 decoding;
- post-initialization parse and size failures are recorded as bounded
  `protocol_error` events without hostile content;
- direct installed stdio is exercised by an independent Python wire client;
- packed root documentation points only to shipped consumer paths;
- stale private installed-surface residue was replaced.

Post-remediation gates:

- accumulated discovered tests: 112/112;
- focused S7, S10, and S11 gates: pass;
- S8-S12 focused gates: 6/6, 8/8, 7/7, 9/9, 2/2;
- dependency audit: zero vulnerabilities;
- protocol and diff gates: pass.

Another clean candidate and three entirely new exact-byte reviews are required.

## Round 4 exact candidate and reviews

Round 4 bound source
`1d4239cc5a30226bbf41e263fb217b84fb7ecf04` to candidate SHA-256
`239ab6a4cfe6d6daf37f2e2fe0322782e1aca4cfdd8a0264641950aa03cba53e`,
153 entries, 144339 packed bytes, and 560284 unpacked bytes. Two official
repacks were byte-identical. The exact manifest, raw proof, public proof,
installed probe, 37-case parity corpus, collision corpus, dependency audit,
local gate, and hosted source gate passed.

Fresh isolated verdicts:

- artifact/distribution: `REJECT`, one medium packaged-documentation finding;
- proof/evidence: `ACCEPT`, no critical/high/medium finding;
- runtime/containment: `ACCEPT`, no critical/high/medium finding and one low
  documentation-precision finding.

The artifact reviewer found three local paths prescribed by packed
documentation but absent from the package inventory. The runtime reviewer
confirmed bounded framing but noted that a transient `Buffer.from` copy makes
literal raw-frame retention broader than the 1 MiB accumulation bound. Round
4 cannot satisfy RQ2.

## Round 4 documentation remediation

- the packed root README no longer sends consumers to unshipped canon files;
- the interop README installs the pinned CASE validator directly from its
  package coordinate;
- the MCP README states the 1 MiB frame-accumulation bound precisely;
- the official pack path audits every packed Markdown document against the
  actual npm inventory and rejects absent local references;
- a focused regression covers valid packed, external, and absent references.

A dirty-tree diagnostic pack exercised the new audit over the complete
153-file npm inventory and passed. The accumulated gate passed 113/113 tests,
the dependency audit found zero vulnerabilities, and the protocol and diff
checks passed. A new clean candidate and three entirely new exact-byte reviews
are required.

## Round 5 exact candidate

Clean source:
`18a50da693282760e1b912258fdaae1c5df049d4`

Official private round 5 candidate:

- filename: `heart-ai-foundation-scopa-0.2.0-dev.1.tgz`;
- SHA-256:
  `5ca3a02054c14c88078485d36abe88a0ce8b084ae9b81d77af739d178e77c6b3`;
- npm SHA-1: `c42df3b93d71dea6c71e0a848d4338e5995cb468`;
- npm integrity:
  `sha512-H9MjK4RlMwiym6vzaa61fl57KNGetwe3QLMynmK8sK7u+MgPbLRE1LoS5YwMDa7NU2S6iarcYWZV0UILHRvb8g==`;
- packed/unpacked bytes: 144960 / 562581;
- entries: 153;
- repeated official pack: byte-identical.

Exact private/public proof hashes:

- candidate manifest:
  `c28be4ad1312282d70e25eb579379f46c83bb4a96a18701e5a80ee1c628977ca`;
- raw proof:
  `3ad9aafcdd20c5e2f47423c5fb10cd8a0de316765bb7996392125811e3b90674`;
- public proof:
  `85a9a89d8aa9303a3651939adc1866514894f74f1cbbd27f76b265d112a67c5a`.

Source-free proof, installed-surface deterministic repack, 37/37 parity cases,
five redaction-collision cases, exact binding, package privacy, and dependency
audit pass. The hosted source run `30367246394`, job `90301551934`, passed all
14 recorded steps with no action-runtime/deprecation warning; the only generic
warning was Git's initial-branch-name hint.

Three entirely new isolated reviewers are assigned the exact round 5 bytes.
Their verdicts:

- artifact/distribution: `REJECT`, two medium findings and one low;
- proof/evidence: `ACCEPT`, no critical/high/medium/low finding;
- runtime/containment: `REJECT`, one medium finding.

The artifact reviewer proved missing-root and missing-glob false negatives in
the new documentation guard, a non-HTTP external-URI false positive, and
installed docs that prescribed contributor scripts absent from the consumer
package. The runtime reviewer proved that `seenRequestIds` and transcript
events grew for the lifetime of a hostile session even though each frame was
bounded. Round 5 cannot satisfy RQ2.

## Round 5 distribution and session-bound remediation

- documentation globs resolve against the real packed inventory rather than
  being skipped;
- conventional root documents participate in the audit;
- external URI schemes are excluded generically;
- contributor npm commands are explicitly source-checkout-only and installed
  consumers are directed to bins and exports;
- a session retains at most 2048 unique request IDs with 256-byte string IDs;
- transcript retention is capped at 1024 events and 4 MiB of canonical event
  payload;
- call/result capacity is reserved before tool execution, so exhaustion fails
  closed without mutation or unbounded error retention;
- stdio replies honor output backpressure before another frame is processed;
- focused tests exercise missing roots/globs, external schemes, request-ID
  exhaustion, transcript count exhaustion, transcript byte exhaustion, and a
  slow response consumer.

One fresh pre-candidate adversary found that other packed documents still
named stripped contributor scripts and that a roughly 600 KiB denied path
could exceed reserved result capacity, leaving an unfinished transcript call.
The follow-up makes source-checkout qualification a pack-time property across
all packed Markdown and rejects paths over 4096 UTF-8 bytes before transcript
admission without echoing them. The exact large-path case now returns a bounded
protocol error and leaves the transcript valid.

Post-remediation gates pass: 117/117 accumulated tests, S8-S12 focused gates,
zero dependency vulnerabilities, protocol synchronization, and diff checks.
A new clean candidate and three new exact-byte reviewers are required.

## Pending RQ3

- final hosted evidence-commit gate: pending;
- provider-side confirmation that affected Slack, OpenRouter, and Valyu
  credentials were rotated and old values invalidated: pending principal
  confirmation.

Only a boolean confirmation may be retained. Until both items pass, RQ3 and
the hardening queue remain open even if RQ1/RQ2 are green.
