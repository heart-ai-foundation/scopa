# SCOPA Process-Tree Cleanup Hardening Macro Delta

**Approved:** 2026-08-01
**Authority:** principal-approved bounded remediation after S23-v2 runtime review
**Provider posture:** closed
**Publication posture:** closed

## Trigger

The fresh S23-v2 installed-runtime reviewer demonstrated that a timed-out gate
could spawn a descendant which survived after `runGate` killed only the
immediate child and returned a failed result. This contradicts SCOPA's cleanup
and bounded-resource posture even though the accumulated suite remained green.

## Objective

Make gate execution own a complete isolated process tree, terminate that tree
on timeout or output-limit pressure, verify that no process-group survivor
remains before returning, and fail closed if cleanup cannot be proven. Then
build and provider-off qualify entirely new candidate bytes.

## Authority boundary

Authorized:

- process-tree termination and survivor verification in the gate runner;
- focused adversarial timeout, output-limit, orphan, escalation, and cleanup
  tests;
- minimal schema-compatible failure signaling needed to prevent false green;
- rebuilding and provider-off qualification of a fresh exact candidate;
- local and hosted validation, privacy/license/dependency checks, and evidence.

Forbidden:

- provider calls or transfer of S21 approval/evidence;
- experiment, customer, publication, release, deployment, visibility,
  announcement, certification, or trademark actions;
- dependency upgrades or changes;
- unrelated runtime, CLI, adapter, protocol, schema, or public API changes;
- reuse of S20-S23 candidate assurance for new bytes.

## Contracts

| Contract | Statement | Initial state |
| --- | --- | --- |
| PTC1 | Timeout and output pressure terminate the complete gate process group with bounded escalation. | open |
| PTC2 | SCOPA verifies group disappearance before returning and fails closed on a survivor or unsupported custody environment. | open |
| PTC3 | A fresh exact candidate passes clean, offline, dependency-closed, process-tree-focused provider-off qualification. | open |

## Slice queue

| Slice | Class | Objective | Acceptance | Status |
| --- | --- | --- | --- | --- |
| S24 | arc | Implement and adversarially prove gate process-tree custody | timeout/output/orphan descendants die; survivor ambiguity fails closed | active |
| S25 | arc | Build and provider-off qualify fresh candidate bytes | reproducible exact bytes, offline npm parity, privacy/license/audit and process-tree matrix green | queued |

## Acceptance boundary

The arc may close only when the new candidate has a distinct exact identity and
provider-off qualification evidence. This creates eligibility for a separately
approved production-live matrix; it does not authorize one.

## Stop conditions

- Any descendant survives a bounded timeout/output/orphan cleanup test.
- Cleanup success is asserted without an explicit disappearance check.
- POSIX process-group or platform behavior is ambiguous but treated as green.
- A dependency, candidate input, or unrelated runtime surface changes.
- Any provider, experiment, publication, release, or customer action occurs.
- Privacy, credential, license, advisory, protocol, accumulated, or hosted gate
  fails.
