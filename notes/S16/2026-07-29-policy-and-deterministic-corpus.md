# S16 policy and deterministic corpus

## Outcome

S16 now has an executable Codex policy contract and a provider-free
21-scenario fault corpus. The policy is published as
`scopa.codex-live-policy.v1`, digest-binds every account, network, model, tool,
native, environment, limit, evidence, cleanup, and scenario field, and
remains closed pending a separate explicit approval.

## Runtime changes

- Codex sessions accept exact input, output, reasoning, and combined token
  ceilings.
- A normalized result beyond a ceiling becomes `usage-limit` with
  `canStop: false`.
- The shared terminal contract publishes the corresponding closed state and
  reason.
- S16 provides an explicit ten-name production environment allowlist.
- Deterministic fixtures run with an even smaller synthetic allowlist and
  cannot inherit host credentials or test-harness state.

## Corpus

The corpus covers the four historical outcomes plus repeated restart,
client/MCP/model/schema/native/tool drift, provider refusal and rate pressure,
timeout with ignored termination, early EOF, malformed events, usage/capture
limits, and orphan cleanup. Each case asserts terminal state, completion
polarity, and process-group disappearance.

## Authorization boundary

No provider request was made. The committed policy states:

- provider gate: `closed-pending-explicit-approval`
- approved provider invocations: `0`
- proposed live scenarios: `4`
- private destination approval: `not-granted`

Opening the gate requires a new policy digest and explicit approval of the
four calls, aggregate token allowance, and private S16 evidence destination.

## Installed privacy remediation

The first installed qualification caught that the published policy contract
named the operator's private evidence topology. That candidate is invalidated.
The shipped contract now names only
`SCOPA_PRIVATE_EVIDENCE_ROOT/S16`; the concrete operator mapping remains in
the private SCOPA evidence home. A new installed result is required before
principal policy review.

## Non-goals preserved

No SCOPA-RV1 experiment work, Claude evidence transfer, customer repository,
provider transcript, credential value, publication, release, deployment, or
full-assurance claim was introduced.
