# S16 production preflight stop

Date: 2026-07-29
Status: stopped before provider launch; zero provider calls consumed

## Frozen candidate

- source commit:
  `15da461ee3ca2b3fd8dd4d555a62cffb2d07e20a`
- package: `@heart-ai-foundation/scopa@0.2.0-dev.1`
- package entries: 174
- package SHA-256:
  `ecc0a1212195246c14e8a488526b43627c162b6986dc20b86cf800fc17f5c6c4`
- policy SHA-256:
  `4086fca329656748ceff55bb54d8543aab7ae89bc357a47be459bd985e9468c3`
- hosted release gate: run `30516378273`, success

## Observed stop

The collision, evidence-root, auth-metadata, worktree, deterministic, package,
and hosted-CI preconditions passed. The installed runtime then observed Codex
CLI `0.146.0` while the candidate required `0.145.0` and returned
`version-drift/client-version-mismatch`.

The provider launcher did not start. The written intent conservatively said a
provider invocation might be consumed, but structural inspection of the
recovery receipt proved that the recorded invocation was the local
`codex --version` probe. Provider invocations consumed: `0`.

## Reproduced hardening defect

The production campaign counted a reserved intent as a provider invocation and
then replaced the precise pre-provider terminal outcome with the generic error
`lacks normalized provider usage`. The narrow remediation:

- marks a session result when the provider process has actually started;
- counts only those launches against the provider allowance;
- reports the exact state and reason for pre-provider and post-launch stops;
- updates the reviewed Codex client pin and deterministic fault client to
  `0.146.0`;
- adds regression assertions that client-version and MCP-inventory drift
  consume zero provider calls.

Private recovery evidence remains mode `0600`, retained for 168 hours, and is
referenced publicly only by safe filename, size, mode, and SHA-256 digest.
No private root or raw provider/client content enters repository evidence.

## Non-goals held

No provider request, experiment work, customer data, deployment, publication,
release, visibility change, credential disclosure, private-path publication,
or assurance upgrade occurred.
