# S18.2 approved production-live preflight

The principal explicitly approved closed matrix digest
`3df4d5eb353c124c2d425c8e98ea6eb52e0d4e07fc6529c470770804a0a317d9`
on 2026-07-31. The canonical approval expires after 2026-08-01, has digest
`f9f1aedb3853878b95b1aceacc9fe57c4070475e4a70c5415b8a36a3dccf0325`,
and reconstructs authorized matrix digest
`65c04e950f630fa229776df3307af078cc1cd4eaa5844f8b89707e5ceff89317`.

Preflight found system-client drift before provider intent: Claude 2.1.220 and
Codex 0.146.0 were newer than the approved 2.1.170 and 0.145.0. Exact approved
clients were installed in a dedicated evidence-home toolchain and verified by
their version surfaces. The system clients were not replaced. Provider call
consumption remains zero.

The S18 controller installs only the frozen candidate tarball by its exact
SHA-256, verifies the approval and execution date, requires 0700 external
custody, enforces Claude-before-Codex order, and stops the campaign after any
failed polarity or cleanup condition.
