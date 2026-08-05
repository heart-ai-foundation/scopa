# S40 Local Visual Boundary Map Decisions

- The Boundary Card is a strict sanitized projection of a validated
  `scopa.workflow-boundary-map.v1`; it cannot be constructed from independent
  counts or prose without passing its own consistency validator.
- The card retains the source-map SHA-256, completion polarity, pass/fail/
  timeout counts, assurance level and basis, all control-surface counts, and
  scope counts. It omits subject labels, path rules, non-goal prose, gate IDs,
  prompts, outputs, capability evidence, environment values, and credentials.
- Unknown evidence mechanically yields `unknown`; any uncontrolled route
  mechanically yields `partial`. The renderers contain no numeric score,
  generic safety state, certification badge, or favorable unknown styling.
- `scopa view` is intentionally a presentation command: terminal is the
  read-only default, while JSON and HTML use the same card. Other explicit CLI
  subcommands retain canonical JSON envelopes.
- Standalone HTML uses semantic landmarks, visible status text, responsive
  layouts, system fonts, light/dark contrast, and print styling. It contains
  inline CSS only: no JavaScript, remote URL, remote asset, telemetry, or
  browser-launch behavior.
- Export requires an explicit normalized repository-relative target outside
  `.scopa`, an existing unaliased parent, and a nonexistent destination. A
  failed write removes only its newly opened partial target.
- The S33 public-journey regression now checks `scopa begin` before the work
  phase and terminal `scopa map` after verification, matching the compressed
  S39 agent entry without weakening its assurance assertion.

No browser, provider, experiment, network, telemetry, hosted service,
publication, release, deployment, customer, or external system was used or
changed.
