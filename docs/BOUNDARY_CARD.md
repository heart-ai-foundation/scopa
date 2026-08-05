# Boundary Card

The Boundary Card is SCOPA's privacy-minimized visual projection of the active
canonical Workflow Boundary Map. It answers four questions without exposing
the repository details behind them:

- are the declared completion gates satisfied or blocked;
- how many gates passed, failed, or timed out;
- how many workflow surfaces are controlled, uncontrolled, unknown,
  authority-required, or disabled; and
- how many allowed path rules and non-goals define the scope.

When the repository is Git-backed, the card may also include separate tracked
and untracked working-tree counts, changes outside the allowed path rules, and
conservatively recognized contact with a declared non-goal. SCOPA-owned
`.scopa/` control state is excluded. No changed path or non-goal text is
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
passed while an observed working-tree change was outside scope or in contact
with a recognized non-goal;
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

An explicit `--output` is a local evidence export outside the locked task
mutation boundary; it is not dispatched as governed task work. The command
states that boundary after writing. If the exported file is untracked and
outside the task paths, a subsequent card includes it in the aggregate
untracked and outside-path counts without revealing its path.

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

## Create a fact-stating adopter badge

```sh
scopa view --format badge --output scopa-boundary.svg
```

The standalone SVG is a compact projection of the same validated card. It
states `SCOPA BOUNDARY EVIDENCE`, the computed assurance level and basis, and
aggregate tracked and untracked working-tree observation when available. The complete source-map
SHA-256 is embedded as a nonvisual binding. The file contains no script,
remote image, font, link, analytics, telemetry, path, prompt, gate output, or
private evidence.

To display it in an adopter README, commit the generated SVG and use a local
reference:

```html
<img alt="SCOPA boundary evidence" src="./scopa-boundary.svg">
```

Regenerate the SVG and its underlying JSON card when the task boundary changes;
do not present an old snapshot as current. A fact-stating badge is permitted.
A grade, score, pass mark, approval, certification, risk rank, or safe-to-merge
badge is not. Zero observed outside-path changes means zero in that bounded Git
working-tree observation, not universal containment or safety. A legacy card
that did not assess untracked files states that limit rather than implying
zero.
