# S47 front-door alignment evidence

## Proven behavior

| Case | Result |
| --- | --- |
| No assistant marker | auto-install selects `generic` |
| Generic preview | reports `.agents/skills/scopa/SKILL.md` and writes nothing |
| Generic install | writes only the receipt-bound project-local skill and receipt |
| Claude + Codex markers | fails closed and names all three explicit clients |
| Agent begin under PTY | explicit `--format json` returns parseable `scopa.cli-result.v1` |
| Agent check under PTY | explicit `--format json` exposes truthful `canStop` |
| Redirected/piped commands | canonical JSON behavior remains unchanged |
| First-run README | single-URL prompt precedes protocol lineage; shipped snapshot is unhedged |

## Consumer audit closure

The root `SCOPA_AGENT.md` and every generated assistant skill now select JSON
for `begin` and `check`. The manual walkthrough selects JSON where it names
exact fields. README, Begin, Quickstart, and Troubleshooting explain terminal
versus redirected behavior. The executable S47 test binds these claims to the
actual CLI under a simulated terminal.

## Honest limits retained

The generic fallback establishes a reversible file placement contract only.
It does not claim discovery, compliance, provider identity, full control, or
full assurance for an unknown client. Ambiguous known surfaces remain a stop.
No output-mode or installation change grants external authority.

## Verification

- `npm run test:s47` — pass
- `npm run test:s39` — pass after stale consumer-string correction
- `npm run test:s43` — pass
- `npm run test:s44` — pass
- `npm run test:docs` — pass
- protocol synchronization — pass
- diff whitespace check — pass
