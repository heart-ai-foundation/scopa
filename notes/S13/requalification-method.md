# S13 release-requalification method

Date: 2026-07-28
Authority:
`next-prompt-protocols/active/2026-07-28-S13-fresh-agent-adversarial-release-requalification.md`
Initial candidate source:
`e9b3c7003924df4db2be0298c3966bf1b95d2180`
Round 2 candidate source:
`9c64b6c25e217da18767c6aedda811b755bbbe63`
Round 3 candidate source:
`e17bbc2acfb70cadad2511b1f1338ddc346fde74`
Round 4 candidate source:
`1d4239cc5a30226bbf41e263fb217b84fb7ecf04`

## Exact-candidate boundary

S13 evaluates one private npm candidate at a time, not a mutable checkout. The
initial official packer run produced
`heart-ai-foundation-scopa-0.2.0-dev.1.tgz` with SHA-256
`2bc09658a8a0cda1221a14daa42a9daffe3f947d0f200876171b978306055466`.
Repeated official packing returned byte-identical output. The retained private
tarball and raw consumer proof live only in the SCOPA evidence home under
`llm-memories/projects/scopa/evidence/S13/`.

Every public receipt and outside report must bind both that full source commit
and candidate digest. Repository evidence may retain the complete
non-sensitive file inventory and exact hashes, but not the tarball, raw private
paths, credentials, or rotation material.

The initial proof/evidence reviewer returned `REJECT` after finding that
consumer-proof v1 admitted semantic adapter/claim drift and candidate paths
admitted normalization aliases. The initial candidate is retained privately
and cannot satisfy RQ2.

The remediation makes the v1 adapter schema, exact sorted six-tool inventory,
full deterministic-fixture assurance, verified claims, and non-claims
constants of the shared published contract. Candidate paths now pass one
shared canonical POSIX-relative rule at pack and validation time; empty, dot,
dot-dot, repeated-separator, trailing-separator, backslash, absolute, Unicode
normalization drift, and normalized-alias states fail closed.

The round 2 replacement candidate contains 153 entries and has SHA-256
`0f47bd929a0ae7db2237c86efb2785640345a5eaec7d2782b49d681eb5c4d346`.
Repeated official packing is byte-identical.

## Executable requalification

The source-free consumer proof installs only the candidate tarball into a
disposable directory. It exercises:

- both installed bins and every retained export;
- absence of consumer lifecycle scripts and development dependencies;
- a governed allowed write and an escaping-write denial;
- satisfied terminal state and deterministic fake-agent assurance;
- the known-failing completion control;
- native signed-packet verification with caller-supplied trust inputs;
- default launcher errors and explicit diagnostic opt-in; and
- structural package privacy and credential-pattern scanning.

The proof runner imports the installed packaged consumer fixture and exercises
the installed adapter bridge and MCP message handler in-process. This avoids a
runner-specific nested-child stdio suppression while preserving the exact
protocol sequence and installed-byte boundary. The installed `scopa-mcp`
binary's real newline-stdio path remains independently exercised by the
accumulated gate, installed-surface probe, and fresh runtime reviewer.

The S11 proof differential and collision corpora and the S12 installed-surface
matrix are rerun or exactly bound to the same candidate. Public-proof
reproduction must be byte-identical, redact only the two designated
environment roots, and compute `semanticFieldsChanged: false`.

## Round 2 runtime rejection

The fresh artifact and evidence reviewers accepted round 2. The fresh runtime
reviewer rejected it with one medium machine-interface finding: journal-root,
signature, INFER-pin, timestamp-signer, and timestamp-authority tampering all
failed closed, but returned generic runtime exit `1` instead of the documented
verification exit `5`.

The rejected bytes and three reports are retained. The narrow remediation
places JSON/evidence verification and CASE recovery behind one typed CLI
verification boundary while leaving input and trust-root file reads outside
that boundary. Invalid evidence and trust policy therefore return stable code
`SCOPA_EVIDENCE_VERIFICATION_FAILED` with exit `5`; unreadable files remain
runtime/configuration exit `1`, and command usage remains exit `2`. Source and
installed-tarball regressions cover the five reported mutation families and
the exit `1`/`2` controls. All three final reviews must be rerun by new agents
against newly packed bytes.

## Round 3 evidence and runtime rejection

The round 3 artifact reviewer accepted the exact candidate. The evidence
reviewer rejected it because runtime and published candidate validators
accepted U+0000 and other control-bearing file paths despite claiming
canonical POSIX-relative paths. The runtime reviewer separately rejected it
because post-initialization parse and oversize transport errors failed closed
on the wire but bypassed the forensic transcript. The 1 MiB guard also ran
only after full-line buffering.

The rejected bytes and reports are retained. Candidate paths now reject the
entire C0/DEL control range in the shared normalizer and shipped schema; the
installed parity corpus includes explicit NUL, LF, tab, and DEL cases. MCP
stdio now uses a byte-capped streaming frame decoder, rejects invalid UTF-8,
discards oversize bytes through the next frame boundary, and records bounded
parse/size errors after initialization without retaining hostile frame
content.

The direct installed-stdio regression uses an independent Python wire client
and reproduces the parse/oversize transcript events on the packed binary.
This preserves real binary coverage while avoiding the managed runner's
reproduced nested-Node pipe suppression. The packed README now points only to
shipped consumer documentation, and the stale private installed receipt was
replaced with the exact round 3 receipt before the next candidate.

## Round 4 documentation rejection

Round 4 bound source
`1d4239cc5a30226bbf41e263fb217b84fb7ecf04` to candidate SHA-256
`239ab6a4cfe6d6daf37f2e2fe0322782e1aca4cfdd8a0264641950aa03cba53e`.
The fresh evidence and runtime reviewers accepted the exact bytes. The fresh
artifact reviewer rejected them because packed documentation referenced two
unshipped canon files and an unshipped Python requirements file. Although the
runtime reviewer accepted, it also noted that the documented 1 MiB frame
retention bound described accumulation plus a transient parse copy too
broadly.

The rejected bytes, receipts, requests, and reports remain retained. The
narrow remediation makes the consumer artifact describe its shipped
reviewable contract, gives a source-free pinned CASE installation command,
and clarifies that the 1 MiB bound applies to frame-accumulation state. The
official packer now scans every packed Markdown document and rejects local
documentation references that are absent from the candidate inventory.

## Fresh-review separation

Three newly created, isolated reviewers receive non-overlapping primary
surfaces:

1. artifact inventory, deterministic packing, installed metadata, bins,
   exports, package privacy, and source-free distribution;
2. runtime/published schema parity, redaction collisions, public/private proof
   truthfulness, and exact hash binding; and
3. installed runtime behavior, scope containment, known failure, launcher/MCP
   validation, signature/trust rejection, and false-green resistance.

Each reviewer works in a fresh temporary consumer directory, makes no
repository change, uses no network or real credential, distinguishes commands
from static inspection, and returns `ACCEPT` or `REJECT`. RQ2 requires all
three to return `ACCEPT` with no critical, high, or medium finding.

An automated reviewer-execution refusal is recorded as an orchestration
failure and replaced with a fresh reviewer; it is neither counted as an
acceptance nor treated as a product finding.

## Credential prerequisite

S13 does not perform or document credential rotation. RQ3 requires the
principal to confirm that the affected Slack, OpenRouter, and Valyu
credentials were rotated provider-side and their old values invalidated.
Only a boolean confirmation and provider names may be retained. Values,
screenshots, old-token fragments, and rotation secrets are forbidden.

Without that confirmation, RQ1 and RQ2 may be evidenced but the hardening
queue remains open.

## Claim and release boundary

Fresh-review agreement is evidence about this exact private candidate. It is
not provider attestation, formal certification, a production guarantee, or
permission to publish.

S13 authorizes no npm publication, GitHub Release, repository visibility
change, deployment, customer use, public announcement, new integration,
consumer-surface reduction, or weakening of established enforcement and trust
semantics.
