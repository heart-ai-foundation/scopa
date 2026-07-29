# S14 shared live-run custody design

Date: 2026-07-28
Implementation candidate:
`074f5ccddc50680817c7ed18b8bda1914c6c4b56`

## Boundary

Claude and Codex now delegate child-process ownership to one internal
`packages/live-run` boundary. Provider adapters still own their arguments,
capability probes, stream normalization, and assurance interpretation. The
shared layer owns only finite input/output custody, process-group lifetime,
terminal classification, installed-artifact receipts, and private/public
evidence persistence.

This separation keeps provider-specific validation visible while removing the
previously duplicated subprocess failure paths.

## Terminal taxonomy

The closed v1 domain is:

- `succeeded`
- `exited`
- `signaled`
- `timed-out`
- `output-limit`
- `spawn-failed`
- `version-drift`
- `inventory-drift`
- `normalization-failed`
- `cleanup-failed`

Process success initially carries `canStop: false`. Only a successful
provider normalizer may bind the machine completion decision. Every failure
state is structurally unable to assert completion.

The extra `cleanup-failed` state is intentional. A parent that exits
successfully while leaving a process-group member behind is not a successful
live run.

## Process custody

Each live client is launched as a detached POSIX process group. Capture is
finite and overflow is discarded rather than accumulated. Timeout, capture
exhaustion, and orphan detection use a bounded sequence:

1. signal the process group with `SIGTERM`;
2. wait the configured grace interval;
3. signal the group with `SIGKILL` if it remains;
4. poll for bounded disappearance; and
5. record whether the group is gone.

Unexpected group-control or stream failures are converted into closed terminal
data. They cannot erase the terminal record through an exception-only path.

## Identity and environment policy

The provider process is not launched until the caller supplies and validates
an exact installed-artifact identity. The receipt binds:

- source commit;
- package name, version, SHA-256, and npm SHA-512 integrity;
- expected and observed client version;
- requested model alias;
- profile and capability-matrix digests;
- scenario identifier and version;
- runtime limits;
- sanitized environment-policy digest; and
- command basename plus argument/stdin digests.

Environment values, raw arguments, prompts, provider output, credentials, and
private roots are absent from the receipt. Environment policy records only
names, counts, removal decisions, and digests. Mutating protected values does
not change the policy digest.

## Evidence custody

Private evidence is canonical JSON and may contain bounded provider material.
It is committed atomically with mode `0600`. Public evidence is a deterministic
derivative with exactly designated fields replaced, mode `0644`, and a digest
of the exact private bytes.

Both destinations must be canonical descendants of distinct canonical roots.
Existing files, symlinked parents, even in-root aliases, cross-destination
aliases, reserved placeholders, and semantic redaction collisions fail before
any write.

## Rejected alternatives

- Keeping separate Claude and Codex subprocess wrappers: terminal polarity and
  cleanup would remain divergent.
- Treating timeouts or parser failures as thrown orchestration errors: no
  stable reviewer-facing terminal state would exist.
- Killing only the direct child PID: descendants could survive.
- Publishing a filtered copy without binding the private bytes: the public
  record could be transplanted.
- Recording raw environment maps and redacting later: credential custody would
  depend on a fallible downstream filter.

## Non-goals preserved

S14 made no real provider call, changed no public CLI or bin, added no provider,
and did not touch the separately running experiment. Claude and Codex remain
partial-assurance integrations. Publication, release, deployment, customer
use, and repository visibility remain outside authority.
