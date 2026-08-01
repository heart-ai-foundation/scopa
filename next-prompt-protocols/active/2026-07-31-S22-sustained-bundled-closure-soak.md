# S22 — Sustained Bundled-Closure Soak

**Class:** `arc`
**Module:** `dependency-closure-identity`
**Crosses:** [`operational-resilience`, `release-readiness`, `conformance`, `production-live-requalification`]
**Advances contracts:** [`DCI2`, `DCI3`, `PLQ1`]
**Compound:** false

## Why this exists

S20 proved exact bundled installs at qualification time and S21 proved fresh
provider behavior once. S22 must distinguish sustained dependency-closed
runtime stability from a favorable cache, registry, process, or filesystem
moment without transferring S20 or S21 assurance.

## Next objective

Run 12 fresh disposable cycles alternating npm 10.9.7 and npm 11.19.0. Every
cycle uses an empty cache, unreachable registry, and network-deny shim; binds
the four-part production identity plus installed tree, dependency graph, and
license inventory; executes allow, deny, status, check, and cold-reload
polarity; and removes its complete root. Run one separate current production
advisory audit and close with zero provider traffic.

## Descriptor rung check

Executable unlock: a sustained exact-byte soak receipt makes the S20/S21
candidate eligible for S23's fresh three-role review packet.

## Anti-ceremony gate

- Classification: `test/validation`.
- Executable change: a bounded runner performs real alternating npm installs,
  runtime polarity, audits, resource measurement, and cleanup checks.
- New uncertainty reduced: whether the exact production closure stays stable
  across repeated empty-cache installs and cold process reloads.
- Validation: focused S22 tests, 12-cycle production soak, accumulated gate,
  protocol check, and hosted CI.
- Consecutive metadata/decision slice check: pass; S21 executed four production
  calls and S22 executes repeated provider-off installs and runtime actions.
- Status-report alternative: insufficient because sustained cycle, audit,
  resource, and cleanup evidence does not yet exist.

## Productivity mix

- Real install and runtime soak behavior: 55%
- Contract, hostility, audit, and resource validation: 35%
- Evidence and protocol closeout: 10%

## Slice queue

| Queue slot | Slice | Purpose | Value gate | Validation gate | Status |
| --- | --- | --- | --- | --- | --- |
| S21 | Fresh candidate production-live matrix | Bind fresh Claude/Codex evidence | Four exact calls pass without transfer | consumed approval and live receipts | `done` |
| S22 | Sustained bundled-closure soak | Prove repeated exact install/runtime stability | Every cycle has identical identities and no growth or residue | 12 cycles, audit, local and hosted gates | `active and provider-off` |
| S23 | Fresh exact-identity reviews and closeout | Obtain three unfamiliar exact-byte verdicts | Three ACCEPT verdicts and no material finding | role reviews, consistency and hosted gates | `queued` |

## Files in play

- `package.json`
- `packages/release-readiness/src/bundled-closure-soak.js`
- `packages/release-readiness/test/bundled-closure-soak.test.js`
- `fixtures/S22/`
- `evidence/S20/`
- `evidence/S21/`
- `evidence/S22/`
- `next-prompt-protocols/**`

## Validation speed option

- Fast slice-local command: `npm run test:s22`
- Active-slice test file:
  `packages/release-readiness/test/bundled-closure-soak.test.js`
- Use a small deterministic fixture receipt for validator hostility tests; run
  the real 12-cycle soak once for evidence and again only if a material runner
  change invalidates it.
- Run accumulated and hosted gates after the exact receipt is frozen.

## Non-goals

- No Claude, Codex, or other provider call; the S21 approval is consumed.
- No experiment crossover, customer data, npm publication, GitHub Release,
  deployment, visibility change, announcement, or assurance transfer.
- No dependency, candidate, client, model, runtime feature, or public API
  change unrelated to soak enforcement.
- No reachable registry during install cycles; one bounded current production
  advisory audit is the only registry operation.

## Evidence

S22 commits the frozen plan, cycle receipt, identity/tree/graph ledger, current
audit summary, privacy/license/resource/cleanup results, and provider-off
closeout under `evidence/S22/`. Temporary caches, installs, and repositories
are removed after every cycle.

## Acceptance

- Twelve fresh cycles complete, six under each approved npm version.
- Every install uses a new empty cache, unreachable registry, offline mode,
  ignore-scripts, and the network-deny shim with zero external requests.
- Package, closure, bundled payload, installed payload, license inventory,
  installed tree, dependency graph, and runtime control state are identical.
- Allow, deny, status, check, and fresh-process cold reload preserve expected
  polarity without stale state or a false green.
- Privacy and credential findings, production advisories, provider calls,
  experiment calls, and publication actions are zero.
- Descriptor and RSS growth stay within frozen bounds; no process, repository,
  cache, install root, escape file, or control residue survives.
- Focused, accumulated, protocol, and hosted gates pass.

## Stop condition

Stop on the first identity, tree, graph, npm-version, network, license, audit,
privacy, credential, runtime-polarity, resource, process, filesystem, cleanup,
provider, experiment, or publication drift. Ambiguity fails closed without
provider traffic.
