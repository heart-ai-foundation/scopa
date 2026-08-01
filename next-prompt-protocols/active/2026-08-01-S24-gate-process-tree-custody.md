# S24 — Gate Process-Tree Custody

**Class:** `arc`
**Module:** `gate-process-custody`
**Crosses:** [`enforcement`, `conformance`, `operational-resilience`, `release-readiness`]
**Advances contracts:** [`PTC1`, `PTC2`]
**Compound:** false

## Why this exists

S23-v2 reproduced a timed-out gate whose descendant survived after SCOPA
returned failure. Existing provider supervision already owns POSIX process
groups, but the enforcement gate runner does not.

## Next objective

Run every gate in an isolated process group; on timeout or output-limit pressure
terminate the complete group with bounded SIGTERM/SIGKILL escalation; verify
group disappearance before returning; detect successful parents that leave a
descendant; and fail closed when custody cannot be established.

## Descriptor rung check

Executable unlock: an adversarial fixture must spawn a signal-ignoring
descendant and prove that no process survives timeout, output pressure, or
parent exit.

## Anti-ceremony gate

- Classification: `runtime guard`.
- Executable change: gate-runner process-group custody and survivor checks.
- New uncertainty reduced: whether a failed gate can continue work after SCOPA
  returns its result.
- Validation: focused enforcement tests, adversarial process probes,
  accumulated release gate, protocol check, and hosted CI.
- Consecutive metadata/decision slice check: pass; the prior slice executed
  fresh installed-runtime behavior and found this defect.
- Status-report alternative: insufficient because the process survivor is a
  reproduced runtime failure.

## Productivity mix

- Runtime guard: 55%
- Adversarial tests: 40%
- Evidence/protocol: 5%

## Slice queue

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S24 | Gate process-tree custody | Close the reproduced survivor | no descendant survives | focused and accumulated gates | `active` |
| S25 | Fresh provider-off candidate qualification | Establish new exact bytes | no assurance transfer | clean packs, offline npm parity, audits, hosted CI | `queued` |

## Files in play

- `packages/enforcement/src/gate-runner.js`
- `packages/enforcement/test/enforcement-loop.test.js`
- `fixtures/S24/**`
- `evidence/S24/**`
- `next-prompt-protocols/**`

## Validation speed option

- Fast slice-local command: `npm run test:s2`
- Active test file: `packages/enforcement/test/enforcement-loop.test.js`
- Use short bounded fixtures; never leave a process for manual cleanup.

## Non-goals

- No provider, experiment, publication, release, dependency, candidate, or
  unrelated runtime change.
- No production-live requalification or transfer of S21/S23 verdicts.
- No broad supervisor refactor beyond the gate-runner custody seam.

## Evidence

S24 commits adversarial process-tree results, cleanup bounds, local/hosted gate
status, and zero-traffic posture under `evidence/S24/`.

## Acceptance

- Timeout kills a signal-ignoring descendant process group.
- Output pressure kills the complete group and returns a failed gate.
- A successful parent that leaves a descendant is detected and cleaned.
- The runner waits for verified group disappearance and fails closed on cleanup
  ambiguity.
- Existing gate-result schema, output accounting, and allow/deny polarity remain
  compatible.
- Focused, accumulated, protocol, and hosted gates pass.

## Stop condition

Stop on any process survivor, false green, unbounded wait, schema drift,
unsupported custody treated as green, unrelated runtime/dependency change, or
provider/experiment/publication/release action.
