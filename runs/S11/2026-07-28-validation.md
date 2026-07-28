# S11 validation — 2026-07-28

## Source

- authority commit: `7d28de8`
- primary implementation: `edc8e2c`
- reviewed remediation and final source: `7b686e3`
- branch: `main`
- remote: `heart-ai-foundation/scopa`

## Focused proof-integrity gate

Command:

```sh
npm run test:s11
```

Result: pass, 8/8 S11 tests.

Covered runtime/published-contract parity, installed corpus presence, the four
original RR-01 reproductions, exact and substring RR-02 collisions, reserved
placeholder injection, overlapping/equal roots, deterministic publication,
raw-byte digest binding, and explicit semantic-projection comparison.

## Differential parity probe

Command:

```sh
npm run probe:s11:parity
```

Result:

- 24 cases;
- 3 accepted positive controls;
- 21 rejected hostile controls;
- `validatorsAgree: true`;
- `expectationsMet: true`;
- `ok: true`.

The final corpus adds the three low coverage cases requested by the outside
reviewer.

## S10 regression

Command:

```sh
npm run test:s10
```

Result: pass, 7/7.

The exact retained S10 public proof and private raw proof both validate under
the new contract engine. Re-publication of the exact private raw proof returns
two field-specific redactions and computed
`semanticFieldsChanged: false`. No retained S10 evidence was edited.

## Accumulated local gate

Command:

```sh
npm test
```

Final result: pass.

- accumulated release-gate discovery: 105/105;
- Claude focused gate: 6/6;
- Codex/parity focused gate: 8/8;
- S10 focused gate: 7/7;
- S11 focused gate: 8/8;
- required clean/fault conformance probes preserved expected polarity.

An earlier final-gate attempt correctly failed because the S11 corpus had been
added to `fixtures/S11/**`, widening the frozen installed public-fixture
inventory. The corpus was moved under the shipped release-readiness source
tree. The same accumulated gate then passed without modifying the S10 fixture
contract or the S12 package-inventory surface.

## Package surface

Command:

```sh
npm pack --dry-run --json
```

Result:

- filename: `heart-ai-foundation-scopa-0.2.0-dev.1.tgz`;
- entries: 149;
- packed/unpacked bytes: 136950 / 528573;
- shipped parity corpus: present;
- frozen S10 public fixture inventory: unchanged.

This is a dry-run inventory, not an S13 candidate and not publication.

## Dependency and protocol gates

Commands:

```sh
npm audit --json
npm run protocol:check
git diff --check
```

Results:

- dependency vulnerabilities: 0 across 19 total dependency records;
- protocol state: in sync, S11 sole active slice;
- diff whitespace errors: 0.

## Outside-model review

Claude Code 2.1.170, model `claude-sonnet-4-6`, reviewed exact commit
`edc8e2c` against `7d28de8` under a read-only request.

- verdict: `ACCEPT`;
- PI1, PI2, PI3: satisfied;
- critical/high/medium findings: 0;
- low findings: 4;
- informational observations: 1;
- cost: USD 1.13663605;
- duration: 718879 ms.

Three low findings were corpus-coverage gaps and were fixed in `7b686e3`. The
fourth required this notes/runs/evidence trio. The informational literal-count
observation was also fixed. The reviewer could not execute its own Bash tests
under the read-only permission mode; local commands above independently
provide the executable results.

## Hosted gate

Foundation-hosted run `30337823696` passed on exact pushed evidence commit
`f83b3c16fb6ddd0143bd4e46a340165fcd5a75b0`.

All steps passed:

- clean JavaScript dependency installation;
- accumulated SCOPA release gate;
- signed native-packet recovery and verification;
- independent CASE validation;
- malformed CASE graph rejection.

The run retained one non-blocking annotation: `actions/checkout@v4`,
`actions/setup-node@v4`, and `actions/setup-python@v5` target the deprecated
Node.js 20 action runtime and were compatibility-run on Node.js 24. That exact
warning is DH3 and transfers to active S12 authority.

## Boundary

This closes proof-integrity behavior. It does not authorize npm publication, a
GitHub Release, repository visibility change, deployment, customer use,
certification, or S13 requalification.
