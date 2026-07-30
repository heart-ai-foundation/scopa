# RC1 resource-bound evidence implementation note

Date: 2026-07-30  
Status: implementation input; no candidate or provider run authorized  
Scope: SCOPA-RC1 experiment, separate from S16/S16R2/S16R3
Repository context at creation:
`a4d7ad8325c204d87440b4dfd31dfb4ee2dfa33e`

## Why this exists

The external SCOPA-RC1 Ruptures 244 pilot demonstrated correct autonomous
codebase work but failed its sealed resource policy. The agent changed only
the authorized implementation file, corrected the minimum-segment boundary,
passed four independent hidden cases, and passed all 178 targeted upstream
tests. The run nevertheless terminated as
`provider-usage-limit-exceeded`, with runtime `canStop: false`, because
provider-reported input use exceeded the prospective ceiling.

This is a retained non-scored engineering qualification failure. It must not
be replayed, reclassified as a successful experimental observation, or used
in the scored SCOPA-RC1 numerator.

## Bound pilot evidence

- Pilot policy ID:
  `SCOPA-RC1-PILOT-RUPTURES-244-LIVE-01`
- Pilot SCOPA source commit:
  `4e3be5583682804acd3ffeb59918af3ffff98782`
- Pilot package SHA-256:
  `f80a1dfed14afbc83fcf7ff47ea9a88f95e5961d78990583df1a3923b1c4b000`
- Policy payload SHA-256:
  `2fd4af6ef71b9064a0536b882ef06c9416d11c524363cd4374815992ac988d31`
- Private host-ledger receipt SHA-256:
  `2b0bde4d4debe1571b18a23235cb7fd18d9ff07da65069c959a307bac17dfd04`
- Sanitized qualification-result SHA-256:
  `60b4dba807c501f65d0c095b68d22c9d55fc02fa6e6e5b1d25d9dc22c23fd39b`
- Resource-bound amendment SHA-256:
  `d4befa8e8532823a29a6367b2425091502db4d3c6b32520603b3da30d45362d1`
- Updated RC1 manifest payload SHA-256:
  `187828f558269129280a51c316031f1ed32309f2614520ae117d2f06ca444b2c`

No raw provider stream, private evidence path, credential, or customer data is
included in this repository note.

## Observed result

The live run used only the six advertised SCOPA MCP tools. Its seven calls
were orientation, two contained reads, one governed write, check, assurance,
and transcript. No tool call failed, no out-of-scope material path changed,
the independent hidden verifier passed 4/4 cases, and the post-run SCOPA check
passed both the visible boundary gate and 178/178 targeted regression tests.

Provider-reported use was 141,520 input tokens, 89,088 cached input tokens,
1,957 output tokens, and 121 reasoning-output tokens. The counted total under
the Codex `0.146.0` integration formula was 143,598 tokens. The sealed pilot
allowed 60,000 input and 66,000 counted total tokens.

The serialized `scopa_check` result was 16,232 bytes. The serialized
`scopa_transcript` result was 38,291 bytes, and the normalized run record was
112,909 bytes. The transcript repeated prior request and result material,
including source content, write content, and verification output already
returned through earlier calls. This repetition is the implementation issue
to correct.

## Required architecture

The correction is a dual-channel evidence contract, not output truncation.

The host evidence channel must remain lossless. It must persist complete gate
commands, stdout, stderr, exit states, durations, timeout and truncation
states, full adapter events, provider capture, repository snapshots, changed
paths, process cleanup, terminal state, and independent-verifier results. The
host record must use no-overwrite persistence and canonical digests.

The agent evidence channel must be bounded. `scopa_check` should return the
slice and lock identity, `status`, `canStop`, failed-gate identifiers, and
per-gate decision metadata. Per-gate metadata must include identifier, pass
state, exit code, timeout state, duration, stdout/stderr byte counts and
SHA-256 digests, and truncation state. Passing command output need not be
returned to the model. Failed output may include a combined preview of at
most 2,048 UTF-8 bytes.

`scopa_transcript` should return session and client identity, launcher-declared
provider and model identity, protocol version, terminal state, event count,
and an ordered event index. Each event index entry should contain sequence,
kind, tool, effect, outcome, request-identity digest, argument digest, result
digest, and a digest-addressed host-evidence reference. The session request,
source reads, write bodies, and prior gate output must not be repeated.

The Codex normalizer must compare observed MCP calls and results with the
compact transcript hashes and the retained full host journal. It must fail
closed on missing events, sequence changes, tool/effect/outcome mismatches,
argument or result mismatches, terminal conflict, unresolved evidence
references, noncanonical payloads, or incomplete journal persistence.

## Host journal requirement

Compacting MCP responses removes full gate and transcript material from the
provider stream. The existing provider capture therefore cannot remain the
only full-evidence source.

The adapter launcher needs an explicit private evidence sink controlled by
the host. One viable design is a launcher-created, mode-`0600`, no-replace
journal path passed to the adapter outside the repository. The adapter writes
full events and gate results before returning compact MCP responses. After
the provider process terminates, the integration reads and validates the
journal, verifies every compact digest, binds the journal digest into the
live receipt, and only then permits an accepted terminal result.

A crash or incomplete journal must leave a consumed intent or inflight record
and must not permit replay. Hashes without retained referents are not
evidence.

## Prospective bounds

The RC1 amendment sets the following hard per-run ceilings:

- 180,000 input tokens
- 4,000 output tokens
- 2,000 reasoning-output tokens
- 186,000 counted total tokens
- 20 MiB provider capture
- 16,384 serialized bytes for `scopa_check`
- 16,384 serialized bytes for `scopa_transcript`
- 16,384 serialized bytes for `scopa_assurance`
- 2,048 combined preview bytes for failed gate output

For Codex CLI `0.146.0`, counted total is
`input_tokens + cache_write_input_tokens + output_tokens +
reasoning_output_tokens`. `cached_input_tokens` is reported separately and is
not double-counted. A client or provider accounting change reopens
qualification.

## Likely implementation surfaces

The implementation is expected to affect these ownership areas:

- `packages/enforcement/src/gate-runner.js`
- `packages/adapter-host/src/bridge.js`
- `packages/adapter-host/src/transcript.js`
- `packages/adapter-host/src/cli.js`
- `packages/adapter-host/src/mcp-stdio.js`
- `packages/integrations/codex/src/normalize.js`
- `packages/integrations/codex/src/run.js`
- adapter-host, enforcement, and Codex live-hardening tests

The six-tool MCP inventory should remain unchanged. Existing tool names and
the requirement to report `canStop` exactly should remain stable.

## Required deterministic evidence

Before a new RC1 candidate can be proposed, tests must demonstrate:

1. canonical equivalence between full journal payloads and compact hashes;
2. rejection of altered arguments, results, ordering, terminal state, or
   evidence references;
3. preservation of pass, fail, denied, timeout, false-completion, and
   output-truncation states;
4. enforcement of every serialized response bound;
5. no-overwrite journal behavior and incomplete-journal failure;
6. process cleanup and absence of accepted orphan state;
7. successful reconstruction of complete host evidence without consulting
   model narrative; and
8. unchanged six-tool inventory and SCOPA-only mutation behavior.

## Candidate and qualification boundary

The pilot candidate at `4e3be558...` is immutable. Current repository HEAD,
future commits, or an unpacked worktree must not be represented as that
candidate. Implementation of this note creates a new candidate identity and
requires a clean package digest.

After deterministic tests pass, one fresh non-scored provider qualification
must use a distinct disposable fixture excluded from the 12 scored RC1 work
units. It requires separate policy sealing and explicit provider
authorization. No provider invocation, release, deployment, assurance
upgrade, or scored execution is authorized by this note.
