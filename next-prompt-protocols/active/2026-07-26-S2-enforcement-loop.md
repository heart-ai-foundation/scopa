# S2 — Enforcement Loop

**Class:** `arc`
**Module:** `enforcement`
**Crosses:** [`agent-surface`]
**Advances contracts:** [`E1`, `E2`, `E3`, `E4`, `A1`, `A2`, `A3`]
**Compound:** false

## Why this exists

S2 is where SCOPA becomes useful to a developer: scope is enforced at the
tool-call boundary and asserted completion is refused unless real gates pass.

## Next objective

Build slice-lock and allowed-path enforcement, a real verification-gate runner,
checkable stop-condition evaluator, compact orientation call, denial payloads,
and cold-resume rotation state.

## Descriptor rung check

Executable unlock: a live coding agent is blocked from an out-of-scope write
and refused a false-green completion.

## Anti-ceremony gate

- Classification: `runtime guard`.
- Runtime change: pre-tool boundary enforcement and executable completion gate.
- Validation: live blocked write, failed gate refusal, and cold resume.

## Productivity mix

- Runtime behavior: 65%
- Contract/test code: 30%
- Metadata/docs: 5%

## Evidence

- `notes/S2/`
- `runs/S2/`
- `evidence/S2/`

## Non-goals

- No publication before S3.
- No signing, anchoring, INFER provider integration, or CASE/UCO export.
- No enforcement that depends on agent cooperation.
- No gate definition mutable from inside the slice without principal DECISION.

## Acceptance

- A real agent write outside the declared allowed paths is blocked before the
  tool executes.
- A claimed completion is refused because a configured command actually fails.
- Stop state is machine-checkable and gate mutation fails closed.
- Orientation and denial payload contracts pass.
- Rotation state restores the slice after a cold context clear.
- S0 and S1 release gates remain green.
- `npm run protocol:check`.

## Closeout

**Result:** complete.

- Focused S2 suite: 13 passed, 0 failed.
- Full release gate: 54 passed, 0 failed; all S0 and S1 gates retained.
- A separate-process reference host with a fixed tool registry rejected an
  out-of-scope agent-shaped write with `SCOPA_SCOPE_DENIED`; the mutation
  handler did not run and the target remained absent.
- Registered mutations are serialized, authorizations are bound to the active
  lock, and path topology is revalidated immediately before execution.
- A real verification command exited 9 and asserted completion was refused
  with a machine-checkable failed-gate state.
- Rotation state survived a cold reload only when its lock hash, state hash,
  slice, stop state, and git commit all matched.
- The threat model explicitly excludes a separately privileged local process
  racing filesystem topology after final revalidation; that deployment class
  requires OS isolation or an inode-pinned adapter.
- Codex hooks were evaluated and retained only as defense in depth, not as the
  conforming enforcement boundary.
- Independent `gpt-5.6-terra` review issued an initial `HOLD` on host binding
  and TOCTOU overclaiming. Both findings were resolved; its final verdict was
  `ACCEPT`.
- Evidence: `notes/S2/`, `runs/S2/`, and `evidence/S2/`.
- Non-goals remained intact; no publication occurred.
