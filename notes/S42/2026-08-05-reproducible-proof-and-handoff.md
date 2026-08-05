# S42 Reproducible Proof and Handoff Decisions

- `scopa demo` is a real, local runtime exercise rather than a staged output
  fixture. It uses the production task bootstrap, trusted write dispatcher,
  gate runner, capability-matrix validator, Workflow Boundary Map, and
  Boundary Card paths.
- The command owns an isolated temporary repository and does not inspect or
  mutate the caller's repository. Cleanup is part of the result contract and
  is verified before success is returned.
- The proof has exactly three closed faults: a scope escape, an asserted
  completion before a real gate passes, and a full-assurance overclaim while
  native routes remain uncontrolled. Each must be injected and rejected by
  the corresponding runtime validator.
- The correction uses an authorized in-scope write, reaches `canStop: true`,
  and continues to report `partial` assurance with four uncontrolled routes.
  A passing gate is therefore not presented as complete host control.
- Terminal output is an exact-tested rendering of a validated deterministic
  result. It contains no temporary path, prompt, environment map, gate output,
  provider output, secret, benchmark, certification, or guaranteed-prevention
  claim.
- Organizational review appears only after the complete free result. It is
  optional, requires no account or lead capture, and describes concrete
  review artifacts rather than making fear-based or exclusive claims.

Qualification was provider-off and local. It made no model call, experiment,
network probe, telemetry event, publication, release, deployment, customer
action, or external-system mutation.
