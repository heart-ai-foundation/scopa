# S2 validation run

Date: 2026-07-26 America/Los_Angeles
Source base: `8f4eba0`

- `npm run test:s2`: PASS, 13 focused tests across 2 files.
- `npm run probe:s2`: PASS.
  - mutation handler executions: 0
  - denied file remained absent: true
  - deliberate gate exit: 9
  - asserted completion refused: true
  - verified rotation reload: true
- `npm test`: PASS, 54/54 tests.
- S0 clean probes exited 0 and injected-fault probes exited 1.
- S1 Node/Deno, lockdown, integrity, persistence, and ACT recovery tests
  remained in the release gate.
- `npm run protocol:check`: PASS.
- `git diff --check`: PASS.

The final host-binding revision adds a fixed-registry reference host process,
lock-bound authorization, immediate topology revalidation, and per-host
mutation serialization. Its integration test submits an out-of-scope tool call
over stdin, receives `SCOPA_SCOPE_DENIED`, and verifies that the target file
does not exist.

The local threat model excludes a separately privileged process racing
repository topology after final revalidation. That deployment class requires
OS isolation or an inode-pinned adapter and is not claimed by S2.

The initial concurrent test invocation exposed a nested process resource race
around temporary `git init` processes. The fixture did not require a real git
subprocess, so it now creates an isolated repository marker and the release
gate runs package test files serially. The runtime gates still execute real
child processes.
