# SCOPA boundary doctor

Provider-off, zero-state repository discovery, explicit lock conversion, and
privacy-minimized proof rendering for `scopa doctor`.

The diagnostic reports bounded repository and host-process observations. It
does not infer an agent's permissions, inspect environment variables, probe the
network, execute discovered commands, or mutate the repository.

The package exports:

- `createBoundaryDiagnostic` and `validateBoundaryDiagnostic` for
  `scopa.boundary-diagnostic.v1`;
- `renderBoundaryDoctorMarkdown` and `validateBoundaryDoctorReport` for the
  digest-bound `scopa.boundary-doctor-report.v1`; and
- stable schema constants and typed validation errors.

Lock conversion is exposed through the root CLI because it intentionally
crosses the mutation boundary. The renderer includes only counts and fixed
status vocabulary; repository paths and caller-supplied workflow identifiers
remain in the private JSON source bound by `sourceSha256`.

See the complete [Boundary Doctor guide](../../docs/BOUNDARY_DOCTOR.md).
