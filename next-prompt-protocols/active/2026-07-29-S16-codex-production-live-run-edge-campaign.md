# S16 — Codex Production Live-Run Edge Campaign

**Class:** `arc`
**Module:** `codex-live-hardening`
**Crosses:** [`live-run-custody`, `adapter-host`, `conformance`]
**Advances contracts:** [`CXH1`, `CXH2`, `CXH3`]
**Compound:** false

## Why this exists

S15 closed the Claude production-live boundary with deterministic fault
controls and direct bounded provider evidence. Codex already has a four-outcome
S9 proof, but it has not yet been exercised through the shared S14 custody
contract across current-client drift, provider refusal, timeout, truncated or
malformed events, usage/capture limits, termination, repeated sessions, and
provider-owned residue.

Claude evidence cannot be transplanted to Codex. The clients expose different
native surfaces, event formats, authentication boundaries, usage accounting,
and persistence behavior while retaining the same `partial` assurance limit.

## Next objective

Build and execute an independently bounded Codex headless edge campaign against
one exact installed SCOPA candidate. Freeze a complete account, network,
model, native-sandbox, MCP-tool, time, turn, usage/cost, evidence-retention,
and cleanup policy before any provider call. Prove every edge class with
deterministic controls first, then execute only a separately approved live
subset and remediate only reproduced Codex boundary defects.

Activation of S16 does not itself authorize or start provider traffic. The
provider gate remains closed until the complete policy, exact scenario count,
aggregate allowance, private evidence destination, and stop conditions are
materialized and explicitly approved.

## Current checkpoint

The complete policy is materialized with four scenarios, per-run and aggregate
token ceilings, a private evidence destination class, retention, cleanup,
environment, and fourteen stop conditions. On 2026-07-29 the principal
explicitly approved the exact four-call allowance, aggregate token ceiling,
and private S16 destination. Its digest-bound authorization state was
`authorized`; provider execution has not completed.

Installed qualification first caught a shipped private-topology reference in
the public policy contract and invalidated that candidate. The remediated
contract uses the public alias `SCOPA_PRIVATE_EVIDENCE_ROOT/S16`, whose
concrete operator mapping is retained outside the package.

Exact source `15da461ee3ca2b3fd8dd4d555a62cffb2d07e20a` passed the generic
installed-surface probe, all 21 deterministic scenarios, and hosted release
gate `30516378273`. Its 174-entry package SHA-256 is
`ecc0a1212195246c14e8a488526b43627c162b6986dc20b86cf800fc17f5c6c4`.

The production command then stopped during its local client-version probe:
the candidate required Codex CLI `0.145.0`, while the installed client was
`0.146.0`. Structural custody evidence proves that the provider launcher did
not start and zero calls were consumed. The stop also reproduced a
campaign-level accounting/reporting defect: an invocation intent was counted
before provider launch and the exact `version-drift` terminal was obscured by
a generic normalization error.

The narrow remediation pins `0.146.0`, marks whether provider launch actually
started, counts only launched provider invocations, and reports the precise
pre-provider or post-launch terminal. Deterministic regressions prove that
client-version and MCP-inventory drift consume zero calls. The stopped attempt
is not replayable and its committed gate remains
`closed-pending-explicit-approval`.

The principal separately approved the fresh S16-v2 posture on 2026-07-29.
Policy ID `S16-v2-production-live-v1`, scenario version `S16.v2`, digest
`c159b0f24c78e3625fa385eb8f9c13c5375d7d130ca19deeae1ea555eb313d95`,
and the fresh `S16R2` evidence namespace distinguish it from the stopped
attempt. It permits exactly the same four one-turn `gpt-5.4` scenarios and
resource ceilings and stops on the first failure.

Exact candidate `4e3be5583682804acd3ffeb59918af3ffff98782`, package SHA-256
`f80a1dfed14afbc83fcf7ff47ea9a88f95e5961d78990583df1a3923b1c4b000`,
all 21 deterministic outcomes, and hosted gate `30519332442` passed before
provider traffic. The clean provider scenario then completed with correct
polarity, six SCOPA-only tools in order, bounded usage, and process cleanup.
SCOPA nevertheless stopped and rejected campaign qualification because the
isolated Codex client store exceeded its 2 MiB content-hash audit bound.
Denied, false-green, and cold-restart were not launched. The v2 gate is closed
and cannot be replayed.

The narrow hardening changes future store inspection to metadata-audit
oversized files without reading their content. Unexpected provider-store
residue still fails closed. Baseline stores containing an oversized,
content-ambiguous file are rejected before provider traffic; symlinks,
special files, entry exhaustion, and all unexpected post-run changes remain
stop conditions.

The S16-v3 continuation is now materialized with policy ID
`S16-v3-production-live-v1`, scenario version `S16.v3`, and a fresh `S16R3`
evidence namespace. It contains only denied, false-green, and cold-restart,
the three scenarios S16-v2 never launched. Its maximum is three one-turn
calls, and its aggregate token ceilings are proportionally reduced to 360,000
input, 12,000 output, and 378,000 total. On 2026-07-30 the principal explicitly
approved this exact posture and fresh private destination as a single
stop-first-failure attempt with no replay. The gate authorizes only the three
enumerated calls.

Exact candidate `f7e5f13777f3998dff65f3c004c658488a9afa0b`, package SHA-256
`17445c35ed6b1993664c91f902622b4159012dc38364b16703e833c56060b8ef`,
all 21 deterministic outcomes, and hosted gate `30522116030` passed before
provider traffic. Denied then completed with expected stop polarity, bounded
usage, and process cleanup. Campaign qualification stopped when the isolated
Codex client store exceeded the 64-entry audit bound. One call was consumed;
false-green and cold-restart were not launched. The gate is closed, the
campaign cannot replay, and the retained result is non-qualifying. S16 remains
active and CXH1-CXH3 remain unsatisfied.

The separate RC1 pilot implementation note at
`evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md` is
now retained as an S17 deterministic implementation input. It does not alter
S16, authorize provider traffic, or admit RC1 experiment/scoring work into
this protocol. Its future dual-channel journal and compact-response work
advances the already ratified OR2 resource/transcript-ceiling contract.

The reproduced S16 entry-audit defect is being remediated independently. The
client-store snapshot now streams directory inventory under a 4,096-entry
hard ceiling instead of assuming no current client can exceed 64 entries.
Deterministic tests may lower but cannot raise the ceiling. Symlink, special
file, oversized ambiguous baseline, and unexpected post-run residue rejection
remain unchanged. This post-stop implementation does not reopen S16-v3 or
authorize provider traffic.

The S16-v4 continuation was materialized with policy ID
`S16-v4-production-live-v1`, scenario version `S16.v4`, and a fresh `S16R4`
evidence namespace. It contains only false-green and cold-restart, the two
scenarios S16-v3 never launched. The maximum is two one-turn calls with
aggregate ceilings reduced to 240,000 input, 8,000 output, and 252,000 total
tokens. On 2026-07-30 the principal explicitly approved this exact posture and
fresh private destination as one stop-first-failure attempt with no replay.
Exact candidate `07d170fc64c74b359e52630499b00a21f91f491c`, package SHA-256
`209c1ff85692d7ccaccd1f9ce4772e7dcf887931302b5b2077e95fed71497a8d`,
all 21 deterministic outcomes, and hosted gate `30543747338` passed before
provider traffic.

False-green consumed the first call and correctly returned blocked polarity
with `canStop: false`, bounded usage, SCOPA-only MCP calls, and complete
process cleanup. Campaign qualification then stopped because Codex left
unexpected state in its isolated client store. Cold-restart was not launched.
The isolated home was deleted, the private intent and recovery journal were
retained under the approved bounds, and the gate is closed. The campaign is
non-qualifying and cannot replay. S16 remains active and CXH1-CXH3 remain
unsatisfied.

The stop exposed one bounded forensic gap: the runner rejected the
path-hashed client-store delta but did not retain it. A deterministic narrow
remediation now persists a no-overwrite, mode-`0600` private store-audit
receipt before enforcing the same rejection. Clean runs remove this temporary
receipt only after normal evidence persistence; stopped runs retain it beside
their intent and recovery journal. This does not reopen any S16 allowance or
authorize provider traffic.

S16-v5 is prepared with a fresh `S16R5` namespace, a closed gate, and only
the never-launched cold-restart scenario. It permits zero calls unless a later
explicit approval binds this exact one-turn continuation.

## Descriptor rung check

Executable unlock: an enumerated, current-client Codex reliability claim whose
real and deterministic outcomes share the same installed-artifact, terminal,
cleanup, polarity, and evidence-custody contract.

## Anti-ceremony gate

- Classification: `test/validation` with permitted narrow implementation
  fixes.
- Executable change: current Codex capability probe, deterministic edge
  corpus, closed live policy, installed runner, cleanup/non-retention audit,
  and provider-safe evidence.
- New uncertainty reduced: whether current Codex preserves SCOPA polarity,
  bounded usage, cleanup, partial assurance, and non-retention across
  production-like failures and repeated sessions.
- Validation: existing four scenarios plus version/model/MCP/native drift,
  refusal, timeout, ignored termination, early EOF, malformed events, usage
  and capture limits, repeated sessions, cleanup, and public-proof scan.
- Consecutive metadata/decision slice check: `pass`; S15 changed executable
  runner behavior and produced direct provider evidence.
- Status-report alternative: insufficient because real and fault-injected
  runtime outcomes must agree.

## Productivity mix

- Runtime behavior: 30%
- Contract/test code: 55%
- Metadata/docs: 15%

## Slice queue

This queue remains the ratified Production Live-Run Hardening queue.

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S14 | Shared live-run custody and supervision | Bound process, terminal, identity, and evidence behavior | Deterministic terminal classes are cleanup-proven and privacy-safe | Fault/cleanup/identity/evidence corpus and hosted CI | `completed` |
| S15 | Claude production live-run edge campaign | Exercise real and deterministic Claude edge paths | Live/fault polarity, cleanup, partial assurance, and non-retention agree | Core plus drift/refusal/rate/timeout/truncation/capture/budget/repeat | `completed` |
| S16 | Codex production live-run edge campaign | Exercise Codex through the same bounded outcome contract | Live/fault polarity, cleanup, partial assurance, and non-retention agree | Core plus drift/refusal/timeout/truncation/usage/capture/repeat | `active` |
| S17 | Sustained recovery, concurrency, and cleanup hardening | Stress operational sequences | No duplicate action, stale state, lost pairing, unbounded growth, or residue | Crash/resume, concurrency, ceilings, soak, cleanup, parity | `queued` |
| S18 | Exact production-live requalification | Requalify one exact candidate | Exact matrix and three fresh reviews pass | Clean candidate, live matrix, soak, audit, reviews, hosted CI | `queued` |

## Provider execution gate

Before the first real Codex request, commit a closed policy that names:

- the authenticated account boundary without credential material;
- the only allowed provider network destination class;
- the requested model and honest launcher-declared provenance limit;
- the exact SCOPA MCP inventory and independently enumerated native surface;
- the native sandbox and approval posture;
- maximum provider invocations, turns, wall time, input/output capture, usage
  or cost, and aggregate allowance;
- disposable repository and prohibited data classes;
- private raw-evidence retention duration, maximum bytes, mode, and deletion
  procedure;
- process, repository, client-store, and control-root cleanup proof;
- immediate drift, privacy, false-green, accounting, and cleanup stop
  conditions.

The runner must refuse provider execution when any field is missing, when the
policy digest differs, when the client/capability probe drifts, or when any
invocation/evidence record already exists. A real run must never become part of
`npm test` or hosted CI.

## Files in play

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/**`
- `schemas/**`
- `packages/live-run/**`
- `packages/integrations/codex/**`
- `packages/adapter-host/**`
- `packages/release-readiness/**`
- `packages/conformance/**`
- `fixtures/S16/**`
- `fixtures/S16R2/**`
- `fixtures/S16R3/**`
- `fixtures/S16R4/**`
- `fixtures/S16R5/**`
- `next-prompt-protocols/**`
- `notes/S16/**`
- `runs/S16/**`
- `evidence/S16/**`
- `evidence/S16R2/**`
- `evidence/S16R3/**`
- `evidence/S16R4/**`
- `evidence/S16R5/**`
- `evidence/RC1/2026-07-30-resource-bound-evidence-implementation-note.md`
- private bounded Codex evidence under
  `llm-memories/projects/scopa/evidence/S16*/**`

## Validation speed option

- Fast deterministic command: `npm run test:s16`
- Codex regression: `npm run test:s9`
- Shared-custody regression: `npm run test:s14`
- Installed-artifact guard: `npm run probe:s12:installed`
- Real-provider command: separately opt-in and policy-file required; never
  part of `npm test` or hosted CI.
- Broad-suite policy: `npm test` remains the accumulated compatibility guard.

## Non-goals

- No SCOPA-RV1 experiment protocol, execution, fixture, allocation,
  ground-truth, scoring, statistical, preregistration, confirmatory, or
  publication work.
- No replay, reclassification, scoring, or provider execution of the
  SCOPA-RC1 pilot; its retained note is implementation input only.
- No reuse or inference of Claude account, behavior, tool, persistence, or
  assurance evidence as Codex evidence.
- No customer repository, customer data, production deployment, or
  uncontrolled mutation.
- No credential, authorization header, environment dump, raw private path,
  provider transcript, token fragment, or account identifier in repository
  evidence.
- No claim that launcher-declared model identity is provider-signed
  provenance.
- No transfer from `partial` to `full` assurance.
- No npm publication, GitHub Release, repository visibility change, public
  announcement, certification, trademark claim, or customer use.
- No remediation beyond a reproduced Codex containment, custody, cleanup,
  privacy, drift, resource, usage, or false-green defect.

## Evidence

This slice commits:

- `notes/S16/` — policy, native/MCP surface, scenario design, reproduced
  defects, narrow remediations, and non-goals;
- `runs/S16/` — exact deterministic/local commands plus sanitized live-run
  command metadata and hosted regression;
- `evidence/S16/` — closed policy digest, scenario matrix, bounded public
  receipts, cleanup/non-retention audit, and reviewer-facing summary.

Raw Codex content, if required, remains bounded and mode-restricted in the
private SCOPA evidence home. Repository records retain only safe digests and
designated public fields.

## Acceptance

- A complete closed per-run and aggregate policy is validated before provider
  execution.
- The exact installed candidate, Codex client version, requested model,
  launcher profile, MCP/native capability matrix, scenario version, limits,
  sandbox/approval posture, and environment policy bind every run.
- Deterministic controls cover the existing four scenarios plus client,
  model, MCP, schema, and native drift; refusal; timeout; ignored termination;
  early EOF; malformed event; usage/capture limit; and cleanup failure.
- The separately approved real Codex subset preserves the same terminal
  polarity as its deterministic controls.
- Repeated sessions leave no resumable provider content, credential, private
  path, cross-run control state, temporary residue, client-store residue, or
  orphan process.
- Codex remains `partial`; favorable prose cannot assert completion.
- Public evidence is deterministic, collision-safe, private-root free, and
  binds bounded private evidence.
- `npm run test:s16`
- `npm run test:s9`
- `npm run test:s14`
- `npm run probe:s12:installed`
- `npm test`
- `npm audit --audit-level=low`
- `npm run protocol:check`
- Hosted deterministic CI passes.
