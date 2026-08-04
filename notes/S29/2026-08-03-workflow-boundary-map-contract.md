# S29 workflow boundary map contract decisions

- The map represents route state, not organizational risk scores or compliance.
- Required missing evidence projects as `unknown`; unknown takes precedence in
  the summary even when another known route is uncontrolled.
- Authority declarations may say disabled, uncontrolled, or
  authority-required. They cannot assert that SCOPA controls a route.
- Raw gate output, duration noise, and capability evidence prose are excluded.
  The stable completion projection and validated source objects are digest-bound.
- The generator includes every validated capability-matrix entry plus fixed
  workflow surfaces for credentials, provider, browser, deployment,
  publication, and external systems.
- `full` remains configuration-relative and requires a complete represented
  surface with no active uncontrolled route.
