# S48 pull-request default value evidence

## Exact no-card behavior

The read-only job summary now:

- says the action observed only the configured card's absence;
- keeps completion, assurance, and scope `UNKNOWN`;
- gives `scopa view --format json --output scopa-boundary.json` as the one
  correction;
- explains the bounded aggregate fields a validated card can supply; and
- says no gate, project command, PR text, or card-supplied command was executed.

It contains no favorable icon, satisfied/pass status, approval,
certification, or safe-to-merge result.

## S46 projection continuity

A validated card with two observed tracked changes, one outside allowed paths,
and one recognized non-goal contact produces:

`Completion: SATISFIED — WITH UNVERIFIED CHANGES`

The PR summary contains only the three aggregate counts and the reporting-only
limit. The card remains canonically `completion.status = satisfied` and
`canStop = true`; no path or non-goal text is projected.

## Preserved guardrails

- default workflow permissions remain `contents: read`;
- checkout credentials remain unpersisted;
- missing/malformed/oversized/aliased/escaping input cannot publish a summary;
- default execution makes no fetch call; and
- comments still require literal opt-in, a supplied token, a pull-request
  event, and caller-granted write authority.

## Verification

- `npm run test:s48` — pass
- `npm run test:s41` — pass
- `npm run test:s46` — pass
- `npm run test:docs` — pass
- protocol synchronization and diff checks — pass
