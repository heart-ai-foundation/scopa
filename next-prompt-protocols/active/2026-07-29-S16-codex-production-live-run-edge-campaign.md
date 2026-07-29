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

The complete proposed policy is now materialized with four scenarios, per-run
and aggregate token ceilings, a private evidence destination class, retention,
cleanup, environment, and fourteen stop conditions. Its digest-bound
authorization state is `closed-pending-explicit-approval`: approved provider
invocations remain zero.

Installed qualification first caught a shipped private-topology reference in
the public policy contract and invalidated that candidate. The remediated
contract uses the public alias `SCOPA_PRIVATE_EVIDENCE_ROOT/S16`, whose
concrete operator mapping is retained outside the package.

Exact source `695672d3cf5fc4f985ae8e779830d13ce20fa3ca` now passes the
generic installed-surface probe and all 21 deterministic scenarios. The
173-entry package SHA-256 is
`eeab466bad7c0651ec778b055826c0ae09f3a767e7cc6f21b6e0f33427e16318`;
all shipped-file privacy findings are zero, every expected state and stop
polarity was observed, every process group was gone, assurance remained
`partial`, and provider invocations were exactly zero.

The next checkpoint is explicit principal review of the proposed four-call
policy. No production Codex command may run before that approval.

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
- `next-prompt-protocols/**`
- `notes/S16/**`
- `runs/S16/**`
- `evidence/S16/**`
- private bounded Codex evidence under
  `llm-memories/projects/scopa/evidence/S16/**`

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
