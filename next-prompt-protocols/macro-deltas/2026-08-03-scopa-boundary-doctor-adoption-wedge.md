# SCOPA Boundary Doctor Adoption Wedge Macro Delta

**Status:** completed provider-off implementation arc on 2026-08-03; BD1-BD3
satisfied; provider, experiment, publication, release, customer,
hosted-service, and external-system actions remained closed
**Project:** SCOPA
**Phase:** Phase 12 — Boundary Doctor Adoption Wedge
**Trigger:** principal direction to make SCOPA an immediately useful, viral
developer diagnostic that creates legitimate demand for deeper boundary
consultation
**Provider posture:** closed
**Release posture:** closed

## Where we are

SCOPA now projects initialized control state as a truthful workflow boundary
map and supports a one-file agent journey. The adoption gap occurs one step
earlier: a developer must already believe the governance problem exists before
SCOPA shows repository-specific evidence. This arc supplies a zero-state,
provider-off diagnostic that discovers observable boundary indicators without
pretending to know the agent's authority, then converts an explicitly reviewed
minimum boundary into SCOPA state and produces a sanitized before/after proof.

## Product objective

Make this path real:

```text
uninitialized repository
  -> scopa doctor
  -> truthful repository-specific boundary findings
  -> explicit minimum lock inputs
  -> scopa doctor --lock
  -> initialized after-map and shareable sanitized proof
```

The diagnostic must create an immediate insight without reading credential
values, calling a model, probing the network, following symlinks, or writing to
the repository. The lock command may mutate only because the caller explicitly
selects `--lock` and supplies the complete validated definition, capability
matrix, and authority document.

## Exit contracts

| Contract | Statement | Proof |
| --- | --- | --- |
| BD1 | An uninitialized repository yields a bounded deterministic diagnostic without filesystem mutation, network access, provider traffic, secret values, or agent-authority overclaim | hostile repository corpus, before/after inventory, bounded traversal, schema validation |
| BD2 | Explicit lock conversion validates all caller inputs before mutation, refuses conflicts, initializes through the existing hardened project path, and returns the actual terminal workflow map | malformed-input no-mutation tests, conflict tests, installed clean lock journey, real gates |
| BD3 | JSON and Markdown doctor results expose the same semantics and the shareable projection omits absolute paths, credential names or values, raw file content, prompts, and gate output | projection digest parity, redaction hostility, installed source-free and cold-process tests |

## Protocol queue

| Slice | Classification | Executable value | Validation | Status |
| --- | --- | --- | --- | --- |
| S34 | implementation | Add `scopa.boundary-diagnostic.v1` and provider-off `scopa doctor` over an uninitialized repository | bounded traversal, symlink, mutation, privacy, determinism, CLI exits | completed; BD1 |
| S35 | runtime guard | Add explicit `scopa doctor --lock` using fully prevalidated inputs and the hardened initializer, returning an actual after-map | malformed no-write, conflict, allow/deny, gate polarity, repeated invocation | completed; BD2 |
| S36 | test/validation | Add digest-bound Markdown before/after proof, source-free installed journey, and public adoption documentation | JSON/Markdown parity, privacy corpus, installed clean/cold process, package contents, accumulated gates | completed; BD3 |

## Why these slices earn their place

- S34 proves the problem before asking for adoption and is useful without a
  configured SCOPA project.
- S35 turns diagnosis into enforcement without inventing authority or silently
  choosing scope.
- S36 closes the distribution loop with a shareable artifact and proves the
  promise from the installed package, rather than adding a dashboard.

## Anti-ceremony rules

- No planning, approval, review-of-review, dashboard, telemetry, account,
  hosted-service, enterprise-console, badge, generic risk score, or closeout
  slice.
- No score that compresses unknown authority into a favorable number.
- No model-generated scope inside the CLI. The caller or its chosen agent must
  supply the explicit minimum boundary.
- No environment-value inspection. Credential values and names remain outside
  diagnostic output.
- No network probe. Absence of a network configuration file is not proof that
  network access is absent.
- Stop after S36 unless qualification finds a concrete defect.

## Cumulative scope boundary

- `packages/boundary-doctor/**`
- `packages/cli/**`
- `packages/workflow-boundary-map/**` only for an unavoidable shared contract
- `packages/release-readiness/**` only for installed/package qualification
- `schemas/**`
- `fixtures/S34/**`, `fixtures/S35/**`, and `fixtures/S36/**`
- focused public documentation and `SCOPA_AGENT.md`
- `package.json`, `package-lock.json`, and provider-off CI wiring
- `next-prompt-protocols/**`, `notes/S34-S36/**`, `runs/S34-S36/**`, and
  `evidence/S34-S36/**`

## Non-goals

- No agent behavioral claim from host-process access alone.
- No credential or environment-name inventory, file-content indexing, source
  upload, telemetry, analytics, account, lead form, or hosted truth source.
- No browser, provider, plugin, deployment, publication, or external-system
  action.
- No automatic execution of a discovered package script during read-only
  diagnosis.
- No automatic policy inference from natural-language task text.
- No OS sandbox, compliance, safety, security, or certification claim.
- No public release, tag, push, announcement, or consultation delivery.

## Stop conditions

- Read-only doctor changes repository state or follows an escaping symlink.
- A truncated scan reports completeness.
- Host-process observations are attributed to an agent or client without
  evidence.
- A missing marker becomes proof that a capability is disabled.
- Lock conversion mutates before every input validates or overwrites a
  conflicting control file.
- Shareable output contains an absolute path, environment name or value, raw
  file content, prompt, gate stdout/stderr, or private topology.
- The arc expands toward a dashboard, generic score, hosted service, telemetry,
  provider traffic, experiment, customer work, publication, or release.

## Recommendation

Implement S34 first and judge the arc on the usefulness and honesty of one
uninitialized repository diagnostic. If it cannot create a repository-specific
insight without overclaiming agent authority, stop rather than polishing its
presentation.
