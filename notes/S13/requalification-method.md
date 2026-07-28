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
Round 5 candidate source:
`18a50da693282760e1b912258fdaae1c5df049d4`
Round 6 candidate source:
`73a969293a6450134e6cce1e7cbcac47e9eea67f`
Round 7 candidate source:
`5a6b29832910db26497095289badb3e859bca48c`

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

The round 5 replacement candidate contains 153 entries and has SHA-256
`5ca3a02054c14c88078485d36abe88a0ce8b084ae9b81d77af739d178e77c6b3`.
Repeated official packing is byte-identical. Its candidate manifest, raw
source-free proof, public proof, installed receipt, parity receipt, collision
receipt, dependency audit, and hosted source gate agree on the exact clean
source and candidate. Three new isolated reviewers receive these bytes; prior
reviewers are not reused.

## Round 5 documentation and session-bound rejection

The fresh evidence reviewer accepted round 5. The artifact reviewer rejected
it after proving that the documentation guard missed absent root files and
absent glob patterns, misclassified non-HTTP external schemes, and allowed
packed documentation to prescribe npm scripts stripped from the installed
consumer. The runtime reviewer separately rejected it because request-ID and
transcript collections had no per-session count or byte ceiling.

The exact rejected bytes, proof material, receipts, requests, and reports are
retained. The narrow remediation resolves globs against the actual inventory,
recognizes conventional root documents, excludes URI schemes generically, and
labels contributor npm commands as source-checkout-only. Runtime sessions now
bound request-ID count and string-ID bytes, transcript event count, and
canonical event bytes. Call/result capacity is reserved before tool execution;
once exhausted, new calls fail before execution while wire errors remain
bounded without further retention.

A separate fresh pre-candidate adversary then found two gaps before new bytes
were minted: additional packed contributor documents still named stripped npm
scripts without qualification, and an approximately 600 KiB hostile path
could make a denial event exceed reserved result capacity and leave an
unfinished transcript call. All packed Markdown containing contributor npm
commands now requires an explicit source-checkout qualification. Read/write
paths are rejected above 4096 UTF-8 bytes before transcript admission or
filesystem resolution and are not echoed; the exact large-path poisoning case
retains a valid transcript.

## Round 6 exact candidate

Round 6 binds source
`73a969293a6450134e6cce1e7cbcac47e9eea67f` to candidate SHA-256
`ddabd2cf3e68e6065531ec59d21cd64548603940f94f5d0f1813fcf587548234`.
The candidate contains 153 entries, is 147435 packed bytes and 571866
unpacked bytes, and repeated official packing is byte-identical.

Its exact manifest, private raw proof, collision-safe public proof, installed
receipt, 37-case parity receipt, five-case collision receipt, dependency
audit, and hosted source gate agree on the same source and candidate. The
source hosted run passed without a Node action-runtime deprecation warning;
the only generic warning was Git's initial-branch-name hint.

Three entirely new isolated reviewers receive the round 6 bytes. Their
artifact assignment emphasizes the repaired root/glob/URI/documented-command
audit. Their evidence assignment emphasizes independent exact binding,
schema/runtime parity, hostile paths, and collision-safe publication. Their
runtime assignment emphasizes finite session state, pre-execution
call/result reservation, oversized-path poisoning, backpressure, containment,
and stable CLI exits.

The fresh proof/evidence reviewer rejected round 6 with two medium findings.
First, candidate-manifest paths had no UTF-8 byte bound, so megabyte-scale
hostile paths could validate and enter retained/public proof. Second, the
parity and dependency receipts lacked source/candidate/input bindings, and
the exact-consistency receipt did not name or hash them, allowing a stale
receipt to be transplanted while the matrix remained green. The reviewer also
reported a low mode-domain weakness. The exact round 6 inventory is clean,
and its parity conclusion was independently reproduced, but those facts do
not repair the false-green contract/evidence boundary. Round 6 cannot satisfy
RQ2 and must be retained.

The fresh artifact reviewer also rejected round 6. Safe hostile fixtures
proved that the documentation audit skipped unresolved root globs and treated
one unrelated `source checkout` phrase as qualifying every contributor npm
command in a document. The reviewer also reported a possible medium
spawned-client startup race requiring independent reproduction because the
managed environment has previously suppressed nested Node stdio, and a low
reflection of a caller-supplied absolute path. The two documentation findings
are independently sufficient to retain the rejected candidate.

Independent root reproduction adjudicated the spawned-client report as a
managed-sandbox false positive. The exact installed workflow reproduced the
early close inside nested-process pipe suppression, then passed unchanged
outside that sandbox with all six tools, an allowed write, scope denial,
satisfied terminal state, full deterministic-fixture assurance, and a valid
11-event transcript. No runtime change is justified by that finding. The two
documentation findings remain release-blocking.

The first fresh runtime review attempt was automatically refused before
producing a result. It is recorded only as an orchestration failure and is
replaced by a newly created reviewer; it does not count toward RQ2 and does
not change the candidate verdict.

The replacement runtime reviewer returned `REJECT`. It executed a high
same-filesystem hardlink escape: `scopa_read_file` returned an outside file
through an in-repository hardlink even though the governed write path denied
that alias. Static review also found a medium revalidation/open race on
pathname-based writes. All requested CLI exit, MCP session-size, transcript,
oversized-path, recovery, backpressure, false-green, and launcher checks
otherwise conformed.

The narrow remediation rejects multi-link read targets before content is
returned. Governed writes no longer reopen a validated pathname directly:
the reference host receives the authorization, the boundary binds the
authorized parent directory by device/inode and descriptor, writes and syncs
a private single-link temporary file, and atomically renames it through that
descriptor. A regression swaps the parent after final revalidation and proves
that neither the moved authorized directory nor outside replacement receives
the write.

## Round 6 remediation

Candidate paths are capped at 4096 UTF-8 bytes before evidence admission, and
the manifest mode domain is closed to `0644` and `0755`. The shared contract
corpus now has 41 cases, including candidate-path and mode boundary attacks.

Bound parity evidence records the source commit plus the candidate, manifest,
corpus, validator-set, and per-input hashes. The next exact-consistency
receipt names and hashes every release receipt; dependency evidence binds the
source commit, candidate, and lockfile instead of standing alone.

Packed-document auditing now recognizes root-level globs and qualifies source
checkout prescriptions in their own local command context. Together with the
hardlink and descriptor-bound write changes, the accumulated gate passes all
119 discovered tests. A newly packed candidate and three fresh reviewers are
still required; no prior rejection is displaced.

## Round 7 exact candidate

Round 7 binds clean source
`5a6b29832910db26497095289badb3e859bca48c` to candidate SHA-256
`6a8d6db6c07db772a4cba32912995472e017ee4f4bee3290f44fe9baf04c4692`.
The official package has 153 regular entries, 150104 packed bytes, and 584212
unpacked bytes. Two independent official repacks and regenerated manifest
bytes are identical.

The exact-consistency receipt hashes and checks the manifest, raw and public
proofs, installed-surface result, bound 41-case parity result, collision
result, lockfile-bound dependency audit, and hosted source gate. Every named
binding matches. Public proof regeneration is byte-identical and changes only
the two designated environment fields.

Hosted run `30377371496`, job `90336372272`, passed against the exact source.
The retained generic warning is Git's initial-branch-name hint; there is no
Node action-runtime deprecation warning. Three newly created reviewers must
still independently attack these exact bytes.

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
