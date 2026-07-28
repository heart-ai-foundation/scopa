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

Pending the evidence commit and GitHub-hosted run. S11 must not rotate until
the pushed gate succeeds and this section is amended with the exact run.

## Boundary

This closes proof-integrity behavior only after the hosted result is recorded.
It does not authorize npm publication, a GitHub Release, repository visibility
change, deployment, customer use, certification, or S13 requalification.
