# S35 explicit doctor lock conversion decisions

- `doctor --lock` is an explicit mutation boundary. Definition, capability
  matrix, and authority declaration are required as one complete set.
- All three inputs must be normalized repository-relative, outside `.scopa`,
  regular, unaliased, and at most 1 MiB. They are read and schema-validated
  before diagnosis or control-state creation.
- The initializer now exposes an in-memory validated-definition seam while
  retaining the same safe control-directory checks, exclusive publishing, and
  conflict behavior used by `scopa init`. This avoids re-reading a declaration
  between validation and mutation.
- The zero-state diagnostic is captured before `.scopa` creation. A repeat run
  truthfully reports initialized state while leaving exact control bytes
  unchanged.
- Gate failure is not an initialization success. It returns exit 4 with
  `SCOPA_DOCTOR_LOCK_BLOCKED` and includes the actual validated after-map under
  error details.
- The transaction does not infer scope, capabilities, authority, or gates and
  performs no provider, network, hosted, customer, experiment, publication, or
  release action.
