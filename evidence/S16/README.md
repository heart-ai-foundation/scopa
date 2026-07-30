# S16 evidence

This namespace contains the approved Codex campaign plan, deterministic
qualification artifacts, and one public preflight-stop receipt. It contains no
provider transcript, credential, account identity, authorization header,
private evidence path, or production Codex result.

The production attempt used the exact 2026-07-29 four-call approval. After its
pre-provider stop, the committed gate returned to
`closed-pending-explicit-approval`. Deterministic tests and the installed probe
execute only the committed S16 fault client and record
`providerInvocations: 0`; provider execution is not complete.

The first production attempt stopped locally before provider launch because
the installed client had advanced from pinned `0.145.0` to `0.146.0`.
`preflight-stop.public.json` binds that drift, the zero-call result, and the
digests of its mode-restricted private intent and recovery records. The
reproduced defect also showed that the campaign-level error obscured the
earlier terminal state; the subsequent candidate hardens launch accounting
and terminal reporting.

A production result may enter this namespace only through the committed
collision-safe runner under a fresh, exact, explicitly approved policy and
allowance.
