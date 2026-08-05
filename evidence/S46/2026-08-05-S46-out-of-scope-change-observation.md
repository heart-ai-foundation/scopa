# S46 out-of-scope change observation evidence

## Result

Boundary Card creation now performs one bounded observation of tracked Git
working-tree changes. A card may add three counts: tracked changes, changes
outside allowed path rules, and conservatively recognized declared-non-goal
contacts. No observed path or non-goal text enters the card.

When declared gates pass but outside-path or non-goal contact is observed, the
terminal and HTML headline is `SATISFIED — WITH UNVERIFIED CHANGES`.
`completion.status` remains `satisfied`, `canStop` remains `true`, assurance is
unchanged, and the source-map SHA-256 is unchanged.

## Real polarity

The focused suite initializes actual Git repositories and proves:

| State | Tracked | Outside | Non-goal contact |
|---|---:|---:|---:|
| clean | 0 | 0 | 0 |
| `src/index.js` changed under `src/**` | 1 | 0 | 0 |
| plus `package.json` with `changing dependencies` non-goal | 2 | 1 | 1 |

The actual CLI `view --format json` path carries the same counts without the
path or non-goal text. A non-Git repository retains the optional legacy card
boundary. Legacy cards validate against both the runtime and updated schema.

## Claim boundary

The artifact explicitly says observation does not mean prevention, control,
attribution, or unauthorized action. Observation never blocks and never enters
completion or assurance computation.

## Validation

Focused S46 and accumulated S2/S29/S40/S41, documentation, protocol, and diff
gates passed. The initial transient historical process-tree result and its
clean direct/official reruns are retained in
`runs/S46/2026-08-05T17-57Z-validation.log`.
