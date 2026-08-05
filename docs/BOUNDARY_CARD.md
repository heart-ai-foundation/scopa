# Boundary Card

The Boundary Card is SCOPA's privacy-minimized visual projection of the active
canonical Workflow Boundary Map. It answers four questions without exposing
the repository details behind them:

- are the declared completion gates satisfied or blocked;
- how many gates passed, failed, or timed out;
- how many workflow surfaces are controlled, uncontrolled, unknown,
  authority-required, or disabled; and
- how many allowed path rules and non-goals define the scope.

When the repository is Git-backed, the card may also include counts of tracked
working-tree changes, changes outside the allowed path rules, and conservatively
recognized contact with a declared non-goal. No changed path or non-goal text is
included. This is observation only: it does not attribute a change to an agent
or claim that SCOPA prevented, controlled, or authorized it.

Every card binds the complete source map by SHA-256. It deliberately omits raw
paths, non-goal text, prompts, gate identifiers and output, capability evidence,
provider output, environment values, credentials, and private roots.

## View in the terminal

After `scopa begin` or another initialization path:

```sh
scopa view
```

This prints a compact plain-text card and does not create a file. `UNKNOWN`
means capability evidence is incomplete. `PARTIAL` means an active route can
bypass SCOPA. `SATISFIED — WITH UNVERIFIED CHANGES` means all declared gates
passed while tracked outside-scope or recognized non-goal contact was observed;
`canStop` remains a declared-gate result. None of these states is a safety,
approval, or attribution claim.

## Create a standalone local HTML card

```sh
scopa view --format html --output scopa-boundary.html
```

The file is deterministic, responsive, semantic HTML with reader landmarks,
visible status text, high-contrast light/dark styling, and print support. It
contains no JavaScript, remote asset, URL, telemetry, analytics, or network
dependency. SCOPA writes with no-replace semantics and refuses an existing
target or aliased/escaping parent.

SCOPA does not open a browser. Review the file locally, then choose whether to
share it.

## Export the sanitized JSON or terminal bytes

```sh
scopa view --format json --output scopa-boundary.json
scopa view --format terminal --output scopa-boundary.txt
```

All three formats derive from the same validated `scopa.boundary-card.v1`
object. JSON is the portable semantic form; terminal and HTML are renderings.
The source map remains the truth. A card is not an operating-system sandbox,
safety result, security certification, compliance finding, or readiness
assessment.
